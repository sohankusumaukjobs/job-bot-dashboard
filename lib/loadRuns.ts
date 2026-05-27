import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { RunIndexEntry, RunSnapshot } from "./types";

// State JSONs are committed into the dashboard repo by the sync workflow.
// They live under public/state/ so Vercel also serves them (and the resume
// DOCXes alongside them) as static assets at /state/...
const STATE_RUNS_DIR = join(process.cwd(), "public", "state", "runs");

export function loadIndex(): RunIndexEntry[] {
  const indexPath = join(STATE_RUNS_DIR, "index.json");
  if (!existsSync(indexPath)) return [];
  try {
    const raw = JSON.parse(readFileSync(indexPath, "utf8"));
    const runs: RunIndexEntry[] = Array.isArray(raw?.runs) ? raw.runs : [];
    return runs.sort((a, b) => (b.run_id ?? "").localeCompare(a.run_id ?? ""));
  } catch {
    return [];
  }
}

export function loadRun(runId: string): RunSnapshot | null {
  const path = join(STATE_RUNS_DIR, `${runId}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as RunSnapshot;
  } catch {
    return null;
  }
}

export function loadBootstrap(): RunSnapshot | null {
  const path = join(STATE_RUNS_DIR, "bootstrap.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as RunSnapshot;
  } catch {
    return null;
  }
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

export function listAllSnapshotFiles(): string[] {
  if (!existsSync(STATE_RUNS_DIR)) return [];
  return readdirSync(STATE_RUNS_DIR).filter(
    (f) => f.endsWith(".json") && f !== "index.json"
  );
}
