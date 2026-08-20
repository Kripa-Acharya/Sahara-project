/**
 * Flat-vector illustrations in the साहारा style: simple geometric forms, soft
 * rounded shapes, minimal faces, muted token colors, no hard shadows.
 * Drawn inline so they ship with the app and follow the design tokens.
 */

/** A companion gently helping an elder who walks with a frame — hero scene. */
export function HeroCareIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 420"
      role="img"
      aria-label="A companion gently supporting an elderly person walking with a frame, beside a window and a house plant"
      className={className}
    >
      {/* Soft background blob */}
      <path
        d="M60 250c-30-90 30-190 150-205s280 30 290 140-90 200-220 210S90 340 60 250Z"
        fill="var(--color-mist-100)"
        opacity="0.7"
      />
      {/* Window frames */}
      <g stroke="var(--color-sage, #afc9b9)" strokeWidth="7" opacity="0.6" fill="none">
        <rect x="52" y="80" width="64" height="64" rx="4" stroke="var(--color-leaf-200)" />
        <rect x="88" y="150" width="52" height="52" rx="4" stroke="var(--color-leaf-200)" />
      </g>
      {/* Tree */}
      <circle cx="428" cy="140" r="46" fill="var(--color-leaf-200)" />
      <circle cx="398" cy="168" r="30" fill="var(--color-leaf-200)" opacity="0.8" />
      <rect x="422" y="170" width="10" height="52" rx="5" fill="var(--color-primary-500)" opacity="0.55" />

      {/* Plant in pot */}
      <g>
        <path d="M96 330c-14-26-8-52 4-64 4 18 2 34 6 48 6-20 16-30 30-34-6 22-14 40-24 50Z" fill="var(--color-leaf-500)" />
        <path d="M78 366h64l-8 40H86Z" fill="var(--color-coral-200)" />
        <rect x="72" y="358" width="76" height="12" rx="6" fill="var(--color-coral-400)" />
      </g>

      {/* Elder with walking frame */}
      <g>
        {/* Frame */}
        <g stroke="var(--color-primary-700)" strokeWidth="8" strokeLinecap="round" fill="none">
          <path d="M330 280v112M382 280v112M330 292h52M330 330h52" />
        </g>
        {/* Legs */}
        <path d="M300 392c2-34 4-62 8-84l24 6c-4 26-6 52-6 78Z" fill="var(--color-mustard-400)" opacity="0.9" />
        <path d="M282 392c0-30 2-58 6-82l22 4c-4 26-6 54-6 78Z" fill="var(--color-mustard-400)" />
        {/* Body — warm shawl */}
        <path
          d="M282 310c-4-42 8-84 34-88 24-4 40 18 42 52 1 18-2 30-6 40l-46 6c-10 0-22-2-24-10Z"
          fill="var(--color-coral-400)"
        />
        {/* Arm to frame */}
        <path d="M330 258c12 8 22 20 26 34l-14 10c-8-12-16-22-24-28Z" fill="var(--color-coral-500)" />
        {/* Head */}
        <circle cx="308" cy="204" r="22" fill="#F2D8C4" />
        {/* Hair */}
        <path d="M288 198c2-16 14-26 26-24 10 2 16 10 16 18-6-6-14-8-22-6-8 2-16 6-20 12Z" fill="#E9EAEC" />
        {/* Gentle closed-eye smile */}
        <path d="M300 208c2 2 5 2 7 0M314 208c2 2 5 2 7 0" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M305 216c3 3 8 3 11 0" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
      </g>

      {/* Companion supporting from behind */}
      <g>
        {/* Legs */}
        <path d="M218 392c0-36 4-66 10-88l24 4c-6 28-8 56-8 84Z" fill="var(--color-primary-700)" />
        <path d="M244 392c2-32 6-60 12-82l22 6c-6 24-10 50-10 76Z" fill="var(--color-primary-700)" opacity="0.85" />
        {/* Body */}
        <path
          d="M222 306c-6-44 10-82 36-84 22-2 36 16 38 44 1 16-2 32-8 42l-42 8c-12 0-22-2-24-10Z"
          fill="var(--color-primary-500)"
        />
        {/* Supporting arm reaching to elder's back */}
        <path d="M262 250c14-2 30 6 40 18l-10 14c-12-10-24-16-34-16Z" fill="var(--color-primary-500)" />
        {/* Head */}
        <circle cx="248" cy="200" r="20" fill="#EAC3A6" />
        {/* Hair */}
        <path d="M230 196c0-14 10-24 22-23 10 1 16 9 16 17-5-5-12-8-19-7-8 1-15 6-19 13Z" fill="var(--color-ink)" opacity="0.85" />
        <path d="M241 206c2 2 4 2 6 0M253 206c2 2 4 2 6 0" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M245 214c3 2 7 2 10 0" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
      </g>

      {/* Ground line */}
      <rect x="140" y="390" width="300" height="8" rx="4" fill="var(--color-leaf-200)" opacity="0.7" />
      {/* Floating heart */}
      <path
        d="M286 150c4-6 12-6 16-1 4-5 12-5 16 1 4 5 3 12-3 17l-13 11-13-11c-6-5-7-12-3-17Z"
        fill="var(--color-coral-500)"
        opacity="0.9"
      />
    </svg>
  );
}

/** Elder and family member connected by a video call — small vignette. */
export function VideoCallIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      role="img"
      aria-label="An elderly parent and their child abroad smiling at each other on a video call"
      className={className}
    >
      <path
        d="M20 110c-12-46 30-86 90-90s180 8 190 62-40 100-130 104S32 156 20 110Z"
        fill="var(--color-cream-dark)"
      />
      {/* Phone */}
      <rect x="118" y="34" width="84" height="140" rx="16" fill="white" stroke="var(--color-line)" strokeWidth="3" />
      <rect x="130" y="52" width="60" height="78" rx="10" fill="var(--color-mist-100)" />
      {/* Elder on screen */}
      <circle cx="160" cy="82" r="14" fill="#F2D8C4" />
      <path d="M148 78c1-9 8-14 13-13 6 1 9 6 9 10-4-3-8-4-12-3-4 1-8 3-10 6Z" fill="#E9EAEC" />
      <path d="M144 112c2-12 8-18 16-18s14 6 16 18Z" fill="var(--color-coral-400)" />
      {/* Hearts */}
      <path d="M212 70c3-4 8-4 11 0 3-4 8-4 11 0 3 4 2 9-2 12l-9 8-9-8c-4-3-5-8-2-12Z" fill="var(--color-coral-500)" />
      <path d="M92 96c2-3 6-3 8 0 2-3 6-3 8 0 2 3 1 7-1 9l-7 6-7-6c-2-2-3-6-1-9Z" fill="var(--color-coral-400)" opacity="0.8" />
      {/* Hand holding phone */}
      <path d="M196 160c10 4 18 10 22 18h-36c2-8 8-14 14-18Z" fill="#EAC3A6" />
    </svg>
  );
}
