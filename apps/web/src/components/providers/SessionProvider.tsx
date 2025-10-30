import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface SessionProviderProps {
  children: ReactNode;
  initialSession: Session | null;
}

interface SessionContextType {
  sessionReady: boolean;
}

const SessionContext = createContext<SessionContextType>({ sessionReady: false });

/**
 * SessionProvider
 *
 * Hydrates Supabase client with session from server-side props.
 * Solves the SSR cookie → client localStorage gap for Edge Function auth.
 *
 * Usage in _app.tsx:
 *   <SessionProvider initialSession={pageProps.initialSession}>
 *     <Component {...pageProps} />
 *   </SessionProvider>
 *
 * Usage in protected pages getServerSideProps:
 *   return { props: { initialSession: session } }
 */
export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    console.log('[SessionProvider] Received initialSession:', {
      hasSession: !!initialSession,
      hasAccessToken: !!initialSession?.access_token,
      hasRefreshToken: !!initialSession?.refresh_token,
      userId: initialSession?.user?.id,
    });

    if (initialSession) {
      // Hydrate client with server session
      console.log('[SessionProvider] Calling setSession...');
      supabase.auth.setSession({
        access_token: initialSession.access_token,
        refresh_token: initialSession.refresh_token,
      }).then((result) => {
        console.log('[SessionProvider] setSession result:', {
          success: !!result.data.session,
          error: result.error?.message,
          userId: result.data.session?.user?.id,
        });
        setSessionReady(true);
      }).catch((error) => {
        console.error('[SessionProvider] Failed to set session:', error);
        setSessionReady(true); // Continue even if it fails
      });
    } else {
      console.log('[SessionProvider] No initialSession, setting sessionReady=true');
      // No session to hydrate
      setSessionReady(true);
    }
  }, [initialSession]);

  return (
    <SessionContext.Provider value={{ sessionReady }}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * useSessionReady Hook
 *
 * Returns true when the Supabase client has been hydrated with the session.
 * Use this to delay Edge Function calls until auth is ready.
 *
 * Usage:
 *   const { sessionReady } = useSessionReady();
 *   useLoadThreads(sessionReady ? userId : undefined);
 */
export function useSessionReady() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionReady must be used within SessionProvider');
  }
  return context;
}
