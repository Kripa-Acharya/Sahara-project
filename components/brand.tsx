/**
 * साहारा brand marks and Nepalese accents.
 * The logo is a warm "sheltering roof + family" mark drawn inline so it needs
 * no external assets and inherits currentColor where useful.
 */

export function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {/* Sheltering roof */}
      <path
        d="M24 6 L44 24 H38 L24 11.5 L10 24 H4 Z"
        fill="var(--color-primary-600)"
      />
      {/* Two figures leaning toward each other */}
      <circle cx="18.5" cy="27" r="3.4" fill="var(--color-coral-500)" />
      <path
        d="M13 40c0-4.4 2.6-7.4 5.5-7.4 2 0 3.6 1.3 4.5 3.2V40Z"
        fill="var(--color-coral-500)"
      />
      <circle cx="30" cy="24.5" r="3.9" fill="var(--color-primary-500)" />
      <path
        d="M35.5 40c0-5.2-2.8-8.8-5.9-8.8-2.4 0-4.4 1.9-5.3 4.6V40Z"
        fill="var(--color-primary-500)"
      />
      {/* Small heart between them */}
      <path
        d="M23.6 20.2c.7-.9 2-.9 2.6-.1.6-.8 1.9-.8 2.6.1.6.8.5 2-.4 2.8l-2.2 1.9-2.2-1.9c-.9-.8-1-2-.4-2.8Z"
        fill="var(--color-coral-500)"
      />
    </svg>
  );
}

/** Brand wordmark — always साहारा (never सहारा). */
export function BrandName() {
  return (
    <span lang="ne" className="font-bold text-primary-700">
      साहारा
    </span>
  );
}

/**
 * Subtle Dhaka-textile-inspired divider — small repeating diamonds.
 * Decorative only; hidden from assistive tech.
 */
export function NepaliPatternDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px flex-1 max-w-24 bg-line" />
      <svg width="112" height="10" viewBox="0 0 112 10" fill="none">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path
            key={i}
            d={`M${8 + i * 16} 1 L${13 + i * 16} 5 L${8 + i * 16} 9 L${3 + i * 16} 5 Z`}
            fill={i % 2 === 0 ? "var(--color-coral-400)" : "var(--color-primary-400)"}
            opacity={i === 3 ? 1 : 0.55}
          />
        ))}
      </svg>
      <span className="h-px flex-1 max-w-24 bg-line" />
    </div>
  );
}

/** Simplified Himalayan skyline used as a quiet footer/hero accent. */
export function SkylineAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 90"
      preserveAspectRatio="none"
      aria-hidden
      className={`w-full h-14 ${className}`}
      fill="none"
    >
      <path
        d="M0 90 L70 42 L120 68 L190 22 L260 66 L330 34 L400 74 L470 30 L540 62 L610 18 L680 58 L740 40 L800 90 Z"
        fill="var(--color-primary-100)"
      />
      <path
        d="M0 90 L90 60 L170 80 L280 52 L380 84 L500 56 L620 82 L720 62 L800 90 Z"
        fill="var(--color-leaf-200)"
        opacity="0.6"
      />
    </svg>
  );
}
