// Centrid AI Filesystem - Main Layout Component
// Version: 3.1 - Supabase Plus MVP Architecture
// Pure presentational component - no logic or integrations

import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
  notificationPanel: ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export default function Layout({ 
  children, 
  sidebar, 
  header, 
  notificationPanel, 
  sidebarOpen, 
  onCloseSidebar 
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      {sidebar}
      
      {/* Main content area */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
      `}>
        {/* Header */}
        {header}
        
        {/* Main content */}
        <main className="p-6">
          {children}
        </main>
      </div>
      
      {/* Notification Panel */}
      {notificationPanel}
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}
    </div>
  );
}
