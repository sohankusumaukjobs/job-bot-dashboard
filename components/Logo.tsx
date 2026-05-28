/**
 * Custom JobBot wordmark. Geometric robot-head glyph + Cabinet Grotesk
 * lettering. Pure SVG, no external assets.
 */
export default function Logo({
  collapsed = false,
  className = "",
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4F9CF9" />
            <stop offset="100%" stopColor="#7B61FF" />
          </linearGradient>
        </defs>
        {/* Rounded chamfered head */}
        <rect
          x="3"
          y="6"
          width="26"
          height="22"
          rx="7"
          fill="url(#logoGrad)"
        />
        {/* Antenna */}
        <rect x="15" y="1" width="2" height="5" rx="1" fill="url(#logoGrad)" />
        <circle cx="16" cy="2" r="2" fill="url(#logoGrad)" />
        {/* Eyes (negative-space) */}
        <circle cx="11.5" cy="16" r="2.25" fill="#0D0F14" />
        <circle cx="20.5" cy="16" r="2.25" fill="#0D0F14" />
        <circle cx="12.15" cy="15.35" r="0.7" fill="#F1F5F9" />
        <circle cx="21.15" cy="15.35" r="0.7" fill="#F1F5F9" />
        {/* Smile slot */}
        <rect x="11" y="21" width="10" height="1.8" rx="0.9" fill="#0D0F14" />
      </svg>

      {!collapsed && (
        <span className="font-display text-[1.05rem] font-bold tracking-tight text-ink">
          Job<span className="text-primary">Bot</span>
        </span>
      )}
    </div>
  );
}
