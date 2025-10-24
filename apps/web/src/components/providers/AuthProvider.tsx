// Centrid AI Filesystem - Authentication Provider
// Version: 4.0 - MVP Account Foundation (Updated)

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
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
