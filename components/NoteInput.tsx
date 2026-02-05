'use client';

import { useState, useEffect } from 'react';
import { NOTE_MAX_CHARS } from '@/lib/firebase/types';
import { Book } from '@/lib/books/types';
import { secondsToChapter, formatTimestamp, chapterToSeconds, parseTimestamp } from '@/lib/utils/time';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface NoteInputProps {
  book: Book;
  currentProgressSeconds: number;
  onPostNote: (text: string, timestampSeconds: number) => Promise<void>;
  disabled?: boolean;
}

export function NoteInput({ book, currentProgressSeconds, onPostNote, disabled }: NoteInputProps) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const hasChapters = book.chapters.length > 0;

  // Chapter-based state
  const initialData = hasChapters ? secondsToChapter(book, currentProgressSeconds) : null;
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(initialData?.chapter.index ?? 0);
  const [offsetInput, setOffsetInput] = useState(
    hasChapters ? formatTimestamp(initialData?.offsetSeconds ?? 0) : ''
  );

  // Timestamp-only state (for books without chapters)
  const [timestampInput, setTimestampInput] = useState(
    hasChapters ? '' : formatTimestamp(currentProgressSeconds)
  );

  // Update defaults when progress changes
  useEffect(() => {
    if (hasChapters) {
      const data = secondsToChapter(book, currentProgressSeconds);
      if (data) {
        setSelectedChapterIndex(data.chapter.index);
        setOffsetInput(formatTimestamp(data.offsetSeconds));
      }
    } else {
      setTimestampInput(formatTimestamp(currentProgressSeconds));
    }
  }, [book, currentProgressSeconds, hasChapters]);

  const charCount = text.length;
  const isOverLimit = charCount > NOTE_MAX_CHARS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isOverLimit || posting) return;

    setPosting(true);
    try {
      let timestampSeconds: number;
      if (hasChapters) {
        const offset = parseTimestamp(offsetInput);
        timestampSeconds = chapterToSeconds(book, selectedChapterIndex, offset);
      } else {
        timestampSeconds = parseTimestamp(timestampInput);
      }
      await onPostNote(text.trim(), timestampSeconds);
      setText('');
      toast.success('Note posted!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post note';
      toast.error(message);
    } finally {
      setPosting(false);
    }
  };

  const selectedChapter = hasChapters ? book.chapters[selectedChapterIndex] : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Leave a Note</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {hasChapters ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Chapter</Label>
                    <select
                      className="w-full h-9 px-2 py-1 text-sm border rounded-md bg-background"
                      value={selectedChapterIndex}
                      onChange={(e) => {
                        setSelectedChapterIndex(Number(e.target.value));
                        setOffsetInput('0:00');
                      }}
                      disabled={disabled || posting}
                    >
                      {book.chapters.map((ch) => (
                        <option key={ch.index} value={ch.index}>
                          {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Time offset</Label>
                    <Input
                      type="text"
                      placeholder="0:00"
                      value={offsetInput}
                      onChange={(e) => setOffsetInput(e.target.value)}
                      disabled={disabled || posting}
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  @ {selectedChapter?.title} + {offsetInput}
                </p>
              </>
            ) : (
              <div>
                <Label className="text-xs">Timestamp (HH:MM:SS or MM:SS)</Label>
                <Input
                  type="text"
                  placeholder="1:23:45"
                  value={timestampInput}
                  onChange={(e) => setTimestampInput(e.target.value)}
                  disabled={disabled || posting}
                  className="h-9 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the audiobook timestamp for this note
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Leave a note for your friends..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={disabled || posting}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-between text-xs">
              <span className={isOverLimit ? 'text-destructive' : 'text-muted-foreground'}>
                {charCount}/{NOTE_MAX_CHARS}
              </span>
              <span className="text-muted-foreground">
                Hidden until friends reach this point
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={disabled || posting || !text.trim() || isOverLimit}
            className="w-full"
          >
            {posting ? 'Posting...' : 'Post Note'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
