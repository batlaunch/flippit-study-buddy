import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "../components/AppShell";
import { Mochi } from "../components/Mochi";
import { useApp, getEvolutionStage, nextThreshold, prevThreshold } from "../lib/store";

export const Route = createFileRoute("/pet")({ component: Pet });

const ALL_ITEMS = [
  { id: "hat-party", name: "Party Hat", earn: "Reach 7-day streak", category: "Hat" },
  { id: "hat-crown", name: "Golden Crown", earn: "Reach 30-day streak", category: "Hat" },
  { id: "acc-glasses", name: "Glasses", earn: "Reach 14-day streak", category: "Accessory" },
  { id: "acc-scarf", name: "Red Scarf", earn: "Reach 3-day streak", category: "Accessory" },
];

function Pet() {
  const hydrate = useApp((s) => s.hydrate);
  useEffect(() => { hydrate(); }, []);
  const mochi = useApp((s) => s.mochi);
  const equip = useApp((s) => s.equipItem);
  const unequip = useApp((s) => s.unequipItem);
  const stage = getEvolutionStage(mochi.xp);
  const stageNames = ["", "Egg", "Baby Mochi", "Mochi", "Elder Mochi"];
  const next = nextThreshold(mochi.xp);
  const prev = prevThreshold(mochi.xp);
  const pct = Math.min(100, ((mochi.xp - prev) / (next - prev)) * 100);

  return (
    <AppShell>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-surface p-6 text-center">
          <Mochi size={240} showHunger />
          <div className="font-display text-2xl mt-4">{stageNames[stage]}</div>
          <div className="text-xs text-muted-foreground">Stage {stage} of 4</div>
          <div className="mt-5">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{mochi.xp} XP</span><span>{next} XP</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Wardrobe</h2>
            <span className="chip" title="Premium shop coming soon">Shop coming soon</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_ITEMS.map((item) => {
              const owned = mochi.inventory.includes(item.id);
              const equipped = mochi.equipped.includes(item.id);
              return (
                <button
                  key={item.id}
                  disabled={!owned}
                  onClick={() => (equipped ? unequip(item.id) : equip(item.id))}
                  className={`p-3 rounded-2xl border text-left text-sm transition ${owned ? "" : "opacity-40 cursor-not-allowed"} ${equipped ? "border-transparent" : "border-[var(--border)]"}`}
                  style={equipped ? { background: "linear-gradient(135deg, rgba(124,106,247,.25), rgba(192,132,252,.25))", borderColor: "var(--accent)" } : { background: "var(--surface2)" }}
                >
                  <div className="text-2xl mb-1">{owned ? "🎁" : "🔒"}</div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{owned ? (equipped ? "Equipped" : "Tap to equip") : item.earn}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
