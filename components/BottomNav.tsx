"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Layers, Send, Mic, XCircle } from "lucide-react";
import { useStatusCount } from "@/lib/jobStatus";

const ITEMS = [
  { href: "/",          label: "Daily",      icon: CalendarDays },
  { href: "/all",       label: "All",        icon: Layers },
  { href: "/applied",   label: "Applied",    icon: Send,    countStatus: "applied" as const },
  { href: "/interview", label: "Interview",  icon: Mic,     countStatus: "interview" as const },
  { href: "/rejected",  label: "Rejected",   icon: XCircle, countStatus: "rejected" as const },
];

export default function BottomNav() {
  const pathname = usePathname() ?? "/";
  const applied = useStatusCount("applied");
  const interview = useStatusCount("interview");
  const rejected = useStatusCount("rejected");
  const counts = { applied, interview, rejected };

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      className="
        fixed bottom-3 left-1/2 z-40 -translate-x-1/2
        flex items-center gap-1 rounded-full
        border border-border/[0.08] bg-bg-elevated/85
        px-2 py-2 shadow-card backdrop-blur-glass
        md:hidden
      "
      aria-label="Primary navigation"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const count = item.countStatus ? counts[item.countStatus] ?? 0 : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`
              relative flex h-11 w-11 items-center justify-center rounded-full
              transition-colors
              ${active ? "bg-primary/15 text-primary" : "text-ink-muted hover:text-ink"}
            `}
          >
            <Icon size={20} strokeWidth={1.85} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
