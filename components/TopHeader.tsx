"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import SyncPanel from "./SyncPanel";
import { PROFILE } from "@/lib/profile";

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
      {/* Page title — hidden on mobile while the search is expanded so the
          input has room (otherwise title + search + sync + avatar overflow a
          ~360px viewport). */}
      <h1
        className={`
          font-display text-lg font-bold tracking-tight text-ink md:text-xl
          ${mobileSearchOpen ? "hidden md:block" : ""}
        `}
      >
        {title}
      </h1>

      {/* Centred / right-aligned controls */}
      <div
        className={`flex items-center gap-2 ${mobileSearchOpen ? "ml-0 flex-1 md:ml-auto md:flex-none" : "ml-auto"}`}
      >
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

        {/* Mobile search — fills the row when open so it never overflows. */}
        <div className={`md:hidden ${mobileSearchOpen ? "flex-1" : ""}`}>
          {mobileSearchOpen ? (
            <form
              onSubmit={onSearchSubmit}
              className="search-pill flex w-full"
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

        {/* Profile chip — avatar + name, collapses to just the avatar on mobile. */}
        <Link
          href="/"
          aria-label={`${PROFILE.fullName} — profile`}
          title={PROFILE.fullName}
          className="
            ml-1 flex items-center gap-2 rounded-full
            border border-transparent py-0.5 pl-0.5 pr-0.5 sm:pr-3
            transition-all duration-150 ease-spring
            hover:border-border/[0.10] hover:bg-bg-elevated/40
          "
        >
          <span
            className="
              grid h-9 w-9 shrink-0 place-items-center rounded-full
              bg-score-gradient text-sm font-bold text-white shadow-card
            "
          >
            {PROFILE.initials}
          </span>
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-sm font-bold text-ink">
              {PROFILE.name}
            </span>
            <span className="truncate text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              {PROFILE.role}
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
