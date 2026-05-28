"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Layers,
  Send,
  Mic,
  XCircle,
  Sun,
  Moon,
} from "lucide-react";
import Logo from "./Logo";
import { useTheme } from "@/lib/theme";
import { useStatusCount } from "@/lib/jobStatus";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  /** Optional live count badge for the link. */
  countStatus?: "applied" | "interview" | "rejected";
}

const PRIMARY_LINKS: NavLink[] = [
  { href: "/",          label: "Daily Feed", icon: CalendarDays },
  { href: "/all",       label: "All Jobs",   icon: Layers },
  { href: "/applied",   label: "Applied",    icon: Send,    countStatus: "applied" },
  { href: "/interview", label: "Interview",  icon: Mic,     countStatus: "interview" },
  { href: "/rejected",  label: "Rejected",   icon: XCircle, countStatus: "rejected" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "/";
  const [theme, , toggleTheme] = useTheme();

  // Pre-compute counts so the hooks are unconditional.
  const appliedCount = useStatusCount("applied");
  const interviewCount = useStatusCount("interview");
  const rejectedCount = useStatusCount("rejected");
  const counts: Record<string, number> = {
    applied: appliedCount,
    interview: interviewCount,
    rejected: rejectedCount,
  };

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className="
        fixed left-0 top-0 z-30 hidden h-dvh
        w-[60px] flex-col border-r border-border/[0.06]
        bg-bg/80 backdrop-blur-glass
        md:flex lg:w-sidebar
      "
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className="flex h-header items-center px-4">
        <Link href="/" className="block lg:hidden" aria-label="Job Bot home">
          <Logo collapsed />
        </Link>
        <Link href="/" className="hidden lg:block" aria-label="Job Bot home">
          <Logo />
        </Link>
      </div>

      {/* Section label */}
      <div className="hidden px-5 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-wide text-ink-faint lg:block">
        Navigation
      </div>

      {/* Links */}
      <nav className="flex flex-1 flex-col gap-1 px-2 lg:px-3">
        {PRIMARY_LINKS.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          const count = link.countStatus ? counts[link.countStatus] ?? 0 : 0;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${active ? "active" : ""} justify-center lg:justify-start`}
              aria-current={active ? "page" : undefined}
              title={link.label}
            >
              <Icon size={20} strokeWidth={1.75} />
              <span className="hidden flex-1 lg:inline">{link.label}</span>
              {count > 0 && (
                <span
                  className={`
                    hidden rounded-full px-1.5 text-[10px] font-bold tabular-nums lg:inline-flex
                    items-center justify-center min-w-[20px] h-5
                    ${active
                      ? "bg-primary/20 text-primary"
                      : "bg-bg-elevated text-ink-muted"}
                  `}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-border/[0.06] p-2 lg:p-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="nav-item justify-center lg:justify-start"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
          <span className="hidden lg:inline">
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
        </button>
      </div>
    </aside>
  );
}
