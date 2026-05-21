import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { useApp } from "../lib/store";
import { categoryColor } from "../lib/categoryColors";
import type { Card } from "../lib/types";

export const Route = createFileRoute("/deck/$id")({ component: DeckDetail });

function DeckDetail() {
  const { id } = Route.useParams();
  const hydrate = useApp((s) => s.hydrate);
  useEffect(() => { hydrate(); }, []);
  const deck = useApp((s) => s.decks.find((d) => d.id === id));
  const updateDeck = useApp((s) => s.updateDeck);
  const upsertCard = useApp((s) => s.upsertCard);
  const deleteCard = useApp((s) => s.deleteCard);
  const nav = useNavigate();

  const [editing, setEditing] = useState<Card | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  if (!deck) return <AppShell><div className="card-surface p-6">Deck not found. <Link to="/library" className="gradient-text">Back to library</Link></div></AppShell>;

  const categories = Array.from(new Set(deck.cards.map((c) => c.cat))).filter(Boolean);

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4 mb-4">
        <input
          value={deck.name}
          onChange={(e) => updateDeck(deck.id, { name: e.target.value })}
          className="!bg-transparent !border-0 !p-0 font-display text-3xl"
        />
        <button className="btn-primary" onClick={() => nav({ to: "/study/$id", params: { id: deck.id } })}>
          Study This Deck
        </button>
      </div>
      <div className="text-sm text-muted-foreground mb-6">{deck.cards.length} cards · {categories.length} categories</div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display text-xl">Cards</h2>
        <button className="btn-ghost !py-2 !px-3 text-sm" onClick={() => { setCreatingNew(true); setEditing({ id: Math.random().toString(36).slice(2, 10), term: "", cat: "", def: "", ex: "" }); }}>+ Add Card</button>
      </div>

      <div className="space-y-2">
        {deck.cards.length === 0 && (
          <div className="card-surface p-6 text-center text-muted-foreground">No cards yet. Add your first card.</div>
        )}
        {deck.cards.map((c) => (
          <div key={c.id} className="card-surface px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--surface2)]"
            onClick={() => { setEditing(c); setCreatingNew(false); }}>
            <span className="chip" style={{ background: categoryColor(c.cat), color: "#111" }}>{c.cat || "Uncategorized"}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.term}</div>
              <div className="text-xs text-muted-foreground truncate">{c.def}</div>
            </div>
            <button className="text-muted-foreground hover:text-[var(--red)]"
              onClick={(e) => { e.stopPropagation(); if (confirm("Delete this card?")) deleteCard(deck.id, c.id); }}>✕</button>
          </div>
        ))}
      </div>

      {editing && (
        <CardEditor
          card={editing}
          categories={categories}
          isNew={creatingNew}
          onClose={() => setEditing(null)}
          onSave={(c) => { upsertCard(deck.id, c); setEditing(null); }}
        />
      )}
    </AppShell>
  );
}

function CardEditor({ card, categories, isNew, onClose, onSave }: { card: Card; categories: string[]; isNew: boolean; onClose: () => void; onSave: (c: Card) => void }) {
  const [draft, setDraft] = useState<Card>(card);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-surface p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl mb-4">{isNew ? "New Card" : "Edit Card"}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Term</label>
            <input value={draft.term} onChange={(e) => setDraft({ ...draft, term: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <input list="cats" value={draft.cat} onChange={(e) => setDraft({ ...draft, cat: e.target.value })} />
            <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Definition</label>
            <textarea rows={3} value={draft.def} onChange={(e) => setDraft({ ...draft, def: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Example (optional)</label>
            <textarea rows={2} value={draft.ex ?? ""} onChange={(e) => setDraft({ ...draft, ex: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" disabled={!draft.term || !draft.def} onClick={() => onSave({ ...draft, cat: draft.cat || "General" })}>Save</button>
        </div>
      </div>
    </div>
  );
}
