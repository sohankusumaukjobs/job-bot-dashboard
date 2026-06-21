"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Logo from "./Logo";
import { PROFILE } from "@/lib/profile";
import { prefersReducedMotion } from "@/lib/anim";

const SESSION_KEY = "job-bot-welcomed";

function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * One-time-per-session branded entrance overlay. Self-gates via sessionStorage
 * and renders nothing on the server, so it never causes a hydration mismatch
 * and never blocks navigation within a session.
 *
 * The hero art is a self-contained SVG (no external asset, theme-reactive,
 * weightless) — an aurora-ribbon + constellation motif locked to the brand
 * palette.
 */
export default function WelcomeScreen({ newToday }: { newToday?: number }) {
  // `show` stays false during SSR + first client render to avoid a flash; an
  // effect decides whether to reveal, so the gate is purely client-side.
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);
  const [hello, setHello] = useState("Welcome back");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;

    setHello(greeting());
    setShow(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }

    // Auto-dismiss. Reduced motion → very short so it doesn't linger.
    const reduce = prefersReducedMotion();
    const timer = window.setTimeout(() => dismiss(), reduce ? 400 : 2800);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    if (prefersReducedMotion()) {
      setShow(false);
      return;
    }
    setClosing(true);
    window.setTimeout(() => setShow(false), 420);
  }

  // Dismiss on Enter / Esc while visible.
  useEffect(() => {
    if (!show) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  const subtitle =
    typeof newToday === "number" && newToday > 0
      ? `${newToday} new role${newToday === 1 ? "" : "s"} are waiting in your feed.`
      : "Your job-hunt command center is ready.";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Enter dashboard"
      onClick={dismiss}
      className={`fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-bg ${
        closing ? "motion-safe:animate-welcome-out" : "motion-safe:animate-fade-in"
      }`}
    >
      <HeroArt />

      {/* Left-anchored content over the negative space. */}
      <div className="relative z-10 flex h-full w-full items-center">
        <div className="w-full max-w-[640px] px-8 sm:px-14 lg:px-20">
          <div className="mb-7 motion-safe:animate-float">
            <Logo />
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary motion-safe:animate-fade-rise">
            {hello}
          </p>

          <h1
            className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl motion-safe:animate-fade-rise"
            style={{ animationDelay: "80ms" }}
          >
            <span className="text-ink">Welcome, </span>
            <span className="bg-score-gradient bg-clip-text text-transparent">
              {PROFILE.name}
            </span>
          </h1>

          <p
            className="mt-4 max-w-md text-base leading-relaxed text-ink-muted motion-safe:animate-fade-rise"
            style={{ animationDelay: "160ms" }}
          >
            {subtitle}
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="btn-primary mt-8 h-11 px-5 text-sm motion-safe:animate-fade-rise"
            style={{ animationDelay: "240ms" }}
          >
            Enter dashboard
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>

          <p
            className="mt-4 text-xs text-ink-faint motion-safe:animate-fade-in"
            style={{ animationDelay: "420ms" }}
          >
            Click anywhere or press Enter to continue
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Self-contained brand hero: blurred aurora ribbons + a drifting constellation
 * of glowing nodes connected by thin lines (a neural-network / career-map
 * motif). Pure SVG + CSS, theme-reactive, no external image.
 */
function HeroArt() {
  // Deterministic node positions (right two-thirds), so SSR/CSR match.
  const nodes = [
    { x: 58, y: 24 }, { x: 70, y: 38 }, { x: 64, y: 56 }, { x: 78, y: 64 },
    { x: 86, y: 30 }, { x: 90, y: 50 }, { x: 74, y: 78 }, { x: 60, y: 72 },
    { x: 82, y: 82 }, { x: 94, y: 70 }, { x: 68, y: 16 }, { x: 88, y: 14 },
  ];
  const links: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [3, 5], [2, 7], [7, 6],
    [6, 8], [8, 9], [5, 9], [3, 6], [10, 0], [11, 4], [4, 10],
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Aurora gradient ribbons (blurred blobs). */}
      <div
        className="absolute -right-[10%] -top-[20%] h-[80%] w-[70%] rounded-full opacity-70 blur-[90px] motion-safe:animate-welcome-drift"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(123,97,255,0.55), transparent 60%)",
        }}
      />
      <div
        className="absolute right-[6%] top-[28%] h-[70%] w-[60%] rounded-full opacity-60 blur-[90px] motion-safe:animate-welcome-drift"
        style={{
          animationDelay: "-6s",
          background:
            "radial-gradient(circle at 60% 40%, rgba(79,156,249,0.5), transparent 62%)",
        }}
      />
      <div
        className="absolute right-[18%] bottom-[-10%] h-[55%] w-[45%] rounded-full opacity-50 blur-[80px] motion-safe:animate-welcome-drift"
        style={{
          animationDelay: "-12s",
          background:
            "radial-gradient(circle at 50% 50%, rgba(34,197,94,0.18), transparent 60%)",
        }}
      />

      {/* Constellation network. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g stroke="rgb(var(--primary) / 0.22)" strokeWidth="0.12">
          {links.map(([a, b], i) => (
            <line
              key={i}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
            />
          ))}
        </g>
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={i % 3 === 0 ? 0.55 : 0.38}
            fill={i % 2 === 0 ? "rgb(var(--primary))" : "rgb(var(--violet))"}
            className="motion-safe:animate-twinkle"
            style={{ animationDelay: `${(i % 5) * 0.6}s` }}
          />
        ))}
      </svg>

      {/* Left scrim so the headline always reads, regardless of theme. */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-transparent" />
      {/* Bottom vignette for depth. */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg to-transparent" />
    </div>
  );
}
