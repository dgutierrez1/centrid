import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Workspace,
  ThreadView,
  Branch,
  ContextGroup,
  ContextReferenceProps,
  Thread,
  File,
  FileData,
  type AgentEvent,
  CreateBranchModal,
  ConsolidateModal,
} from '@centrid/ui/features';

// Use static timestamps to avoid hydration errors
const FIXED_BASE_TIME = new Date('2025-10-26T11:00:00Z').getTime();

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  events?: AgentEvent[];
  timestamp: Date;
  isStreaming?: boolean;
}

// Tool templates for random generation
const TOOL_TEMPLATES = [
  {
    name: 'search_code',
    description: 'Searching codebase',
    inputGen: () => ({ pattern: 'RAG', path: './src' }),
    outputGen: () => `Found 12 matches`,
  },
  {
    name: 'read_file',
    description: 'Reading rag-best-practices.md',
    inputGen: () => ({ file_path: './docs/rag-best-practices.md' }),
    outputGen: () => `File contents retrieved (234 lines)`,
  },
  {
    name: 'analyze_patterns',
    description: 'Analyzing chunking patterns',
    inputGen: () => ({ focus: 'chunking strategies' }),
    outputGen: () => `Found 3 different approaches`,
  },
];

function generateStreamingEvents(): AgentEvent[] {
  const events: AgentEvent[] = [];
  let eventId = 0;

  // Start with text
  events.push({
    type: 'text',
    id: `event-${eventId++}`,
    content: "Great question! Let me analyze the RAG implementation to find the best chunking strategies.",
  });

  // Add 2-3 tool calls
  const numTools = Math.floor(Math.random() * 2) + 2;
  for (let i = 0; i < numTools && i < TOOL_TEMPLATES.length; i++) {
    const template = TOOL_TEMPLATES[i];
    events.push({
      type: 'tool_call',
      id: `event-${eventId++}`,
      name: template.name,
      description: template.description,
      status: 'completed',
      input: template.inputGen(),
      output: template.outputGen(),
      duration: Math.floor(Math.random() * 2000) + 800,
    });
  }

  // Add a tool call that requires approval (Flow 8 demonstration)
  events.push({
    type: 'tool_call',
    id: `event-${eventId++}`,
    name: 'create_file',
    description: 'Creating chunking-strategies-summary.md',
    status: 'approval_required',
    approval_required: true,
    input: {
      file_path: './workspace/chunking-strategies-summary.md',
      content: '# Chunking Strategies Summary\n\n## Key Findings\n\n1. Fixed-size chunks (512 tokens)\n2. Semantic chunking\n3. Overlapping chunks (50-100 token overlap)\n\n## Recommendation\n\nUse fixed-size with overlap for consistent performance.',
    },
    previewContent: '# Chunking Strategies Summary\n\n## Key Findings\n\n1. Fixed-size chunks (512 tokens)\n2. Semantic chunking\n3. Overlapping chunks (50-100 token overlap)',
  });

  // End with conclusion
  events.push({
    type: 'text',
    id: `event-${eventId++}`,
    content: 'Based on my analysis, here are the key chunking approaches:\n\n1. **Fixed-size chunks** (512 tokens): Simple but may split context\n2. **Semantic chunking**: Split by paragraphs/sections\n3. **Overlapping chunks**: 50-100 token overlap preserves context\n\nThe codebase currently uses fixed-size with overlap, which is a solid approach!',
  });

  return events;
}

// Mock data
const mockBranches: Branch[] = [
  {
    id: 'main',
    title: 'Main',
    parentId: null,
    depth: 0,
    artifactCount: 2,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 30),
    summary: 'Exploring AI agent architecture approaches',
  },
  {
    id: 'rag-deep-dive',
    title: 'RAG Deep Dive',
    parentId: 'main',
    depth: 1,
    artifactCount: 5,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 10),
    summary: 'Detailed exploration of RAG best practices',
  },
  {
    id: 'rag-chunking',
    title: 'Chunking Strategies',
    parentId: 'rag-deep-dive',
    depth: 2,
    artifactCount: 3,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 8),
    summary: 'Comparing different chunking approaches',
  },
  {
    id: 'rag-embeddings',
    title: 'Embedding Models',
    parentId: 'rag-deep-dive',
    depth: 2,
    artifactCount: 2,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 12),
    summary: 'Evaluating embedding model performance',
  },
  {
    id: 'orchestration',
    title: 'Orchestration Patterns',
    parentId: 'main',
    depth: 1,
    artifactCount: 4,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 60),
    summary: 'Multi-agent orchestration strategies',
  },
  {
    id: 'sequential-orchestration',
    title: 'Sequential Chains',
    parentId: 'orchestration',
    depth: 2,
    artifactCount: 2,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 55),
    summary: 'Linear agent chains',
  },
  {
    id: 'parallel-orchestration',
    title: 'Parallel Execution',
    parentId: 'orchestration',
    depth: 2,
    artifactCount: 3,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 50),
    summary: 'Concurrent agent execution patterns',
  },
  {
    id: 'memory-systems',
    title: 'Memory Systems',
    parentId: 'main',
    depth: 1,
    artifactCount: 6,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 90),
    summary: 'Context and memory management',
  },
  {
    id: 'short-term-memory',
    title: 'Short-term Context',
    parentId: 'memory-systems',
    depth: 2,
    artifactCount: 2,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 85),
    summary: 'Working memory strategies',
  },
  {
    id: 'long-term-memory',
    title: 'Long-term Storage',
    parentId: 'memory-systems',
    depth: 2,
    artifactCount: 4,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 88),
    summary: 'Persistent knowledge management',
  },
  {
    id: 'vector-db-comparison',
    title: 'Vector DB Comparison',
    parentId: 'long-term-memory',
    depth: 3,
    artifactCount: 5,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 87),
    summary: 'Comparing pgvector, Pinecone, and Qdrant',
  },
];

const mockExplicitContext: Omit<ContextReferenceProps, 'isExpanded'>[] = [
  {
    referenceType: 'file',
    name: 'rag-best-practices.md',
    sourceBranch: 'RAG Deep Dive',
    priorityTier: 1,
    timestamp: new Date(FIXED_BASE_TIME - 1000 * 60 * 120),
  },
  {
    referenceType: 'file',
    name: 'architecture-overview.md',
    sourceBranch: 'Main',
    priorityTier: 1,
    timestamp: new Date(FIXED_BASE_TIME - 1000 * 60 * 180),
  },
];

const mockSemanticContext: Omit<ContextReferenceProps, 'isExpanded'>[] = [
  {
    referenceType: 'file',
    name: 'chunking-strategies.md',
    sourceBranch: 'RAG Deep Dive',
    relevanceScore: 0.95,
    relationship: 'sibling',
    priorityTier: 2,
    timestamp: new Date(FIXED_BASE_TIME - 1000 * 60 * 90),
  },
  {
    referenceType: 'file',
    name: 'embedding-models-comparison.md',
    sourceBranch: 'Embedding Models',
    relevanceScore: 0.87,
    relationship: 'sibling',
    priorityTier: 2,
    timestamp: new Date(FIXED_BASE_TIME - 1000 * 60 * 120),
  },
  {
    referenceType: 'file',
    name: 'vector-search-optimization.md',
    sourceBranch: 'Vector DB Comparison',
    relevanceScore: 0.82,
    relationship: 'cousin',
    priorityTier: 2,
    timestamp: new Date(FIXED_BASE_TIME - 1000 * 60 * 150),
  },
  {
    referenceType: 'thread',
    name: 'RAG Performance Analysis',
    sourceBranch: 'RAG Deep Dive',
    relevanceScore: 0.78,
    relationship: 'sibling',
    priorityTier: 2,
    timestamp: new Date(FIXED_BASE_TIME - 1000 * 60 * 200),
  },
];

const mockArtifactsContext: Omit<ContextReferenceProps, 'isExpanded'>[] = [
  {
    referenceType: 'file',
    name: 'rag-analysis-output.md',
    sourceBranch: 'RAG Deep Dive',
    priorityTier: 1,
    timestamp: new Date(FIXED_BASE_TIME - 1000 * 60 * 5),
  },
];

const mockThreads: Thread[] = [
  {
    id: 'main',
    title: 'Main',
    artifactCount: 2,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 30),
    parentId: null,
    depth: 0,
  },
  {
    id: 'rag-deep-dive',
    title: 'RAG Deep Dive',
    artifactCount: 5,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 10),
    isActive: true,
    parentId: 'main',
    depth: 1,
  },
  {
    id: 'rag-chunking',
    title: 'Chunking Strategies',
    artifactCount: 3,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 8),
    parentId: 'rag-deep-dive',
    depth: 2,
  },
  {
    id: 'rag-embeddings',
    title: 'Embedding Models',
    artifactCount: 2,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 12),
    parentId: 'rag-deep-dive',
    depth: 2,
  },
  {
    id: 'orchestration',
    title: 'Orchestration Patterns',
    artifactCount: 4,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 60),
    parentId: 'main',
    depth: 1,
  },
  {
    id: 'sequential-orchestration',
    title: 'Sequential Chains',
    artifactCount: 2,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 55),
    parentId: 'orchestration',
    depth: 2,
  },
  {
    id: 'parallel-orchestration',
    title: 'Parallel Execution',
    artifactCount: 3,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 50),
    parentId: 'orchestration',
    depth: 2,
  },
  {
    id: 'memory-systems',
    title: 'Memory Systems',
    artifactCount: 6,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 90),
    parentId: 'main',
    depth: 1,
  },
  {
    id: 'short-term-memory',
    title: 'Short-term Context',
    artifactCount: 2,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 85),
    parentId: 'memory-systems',
    depth: 2,
  },
  {
    id: 'long-term-memory',
    title: 'Long-term Storage',
    artifactCount: 4,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 88),
    parentId: 'memory-systems',
    depth: 2,
  },
  {
    id: 'vector-db-comparison',
    title: 'Vector DB Comparison',
    artifactCount: 5,
    lastActivity: new Date(FIXED_BASE_TIME - 1000 * 60 * 87),
    parentId: 'long-term-memory',
    depth: 3,
  },
];

const mockFiles: File[] = [
  {
    id: 'workspace',
    name: 'workspace',
    path: '/workspace',
    lastModified: new Date(FIXED_BASE_TIME - 1000 * 60 * 200),
    type: 'folder',
    parentId: null,
    depth: 0,
  },
  {
    id: 'file-1',
    name: 'rag-best-practices.md',
    path: '/workspace/rag-best-practices.md',
    lastModified: new Date(FIXED_BASE_TIME - 1000 * 60 * 120),
    type: 'file',
    parentId: 'workspace',
    depth: 1,
  },
];

const mockFileContent: FileData = {
  id: 'file-1',
  name: 'rag-best-practices.md',
  content: `# RAG Best Practices\n\n## Chunking Strategies\n\n1. **Fixed-size chunks**: 512-1024 tokens\n2. **Semantic chunking**: Split by paragraphs\n3. **Overlapping chunks**: 50-100 token overlap`,
  provenance: {
    createdAt: new Date(FIXED_BASE_TIME - 1000 * 60 * 120),
    createdBy: 'agent',
    sourceBranch: 'RAG Deep Dive',
    sourceThreadId: 'rag-deep-dive',
    sourceMessageId: 'msg-123',
    lastEditedAt: new Date(FIXED_BASE_TIME - 1000 * 60 * 60),
    lastEditedBy: 'agent',
    lastEditSourceThreadId: 'rag-deep-dive',
  },
};

const initialMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Can you explain how RAG works in AI agent systems?',
    timestamp: new Date(FIXED_BASE_TIME - 1000 * 60 * 15),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'RAG (Retrieval-Augmented Generation) combines vector search with LLMs. It works by indexing documents, retrieving relevant chunks, and generating responses with that context.',
    timestamp: new Date(FIXED_BASE_TIME - 1000 * 60 * 14),
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'What are the best practices for chunking strategies?',
    timestamp: new Date(FIXED_BASE_TIME - 1000 * 60 * 5),
  },
];

export function AiAgentSystemMock({ showFileEditor = false }: { showFileEditor?: boolean }) {
  const [currentBranchId, setCurrentBranchId] = useState('vector-db-comparison');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarActiveTab, setSidebarActiveTab] = useState<'files' | 'threads'>('threads');
  const [isFileEditorOpen, setIsFileEditorOpen] = useState(showFileEditor);
  const [currentFile, setCurrentFile] = useState<FileData | null>(showFileEditor ? mockFileContent : null);
  const [isContextExpanded, setIsContextExpanded] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const hasAutoStarted = useRef(false);

  const simulateStreaming = useCallback((allEvents: AgentEvent[], messageId: string) => {
    let currentIndex = 0;
    setIsStreaming(true);

    const streamInterval = setInterval(() => {
      if (currentIndex >= allEvents.length) {
        clearInterval(streamInterval);
        setIsStreaming(false);
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, isStreaming: false } : msg
        ));
        return;
      }

      const event = allEvents[currentIndex];

      if (event.type === 'tool_call') {
        const runningEvent = { ...event, status: 'running' as const };
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, events: [...(msg.events || []), runningEvent] }
            : msg
        ));

        setTimeout(() => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              const updatedEvents = [...(msg.events || [])];
              updatedEvents[updatedEvents.length - 1] = event;
              return { ...msg, events: updatedEvents };
            }
            return msg;
          }));
        }, Math.floor(Math.random() * 1200) + 600);
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, events: [...(msg.events || []), event] }
            : msg
        ));
      }

      currentIndex++;
    }, Math.floor(Math.random() * 600) + 500);
  }, []);

  // Auto-start streaming response on mount
  useEffect(() => {
    if (hasAutoStarted.current) return;
    hasAutoStarted.current = true;

    const agentEvents = generateStreamingEvents();
    const agentMessageId = `msg-${Date.now()}`;

    const agentMessage: Message = {
      id: agentMessageId,
      role: 'assistant',
      events: [],
      timestamp: new Date(FIXED_BASE_TIME),
      isStreaming: true,
    };

    setTimeout(() => {
      setMessages(prev => [...prev, agentMessage]);
      setTimeout(() => {
        simulateStreaming(agentEvents, agentMessageId);
      }, 300);
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleToggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const handleToggleContext = () => {
    setIsContextExpanded((prev) => !prev);
  };

  const currentBranch = mockBranches.find((b) => b.id === currentBranchId) || mockBranches[0];

  const contextGroups: ContextGroup[] = [
    {
      type: 'explicit',
      title: 'Explicit Context',
      items: mockExplicitContext,
      emptyMessage: 'No explicit context added',
    },
    {
      type: 'semantic',
      title: 'Semantic Matches',
      items: mockSemanticContext,
      emptyMessage: 'No semantic matches',
    },
    {
      type: 'branch',
      title: 'Branch Context',
      items: [],
      emptyMessage: 'No branch context',
    },
    {
      type: 'artifacts',
      title: 'Artifacts',
      items: mockArtifactsContext,
      emptyMessage: 'No artifacts',
    },
  ];

  const handleSendMessage = (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageText('');

    setTimeout(() => {
      const agentEvents = generateStreamingEvents();
      const agentMessageId = `msg-${Date.now()}`;

      const agentMessage: Message = {
        id: agentMessageId,
        role: 'assistant',
        events: [],
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, agentMessage]);
      setTimeout(() => {
        simulateStreaming(agentEvents, agentMessageId);
      }, 300);
    }, 500);
  };

  const handleFileClick = (fileId: string) => {
    setCurrentFile(mockFileContent);
    setIsFileEditorOpen(true);
  };

  const handleThreadClick = (threadId: string) => {
    setCurrentBranchId(threadId);
  };

  const handleCreateThread = () => {
    console.log('Create new thread');
    // In real app: Open modal/form to create new thread
  };

  const handleCreateFile = () => {
    console.log('Create new file');
    // In real app: Open file creation modal
  };

  const handleCreateFolder = () => {
    console.log('Create new folder');
    // In real app: Open folder creation modal
  };

  const handleBranchThread = () => {
    setShowCreateBranchModal(true);
  };

  const handleConsolidate = () => {
    setShowConsolidateModal(true);
  };

  const handleCreateBranch = (branchName: string) => {
    console.log('Creating branch:', branchName);
    setShowCreateBranchModal(false);
    // In real app: Create actual branch
  };

  const handleConfirmConsolidate = (branchIds: string[], fileName: string) => {
    console.log('Consolidating branches:', branchIds, 'to file:', fileName);
    // In real app: Trigger consolidation process
  };

  const handleApproveConsolidation = (fileName: string) => {
    console.log('Approving consolidation to:', fileName);
    setShowConsolidateModal(false);
    // In real app: Create consolidated file
  };

  if (showFileEditor) {
    return (
      <>
        <Workspace
          sidebarActiveTab={sidebarActiveTab}
          onSidebarTabChange={setSidebarActiveTab}
          files={mockFiles}
          threads={mockThreads}
          onFileClick={handleFileClick}
          onThreadClick={handleThreadClick}
          onCreateThread={handleCreateThread}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          currentFile={currentFile}
          isFileEditorOpen={isFileEditorOpen}
          onCloseFileEditor={() => setIsFileEditorOpen(false)}
          onGoToSource={(branchId, messageId) => console.log('Go to source:', branchId, messageId)}
          onToggleSidebar={() => console.log('Toggle sidebar')}
          onToggleTheme={handleToggleTheme}
          onNotificationsClick={() => console.log('Notifications')}
          theme={theme}
          unreadNotificationsCount={3}
          userInitial="D"
          currentBranch={currentBranch}
          branches={mockBranches}
          messages={messages}
          contextGroups={contextGroups}
          messageText={messageText}
          isStreaming={isStreaming}
          isLoading={false}
          pendingToolCall={null}
          isContextExpanded={isContextExpanded}
          onSelectBranch={(id) => setCurrentBranchId(id)}
          onToggleContextPanel={handleToggleContext}
          onMessageChange={setMessageText}
          onSendMessage={handleSendMessage}
          onStopStreaming={() => setIsStreaming(false)}
          onApproveToolCall={() => {}}
          onRejectToolCall={() => {}}
          onAddToExplicit={(item) => console.log('Add:', item)}
          onRemove={(item) => console.log('Remove:', item)}
          onDismiss={(item) => console.log('Dismiss:', item)}
          onBranchThread={handleBranchThread}
          onConsolidate={handleConsolidate}
        />

        {/* Modals */}
        {showCreateBranchModal && (
          <CreateBranchModal
            isOpen={showCreateBranchModal}
            onClose={() => setShowCreateBranchModal(false)}
            onConfirm={handleCreateBranch}
            currentThreadTitle={currentBranch?.title || 'Current Thread'}
          />
        )}

        {showConsolidateModal && (
          <ConsolidateModal
            isOpen={showConsolidateModal}
            onClose={() => setShowConsolidateModal(false)}
            currentBranch={{
              id: currentBranch?.id || '',
              title: currentBranch?.title || '',
              artifactCount: currentBranch?.artifactCount || 0,
            }}
            childBranches={mockBranches.filter(b => b.parentId === currentBranchId).map(b => ({
              id: b.id,
              title: b.title,
              artifactCount: b.artifactCount,
            }))}
            onConfirmConsolidate={handleConfirmConsolidate}
            onApproveConsolidation={handleApproveConsolidation}
            onRejectConsolidation={() => setShowConsolidateModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="h-screen">
        <ThreadView
          currentBranch={currentBranch}
          branches={mockBranches}
          messages={messages}
          contextGroups={contextGroups}
          messageText={messageText}
          isStreaming={isStreaming}
          isLoading={false}
          pendingToolCall={null}
          isContextExpanded={isContextExpanded}
          onSelectBranch={(id) => setCurrentBranchId(id)}
          onToggleContextPanel={handleToggleContext}
          onMessageChange={setMessageText}
          onSendMessage={handleSendMessage}
          onStopStreaming={() => setIsStreaming(false)}
          onApproveToolCall={() => {}}
          onRejectToolCall={() => {}}
          onWidgetClick={(type) => console.log('Widget clicked:', type)}
          onBranchThread={handleBranchThread}
          onConsolidate={handleConsolidate}
        />
      </div>

      {/* Modals */}
      {showCreateBranchModal && (
        <CreateBranchModal
          isOpen={showCreateBranchModal}
          onClose={() => setShowCreateBranchModal(false)}
          onConfirm={handleCreateBranch}
          currentThreadTitle={currentBranch?.title || 'Current Thread'}
        />
      )}

      {showConsolidateModal && (
        <ConsolidateModal
          isOpen={showConsolidateModal}
          onClose={() => setShowConsolidateModal(false)}
          currentBranch={{
            id: currentBranch?.id || '',
            title: currentBranch?.title || '',
            artifactCount: currentBranch?.artifactCount || 0,
          }}
          childBranches={mockBranches.filter(b => b.parentId === currentBranchId).map(b => ({
            id: b.id,
            title: b.title,
            artifactCount: b.artifactCount,
          }))}
          onConfirmConsolidate={handleConfirmConsolidate}
          onApproveConsolidation={handleApproveConsolidation}
          onRejectConsolidation={() => setShowConsolidateModal(false)}
        />
      )}
    </>
  );
}
