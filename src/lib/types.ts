export type Card = {
  id: string;
  term: string;
  cat: string;
  def: string;
  ex?: string;
};

export type Deck = {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
  lastStudiedAt?: number;
};

export type StudyMode = "term-def" | "def-term" | "random";

export type MochiState = {
  xp: number;
  hunger: number; // 0-100
  lastHungerUpdate: number;
  inventory: string[];
  equipped: string[];
};

export type Preferences = {
  showExamples: boolean;
  shuffle: boolean;
  lastMode: Record<string, StudyMode>;
};
