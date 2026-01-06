'use client';

import { useState, useEffect } from 'react';
import { Book, Chapter } from '@/lib/books/types';
import { chapterToSeconds, secondsToChapter, formatTimestamp, parseTimestamp } from '@/lib/utils/time';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChapterPickerProps {
  book: Book;
  currentSeconds: number;
  onUpdate: (seconds: number) => void;
  disabled?: boolean;
}

export function ChapterPicker({ book, currentSeconds, onUpdate, disabled }: ChapterPickerProps) {
  const { chapter, offsetSeconds } = secondsToChapter(book, currentSeconds);

  const [selectedChapterIndex, setSelectedChapterIndex] = useState(chapter.index);
  const [offsetInput, setOffsetInput] = useState(formatTimestamp(offsetSeconds));

  // Update local state when currentSeconds changes
  useEffect(() => {
    const { chapter, offsetSeconds } = secondsToChapter(book, currentSeconds);
    setSelectedChapterIndex(chapter.index);
    setOffsetInput(formatTimestamp(offsetSeconds));
  }, [book, currentSeconds]);

  const handleChapterChange = (index: number) => {
    setSelectedChapterIndex(index);
    setOffsetInput('0:00');
  };

  const handleUpdate = () => {
    const offset = parseTimestamp(offsetInput);
    const totalSeconds = chapterToSeconds(book, selectedChapterIndex, offset);
    onUpdate(totalSeconds);
  };

  const selectedChapter = book.chapters[selectedChapterIndex];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Chapter</Label>
        <select
          className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-background"
          value={selectedChapterIndex}
          onChange={(e) => handleChapterChange(Number(e.target.value))}
          disabled={disabled}
        >
          {book.chapters.map((ch) => (
            <option key={ch.index} value={ch.index}>
              {ch.title} ({formatTimestamp(ch.startSeconds)})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Time into chapter</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="0:00"
            value={offsetInput}
            onChange={(e) => setOffsetInput(e.target.value)}
            disabled={disabled}
            className="font-mono"
          />
          <span className="flex items-center text-sm text-muted-foreground">
            / {formatTimestamp(selectedChapter?.durationSeconds || 0)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Format: MM:SS or HH:MM:SS
        </p>
      </div>

      <Button onClick={handleUpdate} disabled={disabled} className="w-full">
        Update Progress
      </Button>
    </div>
  );
}
