"use client";
import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import {
  getEntriesNow,
  applyEntries,
  mergeEntries,
  subscribeEntries,
  type EntryMap,
} from "./jobStatus";
import {
  getStoredPat,
  saveEntriesToGist,
  loadEntriesFromGist,
} from "./gistSync";

/**
 * Auto-sync engine: a module-level singleton that keeps the local status
 * entries and the remote GitHub Gist converged automatically.
 *
 *  • On start: pull → merge → push if local ended up newer.
 *  • On local change: debounced push (~2s) so rapid toggles collapse to one write.
 *  • Background: interval poll + on focus/visibility/online → conditional pull.
 *  • Conflict-safe: field-level last-write-wins via per-entry timestamps.
 *
 * Pulls are conditional (ETag → 304) so an idle tab costs ~nothing against the
 * authenticated rate limit.
 */

const PUSH_DEBOUNCE_MS = 2000;
const POLL_INTERVAL_MS = 60_000;

export type SyncPhase = "off" | "idle" | "syncing" | "error";

export interface SyncState {
  phase: SyncPhase;
  lastSyncedAt: number; // epoch ms, 0 = never this session
  error: string;
}

// ── Reactive state store (for the SyncPanel UI) ───────────────────────────

let state: SyncState = { phase: "off", lastSyncedAt: 0, error: "" };
const listeners = new Set<() => void>();

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribeState(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const SERVER_STATE: SyncState = Object.freeze({
  phase: "off",
  lastSyncedAt: 0,
  error: "",
});

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    subscribeState,
    () => state,
    () => SERVER_STATE
  );
}

// ── Engine internals ──────────────────────────────────────────────────────

let started = false;
let pat = "";
let etag = "";
let inFlight = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let unsubEntries: (() => void) | null = null;
// Signature of the entry map we believe currently lives on the remote gist.
// Drives both the push decision (push when local differs from this) and the
// debounce feedback guard (don't push when nothing diverges from remote).
let remoteKnownSignature = "";

function signature(entries: EntryMap): string {
  // Order-independent, includes timestamps so any real change shows up.
  return Object.keys(entries)
    .sort()
    .map((k) => `${k}:${entries[k].status}:${entries[k].updatedAt}`)
    .join("|");
}

async function doSync(): Promise<void> {
  if (!pat || inFlight) return;
  inFlight = true;
  setState({ phase: "syncing", error: "" });
  try {
    const local = getEntriesNow();

    // Pull (conditional via ETag). 304 → remote unchanged since last pull, so
    // our remoteKnownSignature still holds. A 200 gives us the authoritative
    // remote state to merge with and to measure divergence against.
    const remote = await loadEntriesFromGist(pat, etag || undefined);

    let merged = local;
    if (remote && !remote.notModified) {
      etag = remote.etag || etag;
      remoteKnownSignature = signature(remote.entries);
      merged = mergeEntries(local, remote.entries);
      // Apply the merge locally if it differs from what we have. This may fire
      // the local-change subscription, but the debounce guard below compares
      // against remoteKnownSignature, so it only schedules a push when the
      // merged result genuinely contains entries the remote still lacks.
      if (signature(merged) !== signature(local)) {
        applyEntries(merged);
      }
    } else if (remote && remote.etag) {
      etag = remote.etag;
    } else if (!remote) {
      // No gist exists yet — anything local is divergent and should be created.
      remoteKnownSignature = "";
    }

    // Push whenever our (merged) state differs from what the remote holds —
    // covers both a fresh local edit and a merge that produced local-only
    // entries the remote is missing. Skips no-op writes.
    const mergedSig = signature(merged);
    if (mergedSig !== remoteKnownSignature) {
      await saveEntriesToGist(pat, merged);
      remoteKnownSignature = mergedSig;
      etag = ""; // our PATCH changed the gist; force a fresh GET next poll
    }

    setState({ phase: "idle", lastSyncedAt: Date.now(), error: "" });
  } catch (err) {
    setState({
      phase: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    inFlight = false;
  }
}

function schedulePush() {
  if (!pat) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    // Only sync if local now diverges from what we believe is on the remote.
    if (signature(getEntriesNow()) === remoteKnownSignature) return;
    void doSync();
  }, PUSH_DEBOUNCE_MS);
}

function onVisible() {
  if (document.visibilityState === "visible") void doSync();
}
function onFocus() {
  void doSync();
}
function onOnline() {
  void doSync();
}

/** Begin auto-syncing with the given PAT. Idempotent. */
export function start(token: string): void {
  if (typeof window === "undefined") return;
  const trimmed = (token || "").trim();
  if (!trimmed) {
    stop();
    return;
  }
  if (started && trimmed === pat) return;
  // Restart cleanly if the PAT changed.
  if (started) stop();

  pat = trimmed;
  started = true;
  etag = "";
  // Unknown remote until the first pull; the initial reconcile sets it.
  remoteKnownSignature = "";
  setState({ phase: "idle", error: "" });

  // Initial reconcile.
  void doSync();

  // Local edits → debounced push.
  unsubEntries = subscribeEntries(schedulePush);

  // Background pulls.
  pollTimer = setInterval(() => void doSync(), POLL_INTERVAL_MS);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onFocus);
  window.addEventListener("online", onOnline);
}

/** Stop auto-syncing and tear down all listeners. */
export function stop(): void {
  started = false;
  pat = "";
  etag = "";
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (unsubEntries) {
    unsubEntries();
    unsubEntries = null;
  }
  if (typeof window !== "undefined") {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("online", onOnline);
  }
  setState({ phase: "off", error: "" });
}

/** Manual force-sync ("Sync now" button). */
export function syncNow(): void {
  if (pat) void doSync();
}

/**
 * Mount hook for the always-on <AutoSync /> component. Starts the engine from
 * the stored PAT (if any) and keeps it alive for the app's lifetime.
 */
export function useAutoSyncEngine(): void {
  useEffect(() => {
    const stored = getStoredPat();
    if (stored) start(stored);
    // Intentionally do NOT stop() on unmount — the engine is a singleton meant
    // to outlive any single mount. SyncPanel's start/stop drive lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
