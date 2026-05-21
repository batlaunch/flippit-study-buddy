import { create } from "zustand";
import { load, save, KEYS } from "./storage";
import type { Deck, Card, MochiState, Preferences, StudyMode } from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / 86_400_000);
}

export function getEvolutionStage(xp: number): 1 | 2 | 3 | 4 {
  if (xp >= 1500) return 4;
  if (xp >= 600) return 3;
  if (xp >= 200) return 2;
  return 1;
}

export function nextThreshold(xp: number): number {
  if (xp < 200) return 200;
  if (xp < 600) return 600;
  if (xp < 1500) return 1500;
  return 3000;
}

export function prevThreshold(xp: number): number {
  if (xp < 200) return 0;
  if (xp < 600) return 200;
  if (xp < 1500) return 600;
  return 1500;
}

type State = {
  decks: Deck[];
  mochi: MochiState;
  streak: number;
  lastStudiedDate: string | null;
  difficulty: Record<string, number>;
  flagged: string[];
  confidence: Record<string, number>;
  prefs: Preferences;
  lastDeck: string | null;

  // hydration
  _hydrated: boolean;
  hydrate: () => void;

  addDeck: (deck: Omit<Deck, "id" | "createdAt">) => string;
  updateDeck: (id: string, patch: Partial<Deck>) => void;
  deleteDeck: (id: string) => void;
  upsertCard: (deckId: string, card: Card) => void;
  deleteCard: (deckId: string, cardId: string) => void;

  toggleFlag: (term: string) => void;
  isFlagged: (term: string) => boolean;

  setDifficulty: (term: string, d: number) => void;
  adjustDifficulty: (term: string, correct: boolean) => void;

  setConfidence: (deckId: string, cat: string, rating: number) => void;

  setPrefs: (p: Partial<Preferences>) => void;

  awardXP: (amount: number) => { newStage: number; oldStage: number };
  feedMochi: () => void;
  decayHunger: () => void;
  equipItem: (id: string) => void;
  unequipItem: (id: string) => void;
  addItem: (id: string) => void;

  markStudiedToday: () => { newStreak: number; milestone: number | null };
  streakMultiplier: () => number;

  setLastDeck: (id: string | null) => void;
};

const defaultMochi: MochiState = {
  xp: 0,
  hunger: 100,
  lastHungerUpdate: Date.now(),
  inventory: [],
  equipped: [],
};

const defaultPrefs: Preferences = {
  showExamples: true,
  shuffle: true,
  lastMode: {},
};

export const useApp = create<State>((set, get) => ({
  decks: [],
  mochi: defaultMochi,
  streak: 0,
  lastStudiedDate: null,
  difficulty: {},
  flagged: [],
  confidence: {},
  prefs: defaultPrefs,
  lastDeck: null,
  _hydrated: false,

  hydrate: () => {
    if (get()._hydrated) return;
    set({
      decks: load(KEYS.decks, [] as Deck[]),
      mochi: load(KEYS.mochi, defaultMochi),
      streak: load(KEYS.streak, 0),
      lastStudiedDate: load(KEYS.lastStudied, null as string | null),
      difficulty: load(KEYS.difficulty, {}),
      flagged: load(KEYS.flagged, [] as string[]),
      confidence: load(KEYS.confidence, {}),
      prefs: load(KEYS.prefs, defaultPrefs),
      lastDeck: load(KEYS.lastDeck, null as string | null),
      _hydrated: true,
    });
    get().decayHunger();
  },

  addDeck: (deck) => {
    const newDeck: Deck = { ...deck, id: uid(), createdAt: Date.now() };
    const decks = [...get().decks, newDeck];
    save(KEYS.decks, decks);
    set({ decks });
    return newDeck.id;
  },
  updateDeck: (id, patch) => {
    const decks = get().decks.map((d) => (d.id === id ? { ...d, ...patch } : d));
    save(KEYS.decks, decks); set({ decks });
  },
  deleteDeck: (id) => {
    const decks = get().decks.filter((d) => d.id !== id);
    save(KEYS.decks, decks); set({ decks });
  },
  upsertCard: (deckId, card) => {
    const decks = get().decks.map((d) => {
      if (d.id !== deckId) return d;
      const exists = d.cards.some((c) => c.id === card.id);
      return {
        ...d,
        cards: exists ? d.cards.map((c) => (c.id === card.id ? card : c)) : [...d.cards, card],
      };
    });
    save(KEYS.decks, decks); set({ decks });
  },
  deleteCard: (deckId, cardId) => {
    const decks = get().decks.map((d) =>
      d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d
    );
    save(KEYS.decks, decks); set({ decks });
  },

  toggleFlag: (term) => {
    const f = get().flagged;
    const next = f.includes(term) ? f.filter((t) => t !== term) : [...f, term];
    save(KEYS.flagged, next); set({ flagged: next });
  },
  isFlagged: (term) => get().flagged.includes(term),

  setDifficulty: (term, d) => {
    const diff = { ...get().difficulty, [term]: d };
    save(KEYS.difficulty, diff); set({ difficulty: diff });
  },
  adjustDifficulty: (term, correct) => {
    const cur = get().difficulty[term] ?? 1.0;
    const next = correct ? Math.max(1.0, cur - 0.1) : Math.min(3.0, cur + 0.3);
    get().setDifficulty(term, next);
  },

  setConfidence: (deckId, cat, rating) => {
    const key = `${deckId}_${cat}_${todayStr()}`;
    const conf = { ...get().confidence, [key]: rating };
    save(KEYS.confidence, conf); set({ confidence: conf });
  },

  setPrefs: (p) => {
    const prefs = { ...get().prefs, ...p, lastMode: { ...get().prefs.lastMode, ...(p.lastMode ?? {}) } };
    save(KEYS.prefs, prefs); set({ prefs });
  },

  awardXP: (amount) => {
    const m = get().mochi;
    const oldStage = getEvolutionStage(m.xp);
    const newXP = m.xp + amount;
    const newStage = getEvolutionStage(newXP);
    const newMochi = { ...m, xp: newXP, hunger: Math.min(100, m.hunger + Math.floor(amount / 4)), lastHungerUpdate: Date.now() };
    save(KEYS.mochi, newMochi); set({ mochi: newMochi });
    return { newStage, oldStage };
  },
  feedMochi: () => {
    const m = get().mochi;
    const nm = { ...m, hunger: 100, lastHungerUpdate: Date.now() };
    save(KEYS.mochi, nm); set({ mochi: nm });
  },
  decayHunger: () => {
    const m = get().mochi;
    const hoursSince = (Date.now() - m.lastHungerUpdate) / 3_600_000;
    let hunger = m.hunger;
    if (hoursSince > 24) {
      // linear from 100% to 0% across 24-48h
      const decayed = Math.max(0, 100 - ((hoursSince - 24) / 24) * 100);
      hunger = Math.min(hunger, decayed);
    }
    const nm = { ...m, hunger };
    save(KEYS.mochi, nm); set({ mochi: nm });
  },
  equipItem: (id) => {
    const m = get().mochi;
    if (m.equipped.includes(id)) return;
    const nm = { ...m, equipped: [...m.equipped, id] };
    save(KEYS.mochi, nm); set({ mochi: nm });
  },
  unequipItem: (id) => {
    const m = get().mochi;
    const nm = { ...m, equipped: m.equipped.filter((x) => x !== id) };
    save(KEYS.mochi, nm); set({ mochi: nm });
  },
  addItem: (id) => {
    const m = get().mochi;
    if (m.inventory.includes(id)) return;
    const nm = { ...m, inventory: [...m.inventory, id] };
    save(KEYS.mochi, nm); set({ mochi: nm });
  },

  markStudiedToday: () => {
    const today = todayStr();
    const last = get().lastStudiedDate;
    let streak = get().streak;
    let milestone: number | null = null;
    if (last === today) {
      // already counted
    } else if (last && daysBetween(last, today) === 1) {
      streak = streak + 1;
    } else {
      streak = 1;
    }
    if ([3, 7, 14, 30].includes(streak) && last !== today) milestone = streak;
    save(KEYS.streak, streak); save(KEYS.lastStudied, today);
    set({ streak, lastStudiedDate: today });
    return { newStreak: streak, milestone };
  },
  streakMultiplier: () => {
    const s = get().streak;
    if (s >= 7) return 2;
    if (s >= 3) return 1.5;
    return 1;
  },

  setLastDeck: (id) => { save(KEYS.lastDeck, id); set({ lastDeck: id }); },
}));

export function modeFor(deckId: string): StudyMode {
  return useApp.getState().prefs.lastMode[deckId] ?? "term-def";
}
