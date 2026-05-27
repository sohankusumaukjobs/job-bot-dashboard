"use client";
import { useMemo, useState } from "react";
import JobCard from "./JobCard";
import type { Job } from "@/lib/types";
import {
  useStatusMap,
  jobKey,
  STATUS_LABELS,
  STATUS_ICONS,
  type JobStatus,
} from "@/lib/jobStatus";

interface JobWithRun {
  job: Job;
  run_id: string;
  date: string;
}

/**
 * Renders all jobs currently marked with the given status (from localStorage).
 * The server passes the full job universe; we filter client-side because the
 * status data only lives in the user's browser.
 */
export default function StatusFilteredJobs({
  status,
  allJobs,
}: {
  status: Exclude<JobStatus, "">;
  allJobs: JobWithRun[];
}) {
  const statusMap = useStatusMap();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const matching = allJobs.filter(({ job }) => statusMap[jobKey(job)] === status);
    const q = query.trim().toLowerCase();
    if (!q) return matching;
    return matching.filter(({ job }) =>
      [job.title, job.company, job.location, job.source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [allJobs, statusMap, status, query]);

  const label = STATUS_LABELS[status];
  const icon = STATUS_ICONS[status];

  return (
    <div>
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
          <span>{icon}</span>
          <span>{label} jobs</span>
          <span className="ml-2 rounded-full bg-bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
            {filtered.length}
          </span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Jobs you marked as <strong className="text-ink">{label.toLowerCase()}</strong>.
          Tracked per browser via localStorage — clear your site data and they go
          away. Toggle the status on any job card to add or remove.
        </p>
      </header>

      {allJobs.length > 0 && (
        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, company, location…"
            className="w-full rounded-md border border-white/10 bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-accent focus:outline-none"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-bg-card p-8 text-center">
          <p className="text-ink-muted">
            No {label.toLowerCase()} jobs yet. Open the{" "}
            <a href="/" className="text-accent-2 hover:underline">
              Daily feed
            </a>{" "}
            or{" "}
            <a href="/all" className="text-accent-2 hover:underline">
              All Jobs
            </a>{" "}
            and tap <strong className="text-ink">{icon} {label}</strong> on any card.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(({ job, run_id }, idx) => (
            <JobCard
              key={`${run_id}-${job.apply_url || idx}`}
              job={job}
              runId={run_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
