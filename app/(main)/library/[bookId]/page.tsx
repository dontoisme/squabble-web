'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils/time';
import { useProgress } from '@/hooks/useProgress';
import { useNotes } from '@/hooks/useNotes';
import { useGuild } from '@/hooks/useGuild';
import { useGuildProgress } from '@/hooks/useGuildProgress';
import { useGuildBook } from '@/hooks/useGuildBooks';
import { useHardcoverToken } from '@/hooks/useHardcover';
import { NoteInput } from '@/components/NoteInput';
import { NoteTimeline } from '@/components/NoteTimeline';
import { BookCover } from '@/components/BookCover';
import { ProgressBarWithGhosts } from '@/components/ProgressBarWithGhosts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CheckCircle, RotateCcw, BookOpen, Clock, Users } from 'lucide-react';

export default function BookPage() {
  const params = useParams();
  const bookId = params.bookId as string;

  const { book, loading: bookLoading } = useGuildBook(bookId);
  const { hasGuild, guild, members } = useGuild();
  const { hasToken: hasHardcoverToken } = useHardcoverToken();

  // Create a Book-like object for hooks that need it
  const bookForHooks = book ? { id: book.id, title: book.title, totalDurationSeconds: 0, chapters: [] } : undefined;

  const { progress, progressSeconds, updateProgress, loading: progressLoading } = useProgress(bookForHooks);
  const { guildProgress } = useGuildProgress(book?.id, members);
  const {
    notes,
    hiddenCount,
    loading: notesLoading,
    postNote,
    deleteNote,
  } = useNotes(bookForHooks, progressSeconds);

  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [manualProgress, setManualProgress] = useState('');

  if (bookLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground animate-pulse">
        Loading book...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Book not found</h1>
        <p className="text-muted-foreground mb-4">
          This book may not be in your guild&apos;s library yet.
        </p>
        <Link href="/library" className="text-primary hover:underline">
          Back to library
        </Link>
      </div>
    );
  }

  const handleUpdateProgress = async (percent: number) => {
    setUpdating(true);
    try {
      // Convert percent to approximate seconds (we don't have total duration)
      await updateProgress(percent * 100); // Store as percent * 100 for now
      toast.success('Progress updated!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update progress';
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleManualProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const percent = parseFloat(manualProgress);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error('Please enter a valid percentage (0-100)');
      return;
    }
    await handleUpdateProgress(percent / 100);
    setManualProgress('');
  };

  const handleMarkComplete = async () => {
    await handleUpdateProgress(1); // 100%
    toast.success('Marked as complete!');
  };

  const handleResetProgress = async () => {
    await handleUpdateProgress(0);
    toast.success('Progress reset');
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

  // Calculate progress from memberOwnership if available
  const currentUserId = guild?.createdBy; // TODO: Get actual current user ID
  const userOwnership = currentUserId ? book.memberOwnership[currentUserId] : null;
  const progressPercent = userOwnership?.progressPercent ?? 0;

  // Ownership stats
  const ownershipCount = Object.values(book.memberOwnership).filter(
    (o) => o.hasBook || (o.progressPercent !== undefined && o.progressPercent > 0)
  ).length;
  const totalMembers = Object.keys(book.memberOwnership).length;

  return (
    <div className="space-y-6">
      {/* Book Header */}
      <div className="flex gap-6">
        <BookCover title={book.title} author={book.author} size="md" autoFetch={hasHardcoverToken} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {book.status === 'reading' && (
              <Badge variant="default" className="bg-primary text-primary-foreground">
                <BookOpen className="w-3 h-3 mr-1" />
                Reading
              </Badge>
            )}
            {book.status === 'finished' && (
              <Badge variant="secondary" className="text-[#4CAF50]">
                <CheckCircle className="w-3 h-3 mr-1" />
                Finished
              </Badge>
            )}
            {book.status === 'queued' && (
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                Queued #{book.queuePosition}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{book.title}</h1>
          {book.author && <p className="text-muted-foreground">{book.author}</p>}

          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{ownershipCount}/{totalMembers} guild members have this book</span>
          </div>

          {/* Progress bar with ghosts */}
          {hasGuild && (
            <div className="mt-4">
              <ProgressBarWithGhosts
                progressSeconds={progressPercent}
                progressPercent={progressPercent}
                totalDurationSeconds={100}
                ghosts={guildProgress}
              />
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
            <h2 className="text-lg font-semibold">Notes</h2>

            {notesLoading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">
                Loading notes...
              </div>
            ) : (
              <NoteTimeline
                notes={notes}
                hiddenCount={hiddenCount}
                guildId={guild?.id}
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
                <CardTitle className="text-base">Your Progress</CardTitle>
                <CardDescription>
                  {progressPercent >= 100
                    ? 'You\'ve completed this book!'
                    : progressPercent > 0
                      ? `${progressPercent.toFixed(1)}% complete`
                      : 'Not started yet'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Manual progress entry */}
                <form onSubmit={handleManualProgressSubmit} className="space-y-2">
                  <Label htmlFor="progress" className="text-xs text-muted-foreground">
                    Update progress (%)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="progress"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="0-100"
                      value={manualProgress}
                      onChange={(e) => setManualProgress(e.target.value)}
                      className="font-mono"
                    />
                    <Button type="submit" disabled={updating || !manualProgress}>
                      Update
                    </Button>
                  </div>
                </form>

                {/* Quick actions */}
                <div className="flex gap-2 pt-2">
                  {progressPercent < 100 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkComplete}
                      disabled={updating}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}

                  {progressPercent > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={updating}>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset progress?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will set your progress back to 0%. Your notes will remain visible to you.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleResetProgress}>
                            Reset Progress
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Note input */}
            <NoteInput
              book={{ id: book.id, title: book.title, totalDurationSeconds: 0, chapters: [] }}
              currentProgressSeconds={progressPercent}
              onPostNote={postNote}
              disabled={!hasGuild}
            />
          </div>
        </div>
      )}
    </div>
  );
}
