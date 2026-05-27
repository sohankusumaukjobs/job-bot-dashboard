import { notFound } from "next/navigation";
import JobCard from "@/components/JobCard";
import { loadIndex, loadRun } from "@/lib/loadRuns";

export const dynamic = "force-static";

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
      <header className="mb-6 border-b border-white/5 pb-4">
        <div className="font-mono text-xs text-ink-muted">{snapshot.run_id}</div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          {snapshot.run_date?.slice(0, 10)}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {snapshot.new_count ?? snapshot.jobs.length} new ·{" "}
          {snapshot.returning_count ?? 0} returning ·{" "}
          {snapshot.total_scraped ?? snapshot.jobs.length} scraped
        </p>
        {profile?.search_queries && profile.search_queries.length > 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            <span className="font-semibold">Searches:</span>{" "}
            {profile.search_queries.join(" · ")}
          </p>
        )}
      </header>

      {snapshot.jobs.length === 0 ? (
        <p className="text-ink-muted">No new jobs in this run.</p>
      ) : (
        <div className="grid gap-3">
          {snapshot.jobs.map((job, idx) => (
            <JobCard key={job.apply_url || idx} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
