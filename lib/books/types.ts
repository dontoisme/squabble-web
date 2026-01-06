export interface Chapter {
  index: number;
  title: string;
  startSeconds: number;
  durationSeconds: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  narrator?: string;
  coverUrl: string;
  totalDurationSeconds: number;
  chapters: Chapter[];
}
