"use client";
import { useSyncExternalStore } from "react";

/**
 * Tiny external-store theme manager. The provider component in
 * components/ThemeProvider.tsx mounts a tiny script that applies the saved
 * theme to <html> before React hydrates (so there's no flash of wrong
 * theme).  This module exposes the runtime hook + setter.
 */

export type Theme = "dark" | "light";

const KEY = "job-bot-theme";

let current: Theme = "dark";
let hydrated = false;
const subs = new Set<() => void>();

function readStored(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = window.localStorage.getItem(KEY);
  return v === "light" ? "light" : "dark";
}

function apply(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "light") root.classList.add("light");
  else root.classList.remove("light");
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  current = readStored();
  apply(current);
  hydrated = true;
}

function subscribe(cb: () => void): () => void {
  hydrate();
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

function getSnapshot(): Theme {
  hydrate();
  return current;
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function useTheme(): [Theme, (t: Theme) => void, () => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setTheme = (t: Theme) => {
    current = t;
    apply(t);
    try {
      window.localStorage.setItem(KEY, t);
    } catch {
      // swallow quota / privacy errors
    }
    subs.forEach((cb) => cb());
  };
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
  return [theme, setTheme, toggle];
}

/**
 * Inline script (returned as a string) that runs *before* React hydrates
 * and applies the saved theme to <html>. Mounted in app/layout.tsx via
 * dangerouslySetInnerHTML to avoid a flash of incorrect theme.
 */
export const themePreloadScript = `
(function(){
  try {
    var t = localStorage.getItem(${JSON.stringify(KEY)});
    if (t === "light") {
      document.documentElement.classList.add("light");
    }
  } catch (e) {}
})();
`;
