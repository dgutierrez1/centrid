import type { AppProps } from 'next/app';
import '@centrid/ui/styles';
import AuthProvider from '@/components/providers/AuthProvider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
