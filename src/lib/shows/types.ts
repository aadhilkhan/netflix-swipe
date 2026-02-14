export type SwipeDirection = 'like' | 'nope';

export interface Show {
  id: string;
  title: string;
  year: number;
  rating: string;
  genres: string[];
  description: string;
  posterUrl: string;
}

export interface UserSwipes {
  liked: Set<string>;
  noped: Set<string>;
}

export interface Room {
  code: string;
  showOrder: string[]; // shuffled show IDs
  users: Map<string, UserSwipes>; // sessionId -> swipes
  createdAt: number;
}
