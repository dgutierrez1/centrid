import { useState, useEffect } from 'react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { cn } from '@centrid/shared/utils';

export interface CreateBranchModalProps {
  isOpen: boolean;
  currentThreadTitle?: string;
  onConfirmCreate: (name: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  validationError?: string | null;
  className?: string;
}

/**
 * CreateBranchModal - Branch creation form in modal
 *
 * Features:
 * - Branch name input with character counter (1-100 chars)
 * - Validation (required, length, allowed chars)
 * - Loading state during creation
 * - Error display for validation failures
 * - Focus trap and keyboard navigation (Escape to close, Enter to submit)
 *
 * UX Spec: ux.md lines 908-918
 * Flow: ux.md lines 126-157 (Flow 2: Create Branch)
 */
export function CreateBranchModal({
  isOpen,
  currentThreadTitle = '',
  onConfirmCreate,
  onCancel,
  isLoading = false,
  validationError = null,
  className,
}: CreateBranchModalProps) {
  const [branchName, setBranchName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const characterLimit = 100;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBranchName('');
      setLocalError(null);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onCancel]);

  const validateBranchName = (name: string): string | null => {
    if (name.length === 0) {
      return 'Branch name required';
    }
    if (name.length > characterLimit) {
      return `Branch name must be ${characterLimit} characters or less`;
    }
    // Allow letters, numbers, spaces, hyphens, underscores
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return 'Branch name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateBranchName(branchName);
    if (error) {
      setLocalError(error);
      return;
    }
    onConfirmCreate(branchName);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBranchName(value);
    setLocalError(null);
  };

  const displayError = validationError || localError;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={!isLoading ? onCancel : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-branch-title"
      >
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full',
            'animate-in slide-in-from-top-4 duration-300',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2
              id="create-branch-title"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              Create Branch
            </h2>
            {currentThreadTitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                From: {currentThreadTitle}
              </p>
            )}
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4">
              <label
                htmlFor="branch-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Branch Name
              </label>
              <Input
                id="branch-name"
                type="text"
                value={branchName}
                onChange={handleNameChange}
                placeholder="e.g., RAG Deep Dive"
                disabled={isLoading}
                autoFocus
                className={cn(displayError && 'border-red-500 focus:border-red-500 focus:ring-red-500')}
                aria-invalid={!!displayError}
                aria-describedby={displayError ? 'branch-name-error' : undefined}
              />
              <div className="flex items-center justify-between mt-2">
                <span
                  className={cn(
                    'text-xs',
                    branchName.length > characterLimit ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {branchName.length}/{characterLimit}
                </span>
              </div>
              {displayError && (
                <p id="branch-name-error" className="text-sm text-red-500 mt-2" role="alert">
                  {displayError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isLoading || branchName.length === 0}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Branch'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
