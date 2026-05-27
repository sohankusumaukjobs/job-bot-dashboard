"use client";
import Link from "next/link";
import { useStatusCount, STATUS_ICONS } from "@/lib/jobStatus";

function TabLink({
  href,
  label,
  count,
}: {
  href: string;
  label: React.ReactNode;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-surface hover:text-ink"
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-bg-surface px-1.5 text-[10px] font-semibold leading-5 text-ink">
          {count}
        </span>
      )}
    </Link>
  );
}

export default function Nav() {
  const appliedCount = useStatusCount("applied");
  const interviewCount = useStatusCount("interview");
  const rejectedCount = useStatusCount("rejected");

  return (
    <nav className="sticky top-0 z-10 border-b border-white/5 bg-bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-accent"
        >
          Job Bot
        </Link>
        <div className="flex flex-wrap gap-1 text-sm">
          <TabLink href="/" label="Daily" />
          <TabLink href="/all" label="All Jobs" />
          <TabLink
            href="/applied"
            label={`${STATUS_ICONS.applied} Applied`}
            count={appliedCount}
          />
          <TabLink
            href="/interview"
            label={`${STATUS_ICONS.interview} Interview`}
            count={interviewCount}
          />
          <TabLink
            href="/rejected"
            label={`${STATUS_ICONS.rejected} Rejected`}
            count={rejectedCount}
          />
        </div>
      </div>
    </nav>
  );
}
