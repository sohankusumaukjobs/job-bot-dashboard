"use client";
import { useEffect, useRef, useState } from "react";

/** True when the user has explicitly requested reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animates a number from 0 → target on mount using requestAnimationFrame.
 * Returns the current displayed value. Respects prefers-reduced-motion.
 */
export function useCountUp(target: number, durationMs = 800): number {
  const [value, setValue] = useState<number>(() =>
    prefersReducedMotion() ? target : 0
  );
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return value;
}

/**
 * Returns `[ref, visible]`. `visible` flips to true the first time the
 * element enters the viewport, OR after a short safety timeout — whichever
 * comes first.
 *
 * The safety timeout is critical: with a strict rootMargin or threshold,
 * IntersectionObserver can fail to fire for elements that are technically
 * "off-screen" at first paint (e.g. just below the fold) but become
 * relevant the moment the user even slightly resizes / zooms / interacts.
 * Without the fallback, those elements stay at opacity:0 forever.
 *
 * Defaults to a generous `rootMargin: "0px 0px 50% 0px"` so even partially
 * below-the-fold content reveals on mount.
 *
 * Bypasses observation entirely under prefers-reduced-motion (always visible).
 */
export function useInView<T extends Element>(
  options: IntersectionObserverInit = {
    rootMargin: "0px 0px 50% 0px",
    threshold: 0,
  },
  fallbackMs = 600
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (visible || typeof window === "undefined") return;

    // Safety net: even if observer never fires, reveal after a short delay
    // so content can't get stuck invisible. Cheap and harmless.
    const timer = window.setTimeout(() => setVisible(true), fallbackMs);

    if (!ref.current || typeof IntersectionObserver === "undefined") {
      return () => window.clearTimeout(timer);
    }
    const node = ref.current;
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
          window.clearTimeout(timer);
          break;
        }
      }
    }, options);
    obs.observe(node);
    return () => {
      obs.disconnect();
      window.clearTimeout(timer);
    };
  }, [visible, options, fallbackMs]);

  return [ref, visible];
}
