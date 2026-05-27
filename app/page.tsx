import DateSection from "@/components/DateSection";
import Stats from "@/components/Stats";
import { loadAllDailyRuns } from "@/lib/loadRuns";
import { groupByDate } from "@/lib/groupByDate";

// Server component reads from the file system at build time; Next.js SSGs it
// automatically. We don't need `dynamic = "force-static"` and removing it
// avoids an edge-cache interaction that prevented Vercel from re-rendering
// the page when new state JSONs landed in `public/state/`.

export default function DailyPage() {
  const snapshots = loadAllDailyRuns();
  const groups = groupByDate(snapshots);

  const totalRuns = snapshots.length;
  const totalNewAllTime = snapshots.reduce(
    (acc, s) => acc + (s.new_count ?? s.jobs.length),
    0
  );
  const totalScrapedAllTime = snapshots.reduce(
    (acc, s) => acc + (s.total_scraped ?? s.jobs.length),
    0
  );
  const latestRunDate = snapshots[0]?.run_date?.slice(0, 10);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Daily Job Feed
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Each section below is one day's results. Only genuinely new jobs (not
          seen in any earlier run) appear here. Looking for everything ever
          scraped? See the{" "}
          <a href="/all" className="text-accent-2 hover:underline">
            All Jobs
          </a>{" "}
          tab.
        </p>
      </header>

      <Stats
        totalRuns={totalRuns}
        totalNewAllTime={totalNewAllTime}
        totalScrapedAllTime={totalScrapedAllTime}
        latestRunDate={latestRunDate}
      />

      {groups.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-bg-card p-8 text-center">
          <p className="text-ink-muted">
            No runs yet. Once the job-bot pushes its first <code>state/runs/*.json</code>{" "}
            file, this page will populate automatically.
          </p>
        </div>
      ) : (
        groups.map((group) => <DateSection key={group.date} group={group} />)
      )}
    </div>
  );
}
