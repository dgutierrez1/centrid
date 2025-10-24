import type { AppProps } from 'next/app';
import '@centrid/ui/styles';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/providers/AuthProvider';
import { FileUploadProvider } from '@/lib/contexts/file-upload.context';
import { toastConfig } from '@/lib/toast.config';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <FileUploadProvider>
        <Component {...pageProps} />
        <Toaster {...toastConfig} />
      </FileUploadProvider>
    </AuthProvider>
  );
}
