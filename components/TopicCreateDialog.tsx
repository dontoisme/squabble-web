'use client';

import { useState } from 'react';
import { TOPIC_DESCRIPTION_MAX_LENGTH } from '@/hooks/useTopics';
import { parseTimestamp, formatTimestamp } from '@/lib/utils/time';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TopicCreateDialogProps {
  bookTitle: string;
  currentProgressTimestamp: number;
  onCreateTopic: (
    bookTitle: string,
    title: string,
    unlockTimestamp: number,
    description?: string,
  ) => Promise<void>;
}

export function TopicCreateDialog({
  bookTitle,
  currentProgressTimestamp,
  onCreateTopic,
}: TopicCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timestampInput, setTimestampInput] = useState(formatTimestamp(currentProgressTimestamp));
  const [creating, setCreating] = useState(false);

  const descCharCount = description.length;
  const isOverLimit = descCharCount > TOPIC_DESCRIPTION_MAX_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || creating) return;

    setCreating(true);
    try {
      const unlockTimestamp = parseTimestamp(timestampInput);
      await onCreateTopic(
        bookTitle,
        title.trim(),
        unlockTimestamp,
        description.trim() || undefined,
      );
      toast.success('Topic created!');
      setOpen(false);
      setTitle('');
      setDescription('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create topic';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          New Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Topic</DialogTitle>
          <DialogDescription>
            Start a discussion thread. It will be hidden until others reach this timestamp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic-title">Title</Label>
            <Input
              id="topic-title"
              placeholder="e.g., Magic System Discussion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={creating}
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic-timestamp">Unlock at (HH:MM:SS or MM:SS)</Label>
            <Input
              id="topic-timestamp"
              type="text"
              placeholder="1:23:45"
              value={timestampInput}
              onChange={(e) => setTimestampInput(e.target.value)}
              disabled={creating}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Others will see this topic after reaching this point
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic-description">Description (optional)</Label>
            <Textarea
              id="topic-description"
              placeholder="What do you want to discuss?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creating}
              rows={3}
              className="resize-none"
            />
            <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {descCharCount}/{TOPIC_DESCRIPTION_MAX_LENGTH}
            </span>
          </div>

          <Button
            type="submit"
            disabled={creating || !title.trim() || isOverLimit}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Topic'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
