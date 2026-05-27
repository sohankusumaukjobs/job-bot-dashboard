import AllJobsTable from "@/components/AllJobsTable";
import { loadAllJobsEver } from "@/lib/loadRuns";
import { flattenAllJobs } from "@/lib/groupByDate";

export const dynamic = "force-static";

export default function AllJobsPage() {
  const snapshots = loadAllJobsEver();
  const rows = flattenAllJobs(snapshots);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">All Jobs</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every unique job ever scraped — including the bootstrap baseline.
          Deduplicated by URL; the earliest run a job appeared in is its{" "}
          <em>first-seen</em> date.
        </p>
      </header>

      <AllJobsTable rows={rows} />
    </div>
  );
}
