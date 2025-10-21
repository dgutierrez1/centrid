import type { AppProps } from 'next/app';
import '@centrid/ui/styles';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
