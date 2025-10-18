// Centrid AI Filesystem - Global State Management (Valtio)
// Version: 3.1 - Supabase Plus MVP Architecture

import { proxy, subscribe } from "valtio";
import { subscribeKey } from "valtio/utils";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Type definitions
type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
type Document = Database["public"]["Tables"]["documents"]["Row"];
type AgentRequest = Database["public"]["Tables"]["agent_requests"]["Row"];
type AgentSession = Database["public"]["Tables"]["agent_sessions"]["Row"];

// Application state interface
interface AppState {
  // Authentication
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthLoading: boolean;

  // Documents
  documents: Document[];
  selectedDocumentId: string | null;
  documentProcessingStatus: Record<
    string,
    "pending" | "processing" | "completed" | "failed"
  >;

  // AI Agents
  agentRequests: AgentRequest[];
  agentSessions: AgentSession[];
  currentSessionId: string | null;
  activeAgentRequest: AgentRequest | null;

  // Search
  searchQuery: string;
  searchResults: any[];
  searchLoading: boolean;

  // UI State
  sidebarOpen: boolean;
  activeView: "documents" | "agents" | "search" | "settings";
  theme: "light" | "dark" | "system";

  // Notifications
  notifications: Notification[];

  // Sync & Real-time
  lastSyncTimestamp: string | null;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  pendingSyncOperations: SyncOperation[];

  // Error handling
  error: string | null;
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface SyncOperation {
  id: string;
  type: "create" | "update" | "delete";
  entityType: "document" | "agent_request" | "agent_session";
  entityId: string;
  data?: any;
  timestamp: string;
  status: "pending" | "syncing" | "completed" | "failed";
}

// Initial state
const initialState: AppState = {
  // Authentication
  user: null,
  userProfile: null,
  isLoading: false,
  isAuthLoading: true,

  // Documents
  documents: [],
  selectedDocumentId: null,
  documentProcessingStatus: {},

  // AI Agents
  agentRequests: [],
  agentSessions: [],
  currentSessionId: null,
  activeAgentRequest: null,

  // Search
  searchQuery: "",
  searchResults: [],
  searchLoading: false,

  // UI State
  sidebarOpen: true,
  activeView: "documents",
  theme: "system",

  // Notifications
  notifications: [],

  // Sync & Real-time
  lastSyncTimestamp: null,
  connectionStatus: "disconnected",
  pendingSyncOperations: [],

  // Error handling
  error: null,
};

// Create the global state
export const appState = proxy<AppState>(initialState);

// State actions (functions that modify state)
export const actions = {
  // Authentication actions
  setUser: (user: User | null) => {
    appState.user = user;
    appState.isAuthLoading = false;
  },

  setUserProfile: (profile: UserProfile | null) => {
    appState.userProfile = profile;
  },

  setAuthLoading: (loading: boolean) => {
    appState.isAuthLoading = loading;
  },

  // Document actions
  setDocuments: (documents: Document[]) => {
    appState.documents = documents;
  },

  addDocument: (document: Document) => {
    appState.documents.push(document);
  },

  updateDocument: (documentId: string, updates: Partial<Document>) => {
    const index = appState.documents.findIndex((doc) => doc.id === documentId);
    if (index !== -1) {
      appState.documents[index] = { ...appState.documents[index], ...updates };
    }
  },

  removeDocument: (documentId: string) => {
    appState.documents = appState.documents.filter(
      (doc) => doc.id !== documentId
    );
    if (appState.selectedDocumentId === documentId) {
      appState.selectedDocumentId = null;
    }
  },

  setSelectedDocument: (documentId: string | null) => {
    appState.selectedDocumentId = documentId;
  },

  setDocumentProcessingStatus: (
    documentId: string,
    status: AppState["documentProcessingStatus"][string]
  ) => {
    appState.documentProcessingStatus[documentId] = status;
  },

  // Agent actions
  setAgentRequests: (requests: AgentRequest[]) => {
    appState.agentRequests = requests;
  },

  addAgentRequest: (request: AgentRequest) => {
    appState.agentRequests.push(request);
  },

  updateAgentRequest: (requestId: string, updates: Partial<AgentRequest>) => {
    const index = appState.agentRequests.findIndex(
      (req) => req.id === requestId
    );
    if (index !== -1) {
      appState.agentRequests[index] = {
        ...appState.agentRequests[index],
        ...updates,
      };
    }
  },

  setActiveAgentRequest: (request: AgentRequest | null) => {
    appState.activeAgentRequest = request;
  },

  setAgentSessions: (sessions: AgentSession[]) => {
    appState.agentSessions = sessions;
  },

  setCurrentSession: (sessionId: string | null) => {
    appState.currentSessionId = sessionId;
  },

  // Search actions
  setSearchQuery: (query: string) => {
    appState.searchQuery = query;
  },

  setSearchResults: (results: any[]) => {
    appState.searchResults = results;
  },

  setSearchLoading: (loading: boolean) => {
    appState.searchLoading = loading;
  },

  // UI actions
  setSidebarOpen: (open: boolean) => {
    appState.sidebarOpen = open;
  },

  setActiveView: (view: AppState["activeView"]) => {
    appState.activeView = view;
  },

  setTheme: (theme: AppState["theme"]) => {
    appState.theme = theme;
  },

  // Notification actions
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      ...notification,
    };
    appState.notifications.unshift(newNotification);

    // Auto-remove success notifications after 5 seconds
    if (notification.type === "success") {
      setTimeout(() => {
        actions.removeNotification(newNotification.id);
      }, 5000);
    }
  },

  removeNotification: (id: string) => {
    appState.notifications = appState.notifications.filter((n) => n.id !== id);
  },

  markNotificationRead: (id: string) => {
    const notification = appState.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  },

  clearAllNotifications: () => {
    appState.notifications = [];
  },

  // Sync actions
  setLastSyncTimestamp: (timestamp: string | null) => {
    appState.lastSyncTimestamp = timestamp;
  },

  setConnectionStatus: (status: AppState["connectionStatus"]) => {
    appState.connectionStatus = status;
  },

  addPendingSyncOperation: (
    operation: Omit<SyncOperation, "id" | "timestamp" | "status">
  ) => {
    const syncOperation: SyncOperation = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      status: "pending",
      ...operation,
    };
    appState.pendingSyncOperations.push(syncOperation);
  },

  updateSyncOperationStatus: (
    operationId: string,
    status: SyncOperation["status"]
  ) => {
    const operation = appState.pendingSyncOperations.find(
      (op) => op.id === operationId
    );
    if (operation) {
      operation.status = status;
    }
  },

  clearCompletedSyncOperations: () => {
    appState.pendingSyncOperations = appState.pendingSyncOperations.filter(
      (op) => op.status !== "completed"
    );
  },

  // General actions
  setLoading: (loading: boolean) => {
    appState.isLoading = loading;
  },

  setError: (error: string | null) => {
    appState.error = error;
    if (error) {
      actions.addNotification({
        type: "error",
        title: "Error",
        message: error,
      });
    }
  },

  clearError: () => {
    appState.error = null;
  },
};

// Computed values (derived state)
export const computed = {
  // Get the currently selected document
  selectedDocument: () => {
    return (
      appState.documents.find(
        (doc) => doc.id === appState.selectedDocumentId
      ) || null
    );
  },

  // Get unread notifications count
  unreadNotificationsCount: () => {
    return appState.notifications.filter((n) => !n.read).length;
  },

  // Get active agent requests
  activeAgentRequests: () => {
    return appState.agentRequests.filter(
      (req) => req.status === "processing" || req.status === "pending"
    );
  },

  // Check if user has active subscription
  hasActiveSubscription: () => {
    return appState.userProfile?.subscription_status === "active";
  },

  // Get current usage count
  currentUsageCount: () => {
    return appState.userProfile?.usage_count || 0;
  },

  // Check if user is over usage limits
  isOverUsageLimit: () => {
    const profile = appState.userProfile;
    if (!profile) return false;

    const limits = { free: 100, pro: 1000, enterprise: 10000 };
    const currentLimit = limits[profile.plan as keyof typeof limits] || 100;

    return (profile.usage_count || 0) >= currentLimit;
  },
};

// Persistence helpers
export const persistence = {
  // Save state to localStorage
  saveToStorage: () => {
    const stateToSave = {
      theme: appState.theme,
      sidebarOpen: appState.sidebarOpen,
      activeView: appState.activeView,
      lastSyncTimestamp: appState.lastSyncTimestamp,
    };

    localStorage.setItem("centrid-app-state", JSON.stringify(stateToSave));
  },

  // Load state from localStorage
  loadFromStorage: () => {
    try {
      const saved = localStorage.getItem("centrid-app-state");
      if (saved) {
        const parsedState = JSON.parse(saved);
        Object.assign(appState, parsedState);
      }
    } catch (error) {
      console.warn("Failed to load state from storage:", error);
    }
  },
};

// Set up automatic persistence
if (typeof window !== "undefined") {
  // Load initial state from storage
  persistence.loadFromStorage();

  // Subscribe to state changes and persist relevant parts
  subscribeKey(appState, "theme", persistence.saveToStorage);
  subscribeKey(appState, "sidebarOpen", persistence.saveToStorage);
  subscribeKey(appState, "activeView", persistence.saveToStorage);
  subscribeKey(appState, "lastSyncTimestamp", persistence.saveToStorage);
}

// Export the state and actions
export default appState;
export type { AppState, Notification, SyncOperation };
