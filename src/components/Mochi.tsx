import { useApp, getEvolutionStage } from "../lib/store";

type Props = {
  size?: number;
  showHunger?: boolean;
  animate?: boolean;
  nom?: boolean;
};

export function Mochi({ size = 120, showHunger = false, animate = true, nom = false }: Props) {
  const mochi = useApp((s) => s.mochi);
  const stage = getEvolutionStage(mochi.xp);
  const hungerState =
    mochi.hunger > 70 ? "happy" : mochi.hunger > 40 ? "neutral" : mochi.hunger > 15 ? "hungry" : "very-hungry";

  const tint = hungerState === "very-hungry" ? "grayscale(.6)" : "none";
  const equipped = mochi.equipped;

  return (
    <div className="inline-flex flex-col items-center gap-2" style={{ filter: tint }}>
      <div
        className={`${animate ? "mochi-idle" : ""} ${nom ? "mochi-nom" : ""}`}
        style={{ width: size, height: size }}
      >
        <MochiSVG stage={stage} hungerState={hungerState} equipped={equipped} />
      </div>
      {showHunger && (
        <div className="text-xs flex items-center gap-1 text-muted-foreground">
          <span>{hungerState === "happy" ? "😊" : hungerState === "neutral" ? "🙂" : hungerState === "hungry" ? "😟" : "😢"}</span>
          <div className="w-16 h-1.5 bg-[var(--surface2)] rounded-full overflow-hidden">
            <div className="h-full gradient-bg" style={{ width: `${mochi.hunger}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function MochiSVG({
  stage,
  hungerState,
  equipped,
}: {
  stage: 1 | 2 | 3 | 4;
  hungerState: string;
  equipped: string[];
}) {
  const isSad = hungerState === "hungry" || hungerState === "very-hungry";
  const eyeY = isSad ? 56 : 52;
  const mouth = isSad ? "M40,72 Q50,66 60,72" : "M40,68 Q50,76 60,68";

  if (stage === 1) {
    // Egg
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <radialGradient id="eggG" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#fde2c4" />
            <stop offset="100%" stopColor="#e8b27a" />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="55" rx="32" ry="40" fill="url(#eggG)" stroke="#a17a4d" strokeWidth="1.5" />
        <path d="M30,55 L40,50 L36,60 L46,56 L42,66" fill="none" stroke="#7a5a36" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="50" cy="35" r="20" fill="#fff" opacity="0.12" />
      </svg>
    );
  }

  const bodyR = stage === 2 ? 30 : stage === 3 ? 36 : 40;
  const bodyFill = "#f4e4ff";
  const aura = stage === 4;

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id="bodyG" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={bodyFill} />
        </radialGradient>
        <radialGradient id="aura" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
      </defs>
      {aura && <circle cx="50" cy="55" r="48" fill="url(#aura)" />}
      {/* Ears for stage 3+ */}
      {stage >= 3 && (
        <>
          <ellipse cx="28" cy="32" rx="6" ry="9" fill={bodyFill} transform="rotate(-20 28 32)" />
          <ellipse cx="72" cy="32" rx="6" ry="9" fill={bodyFill} transform="rotate(20 72 32)" />
        </>
      )}
      {/* Body */}
      <ellipse cx="50" cy="58" rx={bodyR} ry={bodyR - 2} fill="url(#bodyG)" stroke="#d1b3e8" strokeWidth="1.2" />
      {/* Cheeks */}
      <circle cx="32" cy="64" r="4" fill="#ffb3c6" opacity="0.7" />
      <circle cx="68" cy="64" r="4" fill="#ffb3c6" opacity="0.7" />
      {/* Eyes */}
      <circle cx="40" cy={eyeY} r="3" fill="#1a1a2a" />
      <circle cx="60" cy={eyeY} r="3" fill="#1a1a2a" />
      <circle cx="41" cy={eyeY - 1} r="1" fill="#fff" />
      <circle cx="61" cy={eyeY - 1} r="1" fill="#fff" />
      {/* Mouth */}
      <path d={mouth} fill="none" stroke="#1a1a2a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Stubby limbs (stage 2) */}
      {stage === 2 && (
        <>
          <ellipse cx="22" cy="68" rx="4" ry="3" fill={bodyFill} stroke="#d1b3e8" strokeWidth="1" />
          <ellipse cx="78" cy="68" rx="4" ry="3" fill={bodyFill} stroke="#d1b3e8" strokeWidth="1" />
        </>
      )}
      {/* Cosmetic layers */}
      {equipped.includes("hat-party") && (
        <polygon points="50,18 42,38 58,38" fill="#7c6af7" stroke="#5b4dc9" strokeWidth="1" />
      )}
      {equipped.includes("hat-crown") && (
        <polygon points="36,30 44,18 50,28 56,18 64,30 64,34 36,34" fill="#fbbf24" stroke="#a87a0a" strokeWidth="1" />
      )}
      {equipped.includes("acc-glasses") && (
        <g stroke="#1a1a2a" strokeWidth="1.5" fill="none">
          <circle cx="40" cy={eyeY} r="6" />
          <circle cx="60" cy={eyeY} r="6" />
          <line x1="46" y1={eyeY} x2="54" y2={eyeY} />
        </g>
      )}
      {equipped.includes("acc-scarf") && (
        <path d="M28,72 Q50,82 72,72 L72,80 Q50,90 28,80 Z" fill="#f87171" stroke="#a83838" strokeWidth="1" />
      )}
    </svg>
  );
}
