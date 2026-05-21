// Single utility for all localStorage I/O.
const isBrowser = typeof window !== "undefined";

export function load<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const KEYS = {
  decks: "flippit.decks",
  mochi: "flippit.mochi",
  streak: "flippit.streak",
  lastStudied: "flippit.lastStudiedDate",
  difficulty: "flippit.difficulty",
  flagged: "flippit.flagged",
  confidence: "flippit.confidence",
  onboarding: "flippit.onboardingComplete",
  swipeTutorial: "flippit.swipeTutorialDismissed",
  prefs: "flippit.prefs",
  lastDeck: "flippit.lastDeck",
};
