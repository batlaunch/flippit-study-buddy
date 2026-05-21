import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../components/AppShell";
import { useApp } from "../lib/store";
import { categoryColor } from "../lib/categoryColors";
import type { Card } from "../lib/types";

export const Route = createFileRoute("/library")({ component: Library });

function Library() {
  const hydrate = useApp((s) => s.hydrate);
  useEffect(() => { hydrate(); }, []);
  const decks = useApp((s) => s.decks);
  const addDeck = useApp((s) => s.addDeck);
  const deleteDeck = useApp((s) => s.deleteDeck);
  const nav = useNavigate();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl">Deck Library</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Deck</button>
      </div>

      {decks.length === 0 ? (
        <div className="card-surface p-10 text-center text-muted-foreground">
          No decks yet — add one to get started.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((d) => {
            const cats = Array.from(new Set(d.cards.map((c) => c.cat))).filter(Boolean);
            const primary = cats[0] ? categoryColor(cats[0]) : "#7c6af7";
            return (
              <div key={d.id} className="card-surface overflow-hidden group">
                <div className="h-1.5" style={{ background: primary }} />
                <div className="p-5">
                  <Link to="/deck/$id" params={{ id: d.id }} className="block">
                    <div className="font-display text-xl">{d.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {d.cards.length} cards · {cats.length} categor{cats.length === 1 ? "y" : "ies"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {d.lastStudiedAt ? `Last studied ${new Date(d.lastStudiedAt).toLocaleDateString()}` : "Not yet studied"}
                    </div>
                  </Link>
                  <div className="flex gap-2 mt-4">
                    <button className="btn-primary !py-2 !px-3 text-sm flex-1"
                      onClick={() => nav({ to: "/study/$id", params: { id: d.id } })}>Study</button>
                    <button className="btn-ghost !py-2 !px-3 text-sm"
                      onClick={() => {
                        if (confirm(`Delete deck "${d.name}"?`)) deleteDeck(d.id);
                      }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddDeckModal
          onClose={() => setShowAdd(false)}
          onCreate={(name, cards) => {
            const id = addDeck({ name, cards });
            setShowAdd(false);
            nav({ to: "/deck/$id", params: { id } });
          }}
        />
      )}
    </AppShell>
  );
}

function AddDeckModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, cards: Card[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Card[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleFile = async (f: File) => {
    setError("");
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Expected an array");
      const cards: Card[] = parsed.map((c: any, i: number) => {
        if (!c.term || !c.def) throw new Error(`Card ${i + 1} missing term or def`);
        return { id: Math.random().toString(36).slice(2, 10), term: String(c.term), cat: String(c.cat ?? "General"), def: String(c.def), ex: c.ex ? String(c.ex) : undefined };
      });
      setPreview(cards);
      setName(f.name.replace(/\.json$/, ""));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-surface p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl mb-4">Add Deck</h2>

        {!preview ? (
          <>
            <button
              className="btn-primary w-full mb-3"
              onClick={() => fileRef.current?.click()}
            >Upload JSON</button>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

            <button
              className="btn-ghost w-full mb-3"
              onClick={() => onCreate("Untitled Deck", [])}
            >Create Blank Deck</button>

            <div className="space-y-2 mt-4">
              {[
                { label: "Paste plain text", tag: "AI" },
                { label: "Upload PDF or DOCX", tag: "AI" },
                { label: "Import from URL", tag: "AI" },
              ].map((b) => (
                <button key={b.label} disabled
                  className="w-full flex items-center justify-between btn-ghost opacity-50 cursor-not-allowed"
                  title="Coming Soon — AI Powered"
                >
                  <span>{b.label}</span>
                  <span className="chip">Coming Soon — AI</span>
                </button>
              ))}
            </div>

            {error && <div className="mt-3 text-sm text-[var(--red)]">{error}</div>}
            <div className="mt-4 text-xs text-muted-foreground">
              Expected JSON format: <code>[{`{"term":"...","cat":"...","def":"...","ex":"..."}`}]</code>
            </div>
          </>
        ) : (
          <>
            <label className="block text-sm mb-1">Deck name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mb-4" />
            <div className="text-sm text-muted-foreground mb-2">Preview of first 3 cards ({preview.length} total):</div>
            <div className="space-y-2 mb-4">
              {preview.slice(0, 3).map((c, i) => (
                <div key={i} className="card-surface p-3 text-sm">
                  <span className="chip mr-2" style={{ background: categoryColor(c.cat), color: "#111" }}>{c.cat}</span>
                  <strong>{c.term}</strong> — {c.def}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setPreview(null)}>Back</button>
              <button className="btn-primary flex-1" onClick={() => onCreate(name || "Untitled", preview)}>Import</button>
            </div>
          </>
        )}

        <button className="mt-4 text-sm text-muted-foreground hover:text-foreground" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
