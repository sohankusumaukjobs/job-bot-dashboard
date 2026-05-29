"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
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

/** Compact date for tight mobile widths. */
function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
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
  return (
    <div
      className="
        rounded-2xl border border-border/[0.06] bg-bg-elevated/40 p-3.5 sm:p-5
        motion-safe:animate-fade-rise
      "
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {/* Run meta row — wraps cleanly on mobile; stats drop to their own line */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <span className="rounded-md bg-bg-elevated/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-ink">
          {runLabel}
        </span>
        {/* The long timestamp id is noise on phones — show from sm up only. */}
        <span className="hidden font-mono text-ink-muted opacity-70 sm:inline">
          {run.run_id}
        </span>
        <Link
          href={`/runs/${run.run_id}`}
          className="inline-flex items-center gap-0.5 font-semibold text-primary transition hover:underline"
        >
          View run
          <ArrowUpRight size={12} strokeWidth={2.5} />
        </Link>
        <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-ink-muted sm:ml-auto sm:w-auto">
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
        <div className="grid grid-cols-1 gap-3">
          {run.jobs.map((job, idx) => (
            <div
              key={`${run.run_id}-${job.apply_url || idx}`}
              className="min-w-0 motion-safe:animate-fade-rise"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <JobCard job={job} runId={run.run_id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DateSection({
  group,
  defaultOpen = false,
}: {
  group: DateGroup;
  /** Newest date opens by default; older dates start collapsed behind the arrow. */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const runCount = group.runs.length;

  return (
    <section className="mb-3 sm:mb-4">
      {/* ── Tappable date header (the pop-up arrow toggle) ─────────────── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="
          group flex w-full items-center gap-3 rounded-2xl
          border border-border/[0.06] bg-bg-elevated/40 px-3.5 py-3 text-left
          transition-colors hover:border-primary/30 hover:bg-bg-elevated/60
          active:scale-[0.995] sm:px-4
        "
      >
        {/* Rotating chevron — points right when closed, down when open. */}
        <span
          className={`
            grid h-7 w-7 shrink-0 place-items-center rounded-full
            bg-primary/10 text-primary transition-transform duration-300 ease-spring
            ${open ? "rotate-0" : "-rotate-90"}
          `}
        >
          <ChevronDown size={16} strokeWidth={2.5} />
        </span>

        <div className="min-w-0 flex-1">
          {/* Full date from sm up, short date on phones. */}
          <div className="truncate font-display text-sm font-bold text-ink sm:text-base">
            <span className="hidden sm:inline">{formatDate(group.date)}</span>
            <span className="sm:hidden">{formatDateShort(group.date)}</span>
          </div>
          <div className="text-2xs text-ink-muted">
            {runCount} run{runCount === 1 ? "" : "s"}
            {!open && (
              <>
                {" · "}
                <span className="font-semibold text-success">
                  {group.totalNew} new
                </span>{" "}
                — tap to open
              </>
            )}
          </div>
        </div>

        {/* New-count badge */}
        <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-2xs font-bold tabular-nums text-success">
          +{group.totalNew}
        </span>
      </button>

      {/* ── Expanded run list ─────────────────────────────────────────── */}
      {open && (
        <div className="mt-3 flex flex-col gap-3 sm:gap-4">
          {group.runs.map((run, runIdx) => (
            <RunBlock
              key={run.run_id}
              run={run}
              runLabel={`Run ${runCount - runIdx}`}
              delayMs={runIdx * 60}
            />
          ))}
        </div>
      )}
    </section>
  );
}
