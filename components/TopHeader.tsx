"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import SyncPanel from "./SyncPanel";

const PAGE_TITLES: Record<string, string> = {
  "/":          "Daily Feed",
  "/all":       "All Jobs",
  "/applied":   "Applied",
  "/interview": "Interview",
  "/rejected":  "Rejected",
};

function titleFor(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/runs/")) return "Run Detail";
  return "Job Bot";
}

export default function TopHeader() {
  const pathname = usePathname() ?? "/";
  const title = titleFor(pathname);

  // Mobile: search collapses to icon; tap to expand.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mobileSearchOpen) inputRef.current?.focus();
  }, [mobileSearchOpen]);

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const q = String(data.get("q") || "").trim();
    if (!q) return;
    // Quick + transparent: route to /all with the query as a hash so the
    // existing AllJobsTable filter input can pick it up on mount.
    window.location.href = `/all#q=${encodeURIComponent(q)}`;
  }

  return (
    <header
      className="
        glass-bar sticky top-0 z-20 flex items-center gap-3
        px-4 py-3 md:pl-[calc(60px+1rem)] md:pr-6
        lg:pl-[calc(240px+1.5rem)]
      "
    >
      {/* Page title — primary on the left so users always know where they are. */}
      <h1 className="font-display text-lg font-bold tracking-tight text-ink md:text-xl">
        {title}
      </h1>

      {/* Centred / right-aligned controls */}
      <div className="ml-auto flex items-center gap-2">
        {/* Desktop search pill */}
        <form
          onSubmit={onSearchSubmit}
          className="search-pill hidden w-64 md:flex"
          role="search"
        >
          <Search size={15} strokeWidth={2} className="text-ink-muted" />
          <input
            type="search"
            name="q"
            placeholder="Search jobs, companies…"
            className="text-sm"
            autoComplete="off"
          />
        </form>

        {/* Mobile search */}
        <div className="md:hidden">
          {mobileSearchOpen ? (
            <form
              onSubmit={onSearchSubmit}
              className="search-pill flex w-56"
              role="search"
            >
              <Search size={15} strokeWidth={2} className="text-ink-muted" />
              <input
                ref={inputRef}
                type="search"
                name="q"
                placeholder="Search…"
                className="text-sm"
                autoComplete="off"
                onBlur={() => setMobileSearchOpen(false)}
              />
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="text-ink-muted"
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="btn-icon"
              aria-label="Open search"
            >
              <Search size={18} />
            </button>
          )}
        </div>

        {/* Cloud sync (GitHub Gist). Functionality unchanged from existing
            SyncPanel; the panel internally renders an `☁️ Sync` button. */}
        <SyncPanel />

        {/* Avatar */}
        <Link
          href="/"
          aria-label="Profile"
          className="
            ml-1 grid h-9 w-9 place-items-center rounded-full
            bg-score-gradient text-sm font-bold text-white shadow-card
            transition-transform duration-150 ease-spring hover:scale-105
          "
        >
          SK
        </Link>
      </div>
    </header>
  );
}
