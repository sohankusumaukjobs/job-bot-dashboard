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

const STORAGE_KEY = "job-bot-status-v1";

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

// ── External store plumbing ───────────────────────────────────────────────
// We use useSyncExternalStore so toggling status in one JobCard re-renders
// every other JobCard + the Nav counts immediately, even across pages.

type StatusMap = Record<string, JobStatus>;

let cachedMap: StatusMap = {};
let cacheVersion = 0;
let hydrated = false;

const subscribers = new Set<() => void>();

function readFromStorage(): StatusMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  cachedMap = readFromStorage();
  cacheVersion++;
  hydrated = true;
  // Sync across tabs.
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      cachedMap = readFromStorage();
      cacheVersion++;
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

function getServerSnapshotMap(): StatusMap {
  return {};
}

function persist(next: StatusMap) {
  cachedMap = next;
  cacheVersion++;
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
    const current = getSnapshotMap();
    const updated = { ...current };
    if (!next) {
      delete updated[key];
    } else {
      updated[key] = next;
    }
    persist(updated);
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

// ── Imperative helpers (used by cloud sync) ───────────────────────────────

/** Non-hook snapshot of the current status map — for "Save to cloud". */
export function readStatusMapNow(): StatusMap {
  hydrate();
  return { ...cachedMap };
}

/** Replace the entire status map (used after "Load from cloud"). */
export function replaceStatusMap(next: StatusMap): void {
  hydrate();
  // Defensively coerce: only keep entries that look like valid statuses.
  const sanitized: StatusMap = {};
  if (next && typeof next === "object") {
    for (const [k, v] of Object.entries(next)) {
      if (v === "applied" || v === "interview" || v === "rejected") {
        sanitized[k] = v;
      }
    }
  }
  persist(sanitized);
}

/**
 * Merge a remote map into the local one (used by smart Load).
 * On conflict, the remote value wins — caller is expected to have decided
 * whether remote is fresher already.
 */
export function mergeStatusMap(remote: StatusMap): void {
  hydrate();
  const next: StatusMap = { ...cachedMap };
  if (remote && typeof remote === "object") {
    for (const [k, v] of Object.entries(remote)) {
      if (v === "applied" || v === "interview" || v === "rejected") {
        next[k] = v;
      } else if (v === "" || v === null || v === undefined) {
        delete next[k];
      }
    }
  }
  persist(next);
}
