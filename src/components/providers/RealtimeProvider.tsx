// Centrid AI Filesystem - Realtime Provider
// Version: 3.1 - Supabase Plus MVP Architecture

import { useEffect, ReactNode, useRef } from 'react';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { useSnapshot } from 'valtio';
import { RealtimeChannel } from '@supabase/supabase-js';
import { appState, actions } from '@/lib/state';
import { supabase } from '@/lib/supabase';

interface RealtimeProviderProps {
  children: ReactNode;
}

export default function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { session } = useSessionContext();
  const state = useSnapshot(appState);
  const subscriptionsRef = useRef<RealtimeChannel[]>([]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!session?.user?.id) {
      // Clean up existing subscriptions
      subscriptionsRef.current.forEach(subscription => {
        subscription.unsubscribe();
      });
      subscriptionsRef.current = [];
      actions.setConnectionStatus('disconnected');
      return;
    }

    const userId = session.user.id;
    actions.setConnectionStatus('reconnecting');

    // Documents subscription
    const documentsChannel = supabase
      .channel(`documents:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Document change:', payload);
          handleDocumentChange(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Documents subscription active');
        }
      });

    // Agent requests subscription
    const agentRequestsChannel = supabase
      .channel(`agent_requests:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Agent request change:', payload);
          handleAgentRequestChange(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Agent requests subscription active');
        }
      });

    // Agent sessions subscription
    const agentSessionsChannel = supabase
      .channel(`agent_sessions:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Agent session change:', payload);
          handleAgentSessionChange(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Agent sessions subscription active');
        }
      });

    // User profile subscription
    const userProfileChannel = supabase
      .channel(`user_profiles:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('User profile change:', payload);
          if (payload.new) {
            actions.setUserProfile(payload.new as any);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('User profile subscription active');
        }
      });

    // Store subscriptions for cleanup
    subscriptionsRef.current = [
      documentsChannel,
      agentRequestsChannel,
      agentSessionsChannel,
      userProfileChannel,
    ];

    // Monitor connection status
    let connectionCheckInterval: NodeJS.Timeout;
    
    const checkConnection = () => {
      const allSubscribed = subscriptionsRef.current.every(
        channel => channel.state === 'joined'
      );
      
      if (allSubscribed) {
        actions.setConnectionStatus('connected');
      } else {
        actions.setConnectionStatus('reconnecting');
      }
    };

    // Check connection every 5 seconds
    connectionCheckInterval = setInterval(checkConnection, 5000);
    
    // Initial connection check after a delay
    setTimeout(checkConnection, 2000);

    // Cleanup function
    return () => {
      clearInterval(connectionCheckInterval);
      subscriptionsRef.current.forEach(subscription => {
        subscription.unsubscribe();
      });
      subscriptionsRef.current = [];
      actions.setConnectionStatus('disconnected');
    };
  }, [session?.user?.id]);

  // Handle realtime changes
  const handleDocumentChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          actions.addDocument(newRecord);
          actions.addNotification({
            type: 'success',
            title: 'Document Added',
            message: `${newRecord.filename} has been uploaded successfully`,
          });
        }
        break;

      case 'UPDATE':
        if (newRecord) {
          actions.updateDocument(newRecord.id, newRecord);
          
          // Show notification for processing status changes
          if (oldRecord?.processing_status !== newRecord.processing_status) {
            if (newRecord.processing_status === 'completed') {
              actions.addNotification({
                type: 'success',
                title: 'Document Processed',
                message: `${newRecord.filename} is ready for use`,
              });
            } else if (newRecord.processing_status === 'failed') {
              actions.addNotification({
                type: 'error',
                title: 'Processing Failed',
                message: `Failed to process ${newRecord.filename}`,
              });
            }
          }
        }
        break;

      case 'DELETE':
        if (oldRecord) {
          actions.removeDocument(oldRecord.id);
          actions.addNotification({
            type: 'info',
            title: 'Document Deleted',
            message: `${oldRecord.filename} has been removed`,
          });
        }
        break;
    }
  };

  const handleAgentRequestChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          actions.addAgentRequest(newRecord);
        }
        break;

      case 'UPDATE':
        if (newRecord) {
          actions.updateAgentRequest(newRecord.id, newRecord);

          // Update active request if it's the same one
          if (state.activeAgentRequest?.id === newRecord.id) {
            actions.setActiveAgentRequest(newRecord);
          }

          // Show notifications for status changes
          if (oldRecord?.status !== newRecord.status) {
            switch (newRecord.status) {
              case 'completed':
                actions.addNotification({
                  type: 'success',
                  title: 'Agent Request Completed',
                  message: `Your ${newRecord.agent_type} request is ready`,
                });
                break;

              case 'failed':
                actions.addNotification({
                  type: 'error',
                  title: 'Agent Request Failed',
                  message: newRecord.error_message || 'Request could not be completed',
                });
                break;

              case 'processing':
                actions.addNotification({
                  type: 'info',
                  title: 'Processing Started',
                  message: `Your ${newRecord.agent_type} request is being processed`,
                });
                break;
            }
          }
        }
        break;

      case 'DELETE':
        if (oldRecord) {
          const updatedRequests = state.agentRequests.filter(req => req.id !== oldRecord.id);
          actions.setAgentRequests(updatedRequests);

          if (state.activeAgentRequest?.id === oldRecord.id) {
            actions.setActiveAgentRequest(null);
          }
        }
        break;
    }
  };

  const handleAgentSessionChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          const updatedSessions = [...state.agentSessions, newRecord];
          actions.setAgentSessions(updatedSessions);
        }
        break;

      case 'UPDATE':
        if (newRecord) {
          const updatedSessions = state.agentSessions.map(session =>
            session.id === newRecord.id ? newRecord : session
          );
          actions.setAgentSessions(updatedSessions);
        }
        break;

      case 'DELETE':
        if (oldRecord) {
          const updatedSessions = state.agentSessions.filter(session => session.id !== oldRecord.id);
          actions.setAgentSessions(updatedSessions);

          if (state.currentSessionId === oldRecord.id) {
            actions.setCurrentSession(null);
          }
        }
        break;
    }
  };

  return <>{children}</>;
}
