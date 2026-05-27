export interface StatsProps {
  totalRuns: number;
  totalNewAllTime: number;
  totalScrapedAllTime: number;
  latestRunDate?: string;
}

export default function Stats({
  totalRuns,
  totalNewAllTime,
  totalScrapedAllTime,
  latestRunDate,
}: StatsProps) {
  const items: Array<{ label: string; value: string | number; tone: string }> = [
    { label: "Total runs", value: totalRuns, tone: "text-accent-2" },
    { label: "New jobs (all time)", value: totalNewAllTime, tone: "text-accent" },
    { label: "Scraped (all time)", value: totalScrapedAllTime, tone: "text-amber" },
    { label: "Latest run", value: latestRunDate || "—", tone: "text-ink-muted" },
  ];
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-white/5 bg-bg-card p-3"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {item.label}
          </div>
          <div className={`mt-1 text-2xl font-bold ${item.tone}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
