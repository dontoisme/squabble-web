'use client';

import Link from 'next/link';
import { MAGE_TANK_BOOKS } from '@/lib/books/mage-tank';
import { formatDuration } from '@/lib/utils/time';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGuild } from '@/hooks/useGuild';

export default function LibraryPage() {
  const { hasGuild } = useGuild();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Library</h1>
          <p className="text-muted-foreground">
            Select a book to track progress and leave notes
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Search coming soon
        </Badge>
      </div>

      {!hasGuild && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">
              <Link href="/guild" className="text-primary hover:underline">
                Join or create a guild
              </Link>
              {' '}to share notes with friends
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MAGE_TANK_BOOKS.map((book) => (
          <Link key={book.id} href={`/library/${book.id}`}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="aspect-[3/4] bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
                  <div className="text-4xl font-bold text-muted-foreground/30">
                    {book.title.split(' ').slice(-1)[0]}
                  </div>
                </div>
                <CardTitle className="text-lg">{book.title}</CardTitle>
                <CardDescription>{book.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatDuration(book.totalDurationSeconds)}</span>
                  <span>{book.chapters.length} chapters</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
