# Job Bot Dashboard

Public Vercel-deployed Next.js dashboard for the private `job-bot` companion repo.

## What it shows

- **Daily** (`/`) — every run grouped by date. Each date's section contains only the jobs that were NEW in that run (not seen in any earlier run).
- **All Jobs** (`/all`) — every unique job ever scraped, including the bootstrap baseline. Sortable + searchable.
- **Per-run permalinks** (`/runs/<run_id>`) — static page for a specific run.

## How the data flows

```
private repo: job-bot                     this public repo: job-bot-dashboard
  python job_bot.py                          .github/workflows/sync.yml
  └─ writes public/state/runs/*.json                └─ runs every 30 min (cron)
  └─ git push to main                        └─ repository_dispatch (bot triggers it)
                                             └─ scripts/sync-state.mjs pulls
                                                public/state/runs/*.json via GitHub
                                                API using BOT_REPO_PAT
                                             └─ commits to this repo
                                             └─ Vercel auto-rebuilds
```

## Required GitHub Actions secret

| Name | What it is |
|---|---|
| `BOT_REPO_PAT` | Fine-grained PAT with **Contents: Read** on the private `job-bot` repo. Used by `scripts/sync-state.mjs` to read state JSONs. |

Set it at: **Settings → Secrets and variables → Actions → New repository secret**.

## Local development

```bash
npm install
# Sync state JSONs locally (needs BOT_REPO_PAT in your shell env)
BOT_REPO_PAT=... node scripts/sync-state.mjs
npm run dev
```

## Deploying to Vercel

1. https://vercel.com → **Add New Project** → import this repo.
2. Framework preset: **Next.js** (auto-detected).
3. Build command, output directory, install command: defaults are fine.
4. No environment variables needed for the dashboard itself.
5. Deploy.

The dashboard is **public, no auth** by design. A `robots.txt` blocks search-engine indexing as a mitigation.

## Why no auth?

Per the bot owner's design choice. The synced data is job listings (already public) plus search keywords (acceptable PII exposure). Don't enable indexing.
