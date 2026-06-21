"use client";

/**
 * Cross-device sync for the Applied/Interview/Rejected status map via a
 * private GitHub Gist.
 *
 * Design choices:
 *   • One Gist per user, identified by description "job-bot-dashboard-status".
 *   • PAT + Gist ID cached in localStorage so the user only enters the PAT
 *     once per browser. PAT needs the `gist` scope and nothing else.
 *   • "Save" overwrites the remote Gist with the local status map.
 *   • "Load" overwrites the local status map with the remote Gist (after
 *     a confirm if local has entries — see SyncPanel UI).
 *   • If the stored Gist ID is missing or 404s, we LIST the user's gists
 *     and adopt the first one whose description matches our marker. That
 *     way a second device only needs the PAT — it auto-discovers the gist.
 */

export const GIST_DESCRIPTION = "job-bot-dashboard-status (private sync)";
export const GIST_FILENAME = "job-bot-status.json";

const PAT_KEY = "job-bot-gist-pat";
const GIST_ID_KEY = "job-bot-gist-id";
const LAST_SYNC_KEY = "job-bot-gist-last-sync";

// ── localStorage accessors ────────────────────────────────────────────────

export function getStoredPat(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PAT_KEY) || "";
}
export function setStoredPat(pat: string): void {
  if (typeof window === "undefined") return;
  if (pat) localStorage.setItem(PAT_KEY, pat);
  else localStorage.removeItem(PAT_KEY);
}
export function getStoredGistId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(GIST_ID_KEY) || "";
}
export function setStoredGistId(id: string): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(GIST_ID_KEY, id);
  else localStorage.removeItem(GIST_ID_KEY);
}
export function getLastSync(): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(LAST_SYNC_KEY);
  return v ? Number(v) || 0 : 0;
}
function setLastSync(ts: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY, String(ts));
}

export function clearStoredCredentials(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PAT_KEY);
  localStorage.removeItem(GIST_ID_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}

// ── GitHub API plumbing ───────────────────────────────────────────────────

async function githubFetch(
  pat: string,
  path: string,
  init?: RequestInit
): Promise<any> {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.message || "";
    } catch {
      // ignore
    }
    if (res.status === 401) {
      throw new Error("PAT rejected (401). Check the token has `gist` scope.");
    }
    if (res.status === 403) {
      throw new Error(`GitHub 403 — ${detail || "rate limited or insufficient scope"}.`);
    }
    if (res.status === 404) {
      throw new Error("Gist not found (404).");
    }
    throw new Error(`GitHub ${res.status}: ${detail || res.statusText}`);
  }
  // 204 No Content has no body.
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Resolve which gist to write to:
 *   1. Try the cached gist id.
 *   2. Otherwise list the user's gists and find one matching our description.
 *   3. Return null if no existing gist — caller should CREATE one.
 */
async function resolveGistId(pat: string): Promise<string | null> {
  const stored = getStoredGistId();
  if (stored) {
    try {
      await githubFetch(pat, `/gists/${stored}`);
      return stored;
    } catch (err) {
      // Stored ID stale; fall through to search.
      console.warn("[gistSync] stored gist id rejected, searching:", err);
    }
  }
  const list = await githubFetch(pat, `/gists?per_page=100`);
  if (Array.isArray(list)) {
    const match = list.find(
      (g: { description?: string }) => g?.description === GIST_DESCRIPTION
    );
    if (match?.id) {
      setStoredGistId(match.id);
      return match.id;
    }
  }
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────

import type { JobStatus } from "./jobStatus";

export type RemoteStatusMap = Record<string, JobStatus>;

export interface SyncPayload {
  /** ISO timestamp of when this snapshot was written. */
  saved_at: string;
  /** Status map: jobKey → "applied" | "interview" | "rejected". */
  data: RemoteStatusMap;
  /** Schema version for forward-compat. */
  version: 1;
}

/**
 * Save the local status map to the remote gist (create or update).
 * Returns the gist id and the timestamp written.
 */
export async function saveToGist(
  pat: string,
  statusMap: RemoteStatusMap
): Promise<{ gistId: string; ts: number }> {
  if (!pat) throw new Error("GitHub PAT is required.");
  const ts = Date.now();
  const payload: SyncPayload = {
    saved_at: new Date(ts).toISOString(),
    version: 1,
    data: statusMap || {},
  };
  const content = JSON.stringify(payload, null, 2);

  let gistId = await resolveGistId(pat);
  if (gistId) {
    await githubFetch(pat, `/gists/${gistId}`, {
      method: "PATCH",
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        files: { [GIST_FILENAME]: { content } },
      }),
    });
  } else {
    const created = await githubFetch(pat, `/gists`, {
      method: "POST",
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: { [GIST_FILENAME]: { content } },
      }),
    });
    gistId = created?.id;
    if (!gistId) throw new Error("Gist creation succeeded but no id returned.");
    setStoredGistId(gistId);
  }
  setLastSync(ts);
  return { gistId: gistId!, ts };
}

/**
 * Load the remote status map. Returns null if no gist exists yet for this PAT.
 */
export async function loadFromGist(
  pat: string
): Promise<{ data: RemoteStatusMap; ts: number; gistId: string } | null> {
  if (!pat) throw new Error("GitHub PAT is required.");
  const gistId = await resolveGistId(pat);
  if (!gistId) return null;
  const gist = await githubFetch(pat, `/gists/${gistId}`);
  const file = gist?.files?.[GIST_FILENAME];
  if (!file?.content) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(file.content);
  } catch {
    throw new Error("Remote gist content is not valid JSON.");
  }
  // Accept both wrapped (v1) and bare-map (legacy) shapes.
  if (parsed && typeof parsed === "object" && "data" in (parsed as object)) {
    const p = parsed as SyncPayload;
    const ts = Date.parse(p.saved_at) || 0;
    setLastSync(Date.now());
    return { data: p.data || {}, ts, gistId };
  }
  setLastSync(Date.now());
  return {
    data: (parsed as RemoteStatusMap) || {},
    ts: 0,
    gistId,
  };
}

// ── v2 entries API (timestamped, used by the auto-sync engine) ────────────

import type { EntryMap } from "./jobStatus";

export interface SyncPayloadV2 {
  version: 2;
  /** ISO timestamp of when this snapshot was written. */
  saved_at: string;
  /** Per-key { status, updatedAt } so devices merge without clobbering. */
  entries: EntryMap;
}

/** Coerce any stored gist shape (v2 entries, v1 wrapped/bare map) → EntryMap. */
function coerceEntries(parsed: unknown): EntryMap {
  if (!parsed || typeof parsed !== "object") return {};
  const obj = parsed as Record<string, unknown>;

  // v2: { version: 2, entries: {...} }
  if (obj.version === 2 && obj.entries && typeof obj.entries === "object") {
    const out: EntryMap = {};
    for (const [k, v] of Object.entries(obj.entries as Record<string, unknown>)) {
      if (v && typeof v === "object" && "status" in (v as object)) {
        const e = v as { status?: unknown; updatedAt?: unknown };
        const status =
          e.status === "applied" || e.status === "interview" || e.status === "rejected"
            ? e.status
            : "";
        out[k] = { status, updatedAt: Number(e.updatedAt) || 0 };
      }
    }
    return out;
  }

  // v1: { data: {key: status} } OR a bare {key: status} map. updatedAt 0 so any
  // real v2 edit always wins.
  const map =
    "data" in obj && obj.data && typeof obj.data === "object"
      ? (obj.data as Record<string, unknown>)
      : obj;
  const out: EntryMap = {};
  for (const [k, v] of Object.entries(map)) {
    if (v === "applied" || v === "interview" || v === "rejected") {
      out[k] = { status: v, updatedAt: 0 };
    }
  }
  return out;
}

/** Save the local entry map to the remote gist (create or update). */
export async function saveEntriesToGist(
  pat: string,
  entries: EntryMap
): Promise<{ gistId: string; ts: number }> {
  if (!pat) throw new Error("GitHub PAT is required.");
  const ts = Date.now();
  const payload: SyncPayloadV2 = {
    version: 2,
    saved_at: new Date(ts).toISOString(),
    entries: entries || {},
  };
  const content = JSON.stringify(payload, null, 2);

  let gistId = await resolveGistId(pat);
  if (gistId) {
    await githubFetch(pat, `/gists/${gistId}`, {
      method: "PATCH",
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        files: { [GIST_FILENAME]: { content } },
      }),
    });
  } else {
    const created = await githubFetch(pat, `/gists`, {
      method: "POST",
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: { [GIST_FILENAME]: { content } },
      }),
    });
    gistId = created?.id;
    if (!gistId) throw new Error("Gist creation succeeded but no id returned.");
    setStoredGistId(gistId);
  }
  setLastSync(ts);
  return { gistId, ts };
}

export interface LoadEntriesResult {
  entries: EntryMap;
  gistId: string;
  /** Strong validator for cheap conditional polls (304 == no rate cost). */
  etag: string;
  /** True when the server returned 304 — caller should keep its prior data. */
  notModified: boolean;
}

/**
 * Load the remote entry map, optionally conditionally via an ETag. Returns
 * notModified=true on a 304 (no body), so a background poll on an unchanged
 * gist costs nothing against the authenticated rate limit.
 * Returns null when no gist exists yet for this PAT.
 */
export async function loadEntriesFromGist(
  pat: string,
  etag?: string
): Promise<LoadEntriesResult | null> {
  if (!pat) throw new Error("GitHub PAT is required.");
  const gistId = await resolveGistId(pat);
  if (!gistId) return null;

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${pat}`,
      ...(etag ? { "If-None-Match": etag } : {}),
    },
  });

  if (res.status === 304) {
    setLastSync(Date.now());
    return { entries: {}, gistId, etag: etag || "", notModified: true };
  }
  if (res.status === 401) {
    throw new Error("PAT rejected (401). Check the token has `gist` scope.");
  }
  if (!res.ok) {
    throw new Error(`GitHub ${res.status}: ${res.statusText}`);
  }

  const newEtag = res.headers.get("ETag") || "";
  const gist = await res.json();
  const file = gist?.files?.[GIST_FILENAME];
  setLastSync(Date.now());
  if (!file?.content) {
    return { entries: {}, gistId, etag: newEtag, notModified: false };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(file.content);
  } catch {
    throw new Error("Remote gist content is not valid JSON.");
  }
  return {
    entries: coerceEntries(parsed),
    gistId,
    etag: newEtag,
    notModified: false,
  };
}

/** Best-effort: how long ago we last synced, as a human string. */
export function lastSyncRelative(now = Date.now()): string {
  const ts = getLastSync();
  if (!ts) return "never";
  const delta = Math.max(0, now - ts);
  const sec = Math.floor(delta / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
