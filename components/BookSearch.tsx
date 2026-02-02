'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
import { Search, Plus, Headphones, Users, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

interface BookSearchProps {
  onBookAdded?: () => void;
}

export function BookSearch({ onBookAdded }: BookSearchProps) {
  const { search, results, loading, error, clearResults, hasToken } = useHardcoverSearch();
  const { guild, hasGuild } = useGuild();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<number | null>(null);
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

  const handleAddBook = async (book: HardcoverBook) => {
    if (!guild?.id || !user) {
      toast.error('You must be in a guild to add books');
      return;
    }

    setAdding(book.hardcoverId);

    try {
      // Generate a simple book ID from the Hardcover ID
      const bookId = `hc_${book.hardcoverId}`;

      // Add to guild books collection
      const booksRef = collection(db, 'guilds', guild.id, 'books');
      await addDoc(booksRef, {
        id: bookId,
        title: book.title,
        author: book.author,
        hardcoverId: book.hardcoverId,
        coverUrl: book.coverUrl,
        audioDurationSeconds: book.audioDurationSeconds,
        addedBy: user.uid,
        addedAt: serverTimestamp(),
        status: 'queued',
        queuePosition: 999, // Will be sorted later
        memberOwnership: {
          [user.uid]: {
            hasBook: false, // Web users don't have the actual file
            progressPercent: 0,
          },
        },
      });

      toast.success(`"${book.title}" added to guild library!`);
      onBookAdded?.();
      handleClose();
    } catch (err) {
      console.error('Error adding book:', err);
      toast.error('Failed to add book to library');
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

  if (!hasToken) {
    return null; // Don't show search if no token configured
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
          <DialogTitle>Add Book to Guild Library</DialogTitle>
          <DialogDescription>
            Search Hardcover to find books for your guild&apos;s reading list.
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
              No books found for &quot;{query}&quot;
            </div>
          )}

          {!loading && !error && results.length === 0 && !query && (
            <div className="text-center py-12 text-muted-foreground">
              Start typing to search for books
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3 py-2">
              {results.map((book) => (
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
                        {book.series && (
                          <p className="text-xs text-muted-foreground truncate">
                            {book.series}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {book.hasAudiobook && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Headphones className="w-3 h-3" />
                              {formatDuration(book.audioDurationSeconds)}
                            </Badge>
                          )}
                          {book.popularity > 0 && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Users className="w-3 h-3" />
                              {book.popularity.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddBook(book)}
                        disabled={adding === book.hardcoverId || !hasGuild}
                      >
                        {adding === book.hardcoverId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
