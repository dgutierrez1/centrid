import type { AppProps } from 'next/app';
import '@centrid/ui/styles';
import { Toaster } from 'react-hot-toast';
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

export default function App(props: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent {...props} />
      </AuthProvider>
    </ErrorBoundary>
  );
}
