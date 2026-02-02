export interface Chapter {
  index: number;
  title: string;
  startSeconds: number;
  durationSeconds: number;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  narrator?: string;
  coverUrl?: string;
  totalDurationSeconds: number;
  chapters: Chapter[];
}

/**
 * Minimal book info needed for progress tracking
 * (Guild books don't have chapters/duration info)
 */
export interface BookRef {
  id: string;
  title: string;
}
