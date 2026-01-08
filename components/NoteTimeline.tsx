'use client';

import { NoteWithVisibility } from '@/hooks/useNotes';
import { formatTimestamp } from '@/lib/utils/time';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface NoteTimelineProps {
  notes: NoteWithVisibility[];
  hiddenCount: number;
  guildId?: string;
  onDeleteNote?: (noteId: string) => void;
  deleting?: boolean;
}

export function NoteTimeline({ notes, hiddenCount, guildId, onDeleteNote, deleting }: NoteTimelineProps) {
  const copyNoteLink = async (noteId: string) => {
    if (!guildId) {
      toast.error('Cannot share note');
      return;
    }

    const url = `${window.location.origin}/note/${guildId}/${noteId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      // Fallback for older browsers
      toast.error('Failed to copy link');
    }
  };

  if (notes.length === 0 && hiddenCount === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No notes yet</p>
        <p className="text-sm">Be the first to leave a note!</p>
      </div>
    );
  }

  const visibleNotes = notes.filter(n => n.isVisible);
  const hiddenNotes = notes.filter(n => !n.isVisible);

  return (
    <div className="space-y-4">
      {/* Hidden notes teaser - mysterious, no spoilers! */}
      {hiddenNotes.length > 0 && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-6 text-center">
            <p className="text-lg text-muted-foreground italic">
              Nothing to see here...
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              👀 or is there?
            </p>
          </CardContent>
        </Card>
      )}

      {/* Visible notes */}
      {visibleNotes.map((note) => (
        <Card key={note.id} className={note.isOwn ? 'border-primary/30 bg-primary/5' : ''}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {note.userDisplayName}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    @ {formatTimestamp(note.timestamp)}
                  </Badge>
                  {note.isOwn && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {note.text}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatRelativeDate(note.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {guildId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => copyNoteLink(note.id)}
                    title="Copy link to note"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
                {note.isOwn && onDeleteNote && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-8 px-2"
                    onClick={() => onDeleteNote(note.id)}
                    disabled={deleting}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatRelativeDate(date: { toDate?: () => Date } | Date): string {
  const d = date && 'toDate' in date && typeof date.toDate === 'function'
    ? date.toDate()
    : date instanceof Date
      ? date
      : new Date();

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}
