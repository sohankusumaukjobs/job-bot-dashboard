import Link from "next/link";
import JobCard from "./JobCard";
import type { DateGroup } from "@/lib/groupByDate";

function formatDate(iso: string): string {
  // iso is YYYY-MM-DD
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
      <h2 className="mb-2 flex items-baseline justify-between border-b border-white/5 pb-2">
        <span className="text-lg font-bold tracking-tight text-ink">
          {formatDate(group.date)}
        </span>
        <span className="text-xs font-semibold uppercase text-ink-muted">
          {group.totalNew} new
        </span>
      </h2>
      {group.runs.map((run) => (
        <div key={run.run_id} className="mb-6">
          <div className="mb-3 flex items-center gap-3 text-xs text-ink-muted">
            <span className="font-mono">{run.run_id}</span>
            <Link
              href={`/runs/${run.run_id}`}
              className="text-accent-2 hover:underline"
            >
              View run
            </Link>
            <span>
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
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
