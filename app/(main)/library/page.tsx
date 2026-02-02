'use client';

import Link from 'next/link';
import { useGuildBooks, GuildBook } from '@/hooks/useGuildBooks';
import { useGuild } from '@/hooks/useGuild';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookCover } from '@/components/BookCover';
import { Library, BookOpen, CheckCircle, Clock } from 'lucide-react';

function BookCard({ book }: { book: GuildBook }) {
  const ownershipCount = Object.values(book.memberOwnership).filter(
    (o) => o.hasBook || (o.progressPercent !== undefined && o.progressPercent > 0)
  ).length;
  const totalMembers = Object.keys(book.memberOwnership).length;

  return (
    <Link href={`/library/${book.id}`}>
      <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex justify-center mb-3">
            <BookCover title={book.title} size="lg" />
          </div>
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
    </Link>
  );
}

function EmptyLibrary() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <Library className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No books yet</h3>
        <p className="text-muted-foreground mb-4">
          Your guild&apos;s library is empty. Add books from the mobile app to start tracking together!
        </p>
        <p className="text-sm text-muted-foreground">
          Books added on mobile will appear here automatically.
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
  const { hasGuild } = useGuild();
  const { books, currentBook, queuedBooks, finishedBooks, loading, hasBooks } = useGuildBooks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Library</h1>
          <p className="text-muted-foreground">
            Your guild&apos;s shared book collection
          </p>
        </div>
      </div>

      {!hasGuild && <NoGuildPrompt />}

      {hasGuild && loading && (
        <div className="text-center py-12 text-muted-foreground animate-pulse">
          Loading library...
        </div>
      )}

      {hasGuild && !loading && !hasBooks && <EmptyLibrary />}

      {hasGuild && !loading && hasBooks && (
        <>
          {/* Currently Reading */}
          {currentBook && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Currently Reading
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <BookCard book={currentBook} />
              </div>
            </section>
          )}

          {/* Queued Books */}
          {queuedBooks.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Up Next ({queuedBooks.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {queuedBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          )}

          {/* Finished Books */}
          {finishedBooks.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
                Completed ({finishedBooks.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {finishedBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
