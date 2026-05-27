import StatusFilteredJobs from "@/components/StatusFilteredJobs";
import { loadEveryJobWithRun } from "@/lib/loadRuns";

export default function InterviewPage() {
  const allJobs = loadEveryJobWithRun();
  return <StatusFilteredJobs status="interview" allJobs={allJobs} />;
}
