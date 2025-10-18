# Centrid.ai Frontend - Mobile-Responsive Web App (MVP)

**Version**: 4.0 (MVP Aligned - No PWA)  
**Date**: 2024-01-15  
**Status**: Ready for Implementation  
**Estimated Time**: 32 hours (Weeks 3-4)  
**Priority**: Critical Path - User-facing deliverable  
**Dependencies**: Backend (01-backend-architecture.md), AI Agents (03-ai-agent-system.md)  
**Key Changes**: Mobile-responsive web (NO PWA), simple preview (NO diff), single-level undo only, NO batch operations, NO offline mode

---

## 🎯 **OVERVIEW**

### **Objective (MVP - Simplified)**

Build a mobile-responsive web application (NOT a PWA) with mobile-first design, real-time AI progress updates via WebSocket/SSE, basic document management, and simple preview system (no diff visualization, no batch operations, no offline mode).

### **Success Criteria (MVP)**

- Mobile-responsive design works on all devices (requires internet connection)
- Real-time AI agent progress updates via WebSocket/SSE
- Simple preview with apply/regenerate/reject workflow (NO diff visualization)
- Single-level undo only (undo last applied change)
- Touch-optimized interface for mobile browsers
- **Performance Target**: <3 second initial load on mobile
- **NO PWA**: No installation, no offline mode, no push notifications, no service worker

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Frontend Stack & Mobile-First Design (MVP Simplified)**

**Simplified Frontend Stack**:

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with mobile-first responsive design
- **Data Layer**: Supabase client with auto-generated TypeScript types
- **State Management**: React Context API (keep it simple for MVP)
- **Type Safety**: Auto-generated types from Supabase
- **Real-time**: WebSocket/SSE for AI agent progress updates
- **UI Components**: Radix UI primitives with mobile-optimized components
- **Animations**: Basic Framer Motion (minimal, only where needed)

**NO PWA Configuration for MVP**:

- **NO Service Worker**: No offline functionality for MVP
- **NO PWA Manifest**: No app installation
- **NO Caching Strategy**: Browser caching only
- **NO Background Sync**: Requires internet connection
- **NO Push Notifications**: Removed for MVP

**Mobile Optimization**:

- **Touch Targets**: Minimum 44px touch targets for accessibility
- **Gesture Support**: Swipe gestures for agent approval/rejection
- **Native Feel**: iOS/Android platform-specific styling and interactions
- **Performance**: Code splitting, lazy loading, and aggressive caching

---

## 📋 **IMPLEMENTATION REQUIREMENTS**

### **Phase 1: Supabase Plus PWA Foundation (Week 5 - 18 hours)**

#### **1.1 Supabase Plus Frontend Setup (4 hours)**

**Frontend Stack Setup (30 minutes)**:

```bash
# 1. Next.js with PWA support (10 minutes)
npx create-next-app@latest centrid-ai --typescript --tailwind --app
npm install @ducanh2912/next-pwa

# 2. Supabase Plus integration (10 minutes)
npm install @supabase/supabase-js valtio zod
npm install postgres  # For enhanced queries

# 3. UI & Animation libraries (10 minutes)
npm install @radix-ui/react-* framer-motion
```

**Supabase Plus Client Setup**:

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// lib/state.ts - Real-time application state
import { proxy, useSnapshot } from "valtio";

export const appState = proxy({
  documents: new Map<string, Document>(),
  agentRequests: new Map<string, AgentRequest>(),
  user: null as User | null,
  isOnline: true,
  syncQueue: [] as any[],
});
```

**Type Safety Integration**:

```typescript
// lib/hooks/useTypeSafeQuery.ts
import { useCallback } from "react";
import { supabase } from "../supabase";
import { DocumentSchema } from "../validation";

export const useDocuments = () => {
  const fetchDocuments = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Runtime validation with Zod
    return data.map((d) => DocumentSchema.parse(d));
  }, []);

  return { fetchDocuments };
};
```

**PWA Configuration**:

```typescript
// next.config.js
const withPWA = require("@ducanh2912/next-pwa");

const config = withPWA({
  pwa: {
    dest: "public",
    cacheOnFrontendNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
      disableDevLogs: true,
    },
  },
  // Enable React 18 concurrent features
  experimental: {
    appDir: true,
  },
});

module.exports = config;
```

**PWA Manifest Configuration**:

```json
{
  "name": "Centrid",
  "short_name": "Centrid",
  "description": "Your central intelligence for content creation",
  "theme_color": "#0066FF",
  "background_color": "#F8F9FA",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

**Service Worker Strategy**:

```typescript
// Custom service worker for offline agent requests
self.addEventListener("sync", (event) => {
  if (event.tag === "agent-request") {
    event.waitUntil(processOfflineAgentRequests());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Open app to agent results
  event.waitUntil(
    clients.openWindow("/agents/" + event.notification.data.requestId)
  );
});

async function processOfflineAgentRequests() {
  const requests = await getQueuedAgentRequests();

  for (const request of requests) {
    try {
      const response = await fetch("/api/trpc/agents.executeAgent", {
        method: "POST",
        body: JSON.stringify(request),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await removeFromQueue(request.id);
        await sendNotification("Agent request completed", {
          requestId: request.id,
          body: "Your content is ready for review",
        });
      }
    } catch (error) {
      console.error("Failed to process offline request:", error);
    }
  }
}
```

**Deliverable**: PWA foundation with offline capabilities and push notifications

#### **1.2 Mobile-First Design System (8 hours)**

**Design Token System**:

```typescript
// Design tokens for consistent mobile experience
export const designTokens = {
  colors: {
    primary: {
      50: "#f0f9ff",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      900: "#1e3a8a",
    },
    semantic: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },
  spacing: {
    xs: "0.5rem", // 8px
    sm: "0.75rem", // 12px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
  },
  typography: {
    sizes: {
      xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
      sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
      base: ["1rem", { lineHeight: "1.5rem" }], // 16px
      lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
      xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
      "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
    },
  },
  touch: {
    minTarget: "44px", // Minimum touch target size
    tapRadius: "8px", // Border radius for touch elements
    activeScale: 0.95, // Scale on touch
  },
};
```

**Base Component Library**:

```typescript
// Touch-optimized Button component
interface ButtonProps {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  size = "md",
  variant = "primary",
  children,
  onClick,
  disabled = false,
  loading = false,
}) => {
  const sizeClasses = {
    sm: "px-3 py-2 text-sm min-h-[36px]",
    md: "px-4 py-3 text-base min-h-[44px]", // 44px minimum touch target
    lg: "px-6 py-4 text-lg min-h-[52px]",
  };

  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 active:scale-95",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 active:scale-95",
    ghost: "text-primary-600 hover:bg-primary-50 active:scale-95",
  };

  return (
    <motion.button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
        sizeClasses[size],
        variantClasses[variant],
        disabled && "opacity-50 cursor-not-allowed",
        "touch-manipulation" // Prevent 300ms click delay on mobile
      )}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.1 }}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </motion.button>
  );
};

// Swipe-enabled Card component for agent previews
export const SwipeCard: React.FC<SwipeCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
}) => {
  const controls = useAnimationControls();

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.2}
      onDragEnd={(event, info) => {
        if (info.offset.x > 100) {
          onSwipeRight?.();
          controls.start({ x: 300, opacity: 0 });
        } else if (info.offset.x < -100) {
          onSwipeLeft?.();
          controls.start({ x: -300, opacity: 0 });
        } else {
          controls.start({ x: 0 });
        }
      }}
      animate={controls}
    >
      {children}

      {/* Swipe indicators */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 opacity-0 swipe-right-indicator">
          ✓
        </div>
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-500 opacity-0 swipe-left-indicator">
          ✗
        </div>
      </div>
    </motion.div>
  );
};
```

**Deliverable**: Complete mobile-first design system with touch-optimized components

#### **1.3 Responsive Layout System (6 hours)**

**Layout Components**:

```typescript
// Mobile-first app shell
export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">AI Docs</h1>
          <div className="flex items-center space-x-3">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="pb-20">
        {" "}
        {/* Account for bottom nav */}
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <BottomNavigation />
    </div>
  );
};

// Bottom navigation for mobile
export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/documents", icon: DocumentIcon, label: "Documents" },
    { href: "/agents", icon: SparklesIcon, label: "Agents" },
    { href: "/search", icon: MagnifyingGlassIcon, label: "Search" },
    { href: "/settings", icon: CogIcon, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 py-2 safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isActive
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

// Responsive container
export const Container: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
  );
};
```

**Mobile-Optimized Layouts**:

```typescript
// Stack layout for mobile-first content
export const Stack: React.FC<StackProps> = ({
  children,
  spacing = "md",
  direction = "vertical",
}) => {
  const spacingClasses = {
    sm: direction === "vertical" ? "space-y-2" : "space-x-2",
    md: direction === "vertical" ? "space-y-4" : "space-x-4",
    lg: direction === "vertical" ? "space-y-6" : "space-x-6",
  };

  return (
    <div
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col" : "flex-row flex-wrap",
        spacingClasses[spacing]
      )}
    >
      {children}
    </div>
  );
};

// Grid system optimized for mobile
export const Grid: React.FC<GridProps> = ({
  children,
  cols = { default: 1, sm: 2, lg: 3 },
  gap = "md",
}) => {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  return (
    <div
      className={cn(
        "grid",
        `grid-cols-${cols.default}`,
        cols.sm && `sm:grid-cols-${cols.sm}`,
        cols.md && `md:grid-cols-${cols.md}`,
        cols.lg && `lg:grid-cols-${cols.lg}`,
        cols.xl && `xl:grid-cols-${cols.xl}`,
        gapClasses[gap]
      )}
    >
      {children}
    </div>
  );
};
```

**Deliverable**: Responsive layout system optimized for mobile-first usage

### **Phase 2: AI Agent Interface (Week 6 - 20 hours)**

#### **2.1 Agent Request Interface (8 hours)**

**Agent Request Component**:

```typescript
interface AgentRequestProps {
  onSubmit: (request: AgentRequest) => void;
  loading?: boolean;
  placeholder?: string;
}

export const AgentRequestInterface: React.FC<AgentRequestProps> = ({
  onSubmit,
  loading = false,
  placeholder = "Ask your AI agent...",
}) => {
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentType>("auto");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !loading) {
      onSubmit({
        content: input,
        agentType: selectedAgent,
        timestamp: new Date(),
      });
      setInput("");
      setIsExpanded(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Agent selection tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 px-1">
        {agentTypes.map((type) => (
          <button
            key={type.id}
            className={cn(
              "flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors",
              selectedAgent === type.id
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setSelectedAgent(type.id)}
          >
            <div className="flex items-center space-x-2">
              <type.icon className="h-4 w-4" />
              <span>{type.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="p-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className={cn(
              "w-full resize-none border-0 bg-transparent text-base placeholder-gray-400 focus:ring-0",
              isExpanded ? "min-h-[120px]" : "min-h-[44px]"
            )}
            style={{ minHeight: isExpanded ? "120px" : "44px" }}
          />

          {/* Floating action buttons */}
          <div className="absolute bottom-2 right-2 flex items-center space-x-2">
            {/* Voice input button */}
            <VoiceInputButton onVoiceInput={setInput} />

            {/* Send button */}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              loading={loading}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick actions for mobile */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              onClick={() => setInput(action.template)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Voice input integration
const VoiceInputButton: React.FC<{ onVoiceInput: (text: string) => void }> = ({
  onVoiceInput,
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = "en-US";

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onVoiceInput(transcript);
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [onVoiceInput]);

  const toggleListening = () => {
    if (!recognition.current) return;

    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
    }
  };

  if (!recognition.current) return null;

  return (
    <motion.button
      className={cn(
        "p-2 rounded-full transition-colors",
        isListening
          ? "bg-red-100 text-red-600"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      )}
      onClick={toggleListening}
      whileTap={{ scale: 0.95 }}
      animate={isListening ? { scale: [1, 1.1, 1] } : {}}
      transition={{ repeat: isListening ? Infinity : 0, duration: 1 }}
    >
      <MicrophoneIcon className="h-4 w-4" />
    </motion.button>
  );
};
```

**Quick Action Templates**:

```typescript
const quickActions = [
  {
    id: "summarize",
    label: "Summarize",
    template: "Summarize the key points from my recent notes about ",
    agentType: "research",
  },
  {
    id: "create-doc",
    label: "Create Doc",
    template: "Create a comprehensive document about ",
    agentType: "create",
  },
  {
    id: "improve",
    label: "Improve",
    template: "Improve this text to be more clear and professional: ",
    agentType: "edit",
  },
  {
    id: "find-info",
    label: "Find Info",
    template: "Find all information about ",
    agentType: "research",
  },
];
```

**Deliverable**: Intuitive agent request interface with voice input and quick actions

#### **2.2 Real-time Agent Response System (6 hours)**

**Valtio + Supabase Real-time Integration**:

```typescript
// lib/hooks/useRealtimeAgents.ts
import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { supabase } from "../supabase";
import { appState } from "../state";
import { AgentRequestSchema } from "../validation";

export const useRealtimeAgents = () => {
  const { agentRequests } = useSnapshot(appState);

  useEffect(() => {
    const channel = supabase
      .channel("agent_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_requests" },
        (payload) => {
          try {
            const request = AgentRequestSchema.parse(payload.new);
            appState.agentRequests.set(request.id, request);
          } catch (error) {
            console.error("Invalid agent request data:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    agentRequests: Array.from(agentRequests.values()),
    getRequest: (id: string) => agentRequests.get(id),
  };
};
```

**Agent Preview Component**:

```typescript
interface AgentPreviewProps {
  preview: AgentPreview;
  onApprove: () => void;
  onReject: () => void;
  onViewAlternatives: () => void;
  onEdit: (content: string) => void;
}

export const AgentPreview: React.FC<AgentPreviewProps> = ({
  preview,
  onApprove,
  onReject,
  onViewAlternatives,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(preview.generatedContent);

  return (
    <SwipeCard
      onSwipeRight={onApprove}
      onSwipeLeft={onReject}
      onSwipeUp={onViewAlternatives}
    >
      <div className="p-6">
        {/* Header with agent info and confidence */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <AgentIcon
                agentType={preview.agentType}
                className="h-5 w-5 text-primary-600"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {getAgentLabel(preview.agentType)} Agent
              </h3>
              <p className="text-sm text-gray-500">
                {preview.confidence > 0.8
                  ? "High confidence"
                  : preview.confidence > 0.6
                  ? "Medium confidence"
                  : "Low confidence"}
              </p>
            </div>
          </div>

          <ConfidenceIndicator score={preview.confidence} />
        </div>

        {/* Original request context */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-medium">Your request:</p>
          <p className="text-sm text-gray-800 mt-1">
            {preview.originalRequest}
          </p>
        </div>

        {/* Generated content */}
        <div className="mb-6">
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-48 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <ContentRenderer content={preview.generatedContent} />
            </div>
          )}
        </div>

        {/* Source attribution */}
        {preview.sourceAttribution.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Sources used:
            </h4>
            <div className="space-y-2">
              {preview.sourceAttribution.map((source, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-2 bg-blue-50 rounded-lg"
                >
                  <DocumentIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">
                      {source.documentName}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {source.excerpt}...
                    </p>
                  </div>
                  <div className="text-xs text-blue-600 font-mono">
                    {Math.round(source.relevanceScore * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onEdit(editedContent);
                    setIsEditing(false);
                  }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditedContent(preview.generatedContent);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" size="sm" onClick={onApprove}>
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {preview.suggestedChanges &&
              preview.suggestedChanges.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onViewAlternatives}
                >
                  Alternatives
                </Button>
              )}
            <Button variant="ghost" size="sm" onClick={onReject}>
              Reject
            </Button>
          </div>
        </div>

        {/* Swipe indicators for mobile */}
        <div className="mt-4 flex justify-center">
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <ChevronLeftIcon className="h-3 w-3" />
              <span>Reject</span>
            </div>
            <div className="flex items-center space-x-1">
              <ChevronRightIcon className="h-3 w-3" />
              <span>Apply</span>
            </div>
            <div className="flex items-center space-x-1">
              <ChevronUpIcon className="h-3 w-3" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </SwipeCard>
  );
};

// Confidence indicator component
const ConfidenceIndicator: React.FC<{ score: number }> = ({ score }) => {
  const getColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div
      className={cn(
        "px-2 py-1 rounded-full text-xs font-medium",
        getColor(score)
      )}
    >
      {Math.round(score * 100)}%
    </div>
  );
};
```

**Content Renderer for Different Content Types**:

````typescript
const ContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = content.length > 500;
  const displayContent =
    shouldTruncate && !isExpanded ? content.substring(0, 500) + "..." : content;

  // Detect content type and render appropriately
  if (content.includes("```")) {
    return <CodeRenderer content={displayContent} />;
  }

  if (content.includes("|") && content.includes("---")) {
    return <TableRenderer content={displayContent} />;
  }

  return (
    <div>
      <ReactMarkdown
        className="prose prose-sm max-w-none"
        components={{
          code: ({ node, ...props }) => (
            <code
              className="bg-gray-100 px-1 py-0.5 rounded text-sm"
              {...props}
            />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-lg font-bold mb-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-base font-semibold mb-2" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 leading-relaxed" {...props} />
          ),
        }}
      >
        {displayContent}
      </ReactMarkdown>

      {shouldTruncate && (
        <button
          className="text-sm text-primary-600 hover:text-primary-700 mt-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};
````

**Deliverable**: Rich preview system with edit capabilities and source attribution

#### **2.3 Real-time Processing UI (4 hours)**

**Processing Status Component**:

```typescript
interface ProcessingStatusProps {
  request: AgentRequest;
  status: ProcessingStatus;
  onCancel?: () => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  request,
  status,
  onCancel,
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">Processing your request</h3>
          <p className="text-sm text-gray-500 mt-1">{request.content}</p>
        </div>

        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XMarkIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {status.stage}
          </span>
          <span className="text-sm text-gray-500">{status.progress}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-primary-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${status.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Processing stages */}
      <div className="space-y-3">
        {processingStages.map((stage, index) => {
          const isCurrent = status.currentStage === index;
          const isComplete = index < status.currentStage;

          return (
            <div key={stage.id} className="flex items-center space-x-3">
              <div
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  isComplete
                    ? "bg-green-100 text-green-600"
                    : isCurrent
                    ? "bg-primary-100 text-primary-600"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                {isComplete ? (
                  <CheckIcon className="h-3 w-3" />
                ) : isCurrent ? (
                  <Spinner className="h-3 w-3" />
                ) : (
                  index + 1
                )}
              </div>

              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isComplete || isCurrent ? "text-gray-900" : "text-gray-500"
                  )}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-gray-500">{stage.description}</p>
              </div>

              {isCurrent && (
                <div className="text-xs text-gray-500">
                  {formatTime(timeElapsed)}s
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const processingStages = [
  {
    id: "context_retrieval",
    label: "Retrieving context",
    description: "Finding relevant information from your knowledge base",
  },
  {
    id: "agent_processing",
    label: "Processing request",
    description: "AI agent is generating content based on context",
  },
  {
    id: "quality_validation",
    label: "Validating quality",
    description: "Ensuring the response meets quality standards",
  },
  {
    id: "preview_generation",
    label: "Preparing preview",
    description: "Creating preview with source attribution",
  },
];
```

**Live Progress Updates via WebSocket**:

```typescript
export const useAgentProcessing = (requestId: string) => {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;

    // Connect to WebSocket for real-time updates
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/agent-processing/${requestId}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "status_update":
          setStatus(data.status);
          break;
        case "completed":
          setResult(data.result);
          setStatus(null);
          break;
        case "error":
          setError(data.error);
          setStatus(null);
          break;
      }
    };

    ws.onerror = (error) => {
      setError("Connection error occurred");
    };

    return () => {
      ws.close();
    };
  }, [requestId]);

  return { status, result, error };
};
```

**Deliverable**: Real-time processing UI with WebSocket updates and progress tracking

### **Phase 3: Document Management & Search (Week 7 - 20 hours)**

#### **3.1 Document List & File Management (8 hours)**

**Document List Component**:

```typescript
export const DocumentList: React.FC = () => {
  const [documents] = useDocuments();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        await uploadDocument(file);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            handleFileUpload(files);
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".md,.txt,.json,.yaml,.yml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFileUpload(e.target.files);
            }
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Spinner className="h-8 w-8 text-primary-600 mb-2" />
            <p className="text-sm text-gray-600">Uploading files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Upload your documents
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop files here, or click to select
            </p>
            <p className="text-xs text-gray-500">
              Supports: Markdown, Text, JSON, YAML (up to 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Document grid */}
      {documents.length > 0 && (
        <Grid cols={{ default: 1, sm: 2, lg: 3 }} gap="md">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </Grid>
      )}
    </div>
  );
};

// Document card component
const DocumentCard: React.FC<{ document: Document }> = ({ document }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <DocumentIcon className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {document.filename}
            </h3>
            <p className="text-sm text-gray-500">
              {formatFileSize(document.fileSize)} •{" "}
              {formatDate(document.createdAt)}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                View details
              </button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                Download
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Processing status */}
      <ProcessingStatusBadge status={document.processingStatus} />

      {/* Document stats */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {document.chunkCount} chunks
        </div>
        <div className="text-xs text-gray-500">{document.wordCount} words</div>
      </div>
    </div>
  );
};
```

**Mobile File Upload Optimization**:

```typescript
// Mobile-optimized file upload with progress
export const MobileFileUpload: React.FC = () => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const handleFiles = async (files: FileList) => {
    const newUploads = Array.from(files).map((file) => ({
      id: generateId(),
      file,
      progress: 0,
      status: "uploading" as UploadStatus,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // Upload files sequentially to avoid overwhelming mobile connections
    for (const upload of newUploads) {
      try {
        await uploadFileWithProgress(upload.file, (progress) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, progress } : u))
          );
        });

        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: "completed" } : u
          )
        );
      } catch (error) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: "error", error: error.message }
              : u
          )
        );
      }
    }
  };

  return (
    <div>
      {uploads.length > 0 && (
        <div className="space-y-2 mb-4">
          {uploads.map((upload) => (
            <UploadProgressCard key={upload.id} upload={upload} />
          ))}
        </div>
      )}

      {/* File input area */}
      <FileDropZone onFiles={handleFiles} />
    </div>
  );
};
```

**Deliverable**: Mobile-optimized document management with drag-and-drop upload

#### **3.2 Search Interface (6 hours)**

**Search Component with AI-Enhanced Results**:

```typescript
export const SearchInterface: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<"semantic" | "keyword">(
    "semantic"
  );

  const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const searchResults = await performSearch({
        query: searchQuery,
        type: searchType,
        limit: 20,
      });

      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, searchType, debouncedSearch]);

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your knowledge base..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
        />

        {isSearching && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Spinner className="h-5 w-5 text-primary-600" />
          </div>
        )}
      </div>

      {/* Search type toggle */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          className={cn(
            "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            searchType === "semantic"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setSearchType("semantic")}
        >
          AI Search
        </button>
        <button
          className={cn(
            "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            searchType === "keyword"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setSearchType("keyword")}
        >
          Keyword
        </button>
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              {results.length} results found
            </h3>
            {searchType === "semantic" && (
              <span className="text-sm text-gray-500">
                Showing most relevant
              </span>
            )}
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <SearchResultCard key={result.id} result={result} query={query} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {query && !isSearching && results.length === 0 && (
        <div className="text-center py-8">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600">
            Try a different search term or switch to keyword search
          </p>
        </div>
      )}
    </div>
  );
};

// Search result card with highlighting
const SearchResultCard: React.FC<{ result: SearchResult; query: string }> = ({
  result,
  query,
}) => {
  const highlightedContent = highlightText(result.content, query);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <DocumentIcon className="h-4 w-4 text-primary-600" />
          <h4 className="font-medium text-gray-900 text-sm">
            {result.documentName}
          </h4>
        </div>
        {result.similarity && (
          <div className="text-xs text-gray-500 font-mono">
            {Math.round(result.similarity * 100)}%
          </div>
        )}
      </div>

      {result.sectionHierarchy && (
        <div className="text-xs text-gray-500 mb-2">
          {result.sectionHierarchy.join(" > ")}
        </div>
      )}

      <div className="prose prose-sm max-w-none">
        <div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {formatDate(result.createdAt)}
        </div>
        <button className="text-xs text-primary-600 hover:text-primary-700">
          View in context
        </button>
      </div>
    </div>
  );
};
```

**Search with Agent Integration**:

```typescript
// Quick search-to-agent actions
export const SearchActions: React.FC<{
  query: string;
  results: SearchResult[];
}> = ({ query, results }) => {
  const actions = [
    {
      label: "Summarize these results",
      icon: DocumentTextIcon,
      action: () =>
        triggerAgent(
          "research",
          `Summarize the key points from these search results about "${query}"`
        ),
      color: "blue",
    },
    {
      label: "Create document from findings",
      icon: PlusIcon,
      action: () =>
        triggerAgent(
          "create",
          `Create a comprehensive document about "${query}" based on my knowledge base`
        ),
      color: "green",
    },
    {
      label: "Find gaps in information",
      icon: ExclamationTriangleIcon,
      action: () =>
        triggerAgent(
          "research",
          `What information gaps exist about "${query}" based on my current knowledge?`
        ),
      color: "yellow",
    },
  ];

  if (results.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 mt-6">
      <h4 className="font-medium text-gray-900 mb-3">AI Actions</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            className="flex items-center space-x-2 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors text-left"
            onClick={action.action}
          >
            <action.icon className={`h-5 w-5 text-${action.color}-600`} />
            <span className="text-sm font-medium text-gray-900">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

**Deliverable**: AI-enhanced search with agent integration and mobile optimization

#### **3.3 Settings & Profile Management (6 hours)**

**Settings Interface**:

```typescript
export const SettingsInterface: React.FC = () => {
  const [user] = useUser();
  const [settings, setSettings] = useState<UserSettings>();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSetting = async (key: string, value: any) => {
    setIsUpdating(true);
    try {
      await updateUserSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to update setting:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Profile</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display name
            </label>
            <input
              type="text"
              defaultValue={user?.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onBlur={(e) => updateSetting('name', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              defaultValue={user?.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* AI preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">AI Preferences</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default AI model
            </label>
            <select
              defaultValue={settings?.defaultModel}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onChange={(e) => updateSetting('defaultModel', e.target.value)}
            >
              <option value="auto">Auto-select (recommended)</option>
              <option value="gpt-4o">GPT-4o (balanced)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (fast & affordable)</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (advanced reasoning)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Response style
            </label>
            <select
              defaultValue={settings?.responseStyle}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onChange={(e) => updateSetting('responseStyle', e.target.value)}
            >
              <option value="balanced">Balanced</option>
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
              <option value="creative">Creative</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Auto-apply high confidence responses
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Automatically apply responses with >90% confidence
              </p>
            </div>
            <Switch
              checked={settings?.autoApplyHighConfidence}
              onCheckedChange={(checked) => updateSetting('autoApplyHighConfidence', checked)}
            />
          </div>
        </div>
      </div>

      {/* Usage & billing */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Usage & Billing</h3>

        <UsageOverview />
        <BillingSection />
      </div>

      {/* App preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">App Preferences</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable push notifications
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Get notified when agent requests complete
              </p>
            </div>
            <Switch
              checked={settings?.pushNotifications}
              onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Offline mode
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Queue requests when offline
              </p>
            </div>
            <Switch
              checked={settings?.offlineMode}
              onCheckedChange={(checked) => updateSetting('offlineMode', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Deliverable**: Complete settings interface with user preferences and billing integration

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Week 5 Deliverables**

- [ ] Next.js PWA configuration with offline capabilities
- [ ] Mobile-first design system and component library
- [ ] Responsive layout system with touch optimization
- [ ] Service worker for background sync and caching
- [ ] Push notification system setup
- [ ] Basic navigation and app shell

### **Week 6 Deliverables**

- [ ] AI agent request interface with voice input
- [ ] Agent response preview system with swipe gestures
- [ ] Real-time processing status with WebSocket updates
- [ ] Content rendering for different formats
- [ ] Source attribution and confidence indicators
- [ ] Alternative response generation

### **Week 7 Deliverables**

- [ ] Document management with drag-and-drop upload
- [ ] AI-enhanced search with semantic and keyword modes
- [ ] Search-to-agent action integration
- [ ] Settings and profile management interface
- [ ] Usage analytics and billing integration
- [ ] Mobile optimization and performance tuning

### **Quality Gates**

- [ ] PWA installs correctly on iOS and Android
- [ ] <3 second initial load time on mobile 3G
- [ ] Touch targets meet 44px minimum accessibility requirement
- [ ] Offline functionality works for core features
- [ ] 60fps interactions on mid-range mobile devices
- [ ] Push notifications deliver within 30 seconds

---

## 📊 **SUCCESS METRICS**

### **User Experience**

- **Mobile Usage**: 60%+ of sessions on mobile devices
- **PWA Installation**: 40%+ of mobile users install PWA
- **Touch Interaction**: 95% successful touch interactions on first try
- **Agent Approval**: 85%+ users approve agent responses via swipe

### **Performance**

- **Load Time**: <3 seconds initial load on mobile 3G
- **Agent Response**: <10 seconds from request to preview
- **Offline Capability**: Core features work offline
- **Battery Impact**: <5% battery drain per hour of usage

### **Adoption**

- **Feature Usage**: 70% of users use each core feature within first week
- **Daily Active Users**: 40% of registered users return daily
- **Session Length**: 8+ minutes average mobile session
- **User Retention**: 60% day-7 retention, 40% day-30 retention

---

## 🚀 **SUPABASE PLUS PWA ARCHITECTURE SUMMARY**

### **Frontend Evolution - Supabase → Supabase Plus**

**This document has been updated to reflect the optimal Supabase Plus frontend architecture. Key enhancements:**

#### **Optimized State & Type Safety**

- **Supabase**: Auto-generated TypeScript types from database schema
- **Plus Valtio**: Reactive state with zero boilerplate for real-time UI updates
- **Plus Zod**: Frontend runtime validation preventing data corruption
- **Plus Enhanced Queries**: postgres.js for complex search without leaving type safety
- **Benefit**: 30-minute setup, reactive UIs, bulletproof type safety, scalable architecture

#### **Real-time Capabilities Revolution**

- **From**: WebSocket connections or polling for agent updates
- **To**: Supabase real-time subscriptions with automatic reconnection
- **Benefit**: Sub-second AI progress updates, better battery efficiency, no custom WebSocket management

#### **Authentication & Session Management**

- **From**: Custom auth forms with JWT handling and session management
- **To**: Supabase Auth with built-in social logins and automatic token refresh
- **Benefit**: Zero custom auth code, cross-device session sync, secure by default

#### **Offline & Caching Strategy**

- **From**: Custom service worker caching with manual API response management
- **To**: Apollo Client cache + Supabase client offline capabilities
- **Benefit**: Intelligent caching, automatic query deduplication, optimistic updates

### **Key Frontend Implementation Changes**

#### **Client Setup (Simplified)**

```typescript
// Before: Multiple clients and configuration
const trpcClient = createTRPCReact<AppRouter>();
const queryClient = new QueryClient();

// After: Single Supabase client with everything built-in
const supabase = createClient(url, key);
```

#### **Real-time AI Progress (Revolutionary)**

```typescript
// Before: Polling every 2 seconds
useInterval(() => {
  refetch();
}, 2000);

// After: Real-time subscriptions
const { progress } = useAgentProgress(requestId);
// Automatically updates sub-second with no polling
```

#### **Data Fetching (Simplified)**

```typescript
// Before: Custom tRPC queries with error handling
const { data, error, isLoading } = api.documents.list.useQuery();

// After: Auto-generated GraphQL with Apollo Client
const { data, error, loading } = useQuery(GET_DOCUMENTS);
```

### **Performance & UX Improvements**

| Feature                 | tRPC + Polling            | Supabase + Real-time      | Improvement             |
| ----------------------- | ------------------------- | ------------------------- | ----------------------- |
| **AI Progress Updates** | 2-5s delay (polling)      | <1s delay (subscriptions) | 80% faster feedback     |
| **Battery Usage**       | High (constant polling)   | Low (event-driven)        | 60% better efficiency   |
| **Network Usage**       | High (redundant requests) | Low (only changes)        | 70% bandwidth reduction |
| **Offline Support**     | Manual implementation     | Built-in with cache       | Much better reliability |
| **Auth Flow**           | Custom forms + JWT        | Social logins built-in    | 90% less auth code      |
| **Type Safety**         | tRPC generated            | GraphQL generated         | Equal but simpler       |

### **Implementation Timeline Acceleration**

| Phase                  | Traditional   | Pure Supabase | Supabase Plus | Time Saved        |
| ---------------------- | ------------- | ------------- | ------------- | ----------------- |
| **Client Setup**       | 12 hours      | 6 hours       | 2 hours       | 83% faster        |
| **State Management**   | 15 hours      | 8 hours       | 4 hours       | 73% faster        |
| **Type Safety**        | 10 hours      | 5 hours       | 2 hours       | 80% faster        |
| **Real-time Features** | 18 hours      | 10 hours      | 6 hours       | 67% faster        |
| **Data Management**    | 14 hours      | 8 hours       | 5 hours       | 64% faster        |
| **Agent Integration**  | 16 hours      | 10 hours      | 6 hours       | 63% faster        |
| **Offline Support**    | 12 hours      | 6 hours       | 4 hours       | 67% faster        |
| **Testing & Polish**   | 8 hours       | 6 hours       | 4 hours       | 50% faster        |
| **Total**              | **105 hours** | **59 hours**  | **33 hours**  | **69% reduction** |

### **Supabase Plus Frontend Benefits**

✅ **30-minute frontend setup** vs 4+ hours traditional  
✅ **Real-time by default** - Valtio reactive state + Supabase subscriptions  
✅ **Type safety everywhere** - Database to UI with runtime validation  
✅ **Enhanced queries** - Complex operations without losing type safety  
✅ **Offline-first** - Automatic optimistic updates and sync  
✅ **Bundle efficiency** - ~120KB total vs 400KB+ traditional stacks  
✅ **Mobile optimized** - Built for touch, gestures, and PWA capabilities

### **Mobile-Specific Advantages**

#### **Real-time Subscriptions on Mobile**

- **Battery Efficient**: Event-driven vs constant polling
- **Bandwidth Optimized**: Only receive actual changes
- **Better UX**: Instant feedback vs waiting for next poll
- **Connection Resilient**: Auto-reconnect when network returns

#### **Authentication Improvements**

- **Social Logins**: Built-in Google, Apple, GitHub integration
- **Deep Links**: Automatic handling for mobile OAuth flows
- **Session Management**: Automatic refresh across app backgrounding
- **Biometric Auth**: Easy integration with native device security

#### **Offline Capabilities Enhancement**

- **Smart Caching**: Apollo Client + Supabase client work together
- **Optimistic Updates**: Immediate UI updates with server reconciliation
- **Background Sync**: Automatic when connection returns
- **Conflict Resolution**: Built-in handling for offline changes

### **PWA Advantages with Supabase**

✅ **Faster Development**: 55% less implementation time  
✅ **Better Performance**: Sub-second real-time updates  
✅ **Enhanced UX**: No loading states for live data  
✅ **Improved Mobile**: Better battery and bandwidth efficiency  
✅ **Built-in Security**: Database-level RLS policies  
✅ **Simplified Architecture**: Single client for everything  
✅ **Cross-platform Ready**: Same client works for React Native

### **React Native Transition Benefits**

The Supabase client approach makes the eventual React Native transition seamless:

- **Same API**: Identical Supabase client across web and mobile
- **Same Auth**: Authentication flows work identically
- **Same Real-time**: Subscriptions work the same way
- **Same Offline**: Caching strategies port directly
- **80%+ Code Sharing**: Most business logic remains identical

---

**This mobile-first PWA for Centrid, powered by Supabase integration, provides an intuitive, native-feeling interface with true real-time capabilities that makes AI agents accessible to users anywhere, while establishing the perfect foundation for seamless transition to React Native apps.**
