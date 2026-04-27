export function OliveBadgeA({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <radialGradient id="bgA" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fff5d1" />
          <stop offset="60%" stopColor="#f3c84a" />
          <stop offset="100%" stopColor="#a37b1c" />
        </radialGradient>
        <linearGradient id="ringA" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbe48a" />
          <stop offset="100%" stopColor="#a37b1c" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#ringA)" />
      <circle cx="100" cy="100" r="80" fill="url(#bgA)" stroke="#a37b1c" strokeWidth="1.5" />
      {/* tiny rays */}
      <g stroke="#a37b1c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
        <line x1="100" y1="22" x2="100" y2="32" />
        <line x1="178" y1="100" x2="168" y2="100" />
        <line x1="100" y1="178" x2="100" y2="168" />
        <line x1="22" y1="100" x2="32" y2="100" />
        <line x1="155" y1="45" x2="148" y2="52" />
        <line x1="155" y1="155" x2="148" y2="148" />
        <line x1="45" y1="155" x2="52" y2="148" />
        <line x1="45" y1="45" x2="52" y2="52" />
      </g>
      {/* olive — big single fruit */}
      <ellipse cx="100" cy="115" rx="32" ry="40" fill="#5e8a3f" />
      <ellipse cx="92" cy="100" rx="9" ry="14" fill="#7fb04f" opacity="0.65" />
      <path
        d="M100 85 C100 65, 122 55, 140 56"
        stroke="#3b6e42"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="138" cy="56" rx="18" ry="7" fill="#7fb888" transform="rotate(20 138 56)" />
      <ellipse cx="125" cy="64" rx="13" ry="5.5" fill="#5e8a3f" transform="rotate(-15 125 64)" />
    </svg>
  );
}
