import Link from "next/link";
import JobCard from "./JobCard";
import type { DateGroup } from "@/lib/groupByDate";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DateSection({ group }: { group: DateGroup }) {
  return (
    <section className="mb-10">
      {/* ── Date heading ───────────────────────────────────────────────── */}
      <h2 className="mb-4 flex items-baseline justify-between border-b border-white/10 pb-2">
        <span className="text-lg font-bold tracking-tight text-ink">
          {formatDate(group.date)}
        </span>
        <span className="text-xs font-semibold uppercase text-ink-muted">
          {group.totalNew} new
        </span>
      </h2>

      {/* ── One sub-section per run within the date ─────────────────────── */}
      <div className="flex flex-col gap-6">
        {group.runs.map((run, runIdx) => (
          <div
            key={run.run_id}
            className="rounded-xl border border-white/5 bg-bg-surface/40 p-4"
          >
            {/* Run meta row */}
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              <span className="rounded bg-bg-surface px-1.5 py-0.5 font-mono text-[11px]">
                Run {group.runs.length - runIdx}
              </span>
              <span className="font-mono opacity-60">{run.run_id}</span>
              <Link
                href={`/runs/${run.run_id}`}
                className="font-semibold text-accent-2 hover:underline"
              >
                View run →
              </Link>
              <span className="ml-auto">
                {run.new_count ?? run.jobs.length} new ·{" "}
                {run.returning_count ?? 0} returning ·{" "}
                {run.total_scraped} scraped
              </span>
            </div>

            {run.jobs.length === 0 ? (
              <p className="text-sm text-ink-muted">No new jobs in this run.</p>
            ) : (
              <div className="grid gap-3">
                {run.jobs.map((job, idx) => (
                  <JobCard
                    key={`${run.run_id}-${job.apply_url || idx}`}
                    job={job}
                    runId={run.run_id}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
