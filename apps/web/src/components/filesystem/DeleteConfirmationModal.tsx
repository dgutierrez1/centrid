import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@centrid/ui/components';
import { Button } from '@centrid/ui/components';

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName: string;
  itemType: 'folder' | 'document';
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  itemType,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {itemType === 'folder' ? 'Folder' : 'Document'}?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{itemName}"?
            {itemType === 'folder' && (
              <span className="block mt-2 text-error-500 font-medium">
                This will also delete all files and subfolders inside it.
              </span>
            )}
            <span className="block mt-2">
              This action cannot be undone.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
