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
 * element enters the viewport. Used to trigger scroll-reveal animations.
 * Bypasses observation entirely under prefers-reduced-motion (always
 * visible).
 */
export function useInView<T extends Element>(
  options: IntersectionObserverInit = { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (visible || !ref.current || typeof IntersectionObserver === "undefined") {
      return;
    }
    const node = ref.current;
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
          break;
        }
      }
    }, options);
    obs.observe(node);
    return () => obs.disconnect();
  }, [visible, options]);

  return [ref, visible];
}
