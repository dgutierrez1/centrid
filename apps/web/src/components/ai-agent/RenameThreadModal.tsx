import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from '@centrid/ui/components';

interface RenameThreadModalProps {
  isOpen: boolean;
  threadId: string | null;
  currentTitle: string;
  onClose: () => void;
  onConfirm: (threadId: string, newTitle: string) => Promise<void>;
  isLoading?: boolean;
}

export function RenameThreadModal({
  isOpen,
  threadId,
  currentTitle,
  onClose,
  onConfirm,
  isLoading = false,
}: RenameThreadModalProps) {
  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    setTitle(currentTitle);
  }, [currentTitle, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId || !title.trim()) return;

    await onConfirm(threadId, title.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Thread</DialogTitle>
            <DialogDescription>
              Enter a new title for this thread
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Thread Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter thread title"
                maxLength={200}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
