import type { BranchNode, ContextItem, TreeNode, ProvenanceData } from '@centrid/ui/features';
import type { MessageData } from '@centrid/ui/features';

// Mock branches for realistic tree structure
export const mockBranches: BranchNode[] = [
  {
    id: 'main',
    title: 'Main',
    parentId: null,
    depth: 0,
    childCount: 3,
    artifactCount: 2,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    isActive: false,
  },
  {
    id: 'rag-deep-dive',
    title: 'RAG Deep Dive',
    parentId: 'main',
    depth: 1,
    childCount: 2,
    artifactCount: 5,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 10), // 10 min ago
    isActive: true,
  },
  {
    id: 'orchestration-patterns',
    title: 'Orchestration Patterns',
    parentId: 'main',
    depth: 1,
    childCount: 0,
    artifactCount: 3,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    isActive: false,
  },
  {
    id: 'prompting-techniques',
    title: 'Prompting Techniques',
    parentId: 'main',
    depth: 1,
    childCount: 1,
    artifactCount: 4,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    isActive: false,
  },
  {
    id: 'rag-performance',
    title: 'RAG Performance Optimization',
    parentId: 'rag-deep-dive',
    depth: 2,
    childCount: 0,
    artifactCount: 2,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
    isActive: false,
  },
  {
    id: 'rag-chunking-strategies',
    title: 'Chunking Strategies',
    parentId: 'rag-deep-dive',
    depth: 2,
    childCount: 0,
    artifactCount: 1,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
    isActive: false,
  },
  {
    id: 'few-shot-examples',
    title: 'Few-Shot Examples',
    parentId: 'prompting-techniques',
    depth: 2,
    childCount: 0,
    artifactCount: 3,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    isActive: false,
  },
];

// Mock context items
export const mockExplicitContext: ContextItem[] = [
  {
    id: 'file-1',
    label: 'rag-architecture.md',
    type: 'file',
    canRemove: true,
  },
  {
    id: 'file-2',
    label: 'vector-database-comparison.md',
    type: 'file',
    canRemove: true,
  },
  {
    id: 'thread-1',
    label: 'Main: AI Agent Architecture',
    type: 'thread',
    canRemove: true,
  },
];

export const mockFrequentlyUsed: ContextItem[] = [
  {
    id: 'freq-1',
    label: 'project-requirements.md',
    type: 'file',
    canRemove: false,
  },
  {
    id: 'freq-2',
    label: 'tech-stack.md',
    type: 'file',
    canRemove: false,
  },
];

export const mockSemanticMatches: ContextItem[] = [
  {
    id: 'sem-1',
    label: 'embedding-models.md',
    type: 'file',
    relevanceScore: 0.92,
    sourceBranch: 'Main',
    relationship: 'parent',
    canRemove: true,
  },
  {
    id: 'sem-2',
    label: 'retrieval-strategies.md',
    type: 'file',
    relevanceScore: 0.87,
    sourceBranch: 'Orchestration Patterns',
    relationship: 'sibling',
    canRemove: true,
  },
  {
    id: 'sem-3',
    label: 'performance-benchmarks.md',
    type: 'file',
    relevanceScore: 0.81,
    sourceBranch: 'RAG Performance Optimization',
    relationship: 'child',
    canRemove: true,
  },
];

export const mockBranchContext: ContextItem[] = [
  {
    id: 'branch-1',
    label: 'agent-tools-spec.md',
    type: 'file',
  },
  {
    id: 'branch-2',
    label: 'Parent thread summary',
    type: 'thread',
  },
];

export const mockArtifacts: ContextItem[] = [
  {
    id: 'artifact-1',
    label: 'rag-implementation-plan.md',
    type: 'file',
    createdAt: new Date(Date.now() - 1000 * 60 * 20), // 20 min ago
  },
  {
    id: 'artifact-2',
    label: 'chunking-comparison.md',
    type: 'file',
    createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 min ago
  },
];

export const mockExcludedContext: ContextItem[] = [
  {
    id: 'excl-1',
    label: 'old-architecture-notes.md',
    type: 'file',
    relevanceScore: 0.42,
    canAdd: true,
  },
  {
    id: 'excl-2',
    label: 'deprecated-configs.md',
    type: 'file',
    relevanceScore: 0.38,
    canAdd: true,
  },
];

// Mock messages for chat
export const mockMessages: MessageData[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Explain the key components of a RAG system',
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
  },
  {
    id: 'msg-2',
    role: 'agent',
    contentBlocks: [
      {
        id: 'msg-2-text',
        type: 'text',
        content:
          'A RAG (Retrieval-Augmented Generation) system has three key components:\n\n1. **Vector Store**: Stores document embeddings for semantic search\n2. **Retrieval System**: Finds relevant documents based on query similarity\n3. **Generation Model**: Synthesizes answers using retrieved context\n\nLet me create a detailed architecture document for you.',
      },
      {
        id: 'msg-2-tool',
        type: 'tool_calls',
        toolCalls: [
          {
            id: 'tool-1',
            name: 'write_file',
            status: 'approved',
            input: {
              path: 'rag-architecture.md',
              content: '# RAG Architecture\n\n## Components...',
            },
            output: { success: true, fileId: 'file-123' },
          },
        ],
      },
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 24),
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'How can we optimize retrieval performance?',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'msg-4',
    role: 'agent',
    contentBlocks: [
      {
        id: 'msg-4-text',
        type: 'text',
        content:
          'There are several key strategies for optimizing RAG retrieval performance:\n\n1. **Chunking Strategy**: Smaller chunks (200-300 tokens) for precise retrieval\n2. **Hybrid Search**: Combine semantic and keyword search\n3. **Reranking**: Use cross-encoder models for top-k refinement\n4. **Caching**: Cache frequent queries and embeddings\n\nWould you like me to create a detailed comparison document?',
      },
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 14),
  },
];

// Mock tree nodes for visual tree view
export const mockTreeNodes: TreeNode[] = mockBranches.map((branch) => ({
  id: branch.id,
  title: branch.title,
  parentId: branch.parentId,
  artifactCount: branch.artifactCount,
  lastActivityAt: branch.lastActivityAt,
  isActive: branch.isActive,
  createdBy: branch.id === 'rag-deep-dive' || branch.id === 'few-shot-examples' ? 'agent' : 'user',
}));

// Mock provenance data
export const mockProvenance: ProvenanceData = {
  sourceBranch: 'RAG Deep Dive',
  sourceBranchId: 'rag-deep-dive',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  contextSummary:
    'This file was created during a discussion about RAG architecture best practices, specifically focusing on chunking strategies and vector database selection for optimal retrieval performance.',
  lastEditedBy: 'agent',
  lastEditedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  editedInBranch: 'RAG Performance Optimization',
  editedInBranchId: 'rag-performance',
};
