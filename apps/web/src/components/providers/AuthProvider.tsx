// Centrid AI Filesystem - Authentication Provider
// Version: 4.0 - MVP Account Foundation (Updated)

import { createContext, useContext, useEffect, useState, useMemo, useRef, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase/client'
import { TokenStore } from '@/lib/api/tokenStore'
import type { User } from '@supabase/supabase-js'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Auth Context Type
 */
interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

/**
 * Auth State - single object for atomic updates
 */
interface AuthState {
  user: User | null
  loading: boolean
}

/**
 * Auth Context
 * Provides auth state to all components via React Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider Component
 *
 * Wraps the application and provides authentication state to all child components.
 * Automatically handles session initialization and auth state changes.
 * 
 * Uses single state object for atomic updates - prevents multiple rerenders
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  // Single state object - updates are atomic (no separate user/loading rerenders)
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  })
  const router = useRouter()
  
  // Prevent duplicate initialization from StrictMode double-mounting
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip if already initialized (prevents StrictMode double-run)
    if (hasInitialized.current) {
      return;
    }
    
    hasInitialized.current = true;
    
    // Track if we're still in initial mount to skip duplicate auth events
    let isInitializing = true;
    
    // Get initial session and sync token to TokenStore
    const getInitialSession = async () => {
      try {
        // Wait a tick to ensure SSR client is fully initialized
        await new Promise(r => setTimeout(r, 0))

        const { data: { session } } = await supabase.auth.getSession()
        
        // Atomic state update - single rerender for both user and loading
        setAuthState({
          user: session?.user ?? null,
          loading: false,
        })
        
        // Sync token to TokenStore for API requests
        TokenStore.setInitialToken(session?.access_token ?? null)
        TokenStore.markInitialized()
        
        // Mark initialization as complete
        isInitializing = false;
      } catch (error) {
        console.error('[AuthProvider] Error getting initial session:', error)
        
        // Atomic state update on error
        setAuthState({
          user: null,
          loading: false,
        })
        
        TokenStore.setInitialToken(null)
        TokenStore.markInitialized()
        
        // Mark initialization as complete even on error
        isInitializing = false;
      }
    }

    getInitialSession()

    // Listen for auth state changes (login, logout, token refresh)
    // Updates TokenStore so API requests always have the latest token
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Skip auth events during initial mount - already handled by getInitialSession()
      // This prevents duplicate state updates and rerenders
      if (isInitializing) {
        return
      }
      
      // Atomic state update - single rerender
      setAuthState({
        user: session?.user ?? null,
        loading: false,
      })
      
      // Sync token changes to TokenStore (login, logout, refresh)
      TokenStore.setToken(session?.access_token ?? null)

      // If this is a login event and we don't have a token, try refreshing the session
      // This fixes a Supabase SSR bug where tokens aren't always returned
      if (_event === 'SIGNED_IN' && !session?.access_token) {
        console.warn('⚠️ Token missing on SIGNED_IN event. Refreshing session...')
        const { data: refreshed } = await supabase.auth.refreshSession()
        if (refreshed?.session?.access_token) {
          TokenStore.setToken(refreshed.session.access_token)
          console.log('✅ Token recovered via session refresh')
        }
      }

      // Note: No need to refresh/replace route in a CSR app
      // Auth state updates automatically trigger re-renders
      // Explicit redirects (like signOut -> /login) are handled separately
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Sign out helper - memoized to prevent recreating on every render
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      await router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Memoize context value to prevent unnecessary rerenders in consumers
  // Only creates new object when authState actually changes
  const value: AuthContextType = useMemo(
    () => ({
      user: authState.user,
      loading: authState.loading,
      signOut,
      isAuthenticated: !!authState.user,
    }),
    [authState.user, authState.loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuthContext Hook
 *
 * Access auth context from any component wrapped in AuthProvider.
 * Throws error if used outside AuthProvider.
 *
 * Usage:
 *   const { user, loading, signOut, isAuthenticated } = useAuthContext()
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
