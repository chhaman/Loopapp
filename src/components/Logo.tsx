/** Loopapp mark: an app tile with a "loop" around a play glyph — try it, loop to the next. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="18" fill="var(--brand-coral)" />
      <path d="M47.97 26.19 A17 17 0 1 1 34.95 15.26" fill="none" stroke="var(--brand-ink)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="47.97" cy="26.19" r="4.5" fill="var(--brand-ink)" />
      <path d="M28.5 25.5 L28.5 38.5 L39.5 32 Z" fill="var(--brand-ink)" stroke="var(--brand-ink)" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="hidden font-display text-xl font-extrabold tracking-tight min-[420px]:inline">loopapp</span>
    </span>
  );
}
