#!/usr/bin/env node
/**
 * Pull state/ from the private job-bot repo into this dashboard repo so Vercel
 * can statically build the dashboard from local files.
 *
 * Runs inside .github/workflows/sync.yml. Requires:
 *   BOT_REPO_PAT  — fine-grained PAT with Contents: Read on the bot repo.
 *
 * Env (with defaults):
 *   BOT_REPO_OWNER     (default: sohankusumaukjobs)
 *   BOT_REPO_NAME      (default: job-bot)
 *   BOT_REPO_BRANCH    (default: main)
 *   STATE_REMOTE_PATH  (default: state)         path inside the bot repo
 *   STATE_TARGET       (default: public/state)  path inside this repo (must
 *                                               live under public/ so Vercel
 *                                               serves files as static assets)
 */

import { mkdir, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

const OWNER = process.env.BOT_REPO_OWNER ?? "sohankusumaukjobs";
const REPO = process.env.BOT_REPO_NAME ?? "job-bot";
const BRANCH = process.env.BOT_REPO_BRANCH ?? "main";
// Default target is `public/state` so Vercel serves the JSONs and any binary
// artifacts (e.g. resume DOCXes under state/resumes/) as static assets.
// Override via STATE_TARGET / STATE_REMOTE_PATH env vars if needed.
const STATE_REMOTE_PATH = process.env.STATE_REMOTE_PATH ?? "state";
const STATE_TARGET = process.env.STATE_TARGET ?? "public/state";
// Back-compat: if STATE_PATH was the old usage, mirror it onto both fields.
const _legacyPath = process.env.STATE_PATH;
const REMOTE_DIR = _legacyPath ?? STATE_REMOTE_PATH;
const LOCAL_DIR = _legacyPath ? `public/${_legacyPath}` : STATE_TARGET;
const TOKEN = process.env.BOT_REPO_PAT;

if (!TOKEN) {
  console.error("ERROR: BOT_REPO_PAT env var is required.");
  process.exit(1);
}

const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

const REMEDIATION_401 = `
────────────────────────────────────────────────────────────────────────
🚨 BOT_REPO_PAT was REJECTED by GitHub (401 Bad credentials).

The token has expired or been revoked. Until it is replaced, the public
dashboard will NOT receive new runs (the bot itself is unaffected).

Fix (2 minutes):
  1. https://github.com/settings/personal-access-tokens → Generate new token
     (fine-grained). Repository access: ONLY ${OWNER}/${REPO}.
     Permissions: Contents → Read-only. Expiration: 1 year (set a reminder).
  2. https://github.com/${OWNER}/job-bot-dashboard/settings/secrets/actions
     → edit BOT_REPO_PAT → paste the new token.
  3. Re-run this workflow (Actions → Sync state from job-bot → Run workflow).
────────────────────────────────────────────────────────────────────────`;

const REMEDIATION_403 = `
────────────────────────────────────────────────────────────────────────
🚨 GitHub returned 403 for BOT_REPO_PAT.

Either the token lacks "Contents: Read" on ${OWNER}/${REPO}, its repository
access list doesn't include that repo, or the API rate limit was exhausted.
Check the token's settings, or regenerate it (see the 401 instructions in
scripts/sync-state.mjs).
────────────────────────────────────────────────────────────────────────`;

/** fetch with small retries for transient network / 5xx failures. */
async function fetchWithRetry(url, init, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      // Retry server-side errors; return everything else to the caller.
      if (res.status >= 500 && i < attempts - 1) {
        console.warn(`GitHub ${res.status} on ${url} — retry ${i + 1}/${attempts - 1}…`);
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        console.warn(`Network error on ${url} (${err?.message}) — retry ${i + 1}/${attempts - 1}…`);
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      }
    }
  }
  throw lastErr ?? new Error(`fetch failed after ${attempts} attempts: ${url}`);
}

async function gh(path) {
  const url = `${apiBase}/${path}?ref=${BRANCH}`;
  const res = await fetchWithRetry(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 404) return null;
  if (res.status === 401) {
    console.error(REMEDIATION_401);
    throw new Error("BOT_REPO_PAT rejected (401 Bad credentials) — see instructions above.");
  }
  if (res.status === 403) {
    console.error(REMEDIATION_403);
    throw new Error(`GitHub API 403: ${await res.text()}`);
  }
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Preflight: verify the PAT can see the bot repo at all before we start
 * touching the local tree. Produces one clear, actionable failure instead of
 * a stack trace mid-sync.
 */
async function preflight() {
  const res = await fetchWithRetry(`https://api.github.com/repos/${OWNER}/${REPO}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 401) {
    console.error(REMEDIATION_401);
    throw new Error("BOT_REPO_PAT rejected (401 Bad credentials).");
  }
  if (res.status === 403) {
    console.error(REMEDIATION_403);
    throw new Error("BOT_REPO_PAT lacks access (403).");
  }
  if (res.status === 404) {
    // Fine-grained PATs return 404 (not 403) for repos outside their grant.
    console.error(REMEDIATION_403);
    throw new Error(
      `Repo ${OWNER}/${REPO} not visible to BOT_REPO_PAT (404) — token likely ` +
      `not granted access to this repository.`
    );
  }
  if (!res.ok) {
    throw new Error(`Preflight failed: GitHub ${res.status}: ${await res.text()}`);
  }
  console.log(`Preflight OK — BOT_REPO_PAT can read ${OWNER}/${REPO}.`);
}

async function downloadFile(remotePath, localPath) {
  const entry = await gh(remotePath);
  if (!entry || entry.type !== "file") {
    return false;
  }
  // For files <1MB the content is base64-inlined; for larger ones use download_url.
  let contents;
  if (entry.content && entry.encoding === "base64") {
    contents = Buffer.from(entry.content, "base64");
  } else if (entry.download_url) {
    const raw = await fetchWithRetry(entry.download_url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!raw.ok) throw new Error(`download ${entry.download_url} -> ${raw.status}`);
    contents = Buffer.from(await raw.arrayBuffer());
  } else {
    throw new Error(`No content or download_url for ${remotePath}`);
  }
  await mkdir(dirname(localPath), { recursive: true });
  await writeFile(localPath, contents);
  return true;
}

async function syncDirectory(remoteDir, localDir) {
  const entries = await gh(remoteDir);
  if (!Array.isArray(entries)) {
    console.log(`No directory found at ${remoteDir}, skipping.`);
    return;
  }
  await mkdir(localDir, { recursive: true });
  let copied = 0;
  for (const entry of entries) {
    const remotePath = `${remoteDir}/${entry.name}`;
    const localPath = join(localDir, entry.name);
    if (entry.type === "file") {
      await downloadFile(remotePath, localPath);
      copied++;
    } else if (entry.type === "dir") {
      await syncDirectory(remotePath, localPath);
    }
  }
  console.log(`Synced ${copied} file(s) under ${remoteDir}`);
}

async function main() {
  console.log(`Syncing ${OWNER}/${REPO}@${BRANCH}:${REMOTE_DIR}/ → ./${LOCAL_DIR}/`);
  await preflight();
  await syncDirectory(REMOTE_DIR, LOCAL_DIR);
  console.log("Sync complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
