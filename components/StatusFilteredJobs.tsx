"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import JobCard from "./JobCard";
import EmptyState from "./EmptyState";
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

const STATUS_TONE: Record<
  Exclude<JobStatus, "">,
  { fg: string; bg: string }
> = {
  applied:   { fg: "#22C55E", bg: "rgba(34,197,94,0.16)" },
  interview: { fg: "#F59E0B", bg: "rgba(245,158,11,0.16)" },
  rejected:  { fg: "#EF4444", bg: "rgba(239,68,68,0.16)" },
};

/**
 * Renders all jobs currently marked with the given status (from localStorage).
 * Server pre-loads the full job universe; we filter client-side because the
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
    const matching = allJobs.filter(
      ({ job }) => statusMap[jobKey(job)] === status
    );
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
  const tone = STATUS_TONE[status];

  return (
    <div>
      <header className="mb-7">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-2xl text-lg"
            style={{ background: tone.bg, color: tone.fg }}
            aria-hidden="true"
          >
            {icon}
          </span>
          <div>
            <h2 className="flex items-baseline gap-3 font-display text-3xl font-bold tracking-tight text-ink">
              {label}
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums"
                style={{ background: tone.bg, color: tone.fg }}
              >
                {filtered.length}
              </span>
            </h2>
            <p className="mt-1 max-w-xl text-sm text-ink-muted">
              Jobs you marked as <strong className="text-ink">{label.toLowerCase()}</strong>.
              Tracked per browser via localStorage — use the{" "}
              <strong className="text-ink">☁️ Sync</strong> button in the header
              to back this list up to a private GitHub Gist.
            </p>
          </div>
        </div>
      </header>

      {allJobs.length > 0 && (
        <div className="mb-5 max-w-md">
          <div className="search-pill flex w-full">
            <Search size={15} strokeWidth={2} className="text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by title, company, location…"
              className="text-sm"
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={`No ${label.toLowerCase()} jobs yet`}
          body={
            <>
              Open the{" "}
              <Link href="/" className="text-primary hover:underline">
                Daily feed
              </Link>{" "}
              or{" "}
              <Link href="/all" className="text-primary hover:underline">
                All Jobs
              </Link>{" "}
              and tap{" "}
              <strong className="text-ink">
                {icon} {label}
              </strong>{" "}
              on any card to add it here.
            </>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(({ job, run_id }, idx) => (
            <div
              key={`${run_id}-${job.apply_url || idx}`}
              className="min-w-0 motion-safe:animate-fade-rise"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <JobCard job={job} runId={run_id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
