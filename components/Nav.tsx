import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-10 border-b border-white/5 bg-bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-base font-bold tracking-tight text-accent">
          Job Bot
        </Link>
        <div className="flex gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-surface hover:text-ink"
          >
            Daily
          </Link>
          <Link
            href="/all"
            className="rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-surface hover:text-ink"
          >
            All Jobs
          </Link>
        </div>
      </div>
    </nav>
  );
}
