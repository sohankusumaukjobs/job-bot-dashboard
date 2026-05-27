"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Job } from "@/lib/types";
import { jobAnchor } from "./JobCard";

interface Row {
  job: Job;
  from_run: string;
  date: string;
}

type SortKey = "score" | "company" | "date" | "title";

export default function AllJobsTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date");

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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by title, company, location…"
          className="flex-1 rounded-md border border-white/10 bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-accent focus:outline-none"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-white/10 bg-bg-card px-3 py-2 text-sm text-ink"
        >
          <option value="date">Sort: First seen ↓</option>
          <option value="score">Sort: Score ↓</option>
          <option value="company">Sort: Company A→Z</option>
          <option value="title">Sort: Title A→Z</option>
        </select>
      </div>

      <p className="mb-3 text-xs text-ink-muted">
        Showing {filtered.length} of {rows.length} unique jobs ever scraped.
      </p>

      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-surface text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2 text-right">Score</th>
              <th className="px-3 py-2">First seen</th>
              <th className="px-3 py-2">Apply</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ job, from_run, date }, idx) => {
              const score =
                job.tailored_accuracy_score ??
                job.accuracy_score ??
                job.match_score ??
                0;
              // Deep-link: jump straight to this job's card on the run page
              const anchor = jobAnchor(job, from_run);
              const runHref = from_run
                ? `/runs/${from_run}#${anchor}`
                : undefined;
              return (
                <tr
                  key={`${from_run}-${job.apply_url || idx}`}
                  className="border-t border-white/5 transition hover:bg-bg-card"
                >
                  <td className="px-3 py-2 font-medium text-ink">
                    {runHref ? (
                      <Link
                        href={runHref}
                        className="hover:text-accent-2 hover:underline"
                        title="View in run →"
                      >
                        {job.title || "—"}
                      </Link>
                    ) : (
                      job.title || "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{job.company || "—"}</td>
                  <td className="px-3 py-2 text-ink-muted">{job.location || "—"}</td>
                  <td className="px-3 py-2 text-ink-muted">{job.source || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink">
                    {score}
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{date || "—"}</td>
                  <td className="px-3 py-2">
                    {job.apply_url ? (
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-2 hover:underline"
                      >
                        Open
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
                <td colSpan={7} className="px-3 py-6 text-center text-ink-muted">
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
