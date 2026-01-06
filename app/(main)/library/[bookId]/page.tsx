'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getBookById } from '@/lib/books/mage-tank';
import { formatTimestamp, formatDuration, calculateProgressPercent } from '@/lib/utils/time';
import { useProgress } from '@/hooks/useProgress';
import { useNotes } from '@/hooks/useNotes';
import { useGuild } from '@/hooks/useGuild';
import { ChapterPicker } from '@/components/ChapterPicker';
import { NoteInput } from '@/components/NoteInput';
import { NoteTimeline } from '@/components/NoteTimeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function BookPage() {
  const params = useParams();
  const bookId = params.bookId as string;
  const book = getBookById(bookId);

  const { hasGuild, guild } = useGuild();
  const { progress, progressSeconds, updateProgress, loading: progressLoading } = useProgress(book);
  const {
    notes,
    hiddenCount,
    loading: notesLoading,
    postNote,
    deleteNote,
  } = useNotes(book, progressSeconds);

  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!book) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Book not found</h1>
        <Link href="/library" className="text-primary hover:underline">
          Back to library
        </Link>
      </div>
    );
  }

  const handleUpdateProgress = async (seconds: number) => {
    setUpdating(true);
    try {
      await updateProgress(seconds);
      toast.success('Progress updated!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update progress';
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeleting(true);
    try {
      await deleteNote(noteId);
      toast.success('Note deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete note';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const progressPercent = calculateProgressPercent(progressSeconds, book.totalDurationSeconds);

  return (
    <div className="space-y-6">
      {/* Book Header */}
      <div className="flex gap-6">
        <div className="w-32 h-44 bg-muted rounded-lg flex items-center justify-center shrink-0">
          <div className="text-3xl font-bold text-muted-foreground/30">
            {book.title.split(' ').slice(-1)[0]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{book.title}</h1>
          <p className="text-muted-foreground">{book.author}</p>
          {book.narrator && (
            <p className="text-sm text-muted-foreground">Narrated by {book.narrator}</p>
          )}
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{formatDuration(book.totalDurationSeconds)}</Badge>
            <Badge variant="outline">{book.chapters.length} chapters</Badge>
          </div>

          {/* Progress bar */}
          {hasGuild && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{formatTimestamp(progressSeconds)}</span>
                <span className="text-muted-foreground">{progressPercent.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No guild warning */}
      {!hasGuild && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-2">
              Join a guild to track progress and share notes
            </p>
            <Link href="/guild" className="text-primary hover:underline">
              Create or join a guild
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Main content grid */}
      {hasGuild && (
        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          {/* Notes timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Notes</h2>
              {hiddenCount > 0 && (
                <Badge variant="secondary">
                  {hiddenCount} hidden
                </Badge>
              )}
            </div>

            {notesLoading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">
                Loading notes...
              </div>
            ) : (
              <NoteTimeline
                notes={notes}
                hiddenCount={hiddenCount}
                onDeleteNote={handleDeleteNote}
                deleting={deleting}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Progress card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Update Progress</CardTitle>
                <CardDescription>
                  Select your current chapter and time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChapterPicker
                  book={book}
                  currentSeconds={progressSeconds}
                  onUpdate={handleUpdateProgress}
                  disabled={updating || progressLoading}
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Note input */}
            <NoteInput
              book={book}
              currentProgressSeconds={progressSeconds}
              onPostNote={postNote}
              disabled={!hasGuild}
            />
          </div>
        </div>
      )}
    </div>
  );
}
