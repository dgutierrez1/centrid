import { FileText, FolderOpen } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'document' | 'folder';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state component with welcoming message and action prompts
 * Used when no document is selected in the editor
 */
export function EmptyState({
  title = 'No document selected',
  description = 'Select a document from the file tree or create a new one to get started',
  icon = 'document',
  action,
  className = '',
}: EmptyStateProps) {
  const Icon = icon === 'document' ? FileText : FolderOpen;

  return (
    <div className={`flex h-full w-full flex-col items-center justify-center p-8 text-center ${className}`}>
      <Icon className="mb-4 h-16 w-16 text-gray-300" />
      <h3 className="mb-2 text-xl font-semibold text-gray-700">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-gray-500">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
