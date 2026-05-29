"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, ArrowUpRight, ArrowDownUp } from "lucide-react";
import type { Job } from "@/lib/types";
import { jobAnchor } from "./JobCard";

interface Row {
  job: Job;
  from_run: string;
  date: string;
}

type SortKey = "score" | "company" | "date" | "title";

function scoreTone(score: number): { bg: string; color: string } {
  if (score >= 80) return { bg: "rgba(34,197,94,0.16)",  color: "#22C55E" };
  if (score >= 60) return { bg: "rgba(245,158,11,0.16)", color: "#F59E0B" };
  if (score >= 40) return { bg: "rgba(79,156,249,0.16)", color: "#4F9CF9" };
  return { bg: "rgba(239,68,68,0.16)", color: "#EF4444" };
}

export default function AllJobsTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date");

  // Pick up #q= deep-links from the top header's search submit.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.location.hash.match(/#q=([^&]+)/);
    if (m) {
      try {
        setQuery(decodeURIComponent(m[1]));
      } catch {
        // ignore malformed hash
      }
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filteredRows = q
      ? rows.filter((r) =>
          [r.job.title, r.job.company, r.job.location, r.job.source]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : rows;
    const sorted = [...filteredRows];
    if (sort === "score") {
      sorted.sort(
        (a, b) =>
          (b.job.tailored_accuracy_score ??
            b.job.accuracy_score ??
            b.job.match_score ??
            0) -
          (a.job.tailored_accuracy_score ??
            a.job.accuracy_score ??
            a.job.match_score ??
            0)
      );
    } else if (sort === "company") {
      sorted.sort((a, b) => (a.job.company || "").localeCompare(b.job.company || ""));
    } else if (sort === "title") {
      sorted.sort((a, b) => (a.job.title || "").localeCompare(b.job.title || ""));
    } else {
      sorted.sort((a, b) => (b.from_run || "").localeCompare(a.from_run || ""));
    }
    return sorted;
  }, [rows, query, sort]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="search-pill flex-1 min-w-[200px]">
          <Search size={15} strokeWidth={2} className="text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, company, location…"
            className="text-sm"
          />
        </div>

        <div className="relative">
          <ArrowDownUp
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="
              h-9 cursor-pointer appearance-none rounded-full
              border border-border/[0.08] bg-bg-elevated/45
              pl-8 pr-4 text-xs font-semibold text-ink
              focus:border-primary/60 focus:outline-none
            "
          >
            <option value="date">Newest first</option>
            <option value="score">Top score</option>
            <option value="company">Company A–Z</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      <p className="mb-3 text-xs text-ink-muted">
        Showing{" "}
        <span className="font-semibold text-ink">{filtered.length}</span> of{" "}
        <span className="font-semibold text-ink">{rows.length}</span> unique jobs
        ever scraped.
      </p>

      {/* ── Mobile: card list (tables don't fit phone widths) ──────────── */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {filtered.map(({ job, from_run, date }, idx) => {
          const score =
            job.tailored_accuracy_score ??
            job.accuracy_score ??
            job.match_score ??
            0;
          const tone = scoreTone(score);
          const anchor = jobAnchor(job, from_run);
          const runHref = from_run ? `/runs/${from_run}#${anchor}` : undefined;
          return (
            <div
              key={`m-${from_run}-${job.apply_url || idx}`}
              className="rounded-xl border border-border/[0.06] bg-surface p-3.5 shadow-card"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-bold leading-tight text-ink">
                    {runHref ? (
                      <Link href={runHref} className="hover:text-primary">
                        {job.title || "—"}
                      </Link>
                    ) : (
                      job.title || "—"
                    )}
                  </div>
                  <div className="mt-1 break-words text-xs text-ink-muted">
                    {[job.company, job.location, job.source]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums"
                  style={{ background: tone.bg, color: tone.color }}
                >
                  {score}
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-2xs text-ink-muted">
                <span>First seen {date || "—"}</span>
                {job.apply_url && (
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-primary"
                  >
                    Open
                    <ArrowUpRight size={12} strokeWidth={2.5} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-border/[0.06] bg-surface p-6 text-center text-sm text-ink-muted">
            No jobs match your filter.
          </p>
        )}
      </div>

      {/* ── Desktop: full table ────────────────────────────────────────── */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border/[0.06] bg-surface/40 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-elevated/60 text-2xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 text-right font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">First seen</th>
              <th className="px-4 py-3 font-semibold">Apply</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ job, from_run, date }, idx) => {
              const score =
                job.tailored_accuracy_score ??
                job.accuracy_score ??
                job.match_score ??
                0;
              const tone = scoreTone(score);
              const anchor = jobAnchor(job, from_run);
              const runHref = from_run
                ? `/runs/${from_run}#${anchor}`
                : undefined;
              return (
                <tr
                  key={`${from_run}-${job.apply_url || idx}`}
                  className="border-t border-border/[0.05] transition-colors hover:bg-surface-hover/40"
                >
                  <td className="px-4 py-3 font-medium text-ink">
                    {runHref ? (
                      <Link
                        href={runHref}
                        className="transition-colors hover:text-primary"
                        title="View in run →"
                      >
                        {job.title || "—"}
                      </Link>
                    ) : (
                      job.title || "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{job.company || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{job.location || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{job.source || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span
                      className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold"
                      style={{ background: tone.bg, color: tone.color }}
                    >
                      {score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{date || "—"}</td>
                  <td className="px-4 py-3">
                    {job.apply_url ? (
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary transition hover:underline"
                      >
                        Open
                        <ArrowUpRight size={12} strokeWidth={2.5} />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-ink-muted"
                >
                  No jobs match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
