interface PlaceholderProps {
  label: string;
  sublabel?: string;
  className?: string;
  tone?: "peach" | "charcoal" | "cream";
}

/**
 * Stand-in for a real photo/screenshot. Swap the containing element for an
 * <img src="..." alt="..." /> when real assets are ready.
 */
export default function Placeholder({
  label,
  sublabel,
  className = "",
  tone = "peach",
}: PlaceholderProps) {
  const toneStyles = {
    peach:
      "bg-[linear-gradient(135deg,var(--color-peach)_0%,var(--color-orange)_100%)] text-charcoal",
    charcoal: "bg-[#242424] text-white/70",
    cream: "bg-cream text-charcoal/60",
  }[tone];

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden ${toneStyles} ${className}`}
    >
      <div
        className="absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 14px)",
        }}
        aria-hidden="true"
      />
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="relative opacity-70"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 16l-5-5-9 9" />
      </svg>
      <span className="relative text-xs font-medium uppercase tracking-[0.15em]">
        {label}
      </span>
      {sublabel && (
        <span className="relative text-[11px] opacity-70">{sublabel}</span>
      )}
    </div>
  );
}
