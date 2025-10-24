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

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, parentFolderId?: string) => void;
  isLoading?: boolean;
  parentFolderId?: string;
  parentFolderName?: string;
}

export function CreateFolderModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  parentFolderId,
  parentFolderName,
}: CreateFolderModalProps) {
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
          <DialogTitle className="text-xl">Create New Folder</DialogTitle>
          <DialogDescription className="pt-2">
            {parentFolderName
              ? `Create subfolder in: ${parentFolderName}`
              : 'Enter a name for the new folder'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Input
              placeholder="Folder name"
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
