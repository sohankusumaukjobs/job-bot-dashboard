import DateSection from "@/components/DateSection";
import EmptyState from "@/components/EmptyState";
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
      <header className="mb-5">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Daily Job Feed
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-snug text-ink-muted">
          One section per day. Only genuinely new jobs appear here —{" "}
          <a href="/all" className="text-primary hover:underline">
            View All Jobs &rarr;
          </a>
        </p>
      </header>

      <Stats
        totalRuns={totalRuns}
        totalNewAllTime={totalNewAllTime}
        totalScrapedAllTime={totalScrapedAllTime}
        latestRunDate={latestRunDate}
      />

      {groups.length === 0 ? (
        <EmptyState
          title="No runs yet"
          body={
            <>
              Once the job-bot pushes its first{" "}
              <code className="rounded bg-bg-elevated px-1 py-0.5 text-[11px]">
                state/runs/*.json
              </code>{" "}
              file, this page will populate automatically.
            </>
          }
        />
      ) : (
        groups.map((group, i) => (
          <DateSection key={group.date} group={group} defaultOpen={i === 0} />
        ))
      )}
    </div>
  );
}
