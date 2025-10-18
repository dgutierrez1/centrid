// Centrid AI Filesystem - Main App Component
// Version: 3.1 - Supabase Plus MVP Architecture

import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

import { appState, actions } from '@/lib/state';
import { useSnapshot } from 'valtio';
import AuthProvider from '@/components/providers/AuthProvider';
import RealtimeProvider from '@/components/providers/RealtimeProvider';
import ThemeProvider from '@/components/providers/ThemeProvider';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  // Create a new supabase browser client on every first render.
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <ThemeProvider>
        <AuthProvider>
          <RealtimeProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Component {...pageProps} />
              
              {/* Global Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: 'white',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: 'white',
                    },
                  },
                }}
              />
            </div>
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </SessionContextProvider>
  );
}
