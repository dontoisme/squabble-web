'use client';

import { useState, useEffect, useRef } from 'react';
import { useHardcoverSearch, HardcoverBook } from '@/hooks/useHardcover';
import { useGuild } from '@/hooks/useGuild';
import { BookCover } from './BookCover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Plus, Swords, Headphones, X, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { doc, setDoc, getDoc, getDocs, collection, query as firestoreQuery, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

interface BookSearchProps {
  onBookAdded?: () => void;
}

export function BookSearch({ onBookAdded }: BookSearchProps) {
  const { search, results, loading, error, clearResults, hasToken } = useHardcoverSearch();
  const { guild, hasGuild, members } = useGuild();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null); // 'single-{id}' or 'epic-{id}'
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!query.trim()) {
      clearResults();
      return;
    }

    searchTimeout.current = setTimeout(() => {
      search(query);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, search, clearResults]);

  const handleClose = () => {
    setOpen(false);
    setQuery('');
    clearResults();
  };

  // Build memberOwnership for all guild members (adder = hasBook: true)
  const buildMemberOwnership = (adderId: string) => {
    const ownership: Record<string, { hasBook: boolean; progressPercent: number }> = {};
    members.forEach((member) => {
      ownership[member.id] = {
        hasBook: member.id === adderId,
        progressPercent: 0,
      };
    });
    return ownership;
  };

  // Get next queue position by counting queued books
  const getNextQueuePosition = async (guildId: string) => {
    const booksRef = collection(db, 'guilds', guildId, 'books');
    const queueQuery = firestoreQuery(booksRef, where('status', '==', 'queued'));
    const queueSnapshot = await getDocs(queueQuery);
    return queueSnapshot.size + 1;
  };

  const handleAddBook = async (book: HardcoverBook) => {
    if (!guild?.id || !user) {
      toast.error('You must be in a guild to add books');
      return;
    }

    setAdding(`single-${book.hardcoverId}`);

    try {
      const bookId = `hc_${book.hardcoverId}`;

      // Check if book already exists
      const bookRef = doc(db, 'guilds', guild.id, 'books', bookId);
      const existingDoc = await getDoc(bookRef);
      if (existingDoc.exists()) {
        toast.error('This book is already in the guild library');
        return;
      }

      const queuePosition = await getNextQueuePosition(guild.id);

      await setDoc(bookRef, {
        title: book.title,
        author: book.author,
        hardcoverId: book.hardcoverId,
        coverUrl: book.coverUrl,
        audioDurationSeconds: book.audioDurationSeconds,
        series: book.series,
        seriesPosition: book.seriesPosition,
        addedBy: user.uid,
        addedAt: serverTimestamp(),
        status: 'queued',
        queuePosition,
        memberOwnership: buildMemberOwnership(user.uid),
      });

      toast.success(`"${book.title}" added to Quest Board!`);
      onBookAdded?.();
      handleClose();
    } catch (err) {
      console.error('Error adding book:', err);
      toast.error('Failed to add book');
    } finally {
      setAdding(null);
    }
  };

  const handleAddEpicQuest = async (book: HardcoverBook) => {
    if (!guild?.id || !user) {
      toast.error('You must be in a guild to add books');
      return;
    }

    if (!book.series || !book.seriesBooksCount) {
      toast.error('Series information not available');
      return;
    }

    setAdding(`epic-${book.hardcoverId}`);

    try {
      const bookId = `hc_${book.hardcoverId}`;

      // Check if book already exists
      const bookRef = doc(db, 'guilds', guild.id, 'books', bookId);
      const existingDoc = await getDoc(bookRef);
      if (existingDoc.exists()) {
        toast.error('This book is already in the guild library');
        return;
      }

      const queuePosition = await getNextQueuePosition(guild.id);

      await setDoc(bookRef, {
        title: book.title,
        author: book.author,
        hardcoverId: book.hardcoverId,
        coverUrl: book.coverUrl,
        audioDurationSeconds: book.audioDurationSeconds,
        series: book.series,
        seriesPosition: book.seriesPosition,
        seriesBooksCount: book.seriesBooksCount,
        isEpicQuest: true,
        addedBy: user.uid,
        addedAt: serverTimestamp(),
        status: 'queued',
        queuePosition,
        memberOwnership: buildMemberOwnership(user.uid),
      });

      toast.success(`Epic Quest "${book.series}" (${book.seriesBooksCount} books) added!`);
      onBookAdded?.();
      handleClose();
    } catch (err) {
      console.error('Error adding epic quest:', err);
      toast.error('Failed to add epic quest');
    } finally {
      setAdding(null);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatSeriesInfo = (book: HardcoverBook) => {
    if (!book.series) return null;
    if (book.seriesPosition && book.seriesBooksCount) {
      return `${book.series} · Book ${book.seriesPosition} of ${book.seriesBooksCount}`;
    }
    if (book.seriesPosition) {
      return `${book.series} · Book ${book.seriesPosition}`;
    }
    return book.series;
  };

  const isFirstInSeries = (book: HardcoverBook) => {
    return book.seriesPosition === 1 && book.seriesBooksCount && book.seriesBooksCount > 1;
  };

  if (!hasToken) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Search className="w-4 h-4" />
          Search Books
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add to Quest Board</DialogTitle>
          <DialogDescription>
            Search for audiobooks to add to your guild&apos;s quest board.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or series..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && results.length === 0 && query && (
            <div className="text-center py-12 text-muted-foreground">
              No audiobooks found for &quot;{query}&quot;
            </div>
          )}

          {!loading && !error && results.length === 0 && !query && (
            <div className="text-center py-12 text-muted-foreground">
              Start typing to search for audiobooks
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3 py-2">
              {results.map((book) => {
                const seriesInfo = formatSeriesInfo(book);
                const showEpicQuest = isFirstInSeries(book);
                const isAddingSingle = adding === `single-${book.hardcoverId}`;
                const isAddingEpic = adding === `epic-${book.hardcoverId}`;
                const isAdding = isAddingSingle || isAddingEpic;

                return (
                  <Card key={book.hardcoverId} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <BookCover
                          title={book.title}
                          coverUrl={book.coverUrl || undefined}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{book.title}</h4>
                          {book.author && (
                            <p className="text-sm text-muted-foreground truncate">
                              {book.author}
                            </p>
                          )}
                          {seriesInfo && (
                            <p className="text-xs text-muted-foreground truncate">
                              {seriesInfo}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {book.audioDurationSeconds && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Headphones className="w-3 h-3" />
                                {formatDuration(book.audioDurationSeconds)}
                              </Badge>
                            )}
                            {book.popularity > 0 && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Users className="w-3 h-3" />
                                {book.popularity.toLocaleString()} readers
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleAddBook(book)}
                            disabled={isAdding || !hasGuild}
                            className="gap-1 text-xs"
                          >
                            {isAddingSingle ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                            Add Quest
                          </Button>
                          {showEpicQuest && (
                            <Button
                              size="sm"
                              onClick={() => handleAddEpicQuest(book)}
                              disabled={isAdding || !hasGuild}
                              className="gap-1 text-xs bg-violet-400 hover:bg-violet-500 text-white"
                            >
                              {isAddingEpic ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Swords className="w-3 h-3" />
                              )}
                              Epic Quest
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
