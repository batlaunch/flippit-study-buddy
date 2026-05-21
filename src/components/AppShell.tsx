import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="grain min-h-screen relative">
      {!hideNav && (
        <header className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl gradient-text">Flippit</Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/library" className="btn-ghost !py-2 !px-3 text-sm">Decks</Link>
            <Link to="/pet" className="btn-ghost !py-2 !px-3 text-sm">Mochi</Link>
          </nav>
        </header>
      )}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
