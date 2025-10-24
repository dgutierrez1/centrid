import { useState, useEffect } from 'react';
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

interface RenameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newName: string) => void;
  currentName: string;
  itemType: 'folder' | 'document';
  isLoading?: boolean;
}

export function RenameModal({
  open,
  onOpenChange,
  onConfirm,
  currentName,
  itemType,
  isLoading = false,
}: RenameModalProps) {
  const [name, setName] = useState(currentName);

  // Update name when currentName changes (e.g., when modal opens for different item)
  useEffect(() => {
    setName(currentName);
  }, [currentName, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentName) {
      onConfirm(name.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename {itemType === 'folder' ? 'Folder' : 'Document'}</DialogTitle>
          <DialogDescription>
            Enter a new name for "{currentName}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              placeholder="New name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isLoading}
            />
          </div>
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
              type="submit"
              disabled={!name.trim() || name.trim() === currentName || isLoading}
            >
              {isLoading ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
