import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/dialog';
import { Button } from '../../components/button';
import { Icons } from '../../components/icon';
import { Alert, AlertDescription } from '../../components/alert';

export interface ConflictingFile {
  path: string;
  lastSaved: Date;
  pendingChanges: number; // Number of unsaved changes
}

export interface ConflictModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Files that have conflicts */
  conflictingFiles: ConflictingFile[];
  /** Callback when user cancels agent request (keeps user changes) */
  onCancelRequest: () => void;
  /** Callback when user discards changes (applies agent changes) */
  onDiscardChanges: () => void;
  /** Whether the cancel action is processing */
  isCancelling?: boolean;
  /** Whether the discard action is processing */
  isDiscarding?: boolean;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  conflictingFiles,
  onCancelRequest,
  onDiscardChanges,
  isCancelling,
  isDiscarding,
}) => {
  const totalChanges = conflictingFiles.reduce((sum, file) => sum + file.pendingChanges, 0);
  const fileCount = conflictingFiles.length;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[500px]" hideClose>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-10 w-10 rounded-full bg-warning-100 dark:bg-warning-900 flex items-center justify-center">
              <Icons.alertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle>File Conflict Detected</DialogTitle>
              <DialogDescription className="mt-1.5">
                The AI agent is making changes to {fileCount} file{fileCount !== 1 ? 's' : ''}{' '}
                you are currently editing
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Conflicting Files List */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {conflictingFiles.map((file) => (
              <div key={file.path} className="p-3">
                <div className="flex items-start gap-2">
                  <Icons.file className="h-4 w-4 mt-0.5 text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-gray-900 dark:text-gray-100 truncate">
                      {file.path}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Last saved: {formatTimestamp(file.lastSaved)} •{' '}
                      {file.pendingChanges} unsaved change{file.pendingChanges !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <Icons.alertCircle className="h-4 w-4" />
            <AlertDescription>
              This decision cannot be undone. Choose carefully:
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={onCancelRequest}
            disabled={isCancelling || isDiscarding}
            variant="outline"
            className="flex-1"
          >
            {isCancelling && <Icons.loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Agent Request
            <span className="sr-only">(Keep my changes)</span>
          </Button>
          <Button
            onClick={onDiscardChanges}
            disabled={isCancelling || isDiscarding}
            variant="destructive"
            className="flex-1"
          >
            {isDiscarding && <Icons.loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Discard My Changes
            <span className="sr-only">(Apply agent changes)</span>
          </Button>
        </DialogFooter>

        {/* Explanation Text */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Cancel Agent Request:</strong> Stops the AI agent and keeps your unsaved
            changes ({totalChanges} edit{totalChanges !== 1 ? 's' : ''}).
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            <strong>Discard My Changes:</strong> Removes your unsaved edits and applies the
            agent's modifications instead.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
ConflictModal.displayName = 'ConflictModal';
