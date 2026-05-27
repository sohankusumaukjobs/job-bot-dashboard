import type { RunSnapshot } from "./types";

export interface DateGroup {
  date: string;             // YYYY-MM-DD
  runs: RunSnapshot[];      // ordered desc by run_id
  totalNew: number;
}

export function groupByDate(snapshots: RunSnapshot[]): DateGroup[] {
  const map = new Map<string, RunSnapshot[]>();
  for (const snap of snapshots) {
    if (snap.is_bootstrap) continue; // Daily view excludes bootstrap
    const date = (snap.run_date || "").slice(0, 10);
    if (!date) continue;
    const list = map.get(date) ?? [];
    list.push(snap);
    map.set(date, list);
  }
  const groups: DateGroup[] = [];
  for (const [date, runs] of map.entries()) {
    runs.sort((a, b) => (b.run_id ?? "").localeCompare(a.run_id ?? ""));
    const totalNew = runs.reduce((acc, r) => acc + (r.new_count ?? r.jobs.length), 0);
    groups.push({ date, runs, totalNew });
  }
  groups.sort((a, b) => b.date.localeCompare(a.date));
  return groups;
}

export function flattenAllJobs(snapshots: RunSnapshot[]) {
  // Deduplicate by apply_url || title|company across snapshots, keeping the
  // earliest first_seen_run_id we encounter.
  const seen = new Map<string, { job: import("./types").Job; from_run: string; date: string }>();
  for (const snap of snapshots) {
    const date = (snap.run_date || "").slice(0, 10);
    for (const job of snap.jobs) {
      const key =
        (job.apply_url && job.apply_url.trim()) ||
        `${(job.title || "").toLowerCase()}|${(job.company || "").toLowerCase()}|${(job.location || "").toLowerCase()}`;
      const existing = seen.get(key);
      if (!existing || (job.first_seen_run_id && job.first_seen_run_id < existing.from_run)) {
        seen.set(key, { job, from_run: job.first_seen_run_id || snap.run_id, date });
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    (b.from_run || "").localeCompare(a.from_run || "")
  );
}
