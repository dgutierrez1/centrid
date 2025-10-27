// AI Agent System Feature Components
export { Message } from './Message';
export type { MessageProps } from './Message';

export { MessageStream } from './MessageStream';
export type { MessageStreamProps } from './MessageStream';

export { ThreadInput } from './ThreadInput';
export type { ThreadInputProps } from './ThreadInput';

export { ContextReference } from './ContextReference';
export type { ContextReferenceProps } from './ContextReference';

export { ContextSection } from './ContextSection';
export type { ContextSectionProps } from './ContextSection';

export { ContextPanel } from './ContextPanel';
export type { ContextPanelProps, ContextGroup } from './ContextPanel';

export { BranchSelector } from './BranchSelector';
export type { BranchSelectorProps, Branch } from './BranchSelector';

export { ToolCallApproval } from './ToolCallApproval';
export type { ToolCallApprovalProps } from './ToolCallApproval';

export { ThreadView } from './ThreadView';
export type { ThreadViewProps } from './ThreadView';

export { WorkspaceSidebar } from './WorkspaceSidebar';
export type { WorkspaceSidebarProps, Thread, File } from './WorkspaceSidebar';

export { FileEditorPanel } from './FileEditorPanel';
export type { FileEditorPanelProps, FileData, Provenance } from './FileEditorPanel';

export { Workspace } from './Workspace';
export type { WorkspaceProps } from './Workspace';

export { ContextTypeWidget } from './ContextTypeWidget';
export type { ContextTypeWidgetProps } from './ContextTypeWidget';

export { WorkspaceHeader } from './WorkspaceHeader';
export type { WorkspaceHeaderProps } from './WorkspaceHeader';

export { AgentStreamEvent } from './AgentStreamEvent';
export type { AgentStreamEventProps, AgentEvent, TextEvent, ToolCallEvent, AgentEventType, ToolCallStatus } from './AgentStreamEvent';

export { AgentStreamMessage } from './AgentStreamMessage';
export type { AgentStreamMessageProps } from './AgentStreamMessage';

export { BranchActions } from './BranchActions';
export type { BranchActionsProps } from './BranchActions';

export { CreateBranchModal } from './CreateBranchModal';
export type { CreateBranchModalProps } from './CreateBranchModal';

export { ConsolidateModal } from './ConsolidateModal';
export type { ConsolidateModalProps } from './ConsolidateModal';

export { ProvenanceHeader } from './ProvenanceHeader';
export type { ProvenanceHeaderProps } from './ProvenanceHeader';
// Note: Provenance type is already exported from FileEditorPanel
