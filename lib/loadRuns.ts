import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { RunIndexEntry, RunSnapshot } from "./types";

// State JSONs are committed into the dashboard repo by the sync workflow.
// They live under public/state/ so Vercel also serves them (and the resume
// DOCXes alongside them) as static assets at /state/...
const STATE_RUNS_DIR = join(process.cwd(), "public", "state", "runs");

/**
 * Parse a JSON file written by the bot, tolerating the invalid `NaN` /
 * `Infinity` literals that Python's default `json.dumps` produces when
 * `float('nan')` slips in (commonly from pandas/JobSpy's missing-value
 * sentinel). We replace those tokens with `null` *only* when the strict
 * parse fails — keeping the happy path zero-cost — and surface any other
 * failure to the build log so empty-dashboard regressions can't hide again.
 */
function readJsonResilient<T>(path: string, label: string): T | null {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    console.error(`[loadRuns] read failed for ${label} (${path}):`, err);
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (firstErr) {
    // Fall back: scrub bare NaN / Infinity / -Infinity tokens to null.
    // Word-boundary regex so we don't touch strings that happen to contain
    // "NaN" as part of a larger word.
    const scrubbed = raw
      .replace(/\bNaN\b/g, "null")
      .replace(/\b-?Infinity\b/g, "null");
    try {
      const parsed = JSON.parse(scrubbed) as T;
      console.warn(
        `[loadRuns] ${label} contained NaN/Infinity literals; sanitized on read. Fix upstream serializer.`
      );
      return parsed;
    } catch (secondErr) {
      console.error(
        `[loadRuns] JSON parse failed for ${label} (${path}). First error:`,
        firstErr,
        "After NaN scrub:",
        secondErr
      );
      return null;
    }
  }
}

export function loadIndex(): RunIndexEntry[] {
  const indexPath = join(STATE_RUNS_DIR, "index.json");
  if (!existsSync(indexPath)) return [];
  const raw = readJsonResilient<{ runs?: RunIndexEntry[] }>(indexPath, "index.json");
  const runs: RunIndexEntry[] = Array.isArray(raw?.runs) ? raw!.runs! : [];
  return runs.sort((a, b) => (b.run_id ?? "").localeCompare(a.run_id ?? ""));
}

export function loadRun(runId: string): RunSnapshot | null {
  const path = join(STATE_RUNS_DIR, `${runId}.json`);
  if (!existsSync(path)) return null;
  return readJsonResilient<RunSnapshot>(path, `run ${runId}`);
}

export function loadBootstrap(): RunSnapshot | null {
  const path = join(STATE_RUNS_DIR, "bootstrap.json");
  if (!existsSync(path)) return null;
  return readJsonResilient<RunSnapshot>(path, "bootstrap.json");
}

export function loadAllDailyRuns(): RunSnapshot[] {
  return loadIndex()
    .map((entry) => loadRun(entry.run_id))
    .filter((s): s is RunSnapshot => s !== null);
}

export function loadAllJobsEver(): RunSnapshot[] {
  // Same as daily, plus the bootstrap snapshot (which is excluded from daily index).
  const snapshots = loadAllDailyRuns();
  const bootstrap = loadBootstrap();
  if (bootstrap) snapshots.push(bootstrap);
  return snapshots;
}

/**
 * Flat list of every job we've ever seen, paired with the run it first
 * appeared in. Deduplicated by jobKey so the same posting from two runs
 * collapses to one entry. Used by the Applied/Interview/Rejected pages,
 * which filter this list client-side against localStorage.
 */
export function loadEveryJobWithRun(): {
  job: import("./types").Job;
  run_id: string;
  date: string;
}[] {
  const snapshots = loadAllJobsEver();
  const seen = new Map<
    string,
    { job: import("./types").Job; run_id: string; date: string }
  >();
  for (const snap of snapshots) {
    const date = (snap.run_date || "").slice(0, 10);
    for (const job of snap.jobs) {
      const key =
        (job.apply_url && job.apply_url.trim()) ||
        `${(job.title || "").toLowerCase()}|${(job.company || "").toLowerCase()}`;
      const existing = seen.get(key);
      if (
        !existing ||
        (job.first_seen_run_id && job.first_seen_run_id < existing.run_id)
      ) {
        seen.set(key, {
          job,
          run_id: job.first_seen_run_id || snap.run_id,
          date,
        });
      }
    }
  }
  return Array.from(seen.values());
}

export function listAllSnapshotFiles(): string[] {
  if (!existsSync(STATE_RUNS_DIR)) return [];
  return readdirSync(STATE_RUNS_DIR).filter(
    (f) => f.endsWith(".json") && f !== "index.json"
  );
}
