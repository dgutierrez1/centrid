/**
 * Filesystem & Markdown Editor Feature
 * Extracted from design showcase
 */

// Icons
export {
  ChevronRightIcon,
  FileTextIcon,
  PlusIcon,
  MoreVerticalIcon,
  UploadIcon,
  CloudIcon,
  CheckIcon,
  MessageSquareIcon,
  SearchIcon,
  FolderPlusIcon,
  XIcon,
} from './icons';

// Re-export FolderIcon with alias to avoid conflict
export { FolderIcon as FileTreeFolderIcon } from './icons';

// File Tree
export { FileTreeNode } from './FileTreeNode';
export type { FileTreeNodeData, FileTreeNodeProps } from './FileTreeNode';

// Desktop Workspace
export { DesktopWorkspace } from './DesktopWorkspace';
export type { DesktopWorkspaceProps } from './DesktopWorkspace';

// Mobile Views
export { MobileDocumentView } from './MobileDocumentView';
export type { MobileDocumentViewProps } from './MobileDocumentView';

export { MobileChatView } from './MobileChatView';
export type { MobileChatViewProps, ChatMessage } from './MobileChatView';

// Shared mobile type (re-export from one source only)
export type { MobileMenuItem } from './MobileDocumentView';

// Empty State - renamed to avoid conflict
export { EmptyState as FilesystemEmptyState } from './EmptyState';
export type { EmptyStateProps as FilesystemEmptyStateProps } from './EmptyState';

// Context Menu - renamed to avoid conflict
export { ContextMenu as FileTreeContextMenuDemo } from './ContextMenu';
export type { ContextMenuProps as FileTreeContextMenuDemoProps } from './ContextMenu';

// Search Results
export { SearchResults } from './SearchResults';
export type { SearchResultsProps, SearchResult } from './SearchResults';

// File Upload
export { FileUploadModal } from './FileUploadModal';
export type { FileUploadModalProps } from './FileUploadModal';
