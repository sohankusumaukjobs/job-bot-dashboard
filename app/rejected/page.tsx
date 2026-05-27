import StatusFilteredJobs from "@/components/StatusFilteredJobs";
import { loadEveryJobWithRun } from "@/lib/loadRuns";

export default function RejectedPage() {
  const allJobs = loadEveryJobWithRun();
  return <StatusFilteredJobs status="rejected" allJobs={allJobs} />;
}
