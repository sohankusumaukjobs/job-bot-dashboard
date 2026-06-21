"use client";
import { useAutoSyncEngine } from "@/lib/autoSync";

/**
 * Headless component: boots the cross-device auto-sync engine for the app's
 * lifetime. Mounted once in the root layout so it runs on every route,
 * independent of whether the Sync popover is open. Renders nothing.
 */
export default function AutoSync() {
  useAutoSyncEngine();
  return null;
}
