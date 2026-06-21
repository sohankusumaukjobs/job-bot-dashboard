"use client";
import { useEffect, useRef, useState } from "react";
import { Cloud, RefreshCw, Eye, EyeOff } from "lucide-react";
import {
  getStoredPat,
  setStoredPat,
  getStoredGistId,
  clearStoredCredentials,
  lastSyncRelative,
} from "@/lib/gistSync";
import { useStatusMap } from "@/lib/jobStatus";
import { start, stop, syncNow, useSyncState, type SyncPhase } from "@/lib/autoSync";

export default function SyncPanel() {
  const [open, setOpen] = useState(false);
  const [pat, setPat] = useState("");
  const [showPat, setShowPat] = useState(false);
  const [gistId, setGistId] = useState("");
  const [lastSync, setLastSync] = useState("never");

  const sync = useSyncState();
  const localMap = useStatusMap();
  const localCount = Object.keys(localMap).length;
  const panelRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage after mount (avoid SSR mismatch).
  useEffect(() => {
    setPat(getStoredPat());
    setGistId(getStoredGistId());
    setLastSync(lastSyncRelative());
    const id = setInterval(() => setLastSync(lastSyncRelative()), 15_000);
    return () => clearInterval(id);
  }, []);

  // Keep the "synced Xs ago" label fresh whenever the engine reports a sync.
  useEffect(() => {
    setLastSync(lastSyncRelative());
    setGistId(getStoredGistId());
  }, [sync.lastSyncedAt]);

  // Close popover on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function commitPat(value: string) {
    const trimmed = value.trim();
    setPat(trimmed);
    setStoredPat(trimmed);
    if (trimmed) start(trimmed);
    else stop();
  }

  function handleSignOut() {
    const ok = window.confirm(
      "Forget the stored PAT and gist link from this browser? Your local statuses stay."
    );
    if (!ok) return;
    stop();
    clearStoredCredentials();
    setPat("");
    setGistId("");
    setLastSync("never");
  }

  const active = !!pat;

  const phaseMeta: Record<SyncPhase, { label: string; dot: string; text: string }> = {
    off: { label: "Auto-sync off", dot: "bg-ink-faint", text: "text-ink-muted" },
    idle: { label: "Auto-sync on", dot: "bg-success", text: "text-success" },
    syncing: { label: "Syncing…", dot: "bg-warning", text: "text-warning" },
    error: { label: "Sync error", dot: "bg-danger", text: "text-danger" },
  };
  const meta = phaseMeta[active ? sync.phase : "off"];

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="
          relative inline-flex items-center gap-1.5 rounded-full
          border border-border/[0.08] bg-bg-elevated/45 px-3 py-1.5
          text-xs font-semibold text-ink-muted transition
          hover:border-primary/40 hover:text-ink
        "
        title="Cross-device auto-sync via GitHub Gist"
      >
        <Cloud size={14} strokeWidth={2.25} />
        <span className="hidden sm:inline">Sync</span>
        {active && (
          <span
            className={`absolute -top-1 -right-1 grid h-2.5 w-2.5 place-items-center rounded-full ${meta.dot} ring-2 ring-bg ${
              sync.phase === "syncing" ? "motion-safe:animate-pulse" : ""
            }`}
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-2xl border border-border/[0.08] bg-surface/95 p-4 shadow-card-lit backdrop-blur-glass">
          <div className="mb-3">
            <h3 className="font-display text-sm font-bold text-ink">
              Cross-device sync
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
              Your Applied/Interview/Rejected list syncs{" "}
              <span className="text-ink">automatically</span> across your devices
              through a private GitHub Gist. Paste a token with{" "}
              <code className="rounded bg-bg-surface px-1 text-[10px]">gist</code>{" "}
              scope <span className="text-ink">once on each device</span> — after
              that it's hands-free.{" "}
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-2 underline"
              >
                Create one →
              </a>
            </p>
          </div>

          {/* Live status row */}
          <div className="mb-3 flex items-center justify-between rounded-lg border border-border/[0.06] bg-bg-elevated/40 px-3 py-2">
            <span className="flex items-center gap-2 text-[11px] font-semibold">
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              <span className={meta.text}>{meta.label}</span>
            </span>
            <button
              type="button"
              onClick={() => syncNow()}
              disabled={!active || sync.phase === "syncing"}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary transition hover:underline disabled:opacity-40"
              title="Sync now"
            >
              <RefreshCw
                size={12}
                strokeWidth={2.5}
                className={sync.phase === "syncing" ? "motion-safe:animate-spin" : ""}
              />
              Sync now
            </button>
          </div>

          <label className="block text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
            GitHub PAT
          </label>
          <div className="mt-1.5 flex gap-1.5">
            <input
              type={showPat ? "text" : "password"}
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              onBlur={(e) => commitPat(e.target.value)}
              placeholder="ghp_… or github_pat_…"
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-border/[0.08] bg-bg-elevated/60 px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-muted/55 focus:border-primary/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPat((s) => !s)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border/[0.08] bg-bg-elevated/60 text-ink-muted hover:text-ink"
              title={showPat ? "Hide" : "Show"}
            >
              {showPat ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          {sync.phase === "error" && sync.error && (
            <p className="mt-2 text-[11px] text-danger">{sync.error}</p>
          )}

          <div className="mt-3 space-y-1 border-t border-border/[0.05] pt-3 text-[10px] text-ink-muted">
            <div>
              Local: <span className="text-ink">{localCount}</span> job
              {localCount === 1 ? "" : "s"} tracked
            </div>
            <div>
              Last sync: <span className="text-ink">{lastSync}</span>
            </div>
            {gistId && (
              <div className="truncate">
                Gist:{" "}
                <a
                  href={`https://gist.github.com/${gistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {gistId.slice(0, 10)}…
                </a>
              </div>
            )}
            {active && (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-1 text-[10px] text-ink-muted underline hover:text-danger"
              >
                Forget PAT on this device
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
