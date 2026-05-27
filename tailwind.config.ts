import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f1117",
        "bg-card": "#1e2028",
        "bg-surface": "#2a2d37",
        ink: "#e8eaed",
        "ink-muted": "#9aa0a6",
        accent: "#34d399",
        "accent-2": "#60a5fa",
        amber: "#fbbf24",
        red: "#f87171",
      },
    },
  },
  plugins: [],
};

export default config;
