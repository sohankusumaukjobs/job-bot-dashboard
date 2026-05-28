import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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

function RunBlock({
  run,
  runLabel,
  delayMs,
}: {
  run: import("@/lib/types").RunSnapshot;
  runLabel: string;
  delayMs: number;
}) {
  // CSS-only mount fade-in. We INTENTIONALLY do not use IntersectionObserver
  // here: with the old useInView hook + a `rootMargin: "0px 0px -10% 0px"`
  // bottom inset, the first run block frequently rendered below the
  // "10% safe zone" at page load (the KPI row pushed it down on smaller
  // viewports) and stayed at opacity-0 until the user scrolled. The
  // animation already plays once per mount via the Tailwind keyframe,
  // gated by `motion-safe:` so reduced-motion users see static content.
  return (
    <div
      className="
        rounded-2xl border border-border/[0.06] bg-bg-elevated/40 p-4 sm:p-5
        motion-safe:animate-fade-rise
      "
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {/* Run meta row */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <span className="rounded-md bg-bg-elevated/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-ink">
          {runLabel}
        </span>
        <span className="font-mono text-ink-muted opacity-70">{run.run_id}</span>
        <Link
          href={`/runs/${run.run_id}`}
          className="inline-flex items-center gap-0.5 font-semibold text-primary transition hover:underline"
        >
          View run
          <ArrowUpRight size={12} strokeWidth={2.5} />
        </Link>
        <span className="ml-auto flex flex-wrap items-center gap-3 text-ink-muted">
          <span>
            <strong className="font-semibold text-success">
              {run.new_count ?? run.jobs.length}
            </strong>{" "}
            new
          </span>
          <span className="opacity-50">·</span>
          <span>
            <strong className="font-semibold text-ink">{run.returning_count ?? 0}</strong>{" "}
            returning
          </span>
          <span className="opacity-50">·</span>
          <span>
            <strong className="font-semibold text-warning">{run.total_scraped}</strong>{" "}
            scraped
          </span>
        </span>
      </div>

      {run.jobs.length === 0 ? (
        <p className="text-sm text-ink-muted">No new jobs in this run.</p>
      ) : (
        <div className="grid gap-3">
          {run.jobs.map((job, idx) => (
            <div
              key={`${run.run_id}-${job.apply_url || idx}`}
              className="motion-safe:animate-fade-rise"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <JobCard job={job} runId={run.run_id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DateSection({ group }: { group: DateGroup }) {
  return (
    <section className="mb-12">
      {/* ── Centered divider date heading ──────────────────────────────── */}
      <div className="mb-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/[0.12] to-transparent" />
        <div className="flex items-center gap-2 rounded-full border border-border/[0.08] bg-bg-elevated/40 px-4 py-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-muted">
          <span>{formatDate(group.date)}</span>
          <span className="text-ink-faint">·</span>
          <span className="text-success">{group.totalNew} new</span>
        </div>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/[0.12] to-transparent" />
      </div>

      {/* ── One sub-section per run within the date ─────────────────────── */}
      <div className="flex flex-col gap-5">
        {group.runs.map((run, runIdx) => (
          <RunBlock
            key={run.run_id}
            run={run}
            runLabel={`Run ${group.runs.length - runIdx}`}
            delayMs={runIdx * 80}
          />
        ))}
      </div>
    </section>
  );
}
