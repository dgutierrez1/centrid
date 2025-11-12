import type { AppProps } from 'next/app';
import '@centrid/ui/styles';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { Provider as UrqlProvider, createClient, cacheExchange, fetchExchange, errorExchange, ssrExchange } from 'urql';
import type { CombinedError } from 'urql';
import AuthProvider, { useAuthContext } from '@/components/providers/AuthProvider';
import { AIAgentRealtimeProvider } from '@/components/providers/AIAgentRealtimeProvider';
import { FileUploadProvider } from '@/lib/contexts/file-upload.context';
import { toastConfig } from '@/lib/toast.config';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AppContent({ Component, pageProps }: AppProps) {
  const { user } = useAuthContext();

  return (
    <>
      {user ? (
        <AIAgentRealtimeProvider userId={user.id}>
          <FileUploadProvider>
            <Component {...pageProps} />
          </FileUploadProvider>
        </AIAgentRealtimeProvider>
      ) : (
        <FileUploadProvider>
          <Component {...pageProps} />
        </FileUploadProvider>
      )}
      <Toaster {...toastConfig} />
    </>
  );
}

function App(props: AppProps) {
  const isServerSide = typeof window === 'undefined';

  // Create urql client once per app lifecycle
  // SSR cache is hydrated from pageProps.urqlState on BOTH server and client
  const [urqlClient] = useState(() => {
    const ssr = ssrExchange({
      isClient: !isServerSide,
      initialState: props.pageProps.urqlState, // Use on both server and client!
    });

    return createClient({
      url: '/api/graphql',
      exchanges: [
        cacheExchange,
        errorExchange({
          onError: (error: CombinedError) => {
            if (isServerSide) return;
            
            const is401 = error.response?.status === 401;
            const hasAuthError = error.graphQLErrors?.some(
              err => err.extensions?.code === 'UNAUTHENTICATED'
            );

            if (is401 || hasAuthError) {
              const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
              window.location.href = `/login?returnUrl=${returnUrl}`;
            }
          },
        }),
        ssr,
        fetchExchange,
      ],
      fetchOptions: {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      requestPolicy: 'cache-and-network',
      preferGetMethod: false, // Force POST for all queries (urql v5 defaults to GET, which bypasses auth)
    });
  });

  return (
    <ErrorBoundary>
      <UrqlProvider value={urqlClient}>
        <AuthProvider>
          <AppContent {...props} />
        </AuthProvider>
      </UrqlProvider>
    </ErrorBoundary>
  );
}

export default App;
