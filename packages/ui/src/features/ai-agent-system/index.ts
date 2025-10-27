// AI Agent System Feature Components
// Export all feature-specific components

// Legacy components (keep for backward compatibility)
export { ContextReference } from './ContextReference';
export type { ContextReferenceData, ContextReferenceProps } from './ContextReference';

export { ContextReferenceBar } from './ContextReferenceBar';
export type { ContextReferenceBarProps } from './ContextReferenceBar';

export { ApprovalCard } from './ApprovalCard';
export type { ApprovalCardProps, FileChangePreview } from './ApprovalCard';

export { ChatCard } from './ChatCard';
export type { ChatCardProps, ChatData } from './ChatCard';

export { ChatListPanel } from './ChatListPanel';
export type { ChatListPanelProps } from './ChatListPanel';

export { ChatView } from './ChatView';
export type { ChatViewProps, MessageData } from './ChatView';

export { ConflictModal } from './ConflictModal';
export type { ConflictModalProps, ConflictingFile } from './ConflictModal';

// New components for branching threads and provenance (2025-10-26 spec)
export { BranchSelector } from './BranchSelector';
export type { BranchNode, BranchSelectorProps } from './BranchSelector';

export { ContextPanel } from './ContextPanel';
export type { ContextItem, ContextPanelProps } from './ContextPanel';

export { FileEditorWithProvenance } from './FileEditorWithProvenance';
export type { ProvenanceData, FileEditorWithProvenanceProps } from './FileEditorWithProvenance';

export { VisualTreeView } from './VisualTreeView';
export type { TreeNode, VisualTreeViewProps } from './VisualTreeView';

export { ContextWidgets } from './ContextWidgets';
export type { ContextWidget, ContextWidgetsProps } from './ContextWidgets';
