import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@centrid/ui/components';
import { Button } from '@centrid/ui/components';
import { Input } from '@centrid/ui/components';

interface CreateDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, parentFolderId?: string) => void;
  isLoading?: boolean;
  parentFolderId?: string;
  parentFolderName?: string;
}

export function CreateDocumentModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  parentFolderId,
  parentFolderName,
}: CreateDocumentModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim(), parentFolderId);
      setName(''); // Reset for next use
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl">Create New Document</DialogTitle>
          <DialogDescription className="pt-2">
            {parentFolderName
              ? `Create document in: ${parentFolderName}`
              : 'Enter a name for the new document'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Input
              placeholder="Document name (e.g., My Notes.md)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isLoading}
              className="h-12"
            />
          </div>
          <DialogFooter className="mt-8 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex-1 h-11"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
