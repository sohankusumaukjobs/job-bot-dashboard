import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import JobCard from "@/components/JobCard";
import { loadIndex, loadRun } from "@/lib/loadRuns";

export function generateStaticParams() {
  return loadIndex().map((entry) => ({ runId: entry.run_id }));
}

interface Props {
  params: Promise<{ runId: string }>;
}

export default async function RunPage({ params }: Props) {
  const { runId } = await params;
  const snapshot = loadRun(runId);
  if (!snapshot) notFound();

  const profile = snapshot.profile;
  return (
    <div>
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition hover:text-primary"
      >
        <ArrowLeft size={13} strokeWidth={2.5} />
        Back to Daily Feed
      </Link>

      <header className="mb-8 rounded-2xl border border-border/[0.06] bg-surface/40 p-6">
        <div className="font-mono text-xs text-ink-muted">{snapshot.run_id}</div>
        <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
          {snapshot.run_date?.slice(0, 10)}
        </h2>

        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-success/15 px-3 py-1 font-semibold text-success">
            {snapshot.new_count ?? snapshot.jobs.length} new
          </span>
          <span className="rounded-full bg-bg-elevated/70 px-3 py-1 font-semibold text-ink">
            {snapshot.returning_count ?? 0} returning
          </span>
          <span className="rounded-full bg-warning/15 px-3 py-1 font-semibold text-warning">
            {snapshot.total_scraped ?? snapshot.jobs.length} scraped
          </span>
        </div>

        {profile?.search_queries && profile.search_queries.length > 0 && (
          <p className="mt-4 text-xs text-ink-muted">
            <span className="font-semibold text-ink">Searches:</span>{" "}
            {profile.search_queries.join("  ·  ")}
          </p>
        )}
      </header>

      {snapshot.jobs.length === 0 ? (
        <p className="text-ink-muted">No new jobs in this run.</p>
      ) : (
        <div className="grid gap-3">
          {snapshot.jobs.map((job, idx) => (
            <div
              key={job.apply_url || idx}
              className="motion-safe:animate-fade-rise"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <JobCard job={job} runId={runId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
