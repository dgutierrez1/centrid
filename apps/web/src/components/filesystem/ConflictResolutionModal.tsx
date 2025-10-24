import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@centrid/ui/components';
import { Button } from '@centrid/ui/components';
import { AlertTriangleIcon } from 'lucide-react';

export interface ConflictResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReload: () => void;
  documentName: string;
}

/**
 * ConflictResolutionModal - Shows when document version conflict detected
 *
 * Appears when:
 * - User edits document
 * - Another user/session modifies same document
 * - Save attempt fails with version conflict
 *
 * Actions:
 * - Reload Document: Fetches latest version from server (discards local changes)
 * - Cancel: Keeps local version (user can copy content elsewhere)
 */
export function ConflictResolutionModal({
  open,
  onOpenChange,
  onReload,
  documentName,
}: ConflictResolutionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-warning-50">
              <AlertTriangleIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">Document Conflict Detected</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-600">
                The document <span className="font-medium text-gray-900">"{documentName}"</span> was modified by another user or session while you were editing.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900">What happened?</h4>
            <p className="text-sm text-gray-600">
              Your changes couldn't be saved because the document was updated elsewhere. This prevents accidental data loss.
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-warning-200 bg-warning-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-warning-900">Action Required</h4>
            <ul className="space-y-1 text-sm text-warning-800">
              <li>• <span className="font-medium">Reload Document:</span> Get the latest version (your local changes will be lost)</li>
              <li>• <span className="font-medium">Cancel:</span> Keep your current version to copy content elsewhere</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => {
              onReload();
              onOpenChange(false);
            }}
            className="bg-primary-600 hover:bg-primary-700"
          >
            Reload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
