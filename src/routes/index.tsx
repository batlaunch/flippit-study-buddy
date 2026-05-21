import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp, getEvolutionStage, nextThreshold, prevThreshold } from "../lib/store";
import { Mochi } from "../components/Mochi";
import { AppShell } from "../components/AppShell";
import { load, KEYS } from "../lib/storage";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const nav = useNavigate();
  const hydrate = useApp((s) => s.hydrate);
  const hydrated = useApp((s) => s._hydrated);

  useEffect(() => {
    hydrate();
    if (!load<boolean>(KEYS.onboarding, false)) {
      nav({ to: "/onboarding" });
    }
  }, []);

  const decks = useApp((s) => s.decks);
  const mochi = useApp((s) => s.mochi);
  const streak = useApp((s) => s.streak);
  const lastDeck = useApp((s) => s.lastDeck);
  const stage = getEvolutionStage(mochi.xp);
  const stageNames = ["", "Egg", "Baby Mochi", "Mochi", "Elder Mochi"];

  if (!hydrated) return null;

  const next = nextThreshold(mochi.xp);
  const prev = prevThreshold(mochi.xp);
  const pct = Math.min(100, ((mochi.xp - prev) / (next - prev)) * 100);

  return (
    <AppShell>
      <section className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h1 className="font-display text-5xl sm:text-6xl leading-tight">
            <span className="gradient-text">Study smarter.</span><br />
            Grow your Mochi.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-md">
            Flip cards, build streaks, and watch your kawaii study buddy evolve.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="card-surface px-4 py-3 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <div className="text-xs text-muted-foreground">Streak</div>
                <div className="font-display text-xl">{streak} day{streak === 1 ? "" : "s"}</div>
              </div>
            </div>
            <div className="card-surface px-4 py-3">
              <div className="text-xs text-muted-foreground">XP · {stageNames[stage]}</div>
              <div className="font-display text-xl">{mochi.xp} XP</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {lastDeck && decks.some((d) => d.id === lastDeck) && (
              <button
                className="btn-primary"
                onClick={() => nav({ to: "/study/$id", params: { id: lastDeck } })}
              >
                Continue Last Deck
              </button>
            )}
            <Link to="/library" className="btn-ghost">Deck Library</Link>
            <Link to="/pet" className="btn-ghost">Visit Mochi</Link>
          </div>
        </div>

        <div className="card-surface p-6 flex flex-col items-center gap-3">
          <Mochi size={180} showHunger />
          <div className="text-sm text-muted-foreground">{stageNames[stage]}</div>
          <div className="w-full">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{mochi.xp} XP</span><span>{next} XP</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          </div>
        </div>
      </section>

      {decks.length === 0 && (
        <div className="mt-10 card-surface p-8 text-center">
          <h3 className="font-display text-2xl">No decks yet</h3>
          <p className="text-muted-foreground mt-2">Import a JSON file or create a blank deck to begin.</p>
          <Link to="/library" className="btn-primary inline-block mt-4">Open Deck Library</Link>
        </div>
      )}
    </AppShell>
  );
}
