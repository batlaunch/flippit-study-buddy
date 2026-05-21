import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../components/AppShell";
import { useApp } from "../lib/store";
import { categoryColor } from "../lib/categoryColors";
import type { Card, StudyMode } from "../lib/types";

export const Route = createFileRoute("/study/$id")({ component: Study });

type HistoryEntry = { idx: number; wasRight: boolean; wasMissed: boolean; term: string };

function Study() {
  const { id } = Route.useParams();
  const hydrate = useApp((s) => s.hydrate);
  useEffect(() => { hydrate(); }, []);
  const deck = useApp((s) => s.decks.find((d) => d.id === id));
  const flagged = useApp((s) => s.flagged);
  const toggleFlag = useApp((s) => s.toggleFlag);
  const difficulty = useApp((s) => s.difficulty);
  const adjustDifficulty = useApp((s) => s.adjustDifficulty);
  const prefs = useApp((s) => s.prefs);
  const setPrefs = useApp((s) => s.setPrefs);
  const setLastDeck = useApp((s) => s.setLastDeck);
  const updateDeck = useApp((s) => s.updateDeck);
  const setConfidence = useApp((s) => s.setConfidence);

  const nav = useNavigate();
  const [started, setStarted] = useState(false);
  const [sessionConfig, setSessionConfig] = useState<null | {
    mode: StudyMode; showEx: boolean; shuffle: boolean; flaggedEverywhere: boolean; categories: string[]; includeFlaggedCat: boolean;
  }>(null);

  useEffect(() => { if (deck) setLastDeck(deck.id); }, [deck?.id]);

  if (!deck) return <AppShell><div className="card-surface p-6">Deck not found. <Link to="/library" className="gradient-text">Back</Link></div></AppShell>;

  if (!started || !sessionConfig) {
    return (
      <PreStudyModal
        deck={deck}
        flaggedTerms={flagged}
        defaults={{
          mode: prefs.lastMode[deck.id] ?? "term-def",
          showEx: prefs.showExamples,
          shuffle: prefs.shuffle,
        }}
        onCancel={() => nav({ to: "/deck/$id", params: { id: deck.id } })}
        onStart={(cfg) => {
          setPrefs({ showExamples: cfg.showEx, shuffle: cfg.shuffle, lastMode: { [deck.id]: cfg.mode } });
          setSessionConfig(cfg);
          setStarted(true);
        }}
      />
    );
  }

  return (
    <Session
      deckId={deck.id}
      deckName={deck.name}
      allCards={deck.cards}
      config={sessionConfig}
      flagged={new Set(flagged)}
      toggleFlag={toggleFlag}
      difficulty={difficulty}
      adjustDifficulty={adjustDifficulty}
      setConfidence={setConfidence}
      onFinish={(summary) => {
        updateDeck(deck.id, { lastStudiedAt: Date.now() });
        sessionStorage.setItem("flippit.lastSummary", JSON.stringify(summary));
        nav({ to: "/summary/$id", params: { id: deck.id } });
      }}
    />
  );
}

function PreStudyModal({
  deck, flaggedTerms, defaults, onStart, onCancel,
}: {
  deck: { id: string; name: string; cards: Card[] };
  flaggedTerms: string[];
  defaults: { mode: StudyMode; showEx: boolean; shuffle: boolean };
  onStart: (cfg: { mode: StudyMode; showEx: boolean; shuffle: boolean; flaggedEverywhere: boolean; categories: string[]; includeFlaggedCat: boolean }) => void;
  onCancel: () => void;
}) {
  const cats = useMemo(() => Array.from(new Set(deck.cards.map((c) => c.cat))).filter(Boolean), [deck]);
  const flaggedInDeck = deck.cards.filter((c) => flaggedTerms.includes(c.term));
  const [mode, setMode] = useState<StudyMode>(defaults.mode);
  const [showEx, setShowEx] = useState(defaults.showEx);
  const [shuffle, setShuffle] = useState(defaults.shuffle);
  const [flaggedEverywhere, setFlaggedEverywhere] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>(() => Object.fromEntries(cats.map((c) => [c, true])));
  const [includeFlaggedCat, setIncludeFlaggedCat] = useState(false);

  const selectedCats = cats.filter((c) => selected[c]);
  const regularCards = deck.cards.filter((c) => selectedCats.includes(c.cat) && (flaggedEverywhere || !flaggedTerms.includes(c.term)));
  const flaggedCards = flaggedInDeck;
  const totalCount = (() => {
    const set = new Set<string>();
    regularCards.forEach((c) => set.add(c.term));
    if (includeFlaggedCat || flaggedEverywhere) flaggedCards.forEach((c) => set.add(c.term));
    return set.size;
  })();

  const toggle = (e: React.MouseEvent | React.ChangeEvent, fn: () => void) => {
    e.preventDefault();
    fn();
  };

  return (
    <AppShell>
      <div className="card-surface p-6 max-w-2xl mx-auto">
        <h1 className="font-display text-2xl mb-1">{deck.name}</h1>
        <p className="text-sm text-muted-foreground mb-5">Pre-study setup</p>

        <div className="mb-5">
          <div className="text-xs text-muted-foreground mb-2">Mode</div>
          <div className="grid grid-cols-3 gap-2">
            {([
              ["term-def", "Term → Def"],
              ["def-term", "Def → Term"],
              ["random", "Random"],
            ] as [StudyMode, string][]).map(([k, label]) => (
              <button
                key={k}
                className={`btn-ghost text-sm ${mode === k ? "!bg-gradient-to-r from-[#7c6af7] to-[#c084fc] !text-white !border-transparent" : ""}`}
                onClick={() => setMode(k)}
              >{label}</button>
            ))}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <ToggleRow label="Show Examples" checked={showEx} onToggle={(e) => toggle(e, () => setShowEx((v) => !v))} />
          <ToggleRow label="Shuffle Cards" checked={shuffle} onToggle={(e) => toggle(e, () => setShuffle((v) => !v))} />
          <ToggleRow label="Flagged in Every Set" checked={flaggedEverywhere} onToggle={(e) => toggle(e, () => setFlaggedEverywhere((v) => !v))} />
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">Categories</div>
            <div className="flex gap-2">
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={(e) => { e.preventDefault(); setSelected(Object.fromEntries(cats.map((c) => [c, true]))); }}>Select All</button>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={(e) => { e.preventDefault(); setSelected({}); }}>Deselect All</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {cats.map((c) => (
              <label
                key={c}
                onClick={(e) => { e.preventDefault(); setSelected((s) => ({ ...s, [c]: !s[c] })); }}
                className={`cursor-pointer px-3 py-2 rounded-xl border flex items-center gap-2 text-sm ${selected[c] ? "border-transparent" : "border-[var(--border)] opacity-60"}`}
                style={{ background: selected[c] ? categoryColor(c) : "var(--surface2)", color: selected[c] ? "#111" : undefined }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: selected[c] ? "#111" : categoryColor(c) }} />
                {c} <span className="opacity-60 ml-auto">{deck.cards.filter((x) => x.cat === c).length}</span>
              </label>
            ))}
            <label
              onClick={(e) => { e.preventDefault(); setIncludeFlaggedCat((v) => !v); }}
              className={`cursor-pointer px-3 py-2 rounded-xl border-2 flex items-center gap-2 text-sm`}
              style={{ borderColor: "var(--yellow)", background: includeFlaggedCat ? "var(--yellow)" : "transparent", color: includeFlaggedCat ? "#111" : undefined }}
            >
              🚩 Flagged <span className="opacity-70 ml-auto">{flaggedInDeck.length}</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
          <span className="chip">{totalCount} card{totalCount === 1 ? "" : "s"}</span>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" disabled={totalCount === 0}
              onClick={() => onStart({ mode, showEx, shuffle, flaggedEverywhere, categories: selectedCats, includeFlaggedCat })}>Start</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ToggleRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm ${checked ? "border-transparent" : "border-[var(--border)]"}`}
      style={{ background: checked ? "linear-gradient(90deg,#7c6af7,#c084fc)" : "var(--surface2)", color: checked ? "white" : undefined }}
    >
      <span>{label}</span>
      <span className={`w-9 h-5 rounded-full p-0.5 transition ${checked ? "bg-white/30" : "bg-black/40"}`}>
        <span className={`block w-4 h-4 rounded-full bg-white transition ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type SessionProps = {
  deckId: string;
  deckName: string;
  allCards: Card[];
  config: { mode: StudyMode; showEx: boolean; shuffle: boolean; flaggedEverywhere: boolean; categories: string[]; includeFlaggedCat: boolean };
  flagged: Set<string>;
  toggleFlag: (term: string) => void;
  difficulty: Record<string, number>;
  adjustDifficulty: (term: string, correct: boolean) => void;
  setConfidence: (deckId: string, cat: string, rating: number) => void;
  onFinish: (summary: any) => void;
};

function Session(props: SessionProps) {
  const { deckId, deckName, allCards, config, flagged, toggleFlag, difficulty, adjustDifficulty, setConfidence, onFinish } = props;

  const initialDeck = useMemo(() => {
    const map = new Map<string, Card>();
    allCards.forEach((c) => {
      const inCat = config.categories.includes(c.cat);
      const isFlag = flagged.has(c.term);
      if (inCat && (config.flaggedEverywhere || !isFlag)) map.set(c.term, c);
    });
    if (config.flaggedEverywhere || config.includeFlaggedCat) {
      allCards.filter((c) => flagged.has(c.term)).forEach((c) => map.set(c.term, c));
    }
    let arr = Array.from(map.values());
    arr.sort((a, b) => (difficulty[b.term] ?? 1) - (difficulty[a.term] ?? 1));
    if (config.shuffle) {
      arr = shuffleArr(arr);
      arr.sort((a, b) => (difficulty[b.term] ?? 1) - (difficulty[a.term] ?? 1));
    }
    return arr;
  }, []);

  const sourcePool = useRef<Card[]>(initialDeck);
  const [deck, setDeck] = useState<Card[]>(initialDeck);
  const [idx, setIdx] = useState(0);
  const [rightCount, setRight] = useState(0);
  const [wrongCount, setWrong] = useState(0);
  const [missedThisRound, setMissedThisRound] = useState<Card[]>([]);
  const [wrongTerms, setWrongTerms] = useState<string[]>([]);
  const [allMissedHistory, setAllMissedHistory] = useState<Card[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [hasFlippedOnce, setHasFlippedOnce] = useState(false);
  const [showExNow, setShowExNow] = useState(config.showEx);
  const [busy, setBusy] = useState(false);
  const [confidenceCat, setConfidenceCat] = useState<string | null>(null);
  const [catCompleted, setCatCompleted] = useState<Set<string>>(new Set());
  const [swipeTutorial, setSwipeTutorial] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("flippit.swipeTutorialDismissed");
  });

  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [frontLabel, setFrontLabel] = useState("");
  const [backLabel, setBackLabel] = useState("");

  const total = sourcePool.current.length;
  const current = deck[idx];

  const populateCard = useCallback((card: Card) => {
    const mode = config.mode === "random" ? (Math.random() < 0.5 ? "term-def" : "def-term") : config.mode;
    if (mode === "term-def") {
      setFrontText(card.term); setBackText(card.def);
      setFrontLabel(card.cat); setBackLabel(card.cat);
    } else {
      setFrontText(card.def); setBackText(card.term);
      setFrontLabel(card.cat); setBackLabel(card.cat);
    }
  }, [config.mode]);

  useEffect(() => {
    if (current) populateCard(current);
  }, []);

  const advanceTo = useCallback((nextIdx: number, nextDeck: Card[]) => {
    setBusy(true);
    setFrontText(""); setBackText(""); setFrontLabel(""); setBackLabel("");
    setFlipped(false);
    setHasFlippedOnce(false);
    (document.activeElement as HTMLElement | null)?.blur();
    setTimeout(() => {
      const card = nextDeck[nextIdx];
      if (card) populateCard(card);
      setBusy(false);
    }, 460);
  }, [populateCard]);

  const finishOrAdvance = useCallback((nextIdx: number, missedNow: Card[], updatedDeck: Card[]) => {
    if (nextIdx >= updatedDeck.length) {
      if (missedNow.length > 0) {
        const sorted = [...missedNow].sort((a, b) => (difficulty[b.term] ?? 1) - (difficulty[a.term] ?? 1));
        setDeck(sorted);
        setIdx(0);
        setMissedThisRound([]);
        advanceTo(0, sorted);
      } else {
        const summary = {
          deckName, deckId,
          right: rightCount,
          total,
          missedTerms: wrongTerms,
          missedCards: allMissedHistory,
          flaggedCards: Array.from(flagged),
          confidenceByCat: config.categories.reduce((acc, c) => {
            const k = `${deckId}_${c}_${new Date().toISOString().slice(0,10)}`;
            const v = (useApp.getState().confidence as any)[k];
            if (v) acc[c] = v;
            return acc;
          }, {} as Record<string, number>),
        };
        onFinish({ ...summary, right: rightCount, wrong: wrongCount, totalStudied: rightCount + wrongCount, cleanPass: wrongTerms.length === 0 });
      }
    } else {
      setIdx(nextIdx);
      advanceTo(nextIdx, updatedDeck);
    }
  }, [advanceTo, allMissedHistory, deckId, deckName, difficulty, flagged, onFinish, rightCount, total, wrongCount, wrongTerms]);

  const maybeAskConfidence = useCallback((justAnswered: Card, nextIdx: number) => {
    const cat = justAnswered.cat;
    if (catCompleted.has(cat)) return false;
    const remaining = deck.slice(nextIdx).some((c) => c.cat === cat);
    if (!remaining) {
      setCatCompleted((s) => new Set(s).add(cat));
      setConfidenceCat(cat);
      return true;
    }
    return false;
  }, [catCompleted, deck]);

  const answer = useCallback((correct: boolean) => {
    if (busy || !current) return;
    if (!hasFlippedOnce) return;
    adjustDifficulty(current.term, correct);
    setHistory((h) => [...h, { idx, wasRight: correct, wasMissed: !correct, term: current.term }]);
    let newMissed = missedThisRound;
    if (correct) {
      setRight((n) => n + 1);
    } else {
      setWrong((n) => n + 1);
      setWrongTerms((t) => Array.from(new Set([...t, current.term])));
      newMissed = [...missedThisRound, current];
      setMissedThisRound(newMissed);
      setAllMissedHistory((a) => (a.some((x) => x.term === current.term) ? a : [...a, current]));
    }
    const nextIdx = idx + 1;
    const asked = maybeAskConfidence(current, nextIdx);
    if (asked) {
      pendingAdvance.current = () => finishOrAdvance(nextIdx, newMissed, deck);
    } else {
      finishOrAdvance(nextIdx, newMissed, deck);
    }
  }, [adjustDifficulty, busy, current, deck, finishOrAdvance, hasFlippedOnce, idx, maybeAskConfidence, missedThisRound]);

  const pendingAdvance = useRef<null | (() => void)>(null);

  const goBack = useCallback(() => {
    if (history.length === 0 || busy) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    if (last.wasRight) setRight((n) => Math.max(0, n - 1));
    if (last.wasMissed) {
      setWrong((n) => Math.max(0, n - 1));
      setMissedThisRound((m) => m.filter((c) => c.term !== last.term));
      setWrongTerms((t) => t.filter((x) => x !== last.term));
    }
    setIdx(last.idx);
    advanceTo(last.idx, deck);
  }, [advanceTo, busy, deck, history]);

  const doFlip = useCallback(() => {
    if (busy) return;
    setFlipped((f) => !f);
    setHasFlippedOnce(true);
  }, [busy]);

  const doFlag = useCallback(() => {
    if (!current) return;
    toggleFlag(current.term);
  }, [current, toggleFlag]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!["Space", "ArrowLeft", "ArrowRight", "KeyF"].includes(e.code)) return;
      e.preventDefault();
      if (e.code === "Space") doFlip();
      else if (e.code === "KeyF") doFlag();
      else if (e.code === "ArrowLeft") answer(false);
      else if (e.code === "ArrowRight") answer(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doFlip, doFlag, answer]);

  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 40 && Math.abs(dy) < 40) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (!hasFlippedOnce) return;
      if (dx > 0) answer(true); else answer(false);
    } else {
      if (dy < 0) doFlip();
    }
  };

  if (!current) return <AppShell><div className="card-surface p-6">No cards to study.</div></AppShell>;

  const progress = ((idx) / Math.max(1, total)) * 100;

  return (
    <div className="grain min-h-screen relative">
      <div className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="btn-ghost !py-1.5 !px-2.5">←</Link>
          <div className="flex-1">
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">{Math.min(idx + 1, total)} / {total}</div>
          <div className="text-sm tabular-nums"><span className="text-[var(--green)]">✓{rightCount}</span> <span className="text-[var(--red)] ml-2">✗{wrongCount}</span></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {frontLabel && (
          <div className="text-center mb-3">
            <span className="chip" style={{ background: categoryColor(frontLabel), color: "#111" }}>{frontLabel}</span>
          </div>
        )}

        <div className="flip-wrapper relative mx-auto" style={{ maxWidth: 520 }}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <button
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); doFlag(); }}
            className="absolute top-3 right-3 z-10 text-2xl transition"
            style={{ opacity: current && flagged.has(current.term) ? 1 : 0.4, transform: current && flagged.has(current.term) ? "scale(1.15)" : "scale(1)" }}
            aria-label="Flag card"
          >{current && flagged.has(current.term) ? "🚩" : "🏳️"}</button>

          <div className={`flip-card ${flipped ? "flipped" : ""}`} onClick={doFlip}>
            <div className="flip-face front">
              <div className="font-display text-2xl sm:text-3xl">{frontText || "\u00A0"}</div>
              <div className="absolute bottom-3 left-0 right-0 text-xs text-muted-foreground">
                Space to flip · ← Miss · → Got it · F to flag
              </div>
            </div>
            <div className="flip-face back">
              <div className="font-display text-2xl">{backText || "\u00A0"}</div>
              {showExNow && current.ex && (
                <div className="mt-3 text-sm text-muted-foreground italic max-w-md">{current.ex}</div>
              )}
            </div>
          </div>
        </div>

        {config.showEx && (
          <div className="text-center mt-3">
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowExNow((v) => !v)}>
              {showExNow ? "Hide" : "Show"} example
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-8">
          <button tabIndex={-1} className="btn-ghost" disabled={history.length === 0 || busy} onClick={goBack}>↩ Back</button>
          <button tabIndex={-1} className="btn-ghost" style={{ background: "rgba(248,113,113,.15)", borderColor: "var(--red)" }} disabled={!hasFlippedOnce || busy} onClick={() => answer(false)}>✗ Missed it</button>
          <button tabIndex={-1} className="btn-primary" disabled={!hasFlippedOnce || busy} onClick={() => answer(true)}>✓ Got it</button>
        </div>

        {!hasFlippedOnce && (
          <div className="text-center text-xs text-muted-foreground mt-3">Flip the card before answering.</div>
        )}
      </div>

      {confidenceCat && (
        <ConfidenceOverlay cat={confidenceCat} onPick={(r) => {
          setConfidence(deckId, confidenceCat, r);
          setConfidenceCat(null);
          const next = pendingAdvance.current; pendingAdvance.current = null;
          next?.();
        }} />
      )}

      {swipeTutorial && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 sm:hidden">
          <div className="card-surface px-4 py-3 max-w-sm text-sm">
            <div className="font-semibold mb-1">Swipe to study faster</div>
            <div className="text-xs text-muted-foreground">← Missed · → Got it · ↑ Flip</div>
            <button className="mt-2 text-xs gradient-text" onClick={() => {
              localStorage.setItem("flippit.swipeTutorialDismissed", "1");
              setSwipeTutorial(false);
            }}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfidenceOverlay({ cat, onPick }: { cat: string; onPick: (r: number) => void }) {
  const labels = ["", "Not at all", "Barely", "Sort of", "Pretty well", "Got it"];
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="card-surface p-6 max-w-md w-full text-center">
        <h3 className="font-display text-xl mb-1">How well do you know</h3>
        <div className="font-display text-2xl gradient-text mb-5">{cat}?</div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => onPick(n)} className="btn-ghost flex flex-col items-center !px-2 !py-3">
              <span className="font-display text-xl">{n}</span>
              <span className="text-[10px] text-muted-foreground mt-1">{labels[n]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
