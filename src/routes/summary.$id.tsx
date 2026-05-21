import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { useApp, getEvolutionStage } from "../lib/store";
import { Mochi } from "../components/Mochi";
import { Confetti } from "../components/Confetti";
import { categoryColor } from "../lib/categoryColors";

export const Route = createFileRoute("/summary/$id")({ component: Summary });

type StoredSummary = {
  deckId: string; deckName: string;
  right: number; wrong: number; totalStudied: number;
  missedTerms: string[]; missedCards: { term: string; cat: string; def: string }[];
  flaggedCards: string[]; cleanPass: boolean;
  confidenceByCat: Record<string, number>;
};

function Summary() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const hydrate = useApp((s) => s.hydrate);
  const awardXP = useApp((s) => s.awardXP);
  const markStudiedToday = useApp((s) => s.markStudiedToday);
  const streakMult = useApp((s) => s.streakMultiplier);
  const addItem = useApp((s) => s.addItem);
  const mochi = useApp((s) => s.mochi);

  const summary = useMemo<StoredSummary | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("flippit.lastSummary");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const [animatedXP, setAnimatedXP] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [evolved, setEvolved] = useState<{ from: number; to: number } | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [nom, setNom] = useState(false);

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (!summary) return;
    const xpEarned = summary.right * 10 + (summary.cleanPass ? 50 : 0);
    const mult = streakMult();
    const total = Math.round(xpEarned * mult);
    const { newStage, oldStage } = awardXP(total);
    const streakRes = markStudiedToday();
    if (streakRes.milestone) {
      setMilestone(streakRes.milestone);
      // award a cosmetic
      const pool = ["hat-party", "hat-crown", "acc-glasses", "acc-scarf"];
      const unowned = pool.filter((p) => !useApp.getState().mochi.inventory.includes(p));
      const pick = unowned[Math.floor(Math.random() * unowned.length)] ?? pool[0];
      addItem(pick);
    }
    if (newStage !== oldStage) setEvolved({ from: oldStage, to: newStage });
    if (summary.cleanPass) setShowConfetti(true);
    // animate XP counter
    let n = 0;
    const step = Math.max(1, Math.floor(total / 30));
    const iv = setInterval(() => {
      n = Math.min(total, n + step);
      setAnimatedXP(n);
      setNom(true);
      setTimeout(() => setNom(false), 200);
      if (n >= total) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [summary]);

  if (!summary) return (
    <AppShell><div className="card-surface p-6">No summary available. <Link to="/library" className="gradient-text">Back to library</Link></div></AppShell>
  );

  const accuracy = summary.totalStudied > 0 ? Math.round((summary.right / summary.totalStudied) * 100) : 0;

  return (
    <AppShell>
      <Confetti active={showConfetti} />
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl mb-1">Session Complete</h1>
        <p className="text-muted-foreground mb-6">{summary.deckName}</p>

        <div className="card-surface p-6 mb-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Accuracy</div>
            <div className="font-display text-6xl gradient-text">{accuracy}%</div>
          </div>
          <div className="progress-bar mt-4"><div className="progress-fill" style={{ width: `${accuracy}%` }} /></div>
          <div className="grid grid-cols-3 gap-3 mt-5 text-center">
            <div><div className="text-xs text-muted-foreground">Correct</div><div className="font-display text-xl text-[var(--green)]">{summary.right}</div></div>
            <div><div className="text-xs text-muted-foreground">Missed</div><div className="font-display text-xl text-[var(--red)]">{summary.wrong}</div></div>
            <div><div className="text-xs text-muted-foreground">Total</div><div className="font-display text-xl">{summary.totalStudied}</div></div>
          </div>
        </div>

        <div className="card-surface p-6 mb-4 flex items-center gap-4">
          <Mochi size={90} animate={false} nom={nom} />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">XP Earned</div>
            <div className="font-display text-3xl gradient-text">+{animatedXP}</div>
            <div className="text-xs text-muted-foreground mt-1">Streak ×{streakMult()} {summary.cleanPass && "· +50 clean pass"}</div>
          </div>
        </div>

        {Object.keys(summary.confidenceByCat).length > 0 && (
          <div className="card-surface p-6 mb-4">
            <h3 className="font-display text-lg mb-3">Confidence by category</h3>
            <div className="space-y-2">
              {Object.entries(summary.confidenceByCat).map(([cat, r]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="chip" style={{ background: categoryColor(cat), color: "#111" }}>{cat}</span>
                  <div className="flex-1 flex gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <span key={n} className={`text-lg ${n <= r ? "" : "opacity-25"}`}>★</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.missedTerms.length > 0 && (
          <div className="card-surface p-6 mb-4">
            <h3 className="font-display text-lg mb-3">Missed cards</h3>
            <div className="flex flex-wrap gap-2">
              {summary.missedTerms.map((t) => <span key={t} className="chip">{t}</span>)}
            </div>
          </div>
        )}

        {milestone && (
          <div className="card-surface p-4 mb-4 border-2" style={{ borderColor: "var(--yellow)" }}>
            🔥 <strong>{milestone}-day streak!</strong> You unlocked a new cosmetic item for Mochi.
          </div>
        )}
        {evolved && (
          <div className="card-surface p-4 mb-4 border-2" style={{ borderColor: "var(--accent)" }}>
            ✨ Mochi evolved to stage {evolved.to}!
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => nav({ to: "/study/$id", params: { id } })}>Study Again</button>
          <button className="btn-ghost" onClick={() => nav({ to: "/deck/$id", params: { id } })}>Back to Deck</button>
          <Link to="/pet" className="btn-ghost">Visit Mochi</Link>
        </div>
      </div>
    </AppShell>
  );
}
