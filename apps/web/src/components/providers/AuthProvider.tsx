// Centrid AI Filesystem - Authentication Provider
// Version: 4.0 - MVP Account Foundation (Updated)

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
 * Auth Context
 * Provides auth state to all components via React Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider Component
 *
 * Wraps the application and provides authentication state to all child components.
 * Automatically handles session initialization and auth state changes.
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session and sync token to TokenStore
    const getInitialSession = async () => {
      try {
        // Wait a tick to ensure SSR client is fully initialized
        await new Promise(r => setTimeout(r, 0))

        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔐 Initial session:', { user: session?.user?.email, hasToken: !!session?.access_token, token: session?.access_token?.substring(0, 20) + '...' })
        setUser(session?.user ?? null)
        // Sync token to TokenStore for API requests
        TokenStore.setInitialToken(session?.access_token ?? null)
        console.log('✅ Token synced to TokenStore')
      } catch (error) {
        console.error('Error getting initial session:', error)
        setUser(null)
        TokenStore.setInitialToken(null)
      } finally {
        setLoading(false)
        TokenStore.markInitialized()
      }
    }

    getInitialSession()

    // Listen for auth state changes (login, logout, token refresh)
    // Updates TokenStore so API requests always have the latest token
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state changed:', { event: _event, user: session?.user?.email, hasToken: !!session?.access_token })
      setUser(session?.user ?? null)
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

      setLoading(false)

      // Note: No need to refresh/replace route in a CSR app
      // Auth state updates via setUser() automatically trigger re-renders
      // Explicit redirects (like signOut -> /login) are handled separately
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  // Sign out helper
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      await router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }

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
