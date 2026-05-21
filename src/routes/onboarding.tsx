import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mochi } from "../components/Mochi";
import { save, KEYS } from "../lib/storage";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  const finish = () => {
    save(KEYS.onboarding, true);
    nav({ to: "/library" });
  };

  const steps = [
    {
      title: "Welcome to Flippit",
      body: "Study smarter. Grow your Mochi.",
      art: <div className="font-display text-6xl gradient-text">Flippit</div>,
    },
    {
      title: "Meet Mochi",
      body: "Your kawaii study buddy. Every correct answer feeds Mochi XP — keep going to unlock new forms.",
      art: <Mochi size={180} />,
    },
    {
      title: "How to Study",
      body: "Tap or press Space to flip a card. Swipe right (or →) for 'Got it', left (or ←) for 'Missed'. Press F to flag tricky cards.",
      art: <div className="text-5xl">🃏 ⇆ ✨</div>,
    },
    {
      title: "Import Your First Deck",
      body: "Upload a JSON file or create a blank deck to start studying.",
      art: <div className="text-5xl">📚</div>,
    },
  ];

  const s = steps[step];

  return (
    <div className="grain min-h-screen relative flex items-center justify-center p-6">
      <div className="card-surface p-8 max-w-md w-full text-center relative z-10">
        <div className="flex justify-center mb-6 min-h-[120px] items-center">{s.art}</div>
        <h2 className="font-display text-2xl mb-2">{s.title}</h2>
        <p className="text-muted-foreground">{s.body}</p>

        <div className="flex items-center justify-center gap-1 mt-6">
          {steps.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === step ? 24 : 8, background: i === step ? "var(--accent)" : "var(--surface2)" }} />
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <button className="text-sm text-muted-foreground hover:text-foreground flex-1" onClick={finish}>Skip Onboarding</button>
          {step < steps.length - 1 ? (
            <button className="btn-primary flex-1" onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button className="btn-primary flex-1" onClick={finish}>Get Started</button>
          )}
        </div>
      </div>
    </div>
  );
}
