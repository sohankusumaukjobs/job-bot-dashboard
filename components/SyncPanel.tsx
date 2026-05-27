"use client";
import { useEffect, useRef, useState } from "react";
import {
  getStoredPat,
  setStoredPat,
  getStoredGistId,
  clearStoredCredentials,
  saveToGist,
  loadFromGist,
  lastSyncRelative,
} from "@/lib/gistSync";
import {
  readStatusMapNow,
  replaceStatusMap,
  useStatusMap,
} from "@/lib/jobStatus";

type Tone = "idle" | "ok" | "err" | "busy";

interface Message {
  tone: Tone;
  text: string;
}

export default function SyncPanel() {
  const [open, setOpen] = useState(false);
  const [pat, setPat] = useState("");
  const [showPat, setShowPat] = useState(false);
  const [msg, setMsg] = useState<Message>({ tone: "idle", text: "" });
  const [gistId, setGistId] = useState("");
  const [lastSync, setLastSync] = useState("never");
  // Force a re-render once per minute so "Last sync: 3m ago" stays accurate.
  const [, setTick] = useState(0);

  const localMap = useStatusMap();
  const localCount = Object.keys(localMap).length;
  const panelRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage after mount (avoid SSR mismatch).
  useEffect(() => {
    setPat(getStoredPat());
    setGistId(getStoredGistId());
    setLastSync(lastSyncRelative());
    const id = setInterval(() => {
      setLastSync(lastSyncRelative());
      setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

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
  }

  async function handleSave() {
    if (!pat) {
      setMsg({ tone: "err", text: "Enter a GitHub PAT first." });
      return;
    }
    setMsg({ tone: "busy", text: "Saving to GitHub Gist…" });
    try {
      const snapshot = readStatusMapNow();
      const { gistId: id } = await saveToGist(pat, snapshot);
      setGistId(id);
      setLastSync(lastSyncRelative());
      const n = Object.keys(snapshot).length;
      setMsg({
        tone: "ok",
        text: `Saved ${n} job${n === 1 ? "" : "s"} to cloud.`,
      });
    } catch (err) {
      setMsg({
        tone: "err",
        text: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function handleLoad() {
    if (!pat) {
      setMsg({ tone: "err", text: "Enter a GitHub PAT first." });
      return;
    }
    if (localCount > 0) {
      const ok = window.confirm(
        `This will replace your local statuses (${localCount} job${
          localCount === 1 ? "" : "s"
        }) with whatever is in the cloud. Continue?`
      );
      if (!ok) return;
    }
    setMsg({ tone: "busy", text: "Loading from GitHub Gist…" });
    try {
      const result = await loadFromGist(pat);
      if (!result) {
        setMsg({
          tone: "err",
          text: "No cloud snapshot found yet. Click Save first on another device.",
        });
        return;
      }
      replaceStatusMap(result.data);
      setGistId(result.gistId);
      setLastSync(lastSyncRelative());
      const n = Object.keys(result.data).length;
      setMsg({
        tone: "ok",
        text: `Loaded ${n} job${n === 1 ? "" : "s"} from cloud.`,
      });
    } catch (err) {
      setMsg({
        tone: "err",
        text: err instanceof Error ? err.message : String(err),
      });
    }
  }

  function handleSignOut() {
    const ok = window.confirm(
      "Forget the stored PAT and gist link from this browser? Your local statuses stay."
    );
    if (!ok) return;
    clearStoredCredentials();
    setPat("");
    setGistId("");
    setLastSync("never");
    setMsg({ tone: "ok", text: "Credentials cleared from this browser." });
  }

  const toneClass: Record<Tone, string> = {
    idle: "text-ink-muted",
    ok: "text-accent",
    err: "text-red",
    busy: "text-amber",
  };

  return (
    <div ref={panelRef} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-white/10 bg-bg-surface px-2.5 py-1 text-xs font-semibold text-ink-muted transition hover:border-white/30 hover:text-ink"
        title="Cross-device sync via GitHub Gist"
      >
        <span>☁️</span>
        <span>Sync</span>
        {pat && (
          <span className="rounded-full bg-accent/15 px-1.5 text-[10px] font-semibold text-accent">
            on
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-white/10 bg-bg-card p-4 shadow-xl shadow-black/40">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-ink">
              ☁️ Cross-device sync
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
              Stores your Applied/Interview/Rejected list in a{" "}
              <span className="text-ink">private GitHub Gist</span> so it
              follows you between devices. Needs a Personal Access Token with{" "}
              <code className="rounded bg-bg-surface px-1 text-[10px]">
                gist
              </code>{" "}
              scope only.{" "}
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

          <label className="block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            GitHub PAT
          </label>
          <div className="mt-1 flex gap-1">
            <input
              type={showPat ? "text" : "password"}
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              onBlur={(e) => commitPat(e.target.value)}
              placeholder="ghp_… or github_pat_…"
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-bg-surface px-2 py-1 text-xs text-ink placeholder:text-ink-muted/50 focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPat((s) => !s)}
              className="rounded-md border border-white/10 bg-bg-surface px-2 text-[11px] text-ink-muted hover:text-ink"
              title={showPat ? "Hide" : "Show"}
            >
              {showPat ? "🙈" : "👁"}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={msg.tone === "busy"}
              className="flex-1 rounded-md bg-accent px-2 py-1.5 text-xs font-semibold text-bg transition hover:bg-emerald-400 disabled:opacity-50"
            >
              ⬆ Save to cloud
            </button>
            <button
              type="button"
              onClick={handleLoad}
              disabled={msg.tone === "busy"}
              className="flex-1 rounded-md border border-white/15 bg-bg-surface px-2 py-1.5 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent disabled:opacity-50"
            >
              ⬇ Load from cloud
            </button>
          </div>

          {msg.text && (
            <p className={`mt-3 text-[11px] ${toneClass[msg.tone]}`}>
              {msg.text}
            </p>
          )}

          <div className="mt-3 space-y-1 border-t border-white/5 pt-3 text-[10px] text-ink-muted">
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
                  className="text-accent-2 underline"
                >
                  {gistId.slice(0, 10)}…
                </a>
              </div>
            )}
            {pat && (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-1 text-[10px] text-ink-muted underline hover:text-red"
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
