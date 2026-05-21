const PALETTE = [
  "#7c6af7", "#c084fc", "#4ade80", "#fbbf24", "#f87171",
  "#38bdf8", "#fb7185", "#a78bfa", "#34d399", "#facc15",
];

const cache = new Map<string, string>();

export function categoryColor(cat: string): string {
  if (cache.has(cat)) return cache.get(cat)!;
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) >>> 0;
  const color = PALETTE[h % PALETTE.length];
  cache.set(cat, color);
  return color;
}
