"use client";
import { useState } from "react";
import {
  ExternalLink,
  Download,
  Mail,
  FileText,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { Job } from "@/lib/types";
import {
  useJobStatus,
  STATUS_LABELS,
  STATUS_ICONS,
  type JobStatus,
} from "@/lib/jobStatus";

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

/** First letter(s) of a company name for the avatar fallback. */
function initials(name?: string): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

/** Deterministic hue per company name, for variety in the avatar bg. */
function avatarHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function statusAccentClass(status: JobStatus, isNew?: boolean): string {
  // 3px left bar that signals the card's state at-a-glance.
  if (status === "applied")   return "before:bg-success";
  if (status === "interview") return "before:bg-warning";
  if (status === "rejected")  return "before:bg-danger";
  if (isNew)                  return "before:bg-primary";
  return "before:bg-ink-faint/40";
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
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterCopied, setLetterCopied] = useState(false);
  const [status, setStatus] = useJobStatus({
    apply_url: job.apply_url,
    title: job.title,
    company: job.company,
  });

  const score =
    job.tailored_accuracy_score ?? job.accuracy_score ?? job.match_score ?? 0;
  const tier = job.recommendation_tier || "";
  const company = job.company || "";

  function handleCopy() {
    if (!job.cold_email) return;
    navigator.clipboard.writeText(job.cold_email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCopyLetter() {
    if (!job.cover_letter) return;
    navigator.clipboard.writeText(job.cover_letter).then(() => {
      setLetterCopied(true);
      setTimeout(() => setLetterCopied(false), 2000);
    });
  }

  // Dim rejected so the eye skips it.
  const dim = status === "rejected" ? "opacity-65" : "";

  // Show up to 5 skill chips for visual balance.
  const skills = (job.tailored_skills && job.tailored_skills.length
    ? job.tailored_skills
    : job.ats_keyword_matches ?? []
  )
    .slice(0, 5);

  return (
    <article
      id={jobAnchor(job, runId)}
      className={`
        group relative overflow-hidden rounded-xl border border-border/[0.06]
        bg-surface p-4 shadow-card transition-all duration-200 ease-out
        hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-lit
        before:absolute before:left-0 before:top-0 before:h-full before:w-[3px]
        before:rounded-l-xl sm:p-5 ${statusAccentClass(status, job.is_new)} ${dim}
      `}
    >
      {/* ── Top row: company avatar + title + score badge ─────────────── */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
          style={{
            background: `linear-gradient(135deg, hsl(${avatarHue(company)} 70% 55%), hsl(${(avatarHue(company) + 45) % 360} 75% 45%))`,
          }}
          aria-hidden="true"
        >
          {initials(company)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[0.975rem] font-bold leading-tight tracking-tight text-ink sm:text-[1.0625rem]">
            {job.title || "Untitled role"}
          </h3>
          <div className="mt-1 break-words text-[13px] text-ink-muted sm:truncate sm:text-sm">
            {[job.company, job.location, job.source]
              .filter(Boolean)
              .join("  ·  ")}
          </div>
          {job.salary && (
            <div className="mt-1.5 text-xs font-semibold text-success">
              {job.salary}
            </div>
          )}
        </div>

        {/* Gradient score badge */}
        <div className="shrink-0">
          <div
            className="
              flex h-11 w-11 items-center justify-center rounded-full
              bg-score-gradient text-white shadow-glow tabular-nums
              sm:h-12 sm:w-12
            "
          >
            <span className="font-display text-sm font-bold leading-none sm:text-base">
              {score}
            </span>
          </div>
          <div className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Match
          </div>
        </div>
      </div>

      {/* ── Description / summary ─────────────────────────────────────── */}
      {job.tailored_summary && (
        <div className="relative mt-4">
          <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted">
            {job.tailored_summary}
          </p>
          {/* Soft fade at bottom of clamp */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-surface to-transparent" />
        </div>
      )}

      {/* ── Status / tier / gate chips ────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tier && (
          <span className="chip" style={{ background: "rgba(123,97,255,0.12)", color: "#7B61FF" }}>
            <Sparkles size={11} strokeWidth={2.25} />
            {tier}
          </span>
        )}
        {job.quality_gate_passed && (
          <span className="chip" style={{ background: "rgba(34,197,94,0.14)", color: "#22C55E" }}>
            <ShieldCheck size={11} strokeWidth={2.25} />
            Gate Passed
          </span>
        )}
        {job.is_new && !status && (
          <span className="chip" style={{ background: "rgba(79,156,249,0.14)", color: "#4F9CF9" }}>
            New
          </span>
        )}
        {status && (
          <span
            className="chip"
            style={{
              background:
                status === "applied"
                  ? "rgba(34,197,94,0.16)"
                  : status === "interview"
                  ? "rgba(245,158,11,0.16)"
                  : "rgba(239,68,68,0.16)",
              color:
                status === "applied"
                  ? "#22C55E"
                  : status === "interview"
                  ? "#F59E0B"
                  : "#EF4444",
            }}
          >
            <span>{STATUS_ICONS[status]}</span>
            {STATUS_LABELS[status]}
          </span>
        )}
      </div>

      {/* ── Skill chips ───────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* ── Action row — buttons split full-width on mobile for easy taps ── */}
      {(job.apply_url || job.resume_file || job.cover_letter_file) && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary h-10 flex-1 sm:h-9 sm:flex-none"
            >
              Apply
              <ExternalLink size={14} strokeWidth={2.25} />
            </a>
          )}
          {job.resume_file && (
            <a
              href={resumeHref(job.resume_file)}
              download
              className="btn-ghost h-10 flex-1 sm:h-9 sm:flex-none"
            >
              <Download size={14} strokeWidth={2.25} />
              Resume
            </a>
          )}
          {job.cover_letter_file && (
            <a
              href={resumeHref(job.cover_letter_file)}
              download
              className="btn-ghost h-10 flex-1 sm:h-9 sm:flex-none"
              style={{ color: "rgb(var(--violet))", borderColor: "rgba(123,97,255,0.35)" }}
            >
              <FileText size={14} strokeWidth={2.25} />
              Letter
            </a>
          )}
        </div>
      )}

      {/* ── Status selector ───────────────────────────────────────────── */}
      <StatusSelector status={status} onChange={setStatus} />

      {/* ── Cold email (collapsible) ──────────────────────────────────── */}
      {job.cold_email && (
        <div className="mt-4 border-t border-border/[0.06] pt-3">
          <button
            onClick={() => setEmailOpen((o) => !o)}
            className="flex w-full items-center gap-2 text-left text-xs font-semibold text-ink-muted transition hover:text-ink"
          >
            <Mail size={13} strokeWidth={2.25} />
            <span>Cold email</span>
            {!emailOpen && (
              <span className="ml-1 min-w-0 truncate font-normal italic text-ink-faint">
                {job.cold_email.slice(0, 70)}…
              </span>
            )}
            <ChevronDown
              size={13}
              className={`ml-auto shrink-0 transition-transform duration-200 ${emailOpen ? "rotate-180" : ""}`}
            />
          </button>

          {emailOpen && (
            <div className="mt-2 overflow-hidden rounded-lg border border-border/[0.08] bg-bg-elevated/60">
              <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap p-3 font-sans text-xs leading-relaxed text-ink-muted">
                {job.cold_email}
              </pre>
              <div className="flex items-center justify-end border-t border-border/[0.06] px-3 py-1.5">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-primary transition hover:underline"
                >
                  {copied ? (
                    <>
                      <Check size={12} strokeWidth={2.5} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} strokeWidth={2.25} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Cover letter (collapsible — humanized, longer than cold email) ── */}
      {job.cover_letter && (
        <div className="mt-3 border-t border-border/[0.06] pt-3">
          <button
            onClick={() => setLetterOpen((o) => !o)}
            className="flex w-full items-center gap-2 text-left text-xs font-semibold text-ink-muted transition hover:text-ink"
          >
            <FileText
              size={13}
              strokeWidth={2.25}
              className="text-violet"
            />
            <span>Cover letter</span>
            {!letterOpen && (
              <span className="ml-1 min-w-0 truncate font-normal italic text-ink-faint">
                {job.cover_letter.slice(0, 70)}…
              </span>
            )}
            <ChevronDown
              size={13}
              className={`ml-auto shrink-0 transition-transform duration-200 ${letterOpen ? "rotate-180" : ""}`}
            />
          </button>

          {letterOpen && (
            <div
              className="mt-2 overflow-hidden rounded-lg border bg-bg-elevated/60"
              style={{ borderColor: "rgba(123,97,255,0.25)" }}
            >
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap p-3 font-sans text-xs leading-relaxed text-ink-muted">
                {job.cover_letter}
              </pre>
              <div className="flex items-center justify-end border-t border-border/[0.06] px-3 py-1.5">
                <button
                  onClick={handleCopyLetter}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-violet transition hover:underline"
                >
                  {letterCopied ? (
                    <>
                      <Check size={12} strokeWidth={2.5} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} strokeWidth={2.25} />
                      Copy
                    </>
                  )}
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
  const choices: {
    value: Exclude<JobStatus, "">;
    label: string;
    activeBg: string;
    activeColor: string;
  }[] = [
    {
      value: "applied",
      label: `${STATUS_ICONS.applied} Applied`,
      activeBg: "rgba(34,197,94,0.16)",
      activeColor: "#22C55E",
    },
    {
      value: "interview",
      label: `${STATUS_ICONS.interview} Interview`,
      activeBg: "rgba(245,158,11,0.16)",
      activeColor: "#F59E0B",
    },
    {
      value: "rejected",
      label: `${STATUS_ICONS.rejected} Rejected`,
      activeBg: "rgba(239,68,68,0.16)",
      activeColor: "#EF4444",
    },
  ];

  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        Status
      </span>
      {choices.map((c) => {
        const active = status === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(active ? "" : c.value)}
            aria-pressed={active}
            className={`
              rounded-full border px-2.5 py-0.5 text-[11px] font-semibold
              transition-all duration-150 ease-spring
              ${active ? "" : "border-border/[0.10] bg-bg-elevated/60 text-ink-muted hover:border-border/[0.25] hover:text-ink"}
            `}
            style={
              active
                ? {
                    background: c.activeBg,
                    color: c.activeColor,
                    borderColor: `${c.activeColor}99`,
                  }
                : undefined
            }
          >
            {c.label}
          </button>
        );
      })}
      {status && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="ml-1 text-[10px] font-semibold text-ink-muted hover:text-danger"
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
