import { useEffect, useRef } from 'react';
import { FileText, FolderPlus, Edit, Trash2, Move } from 'lucide-react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  className?: string;
}

/**
 * Context menu component for file tree operations
 * Shows on right-click with file/folder actions
 */
export function ContextMenu({ x, y, items, onClose, className = '' }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg ${className}`}
      style={{ top: y, left: x }}
    >
      <div className="py-1">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            disabled={item.disabled}
            className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
              item.disabled
                ? 'cursor-not-allowed text-gray-400'
                : item.destructive
                ? 'text-error-600 hover:bg-error-50'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.icon && <span className="h-4 w-4">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Pre-built context menu items for common file tree operations
 */
export const FileTreeContextMenuItems = {
  newFile: (onClick: () => void): ContextMenuItem => ({
    label: 'New File',
    icon: <FileText className="h-4 w-4" />,
    onClick,
  }),
  newFolder: (onClick: () => void): ContextMenuItem => ({
    label: 'New Folder',
    icon: <FolderPlus className="h-4 w-4" />,
    onClick,
  }),
  rename: (onClick: () => void): ContextMenuItem => ({
    label: 'Rename',
    icon: <Edit className="h-4 w-4" />,
    onClick,
  }),
  delete: (onClick: () => void): ContextMenuItem => ({
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick,
    destructive: true,
  }),
  moveTo: (onClick: () => void): ContextMenuItem => ({
    label: 'Move To...',
    icon: <Move className="h-4 w-4" />,
    onClick,
  }),
};
