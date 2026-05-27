import StatusFilteredJobs from "@/components/StatusFilteredJobs";
import { loadEveryJobWithRun } from "@/lib/loadRuns";

export default function AppliedPage() {
  // Server pre-loads the entire job universe; the client component below
  // filters it against the user's localStorage status map at runtime.
  const allJobs = loadEveryJobWithRun();
  return <StatusFilteredJobs status="applied" allJobs={allJobs} />;
}
