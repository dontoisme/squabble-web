'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Note } from '@/lib/firebase/types';
import { formatTimestamp } from '@/lib/utils/time';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookCover } from '@/components/BookCover';
import { getBookById } from '@/lib/books/mage-tank';
import { MessageSquare, BookOpen, Clock, User } from 'lucide-react';

export default function NotePage() {
  const params = useParams();
  const guildId = params.guildId as string;
  const noteId = params.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNote() {
      try {
        const noteRef = doc(db, 'guilds', guildId, 'comments', noteId);
        const noteSnap = await getDoc(noteRef);

        if (noteSnap.exists()) {
          setNote({ id: noteSnap.id, ...noteSnap.data() } as Note);
        } else {
          setError('Note not found');
        }
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('Failed to load note');
      } finally {
        setLoading(false);
      }
    }

    if (guildId && noteId) {
      fetchNote();
    }
  }, [guildId, noteId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading note...</div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h1 className="text-xl font-semibold mb-2">Note Not Found</h1>
            <p className="text-muted-foreground mb-4">
              This note may have been deleted or the link is invalid.
            </p>
            <Link href="/library">
              <Button variant="outline">Go to Library</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground">
            Squabble
          </Link>
        </div>
      </header>

      {/* Note content */}
      <main className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              {/* Book cover */}
              <BookCover
                title={note.bookTitle}
                coverUrl={getBookById(note.bookId)?.coverUrl}
                size="sm"
              />

              {/* Note details */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Header */}
                <div>
                  <h2 className="font-semibold text-lg">{note.bookTitle}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{note.userDisplayName}</span>
                    <span className="text-muted-foreground/50">at</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {formatTimestamp(note.timestamp)}
                    </Badge>
                  </div>
                </div>

                {/* Note text */}
                <blockquote className="border-l-4 border-primary/30 pl-4 py-2 text-base">
                  {note.text}
                </blockquote>

                {/* CTA */}
                <div className="pt-2">
                  <Link href={`/library/${note.bookId}`}>
                    <Button size="sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      View in Book
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign up prompt for non-authenticated users */}
        <Card className="mt-6 border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-3">
              Join Squabble to leave your own notes and listen with friends
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Log In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
