import { Book, Chapter } from './types';

// Helper to generate chapters with named intro/outro sections
function generateChapters(
  totalDuration: number,
  mainChapterCount: number,
  options: {
    hasOpeningCredits?: boolean;
    hasPrologue?: boolean;
    hasEpilogue?: boolean;
    hasEndCharacterSheet?: boolean;
    hasEndCredits?: boolean;
  } = {}
): Chapter[] {
  const chapters: Chapter[] = [];
  let currentTime = 0;

  // Estimate durations for special sections
  const creditsDuration = 60; // 1 min for credits
  const charSheetDuration = 300; // 5 min for character sheet
  const epilogueDuration = totalDuration * 0.02; // 2% for epilogue

  // Calculate main chapter duration
  let specialDuration = 0;
  if (options.hasOpeningCredits) specialDuration += creditsDuration;
  if (options.hasEndCredits) specialDuration += creditsDuration;
  if (options.hasEndCharacterSheet) specialDuration += charSheetDuration;
  if (options.hasEpilogue) specialDuration += epilogueDuration;

  const mainDuration = totalDuration - specialDuration;
  const avgChapterDuration = mainDuration / mainChapterCount;

  // Opening Credits
  if (options.hasOpeningCredits) {
    chapters.push({
      index: chapters.length,
      title: 'Opening Credits',
      startSeconds: currentTime,
      durationSeconds: creditsDuration,
    });
    currentTime += creditsDuration;
  }

  // Main chapters
  for (let i = 1; i <= mainChapterCount; i++) {
    // Vary chapter length slightly (+/- 5%)
    const variance = 1 + (((i * 7) % 10) / 100 - 0.05);
    let duration = Math.floor(avgChapterDuration * variance);

    chapters.push({
      index: chapters.length,
      title: `Chapter ${i}`,
      startSeconds: currentTime,
      durationSeconds: duration,
    });
    currentTime += duration;
  }

  // Epilogue
  if (options.hasEpilogue) {
    chapters.push({
      index: chapters.length,
      title: 'Epilogue',
      startSeconds: currentTime,
      durationSeconds: Math.floor(epilogueDuration),
    });
    currentTime += Math.floor(epilogueDuration);
  }

  // End Character Sheet
  if (options.hasEndCharacterSheet) {
    chapters.push({
      index: chapters.length,
      title: 'End Character Sheet',
      startSeconds: currentTime,
      durationSeconds: charSheetDuration,
    });
    currentTime += charSheetDuration;
  }

  // End Credits
  if (options.hasEndCredits) {
    // Adjust to fill remaining time
    const remaining = totalDuration - currentTime;
    chapters.push({
      index: chapters.length,
      title: 'End Credits',
      startSeconds: currentTime,
      durationSeconds: remaining > 0 ? remaining : creditsDuration,
    });
  }

  return chapters;
}

// Mage Tank Book 1 - ~17 hours 45 min
// Opening Credits, Chapters 1-70, Epilogue, End Character Sheet, End Credits
const MAGE_TANK_1_DURATION = 17 * 3600 + 45 * 60; // 63,900 seconds
export const MAGE_TANK_1: Book = {
  id: 'mage-tank-1',
  title: 'Mage Tank',
  author: 'Cornman',
  narrator: 'Daniel Wisniewski',
  coverUrl: '/covers/mage-tank-1.jpg',
  totalDurationSeconds: MAGE_TANK_1_DURATION,
  chapters: generateChapters(MAGE_TANK_1_DURATION, 70, {
    hasOpeningCredits: true,
    hasEpilogue: true,
    hasEndCharacterSheet: true,
    hasEndCredits: true,
  }),
};

// Mage Tank Book 2 - ~23 hours 30 min
// 67 chapters (assume same pattern)
const MAGE_TANK_2_DURATION = 23 * 3600 + 30 * 60; // 84,600 seconds
export const MAGE_TANK_2: Book = {
  id: 'mage-tank-2',
  title: 'Mage Tank 2',
  author: 'Cornman',
  narrator: 'Daniel Wisniewski',
  coverUrl: '/covers/mage-tank-2.jpg',
  totalDurationSeconds: MAGE_TANK_2_DURATION,
  chapters: generateChapters(MAGE_TANK_2_DURATION, 67, {
    hasOpeningCredits: true,
    hasEpilogue: true,
    hasEndCharacterSheet: true,
    hasEndCredits: true,
  }),
};

// Mage Tank Book 3 - ~25 hours (estimated)
// 83 chapters
const MAGE_TANK_3_DURATION = 25 * 3600; // 90,000 seconds
export const MAGE_TANK_3: Book = {
  id: 'mage-tank-3',
  title: 'Mage Tank 3',
  author: 'Cornman',
  narrator: 'Daniel Wisniewski',
  coverUrl: '/covers/mage-tank-3.jpg',
  totalDurationSeconds: MAGE_TANK_3_DURATION,
  chapters: generateChapters(MAGE_TANK_3_DURATION, 83, {
    hasOpeningCredits: true,
    hasEpilogue: true,
    hasEndCharacterSheet: true,
    hasEndCredits: true,
  }),
};

export const MAGE_TANK_BOOKS: Book[] = [MAGE_TANK_1, MAGE_TANK_2, MAGE_TANK_3];

export function getBookById(id: string): Book | undefined {
  return MAGE_TANK_BOOKS.find(book => book.id === id);
}
