import type { Config } from "tailwindcss";

/**
 * "Midnight Ink" design system.
 *
 * Color tokens are wired to CSS variables in app/globals.css so the same
 * Tailwind class names render correctly in both dark + light mode. To add a
 * new color, declare the CSS variable in both :root themes and reference it
 * here as `rgb(var(--token) / <alpha-value>)`.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: "rgb(var(--bg) / <alpha-value>)",
        "bg-elevated": "rgb(var(--bg-elevated) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-hover": "rgb(var(--surface-hover) / <alpha-value>)",

        // Borders / dividers
        border: "rgb(var(--border) / <alpha-value>)",
        divider: "rgb(var(--divider) / <alpha-value>)",

        // Text
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--ink-muted) / <alpha-value>)",
        "ink-faint": "rgb(var(--ink-faint) / <alpha-value>)",

        // Accent + semantic
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-soft": "rgb(var(--primary-soft) / <alpha-value>)",
        violet: "rgb(var(--violet) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",

        // Legacy aliases — kept so existing components keep compiling while we
        // migrate. Map to the new tokens.
        "bg-card": "rgb(var(--surface) / <alpha-value>)",
        "bg-surface": "rgb(var(--bg-elevated) / <alpha-value>)",
        accent: "rgb(var(--success) / <alpha-value>)",
        "accent-2": "rgb(var(--primary) / <alpha-value>)",
        amber: "rgb(var(--warning) / <alpha-value>)",
        red: "rgb(var(--danger) / <alpha-value>)",
      },
      fontFamily: {
        display: ['"Cabinet Grotesk"', "system-ui", "sans-serif"],
        sans: ['"Satoshi"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Fluid type scale via clamp() — minimum 16px body per spec.
        "2xs": ["clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)", { lineHeight: "1.4" }],
        xs:   ["clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)",  { lineHeight: "1.5" }],
        sm:   ["clamp(0.875rem, 0.85rem + 0.15vw, 0.9375rem)", { lineHeight: "1.55" }],
        base: ["clamp(1rem, 0.97rem + 0.15vw, 1.0625rem)",     { lineHeight: "1.65" }],
        lg:   ["clamp(1.125rem, 1.08rem + 0.25vw, 1.25rem)",   { lineHeight: "1.55" }],
        xl:   ["clamp(1.25rem, 1.18rem + 0.4vw, 1.5rem)",      { lineHeight: "1.4" }],
        "2xl":["clamp(1.5rem, 1.35rem + 0.8vw, 2rem)",         { lineHeight: "1.25" }],
        "3xl":["clamp(1.875rem, 1.6rem + 1.2vw, 2.5rem)",      { lineHeight: "1.15" }],
        "4xl":["clamp(2.25rem, 1.9rem + 1.8vw, 3.25rem)",      { lineHeight: "1.1"  }],
      },
      letterSpacing: {
        // Spec: 0.02em on uppercase labels + stat numbers
        wide: "0.02em",
      },
      spacing: {
        // 4px-based custom spacing for fine tuning beyond Tailwind's defaults.
        "sidebar": "240px",
        "sidebar-collapsed": "60px",
        "header": "64px",
      },
      borderRadius: {
        "xl": "0.875rem",   // 14px — job cards
        "2xl": "1rem",      // 16px — KPI cards
      },
      boxShadow: {
        // Premium card depth.
        card: "0 2px 12px rgba(0,0,0,0.30)",
        "card-lit":
          "0 8px 28px -8px rgba(79,156,249,0.35), 0 4px 12px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(79,156,249,0.5), 0 8px 24px -8px rgba(79,156,249,0.45)",
      },
      backgroundImage: {
        "score-gradient": "linear-gradient(135deg, #4F9CF9 0%, #7B61FF 100%)",
        "kpi-border":
          "linear-gradient(135deg, rgba(79,156,249,0.35), rgba(123,97,255,0.10))",
        "kpi-surface":
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
      },
      backdropBlur: {
        glass: "20px",
      },
      keyframes: {
        "fade-rise": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.55" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 0.4s ease-out both",
        "fade-in":   "fade-in 0.3s ease-out both",
        shimmer:     "shimmer 1.5s ease-in-out infinite",
        float:       "float 3.5s ease-in-out infinite",
        "pulse-soft":"pulse-soft 2.4s ease-in-out infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
