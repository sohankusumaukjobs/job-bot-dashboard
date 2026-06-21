"use client";
import { useSyncExternalStore } from "react";

/** User-set application status for a job. Empty string = no status set. */
export type JobStatus = "applied" | "interview" | "rejected" | "";

export const STATUS_LABELS: Record<Exclude<JobStatus, "">, string> = {
  applied: "Applied",
  interview: "Interview",
  rejected: "Rejected",
};

export const STATUS_ICONS: Record<Exclude<JobStatus, "">, string> = {
  applied: "📨",
  interview: "🎤",
  rejected: "❌",
};

const STORAGE_KEY = "job-bot-status-v2";
const LEGACY_STORAGE_KEY = "job-bot-status-v1";

interface JobIdentity {
  apply_url?: string;
  title?: string;
  company?: string;
}

/** Stable key for a job — prefer apply_url, fall back to title|company. */
export function jobKey(job: JobIdentity): string {
  if (job.apply_url && job.apply_url.trim()) return job.apply_url.trim();
  return `${(job.title || "").toLowerCase().trim()}|${(job.company || "")
    .toLowerCase()
    .trim()}`;
}

// ── Data model ────────────────────────────────────────────────────────────
// Internally we track a per-entry timestamp so two devices can merge their
// edits without clobbering each other (field-level last-write-wins). An entry
// whose status is "" is a TOMBSTONE: an explicit clear that must propagate to
// other devices rather than be resurrected by a stale "applied" elsewhere.

export type StatusMap = Record<string, JobStatus>;

export interface StatusEntry {
  status: JobStatus; // "" == tombstone (cleared)
  updatedAt: number; // epoch ms
}
export type EntryMap = Record<string, StatusEntry>;

function isValidStatus(v: unknown): v is Exclude<JobStatus, ""> {
  return v === "applied" || v === "interview" || v === "rejected";
}

/**
 * Merge two entry maps by per-key last-write-wins (larger updatedAt wins).
 * Pure — used for both the local↔remote merge and tests.
 */
export function mergeEntries(a: EntryMap, b: EntryMap): EntryMap {
  const out: EntryMap = { ...a };
  for (const [k, entry] of Object.entries(b)) {
    const existing = out[k];
    if (!existing || entry.updatedAt >= existing.updatedAt) {
      out[k] = entry;
    }
  }
  return out;
}

/** Derive the public {key: status} map, dropping tombstones + bad values. */
function entriesToStatusMap(entries: EntryMap): StatusMap {
  const map: StatusMap = {};
  for (const [k, e] of Object.entries(entries)) {
    if (isValidStatus(e.status)) map[k] = e.status;
  }
  return map;
}

// ── External store plumbing ───────────────────────────────────────────────
// We use useSyncExternalStore so toggling status in one JobCard re-renders
// every other JobCard + the Nav counts immediately, even across pages.

let cachedEntries: EntryMap = {};
let cachedMap: StatusMap = {}; // derived from cachedEntries (no tombstones)
let hydrated = false;

const subscribers = new Set<() => void>();

function parseEntries(raw: string | null): EntryMap | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const out: EntryMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v && typeof v === "object" && "status" in (v as object)) {
        const e = v as { status?: unknown; updatedAt?: unknown };
        const status = (isValidStatus(e.status) ? e.status : "") as JobStatus;
        out[k] = { status, updatedAt: Number(e.updatedAt) || 0 };
      }
    }
    return out;
  } catch {
    return null;
  }
}

/** One-time migration of the legacy {key: status} map → entries (updatedAt 0). */
function migrateLegacy(): EntryMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: EntryMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      // updatedAt 0 so any real remote edit always wins over migrated data.
      if (isValidStatus(v)) out[k] = { status: v, updatedAt: 0 };
    }
    return out;
  } catch {
    return {};
  }
}

function readFromStorage(): EntryMap {
  if (typeof window === "undefined") return {};
  const fromV2 = parseEntries(localStorage.getItem(STORAGE_KEY));
  if (fromV2) return fromV2;
  // No v2 yet — migrate the legacy map (if any) and persist under v2.
  const migrated = migrateLegacy();
  if (Object.keys(migrated).length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    } catch {
      // ignore
    }
  }
  return migrated;
}

function recompute() {
  cachedMap = entriesToStatusMap(cachedEntries);
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  cachedEntries = readFromStorage();
  recompute();
  hydrated = true;
  // Sync across tabs.
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      cachedEntries = parseEntries(e.newValue) ?? {};
      recompute();
      subscribers.forEach((cb) => cb());
    }
  });
}

function subscribe(cb: () => void): () => void {
  hydrate();
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function getSnapshotMap(): StatusMap {
  hydrate();
  return cachedMap;
}

// Must be a STABLE reference. Returning a fresh `{}` each call makes
// useSyncExternalStore throw "getServerSnapshot should be cached to avoid an
// infinite loop" and can abort hydration for the whole client tree — which
// silently breaks every onClick on the page (collapsible toggles, status
// buttons, etc.). One frozen empty map keeps the server snapshot identity-stable.
const EMPTY_MAP: StatusMap = Object.freeze({}) as StatusMap;

function getServerSnapshotMap(): StatusMap {
  return EMPTY_MAP;
}

/** Persist entries to storage + recompute the derived map + notify. */
function persistEntries(next: EntryMap) {
  cachedEntries = next;
  recompute();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage quota / disabled — silently ignore; UI still reflects in-memory state.
    }
  }
  subscribers.forEach((cb) => cb());
}

// ── Public API ────────────────────────────────────────────────────────────

/** Get the current status of a job (re-runs when any status changes). */
export function useJobStatus(
  job: JobIdentity
): [JobStatus, (next: JobStatus) => void] {
  const key = jobKey(job);
  const map = useSyncExternalStore(
    subscribe,
    getSnapshotMap,
    getServerSnapshotMap
  );
  const status: JobStatus = (map[key] as JobStatus) || "";

  const setStatus = (next: JobStatus) => {
    hydrate();
    const updated: EntryMap = { ...cachedEntries };
    // Clearing a status keeps a tombstone (status "") with a fresh timestamp so
    // the clear propagates to other devices instead of being undone by a merge.
    updated[key] = { status: next || "", updatedAt: Date.now() };
    persistEntries(updated);
  };

  return [status, setStatus];
}

/** Read the full status map reactively (used by Nav counts + filter pages). */
export function useStatusMap(): StatusMap {
  return useSyncExternalStore(subscribe, getSnapshotMap, getServerSnapshotMap);
}

/** Convenience: how many jobs currently carry the given status. */
export function useStatusCount(status: Exclude<JobStatus, "">): number {
  const map = useStatusMap();
  let n = 0;
  for (const k in map) if (map[k] === status) n++;
  return n;
}

// ── Imperative helpers (used by the auto-sync engine) ─────────────────────

/** Non-hook snapshot of the current status map (tombstones excluded). */
export function readStatusMapNow(): StatusMap {
  hydrate();
  return { ...cachedMap };
}

/** Non-hook snapshot of the full entry map (tombstones included). */
export function getEntriesNow(): EntryMap {
  hydrate();
  return { ...cachedEntries };
}

/**
 * Subscribe to any change of the entry map (local edits or cross-tab/remote
 * applies). Returns an unsubscribe fn. Used by the sync engine to debounce
 * pushes. Does NOT fire for the initial value.
 */
export function subscribeEntries(cb: () => void): () => void {
  return subscribe(cb);
}

/** Replace the full entry map (used by the engine after a merge). */
export function applyEntries(next: EntryMap): void {
  hydrate();
  const sanitized: EntryMap = {};
  for (const [k, v] of Object.entries(next || {})) {
    if (v && typeof v === "object") {
      const status = (isValidStatus(v.status) ? v.status : "") as JobStatus;
      sanitized[k] = { status, updatedAt: Number(v.updatedAt) || 0 };
    }
  }
  persistEntries(sanitized);
}

/**
 * Replace the entire status map (used after a destructive "Load from cloud").
 * Stamps each entry now. Kept for back-compat with older callers.
 */
export function replaceStatusMap(next: StatusMap): void {
  hydrate();
  const now = Date.now();
  const entries: EntryMap = {};
  if (next && typeof next === "object") {
    for (const [k, v] of Object.entries(next)) {
      if (isValidStatus(v)) entries[k] = { status: v, updatedAt: now };
    }
  }
  persistEntries(entries);
}

/**
 * Merge a remote {key: status} map into the local entries (back-compat helper).
 * Remote values are stamped now so they win. Empty/null clears (tombstone).
 */
export function mergeStatusMap(remote: StatusMap): void {
  hydrate();
  const now = Date.now();
  const next: EntryMap = { ...cachedEntries };
  if (remote && typeof remote === "object") {
    for (const [k, v] of Object.entries(remote)) {
      if (isValidStatus(v)) {
        next[k] = { status: v, updatedAt: now };
      } else if (v === "" || v === null || v === undefined) {
        next[k] = { status: "", updatedAt: now };
      }
    }
  }
  persistEntries(next);
}
