import React, { useState } from 'react';
import {
  ThreadView,
  Branch,
  MessageProps,
  ContextGroup,
  ContextReferenceProps,
} from '@centrid/ui/features';

// Mock data
const mockBranches: Branch[] = [
  {
    id: 'main',
    title: 'Main',
    parentId: null,
    depth: 0,
    artifactCount: 2,
    lastActivity: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    summary: 'Exploring AI agent architecture approaches',
  },
  {
    id: 'rag-deep-dive',
    title: 'RAG Deep Dive',
    parentId: 'main',
    depth: 1,
    artifactCount: 5,
    lastActivity: new Date(Date.now() - 1000 * 60 * 10), // 10 min ago
    summary: 'Detailed exploration of RAG best practices and implementation patterns',
  },
  {
    id: 'orchestration',
    title: 'Orchestration Patterns',
    parentId: 'main',
    depth: 1,
    artifactCount: 3,
    lastActivity: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    summary: 'Multi-agent orchestration strategies',
  },
  {
    id: 'rag-performance',
    title: 'RAG Performance',
    parentId: 'rag-deep-dive',
    depth: 2,
    artifactCount: 1,
    lastActivity: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
    summary: 'Optimizing RAG performance and latency',
  },
];

const mockMessages: MessageProps[] = [
  {
    role: 'user',
    content: 'Can you explain how RAG works in AI agent systems?',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    role: 'assistant',
    content:
      'RAG (Retrieval-Augmented Generation) combines vector search with LLMs. It works by:\n\n1. **Indexing**: Documents are split into chunks and converted to embeddings\n2. **Retrieval**: User queries are embedded and matched against the vector database\n3. **Generation**: Relevant chunks are provided as context to the LLM for answer generation\n\nThis approach allows AI agents to reference external knowledge without retraining.',
    timestamp: new Date(Date.now() - 1000 * 60 * 14),
  },
  {
    role: 'user',
    content: 'What are the best practices for chunking strategies?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
];

const mockExplicitContext: ContextReferenceProps[] = [
  {
    referenceType: 'file',
    name: 'rag-best-practices.md',
    sourceBranch: 'RAG Deep Dive',
    priorityTier: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    isExpanded: true,
  },
  {
    referenceType: 'file',
    name: 'architecture-overview.md',
    sourceBranch: 'Main',
    priorityTier: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    isExpanded: true,
  },
  {
    referenceType: 'thread',
    name: 'Orchestration Patterns',
    sourceBranch: 'Main',
    priorityTier: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    isExpanded: true,
  },
];

const mockSemanticContext: ContextReferenceProps[] = [
  {
    referenceType: 'file',
    name: 'chunking-strategies.md',
    sourceBranch: 'RAG Deep Dive',
    relevanceScore: 0.95,
    relationship: 'sibling',
    priorityTier: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    isExpanded: true,
  },
  {
    referenceType: 'file',
    name: 'embedding-models.md',
    sourceBranch: 'RAG Deep Dive',
    relevanceScore: 0.87,
    relationship: 'sibling',
    priorityTier: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 100),
    isExpanded: true,
  },
];

const mockArtifactsContext: ContextReferenceProps[] = [
  {
    referenceType: 'file',
    name: 'rag-analysis-output.md',
    sourceBranch: 'RAG Deep Dive',
    priorityTier: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isExpanded: true,
  },
];

export function AiAgentSystemMock() {
  const [currentBranchId, setCurrentBranchId] = useState('rag-deep-dive');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    explicit: true,
    'frequently-used': false,
    semantic: true,
    branch: false,
    artifacts: false,
    excluded: false,
  });
  const [pendingToolCall, setPendingToolCall] = useState<any>(null);

  const currentBranch = mockBranches.find((b) => b.id === currentBranchId) || mockBranches[1];

  const contextGroups: ContextGroup[] = [
    {
      type: 'explicit',
      title: 'Explicit Context',
      items: mockExplicitContext,
      isExpanded: expandedSections.explicit,
      emptyMessage: 'No explicit context added',
    },
    {
      type: 'frequently-used',
      title: 'Frequently Used',
      items: [],
      isExpanded: expandedSections['frequently-used'],
      emptyMessage: 'No frequently used files yet',
    },
    {
      type: 'semantic',
      title: 'Semantic Matches',
      items: mockSemanticContext,
      isExpanded: expandedSections.semantic,
      emptyMessage: 'No semantic matches found',
    },
    {
      type: 'branch',
      title: 'Branch Context',
      items: [],
      isExpanded: expandedSections.branch,
      emptyMessage: 'No branch context inherited',
    },
    {
      type: 'artifacts',
      title: 'Artifacts from this Thread',
      items: mockArtifactsContext,
      isExpanded: expandedSections.artifacts,
      emptyMessage: 'No artifacts created yet',
    },
    {
      type: 'excluded',
      title: 'Excluded from Context',
      items: [],
      isExpanded: expandedSections.excluded,
      emptyMessage: 'All items fit in context budget',
    },
  ];

  const handleSendMessage = (text: string) => {
    // Add user message
    const userMessage: MessageProps = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);
    setMessageText('');
    setIsLoading(true);

    // Simulate agent response
    setTimeout(() => {
      setIsLoading(false);
      setIsStreaming(true);

      // Simulate streaming
      setTimeout(() => {
        const agentMessage: MessageProps = {
          role: 'assistant',
          content:
            'Great question! Chunking strategies are crucial for RAG performance. Here are the key approaches:\n\n1. **Fixed-size chunks** (e.g., 512 tokens): Simple but may split context\n2. **Semantic chunking**: Split by paragraphs/sections for better context\n3. **Overlapping chunks**: Add overlap (50-100 tokens) to preserve context\n\nI can create a detailed analysis document about this. Would you like me to create a file?',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMessage]);
        setIsStreaming(false);

        // Simulate tool call approval
        setTimeout(() => {
          setPendingToolCall({
            toolName: 'create_file',
            toolInput: {
              path: 'chunking-strategies-analysis.md',
              content: '# Chunking Strategies Analysis\n\n## Overview\n...',
            },
            previewContent:
              '# Chunking Strategies Analysis\n\n## Overview\n\nThis document analyzes different chunking strategies for RAG systems.\n\n## Fixed-Size Chunks\n\nFixed-size chunking splits text into uniform segments...\n\n## Semantic Chunking\n\nSemantic chunking preserves logical boundaries...',
          });
        }, 1000);
      }, 2000);
    }, 500);
  };

  const handleApproveToolCall = () => {
    setPendingToolCall(null);
    // Mock file creation success
    console.log('Tool call approved');
  };

  const handleRejectToolCall = () => {
    setPendingToolCall(null);
    console.log('Tool call rejected');
  };

  return (
    <div className="h-screen">
      <ThreadView
        currentBranch={currentBranch}
        branches={mockBranches}
        messages={messages}
        contextGroups={contextGroups}
        messageText={messageText}
        isStreaming={isStreaming}
        isLoading={isLoading}
        pendingToolCall={pendingToolCall}
        onSelectBranch={(id) => setCurrentBranchId(id)}
        onToggleContextSection={(type) =>
          setExpandedSections((prev) => ({ ...prev, [type]: !prev[type as keyof typeof prev] }))
        }
        onMessageChange={setMessageText}
        onSendMessage={handleSendMessage}
        onStopStreaming={() => setIsStreaming(false)}
        onApproveToolCall={handleApproveToolCall}
        onRejectToolCall={handleRejectToolCall}
        onFileClick={(item) => console.log('File clicked:', item)}
        onAddToExplicit={(item) => console.log('Add to explicit:', item)}
        onRemove={(item) => console.log('Remove:', item)}
        onDismiss={(item) => console.log('Dismiss:', item)}
      />
    </div>
  );
}
