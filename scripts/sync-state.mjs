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

async function gh(path) {
  const url = `${apiBase}/${path}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  return res.json();
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
    const raw = await fetch(entry.download_url, {
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
  await syncDirectory(REMOTE_DIR, LOCAL_DIR);
  console.log("Sync complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
