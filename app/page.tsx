import DateSection from "@/components/DateSection";
import EmptyState from "@/components/EmptyState";
import Stats from "@/components/Stats";
import {
  loadIndex,
  loadRecentDailyRuns,
  DAILY_FEED_RUN_LIMIT,
} from "@/lib/loadRuns";
import { groupByDate } from "@/lib/groupByDate";

// Server component reads from the file system at build time; Next.js SSGs it
// automatically. We don't need `dynamic = "force-static"` and removing it
// avoids an edge-cache interaction that prevented Vercel from re-rendering
// the page when new state JSONs landed in `public/state/`.

export default function DailyPage() {
  // KPI stats come from the lightweight index (new_count / total_scraped per
  // run) so they stay accurate all-time without loading every run file. Only
  // the most recent runs are loaded in full for rendering — older days live on
  // the All Jobs page and per-run permalinks. This keeps the statically
  // pre-rendered page bounded under Vercel's 19 MB ISR limit.
  const index = loadIndex();
  const snapshots = loadRecentDailyRuns();
  const groups = groupByDate(snapshots);

  const totalRuns = index.length;
  const totalNewAllTime = index.reduce((acc, e) => acc + (e.new_count ?? 0), 0);
  const totalScrapedAllTime = index.reduce(
    (acc, e) => acc + (e.total_scraped ?? 0),
    0
  );
  const latestRunDate = (index[0]?.run_date ?? index[0]?.date)?.slice(0, 10);
  const cappedOlderRuns = index.length > snapshots.length;

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
        {cappedOlderRuns && (
          <p className="mt-1 max-w-2xl text-xs leading-snug text-ink-faint">
            Showing the latest {DAILY_FEED_RUN_LIMIT} runs. Older runs remain on
            the{" "}
            <a href="/all" className="text-primary hover:underline">
              All Jobs
            </a>{" "}
            page.
          </p>
        )}
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
