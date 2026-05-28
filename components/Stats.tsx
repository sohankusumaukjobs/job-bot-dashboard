"use client";
import { Activity, Cpu, Send, Clock } from "lucide-react";
import { useCountUp } from "@/lib/anim";

export interface StatsProps {
  totalRuns: number;
  totalNewAllTime: number;
  totalScrapedAllTime: number;
  latestRunDate?: string;
}

interface Item {
  label: string;
  value: number;
  /** Replaces the count-up number with a string (e.g. a date). */
  textValue?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  accent: string;
  /** Pre-baked relative-ratio points for the decorative sparkline (0-1). */
  spark: number[];
}

function Sparkline({
  points,
  color,
}: {
  points: number[];
  color: string;
}) {
  if (!points.length) return null;
  const w = 80;
  const h = 24;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1 || 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  // Area under the line for the soft fill.
  const area = `${path} L${w},${h} L0,${h} Z`;
  const gradId = `sparkGrad-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KpiCard({ item, delayMs }: { item: Item; delayMs: number }) {
  const animated = useCountUp(item.value, 900);
  const display =
    item.textValue ?? animated.toLocaleString();
  const Icon = item.icon;

  return (
    <div
      className="glass-card group relative overflow-hidden p-5 motion-safe:animate-fade-rise"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start justify-between">
        <div
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${item.accent}33, transparent)`,
            color: item.accent,
          }}
        >
          <Icon size={18} strokeWidth={1.85} />
        </div>
        <Sparkline points={item.spark} color={item.accent} />
      </div>

      <div className="mt-5">
        <div className="font-display text-3xl font-bold tracking-tight tabular-nums text-ink">
          {display}
        </div>
        <div className="mt-1 text-2xs font-semibold uppercase tracking-wide text-ink-muted">
          {item.label}
        </div>
      </div>
    </div>
  );
}

export default function Stats({
  totalRuns,
  totalNewAllTime,
  totalScrapedAllTime,
  latestRunDate,
}: StatsProps) {
  // Sparklines are decorative — they convey "trending" without claiming
  // accuracy. We build a gentle synthetic series anchored to each value.
  const synth = (target: number, len = 8): number[] => {
    if (target <= 0) return Array(len).fill(0);
    const out: number[] = [];
    for (let i = 0; i < len; i++) {
      const t = i / (len - 1);
      const wave = 0.55 + 0.45 * Math.sin(t * Math.PI * 1.4 - 0.5);
      const drift = 0.4 + 0.6 * t;
      out.push(target * wave * drift);
    }
    return out;
  };

  const items: Item[] = [
    {
      label: "Total Runs",
      value: totalRuns,
      icon: Activity,
      accent: "#4F9CF9",
      spark: synth(totalRuns),
    },
    {
      label: "New Jobs · All Time",
      value: totalNewAllTime,
      icon: Send,
      accent: "#22C55E",
      spark: synth(totalNewAllTime),
    },
    {
      label: "Scraped · All Time",
      value: totalScrapedAllTime,
      icon: Cpu,
      accent: "#F59E0B",
      spark: synth(totalScrapedAllTime),
    },
    {
      label: "Latest Run",
      value: 0,
      textValue: latestRunDate || "—",
      icon: Clock,
      accent: "#7B61FF",
      spark: synth(Math.max(totalRuns, 1), 8),
    },
  ];

  return (
    <div className="mb-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item, idx) => (
        <KpiCard key={item.label} item={item} delayMs={idx * 60} />
      ))}
    </div>
  );
}
