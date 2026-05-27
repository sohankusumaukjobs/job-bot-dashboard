"use client";
import { useState } from "react";
import type { Job } from "@/lib/types";
import {
  useJobStatus,
  STATUS_LABELS,
  STATUS_ICONS,
  type JobStatus,
} from "@/lib/jobStatus";

function scoreColor(score: number): string {
  if (score >= 80) return "bg-accent/10 text-accent ring-1 ring-accent";
  if (score >= 60) return "bg-amber/10 text-amber ring-1 ring-amber";
  if (score >= 40) return "bg-orange-500/10 text-orange-400 ring-1 ring-orange-400";
  return "bg-red/10 text-red ring-1 ring-red";
}

/** Stable anchor id for deep-linking to a specific job card. */
export function jobAnchor(job: Job, runId?: string): string {
  const key = job.apply_url || `${job.title}-${job.company}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(31, h) + key.charCodeAt(i);
    h |= 0;
  }
  const prefix = runId ? `run-${runId}-` : "";
  return `${prefix}job-${Math.abs(h).toString(36)}`;
}

export default function JobCard({
  job,
  runId,
}: {
  job: Job;
  /** The run this job belongs to — used to set an anchor id for deep-linking. */
  runId?: string;
}) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useJobStatus({
    apply_url: job.apply_url,
    title: job.title,
    company: job.company,
  });

  const score =
    job.tailored_accuracy_score ?? job.accuracy_score ?? job.match_score ?? 0;
  const tier = job.recommendation_tier || "";
  const meta = [job.company, job.location, job.source]
    .filter(Boolean)
    .join(" · ");

  function handleCopy() {
    if (!job.cold_email) return;
    navigator.clipboard.writeText(job.cold_email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Visual emphasis: dim rejected; subtle ring for applied/interview.
  const statusRing =
    status === "applied"
      ? "ring-1 ring-accent-2/40"
      : status === "interview"
      ? "ring-1 ring-amber/50"
      : status === "rejected"
      ? "opacity-60"
      : "";

  return (
    <article
      id={jobAnchor(job, runId)}
      className={`rounded-xl border border-white/5 bg-bg-card p-4 transition hover:border-white/10 ${statusRing}`}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">
            {job.title || "Untitled role"}
          </h3>
          <div className="mt-0.5 text-xs text-ink-muted">{meta}</div>
          {job.salary && (
            <div className="mt-1 text-xs font-semibold text-accent">
              {job.salary}
            </div>
          )}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold ${scoreColor(
            score
          )}`}
        >
          {score}
        </div>
      </div>

      {job.tailored_summary && (
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {job.tailored_summary}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {tier && (
          <span className="rounded-full bg-bg-surface px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {tier}
          </span>
        )}
        {job.quality_gate_passed && (
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
            ✅ Gate passed
          </span>
        )}
        {job.is_new && !status && (
          <span className="rounded-full bg-accent-2/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent-2">
            New
          </span>
        )}
        {status && (
          <span className="rounded-full bg-bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-ink">
            {STATUS_ICONS[status]} {STATUS_LABELS[status]}
          </span>
        )}
      </div>

      {(job.apply_url || job.resume_file) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-bg transition hover:bg-emerald-400"
            >
              Apply →
            </a>
          )}
          {job.resume_file && (
            <a
              href={resumeHref(job.resume_file)}
              download
              className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-bg-surface px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
            >
              📄 Download resume
            </a>
          )}
        </div>
      )}

      {/* ── Status selector ─────────────────────────────────────────── */}
      <StatusSelector status={status} onChange={setStatus} />

      {/* ── Cold email (collapsible) ─────────────────────────────────── */}
      {job.cold_email && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <button
            onClick={() => setEmailOpen((o) => !o)}
            className="flex w-full items-center gap-2 text-left text-xs font-semibold text-ink-muted transition hover:text-ink"
          >
            <span>{emailOpen ? "▾" : "▸"}</span>
            <span>✉️ Cold email</span>
            {!emailOpen && (
              <span className="ml-1 min-w-0 truncate font-normal italic opacity-60">
                {job.cold_email.slice(0, 70)}…
              </span>
            )}
          </button>

          {emailOpen && (
            <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-bg-surface">
              <pre className="max-h-72 overflow-y-auto p-3 font-sans text-xs leading-relaxed text-ink-muted whitespace-pre-wrap">
                {job.cold_email}
              </pre>
              <div className="flex items-center justify-end border-t border-white/5 px-3 py-1.5">
                <button
                  onClick={handleCopy}
                  className="text-[11px] font-semibold text-accent-2 transition hover:underline"
                >
                  {copied ? "✓ Copied!" : "📋 Copy to clipboard"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/** Pill button group for marking application status. */
function StatusSelector({
  status,
  onChange,
}: {
  status: JobStatus;
  onChange: (next: JobStatus) => void;
}) {
  const choices: { value: Exclude<JobStatus, "">; label: string; activeCls: string }[] = [
    {
      value: "applied",
      label: `${STATUS_ICONS.applied} Applied`,
      activeCls: "bg-accent-2/20 text-accent-2 border-accent-2/60",
    },
    {
      value: "interview",
      label: `${STATUS_ICONS.interview} Interview`,
      activeCls: "bg-amber/20 text-amber border-amber/60",
    },
    {
      value: "rejected",
      label: `${STATUS_ICONS.rejected} Rejected`,
      activeCls: "bg-red/20 text-red border-red/60",
    },
  ];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted/70">
        Status:
      </span>
      {choices.map((c) => {
        const active = status === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(active ? "" : c.value)}
            aria-pressed={active}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
              active
                ? c.activeCls
                : "border-white/10 bg-bg-surface text-ink-muted hover:border-white/30 hover:text-ink"
            }`}
          >
            {c.label}
          </button>
        );
      })}
      {status && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="ml-1 text-[11px] font-semibold text-ink-muted hover:text-ink"
          title="Clear status"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function resumeHref(resumeFile: string): string {
  const normalized = resumeFile.replace(/\\/g, "/").replace(/^\/+/, "");
  return `/state/${normalized}`;
}
