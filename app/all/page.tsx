import AllJobsTable from "@/components/AllJobsTable";
import { loadAllJobsEver } from "@/lib/loadRuns";
import { flattenAllJobs } from "@/lib/groupByDate";

export default function AllJobsPage() {
  const snapshots = loadAllJobsEver();
  const rows = flattenAllJobs(snapshots);

  return (
    <div>
      <header className="mb-7">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
          All Jobs
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Every unique job ever scraped — including the bootstrap baseline.
          Deduplicated by URL; the earliest run a job appeared in is its{" "}
          <em>first-seen</em> date.
        </p>
      </header>

      <AllJobsTable rows={rows} />
    </div>
  );
}
