'use client';

import { useState } from 'react';
import { NoteWithVisibility } from '@/hooks/useNotes';
import { NOTE_MAX_CHARS } from '@/lib/firebase/types';
import { formatTimestamp } from '@/lib/utils/time';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Pencil, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface NoteTimelineProps {
  notes: NoteWithVisibility[];
  hiddenCount: number;
  guildId?: string;
  onDeleteNote?: (noteId: string) => void;
  onEditNote?: (noteId: string, newText: string) => Promise<void>;
  deleting?: boolean;
}

export function NoteTimeline({ notes, hiddenCount, guildId, onDeleteNote, onEditNote, deleting }: NoteTimelineProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

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
      toast.error('Failed to copy link');
    }
  };

  const startEditing = (note: NoteWithVisibility) => {
    setEditingNoteId(note.id);
    setEditText(note.text);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editingNoteId || !onEditNote) return;
    setSaving(true);
    try {
      await onEditNote(editingNoteId, editText);
      toast.success('Note updated');
      setEditingNoteId(null);
      setEditText('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to edit note';
      toast.error(message);
    } finally {
      setSaving(false);
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
      {visibleNotes.map((note) => {
        const isEditing = editingNoteId === note.id;
        const editCharCount = editText.length;
        const isOverLimit = editCharCount > NOTE_MAX_CHARS;

        return (
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
                  {isEditing ? (
                    <div className="space-y-2 mt-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="resize-none text-sm"
                        disabled={saving}
                      />
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {editCharCount}/{NOTE_MAX_CHARS}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                            disabled={saving}
                            className="h-7 px-2"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveEdit}
                            disabled={saving || !editText.trim() || isOverLimit}
                            className="h-7 px-2"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {note.text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatRelativeDate(note.createdAt)}
                      </p>
                    </>
                  )}
                </div>
                {!isEditing && (
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
                    {note.isOwn && onEditNote && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => startEditing(note)}
                        title="Edit note"
                      >
                        <Pencil className="h-4 w-4" />
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
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
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
