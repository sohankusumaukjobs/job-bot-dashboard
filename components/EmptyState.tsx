import React from "react";

/**
 * Friendly empty-state with a floating animated robot illustration.
 * Pure SVG, no external deps. Animation is CSS-only (defined in
 * tailwind.config.ts as the `float` keyframe) and disabled under
 * prefers-reduced-motion.
 */
export default function EmptyState({
  title = "No new jobs today",
  body = "Once the job-bot publishes its next run, this view will populate automatically.",
  children,
}: {
  title?: string;
  body?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/[0.06] bg-surface/40 p-10 text-center">
      <div className="mx-auto mb-5 grid h-28 w-28 place-items-center">
        <svg
          viewBox="0 0 120 120"
          width="120"
          height="120"
          fill="none"
          aria-hidden="true"
          className="motion-safe:animate-float drop-shadow-[0_8px_20px_rgba(79,156,249,0.25)]"
        >
          <defs>
            <linearGradient id="emptyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4F9CF9" />
              <stop offset="100%" stopColor="#7B61FF" />
            </linearGradient>
          </defs>
          {/* Antenna */}
          <line x1="60" y1="18" x2="60" y2="30" stroke="url(#emptyGrad)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="14" r="4.5" fill="url(#emptyGrad)" />
          {/* Head */}
          <rect x="22" y="30" width="76" height="60" rx="18" fill="url(#emptyGrad)" />
          {/* Eyes (closed/sleeping) */}
          <path d="M40 58 Q46 52 52 58" stroke="#0D0F14" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M68 58 Q74 52 80 58" stroke="#0D0F14" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Smile slot */}
          <rect x="48" y="72" width="24" height="3.5" rx="1.75" fill="#0D0F14" />
          {/* Shadow */}
          <ellipse cx="60" cy="104" rx="28" ry="4" fill="rgba(79,156,249,0.2)" />
          {/* Z's for "sleeping" / "waiting" */}
          <text
            x="98"
            y="40"
            fontFamily="Cabinet Grotesk, sans-serif"
            fontWeight="800"
            fontSize="14"
            fill="#7B61FF"
            opacity="0.7"
          >
            z
          </text>
          <text
            x="106"
            y="32"
            fontFamily="Cabinet Grotesk, sans-serif"
            fontWeight="800"
            fontSize="10"
            fill="#4F9CF9"
            opacity="0.5"
          >
            z
          </text>
        </svg>
      </div>
      <h3 className="font-display text-lg font-bold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{body}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
