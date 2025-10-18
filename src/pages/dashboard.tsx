// Centrid AI Filesystem - Dashboard Page
// Version: 3.1 - Supabase Plus MVP Architecture
// Container component - handles all logic and state, passes props to presentational components

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSnapshot } from 'valtio';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { appState, actions, computed } from '@/lib/state';
import Layout from '@/components/layout/Layout';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DocumentManager from '@/components/documents/DocumentManager';
import AgentInterface from '@/components/agents/AgentInterface';
import SearchInterface from '@/components/search/SearchInterface';
import NotificationPanel from '@/components/ui/NotificationPanel';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Dashboard() {
  const router = useRouter();
  const { session, isLoading } = useSessionContext();
  const state = useSnapshot(appState);

  // Local state for search interface
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchType, setSearchType] = useState<'documents' | 'chunks' | 'both'>('both');

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/signin');
    }
  }, [session, isLoading, router]);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (session?.user && !state.isLoading) {
      loadInitialData();
    }
  }, [session?.user]);

  const loadInitialData = async () => {
    actions.setLoading(true);
    
    try {
      // Load user documents, agent requests, and sessions in parallel
      await Promise.all([
        loadDocuments(),
        loadAgentRequests(),
        loadAgentSessions(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      actions.setError('Failed to load dashboard data');
    } finally {
      actions.setLoading(false);
    }
  };

  const loadDocuments = async () => {
    // This would typically use the supabase client
    // For now, we'll set empty arrays as placeholders
    actions.setDocuments([]);
  };

  const loadAgentRequests = async () => {
    actions.setAgentRequests([]);
  };

  const loadAgentSessions = async () => {
    actions.setAgentSessions([]);
  };

  // Handler functions for UI interactions
  const handleToggleSidebar = () => {
    actions.setSidebarOpen(!state.sidebarOpen);
  };

  const handleCloseSidebar = () => {
    actions.setSidebarOpen(false);
  };

  const handleNavigate = (view: 'documents' | 'agents' | 'search' | 'settings') => {
    actions.setActiveView(view);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      actions.setSidebarOpen(false);
    }
  };

  const handleToggleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(state.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    actions.setTheme(themes[nextIndex]);
  };

  const handleNotificationsClick = () => {
    // TODO: Open notifications panel or modal
    console.log('Notifications clicked');
  };

  // Document handlers
  const handleUploadDocument = () => {
    // TODO: Implement document upload
    console.log('Upload document clicked');
    actions.addNotification({
      type: 'info',
      title: 'Upload Document',
      message: 'Document upload feature coming soon!',
    });
  };

  const handleDocumentClick = (documentId: string) => {
    actions.setSelectedDocument(documentId);
    console.log('Document clicked:', documentId);
  };

  // Agent handlers
  const handleNewAgentRequest = () => {
    // TODO: Implement new agent request
    console.log('New agent request clicked');
    actions.addNotification({
      type: 'info',
      title: 'New Agent Request',
      message: 'Agent request feature coming soon!',
    });
  };

  const handleAgentRequestClick = (requestId: string) => {
    const request = state.agentRequests.find((r: any) => r.id === requestId);
    if (request) {
      actions.setActiveAgentRequest(request);
      console.log('Agent request clicked:', requestId);
    }
  };

  // Search handlers
  const handleSearchQueryChange = (query: string) => {
    actions.setSearchQuery(query);
  };

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!state.searchQuery.trim()) return;

    actions.setSearchLoading(true);

    try {
      // TODO: Implement actual search functionality
      // This would call the text-search Edge Function
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      actions.setSearchResults([]);
      
      actions.addNotification({
        type: 'info',
        title: 'Search',
        message: 'Search functionality coming soon!',
      });
    } catch (error) {
      console.error('Search error:', error);
      actions.setError('Search failed');
    } finally {
      actions.setSearchLoading(false);
    }
  };

  const handleToggleSearchFilters = () => {
    setShowSearchFilters(!showSearchFilters);
  };

  const handleSearchResultClick = (result: any, index: number) => {
    console.log('Search result clicked:', result, index);
  };

  // Notification handlers
  const handleMarkNotificationRead = (id: string) => {
    actions.markNotificationRead(id);
  };

  const handleDismissNotification = (id: string) => {
    actions.removeNotification(id);
  };

  const handleClearAllNotifications = () => {
    actions.clearAllNotifications();
  };

  // Computed values
  const unreadNotificationsCount = computed.unreadNotificationsCount();
  const userInitial = state.userProfile?.name?.charAt(0)?.toUpperCase() || 'U';

  // Show loading spinner while checking auth
  if (isLoading || state.isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!session) {
    return null;
  }

  const renderActiveView = () => {
    switch (state.activeView) {
      case 'documents':
        return (
          <DocumentManager
            documents={state.documents}
            onUploadDocument={handleUploadDocument}
            onDocumentClick={handleDocumentClick}
          />
        );
      case 'agents':
        return (
          <AgentInterface
            agentRequests={state.agentRequests}
            onNewRequest={handleNewAgentRequest}
            onRequestClick={handleAgentRequestClick}
          />
        );
      case 'search':
        return (
          <SearchInterface
            searchQuery={state.searchQuery}
            searchResults={state.searchResults}
            isSearching={state.searchLoading}
            showFilters={showSearchFilters}
            searchType={searchType}
            onSearchQueryChange={handleSearchQueryChange}
            onSearchSubmit={handleSearchSubmit}
            onToggleFilters={handleToggleSearchFilters}
            onSearchTypeChange={setSearchType}
            onResultClick={handleSearchResultClick}
          />
        );
      case 'settings':
        return <div className="p-6">Settings coming soon...</div>;
      default:
        return (
          <DocumentManager
            documents={state.documents}
            onUploadDocument={handleUploadDocument}
            onDocumentClick={handleDocumentClick}
          />
        );
    }
  };

  return (
    <Layout
      sidebarOpen={state.sidebarOpen}
      onCloseSidebar={handleCloseSidebar}
      sidebar={
        <Sidebar
          isOpen={state.sidebarOpen}
          activeView={state.activeView}
          connectionStatus={state.connectionStatus}
          userName={state.userProfile?.name || null}
          userPlan={state.userProfile?.plan || null}
          showUser={!!state.user}
          onClose={handleCloseSidebar}
          onNavigate={handleNavigate}
        />
      }
      header={
        <Header
          activeView={state.activeView}
          theme={state.theme}
          unreadNotificationsCount={unreadNotificationsCount}
          userInitial={userInitial}
          onToggleSidebar={handleToggleSidebar}
          onToggleTheme={handleToggleTheme}
          onNotificationsClick={handleNotificationsClick}
        />
      }
      notificationPanel={
        <NotificationPanel
          notifications={state.notifications}
          onMarkAsRead={handleMarkNotificationRead}
          onDismiss={handleDismissNotification}
          onClearAll={handleClearAllNotifications}
        />
      }
    >
      {state.isLoading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        renderActiveView()
      )}
    </Layout>
  );
}
