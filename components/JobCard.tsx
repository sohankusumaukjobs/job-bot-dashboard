import type { Job } from "@/lib/types";

function scoreColor(score: number): string {
  if (score >= 80) return "bg-accent/10 text-accent ring-1 ring-accent";
  if (score >= 60) return "bg-amber/10 text-amber ring-1 ring-amber";
  if (score >= 40) return "bg-orange-500/10 text-orange-400 ring-1 ring-orange-400";
  return "bg-red/10 text-red ring-1 ring-red";
}

export default function JobCard({ job }: { job: Job }) {
  const score =
    job.tailored_accuracy_score ?? job.accuracy_score ?? job.match_score ?? 0;
  const tier = job.recommendation_tier || "";
  const meta = [job.company, job.location, job.source]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="rounded-xl border border-white/5 bg-bg-card p-4 transition hover:border-white/10">
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
        {job.is_new && (
          <span className="rounded-full bg-accent-2/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent-2">
            New
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
    </article>
  );
}

function resumeHref(resumeFile: string): string {
  // job.resume_file is a path relative to the bot's state/ dir
  // (e.g. "resumes/20260527T1100/01_Acme_Engineer_82.docx"). The dashboard
  // serves the synced state tree under /state/ so the public URL is:
  //   /state/resumes/<run_id>/<file>.docx
  // For older runs that stored the path as "resumes/<file>.docx" without a
  // run_id, fall back to /state/<as-is> so they still work.
  const normalized = resumeFile.replace(/\\/g, "/").replace(/^\/+/, "");
  return `/state/${normalized}`;
}
