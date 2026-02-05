'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGuildBooks, GuildBook } from '@/hooks/useGuildBooks';
import { useGuild } from '@/hooks/useGuild';
import { useAuth } from '@/contexts/AuthContext';
import { useHardcoverToken } from '@/hooks/useHardcover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookCover } from '@/components/BookCover';
import { BookSearch } from '@/components/BookSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Library, BookOpen, CheckCircle, Clock,
  MoreVertical, Play, Trash2, Flag, User,
  ArrowUp, ArrowDown,
} from 'lucide-react';

type LibraryFilter = 'guild' | 'mine';

interface BookCardProps {
  book: GuildBook;
  autoFetchCover?: boolean;
  onCoverFetched?: (coverUrl: string) => void;
  onStartReading?: () => void;
  onFinishBook?: () => void;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showActions?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

function BookCard({
  book, autoFetchCover = false, onCoverFetched,
  onStartReading, onFinishBook, onRemove,
  onMoveUp, onMoveDown, showActions = false,
  isFirst = false, isLast = false,
}: BookCardProps) {
  const ownershipCount = Object.values(book.memberOwnership).filter(
    (o) => o.hasBook || (o.progressPercent !== undefined && o.progressPercent > 0)
  ).length;
  const totalMembers = Object.keys(book.memberOwnership).length;

  return (
    <Card className="h-full hover:bg-muted/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Link href={`/library/${book.id}`} className="flex-1">
            <div className="flex justify-center mb-3">
              <BookCover
                title={book.title}
                author={book.author}
                coverUrl={book.coverUrl}
                size="lg"
                autoFetch={autoFetchCover}
                onCoverFetched={onCoverFetched}
              />
            </div>
          </Link>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {book.status === 'queued' && onStartReading && (
                  <DropdownMenuItem onClick={onStartReading}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Reading
                  </DropdownMenuItem>
                )}
                {book.status === 'reading' && onFinishBook && (
                  <DropdownMenuItem onClick={onFinishBook}>
                    <Flag className="w-4 h-4 mr-2" />
                    Mark as Finished
                  </DropdownMenuItem>
                )}
                {book.status === 'queued' && onMoveUp && !isFirst && (
                  <DropdownMenuItem onClick={onMoveUp}>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Move Up
                  </DropdownMenuItem>
                )}
                {book.status === 'queued' && onMoveDown && !isLast && (
                  <DropdownMenuItem onClick={onMoveDown}>
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Move Down
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onRemove} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove from Library
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <Link href={`/library/${book.id}`}>
          <div className="flex items-center gap-2">
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
          <CardTitle className="text-lg mt-2">{book.title}</CardTitle>
          {book.author && <CardDescription>{book.author}</CardDescription>}
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{ownershipCount}/{totalMembers} have it</span>
          {book.totalComments !== undefined && book.totalComments > 0 && (
            <span>{book.totalComments} notes</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyLibrary() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <Library className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No books yet</h3>
        <p className="text-muted-foreground mb-4">
          Your guild&apos;s library is empty. Search for audiobooks to add to your quest board!
        </p>
      </CardContent>
    </Card>
  );
}

function NoGuildPrompt() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-6 text-center">
        <p className="text-muted-foreground">
          <Link href="/guild" className="text-primary hover:underline">
            Join or create a guild
          </Link>
          {' '}to see your shared library
        </p>
      </CardContent>
    </Card>
  );
}

export default function LibraryPage() {
  const { user } = useAuth();
  const { hasGuild } = useGuild();
  const {
    books, currentBook, queuedBooks, finishedBooks,
    loading, hasBooks, updateBookCoverUrl,
    removeBook, setCurrentBook, finishCurrentBook, reorderQueue,
  } = useGuildBooks();
  const { hasToken: hasHardcoverToken } = useHardcoverToken();

  const [filter, setFilter] = useState<LibraryFilter>('guild');
  const [bookToRemove, setBookToRemove] = useState<GuildBook | null>(null);

  // Filter books for "My Books" view
  const userId = user?.uid;
  const filterBooks = (bookList: GuildBook[]) => {
    if (filter === 'guild' || !userId) return bookList;
    return bookList.filter((b) => {
      const ownership = b.memberOwnership[userId];
      return ownership?.hasBook || (ownership?.progressPercent !== undefined && ownership.progressPercent > 0);
    });
  };

  const filteredCurrentBook = currentBook && filterBooks([currentBook]).length > 0 ? currentBook : null;
  const filteredQueuedBooks = filterBooks(queuedBooks);
  const filteredFinishedBooks = filterBooks(finishedBooks);
  const hasFilteredBooks = filter === 'guild'
    ? hasBooks
    : (filteredCurrentBook || filteredQueuedBooks.length > 0 || filteredFinishedBooks.length > 0);

  const handleStartReading = async (bookId: string) => {
    try {
      await setCurrentBook(bookId);
      toast.success('Started reading!');
    } catch {
      toast.error('Failed to start reading');
    }
  };

  const handleFinishBook = async () => {
    try {
      await finishCurrentBook();
      toast.success('Book finished! Next quest started.');
    } catch {
      toast.error('Failed to finish book');
    }
  };

  const handleRemoveBook = async () => {
    if (!bookToRemove) return;
    try {
      await removeBook(bookToRemove.id);
      toast.success(`"${bookToRemove.title}" removed from library`);
    } catch {
      toast.error('Failed to remove book');
    } finally {
      setBookToRemove(null);
    }
  };

  const handleMoveQueue = async (bookId: string, direction: 'up' | 'down') => {
    const index = queuedBooks.findIndex((b) => b.id === bookId);
    if (index === -1) return;

    const newOrder = queuedBooks.map((b) => b.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;

    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    try {
      await reorderQueue(newOrder);
    } catch {
      toast.error('Failed to reorder queue');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Library</h1>
          <p className="text-muted-foreground">
            {filter === 'mine' ? 'Books you own' : 'Your guild\'s shared book collection'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasGuild && (
            <div className="flex bg-muted rounded-lg p-0.5">
              <Button
                variant={filter === 'guild' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('guild')}
                className="text-xs"
              >
                <Library className="w-3 h-3 mr-1" />
                Guild
              </Button>
              <Button
                variant={filter === 'mine' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('mine')}
                className="text-xs"
              >
                <User className="w-3 h-3 mr-1" />
                My Books
              </Button>
            </div>
          )}
          {hasGuild && hasHardcoverToken && <BookSearch />}
        </div>
      </div>

      {!hasGuild && <NoGuildPrompt />}

      {hasGuild && loading && (
        <div className="text-center py-12 text-muted-foreground animate-pulse">
          Loading library...
        </div>
      )}

      {hasGuild && !loading && !hasFilteredBooks && filter === 'guild' && <EmptyLibrary />}

      {hasGuild && !loading && !hasFilteredBooks && filter === 'mine' && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No books marked as yours</h3>
            <p className="text-muted-foreground mb-4">
              Open a book and toggle &quot;I Have This Book&quot; to add it to your collection.
            </p>
          </CardContent>
        </Card>
      )}

      {hasGuild && !loading && hasFilteredBooks && (
        <>
          {/* Currently Reading */}
          {(filter === 'guild' ? currentBook : filteredCurrentBook) && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Currently Reading
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <BookCard
                  book={(filter === 'guild' ? currentBook : filteredCurrentBook)!}
                  autoFetchCover={hasHardcoverToken}
                  onCoverFetched={(url) => updateBookCoverUrl(currentBook!.id, url)}
                  showActions
                  onFinishBook={handleFinishBook}
                  onRemove={() => setBookToRemove(currentBook!)}
                />
              </div>
            </section>
          )}

          {/* Queued Books */}
          {(filter === 'guild' ? queuedBooks : filteredQueuedBooks).length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Up Next ({(filter === 'guild' ? queuedBooks : filteredQueuedBooks).length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(filter === 'guild' ? queuedBooks : filteredQueuedBooks).map((book, index, arr) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    autoFetchCover={hasHardcoverToken}
                    onCoverFetched={(url) => updateBookCoverUrl(book.id, url)}
                    showActions
                    onStartReading={() => handleStartReading(book.id)}
                    onRemove={() => setBookToRemove(book)}
                    onMoveUp={() => handleMoveQueue(book.id, 'up')}
                    onMoveDown={() => handleMoveQueue(book.id, 'down')}
                    isFirst={index === 0}
                    isLast={index === arr.length - 1}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Finished Books */}
          {(filter === 'guild' ? finishedBooks : filteredFinishedBooks).length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
                Completed ({(filter === 'guild' ? finishedBooks : filteredFinishedBooks).length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(filter === 'guild' ? finishedBooks : filteredFinishedBooks).map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    autoFetchCover={hasHardcoverToken}
                    onCoverFetched={(url) => updateBookCoverUrl(book.id, url)}
                    showActions
                    onRemove={() => setBookToRemove(book)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Remove confirmation dialog */}
      <AlertDialog open={!!bookToRemove} onOpenChange={(open) => !open && setBookToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from library?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{bookToRemove?.title}&quot; from the guild library for everyone.
              Notes and progress will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveBook} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
