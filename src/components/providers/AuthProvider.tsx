// Centrid AI Filesystem - Authentication Provider
// Version: 3.1 - Supabase Plus MVP Architecture

import { useEffect, ReactNode } from 'react';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { useSnapshot } from 'valtio';
import { appState, actions } from '@/lib/state';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { session, isLoading } = useSessionContext();
  const state = useSnapshot(appState);

  // Handle authentication state changes
  useEffect(() => {
    const handleAuthChange = async (user: User | null) => {
      actions.setUser(user);
      
      if (user) {
        // Fetch user profile
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            // Profile doesn't exist, this is handled by the database trigger
            console.warn('Error fetching user profile:', error);
          } else if (profile) {
            actions.setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error handling auth change:', error);
          actions.setError('Failed to load user profile');
        }
      } else {
        // Clear user data on sign out
        actions.setUserProfile(null);
        actions.setDocuments([]);
        actions.setAgentRequests([]);
        actions.setAgentSessions([]);
        actions.setSelectedDocument(null);
        actions.setCurrentSession(null);
      }
    };

    // Handle initial session
    if (session?.user) {
      handleAuthChange(session.user);
    } else {
      actions.setUser(null);
      actions.setAuthLoading(false);
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              await handleAuthChange(session.user);
            }
            break;
            
          case 'SIGNED_OUT':
            await handleAuthChange(null);
            break;
            
          case 'TOKEN_REFRESHED':
            if (session?.user && session.user.id === state.user?.id) {
              // Token refreshed for the same user, no need to reload profile
              actions.setUser(session.user);
            }
            break;
            
          case 'USER_UPDATED':
            if (session?.user) {
              actions.setUser(session.user);
              // Re-fetch profile in case metadata changed
              await handleAuthChange(session.user);
            }
            break;
            
          default:
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [session]);

  // Set auth loading state
  useEffect(() => {
    actions.setAuthLoading(isLoading);
  }, [isLoading]);

  // Auto-refresh session periodically
  useEffect(() => {
    if (!session) return;

    const refreshInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('Failed to refresh session:', error.message);
        }
      } catch (error) {
        console.warn('Session refresh error:', error);
      }
    }, 30 * 60 * 1000); // Refresh every 30 minutes

    return () => clearInterval(refreshInterval);
  }, [session]);

  return <>{children}</>;
}
