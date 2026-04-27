export function OliveBadgeC({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <radialGradient id="bgC" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fff5d1" />
          <stop offset="55%" stopColor="#f3c84a" />
          <stop offset="100%" stopColor="#8a6217" />
        </radialGradient>
      </defs>
      {/* hexagon ribbon */}
      <polygon
        points="100,10 178,55 178,145 100,190 22,145 22,55"
        fill="#a37b1c"
      />
      <polygon
        points="100,22 168,60 168,140 100,178 32,140 32,60"
        fill="url(#bgC)"
        stroke="#8a6217"
        strokeWidth="1"
      />
      {/* triple-olive cluster */}
      <g>
        <ellipse cx="78" cy="120" rx="20" ry="26" fill="#5e8a3f" />
        <ellipse cx="74" cy="113" rx="6" ry="10" fill="#7fb04f" opacity="0.7" />
        <ellipse cx="122" cy="120" rx="20" ry="26" fill="#3b6e42" />
        <ellipse cx="118" cy="113" rx="6" ry="10" fill="#5e8a3f" opacity="0.7" />
        <ellipse cx="100" cy="100" rx="22" ry="28" fill="#7fb04f" />
        <ellipse cx="96" cy="93" rx="7" ry="11" fill="#a8d2ae" opacity="0.7" />
      </g>
      {/* leaf on top */}
      <path
        d="M100 78 C100 60, 120 50, 138 52"
        stroke="#3b6e42"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="135" cy="52" rx="16" ry="6" fill="#7fb888" transform="rotate(15 135 52)" />
      <ellipse cx="120" cy="60" rx="11" ry="4.5" fill="#5e8a3f" transform="rotate(-10 120 60)" />
      {/* small banner ribbons */}
      <path d="M22 130 L40 140 L22 150 Z" fill="#a37b1c" />
      <path d="M178 130 L160 140 L178 150 Z" fill="#a37b1c" />
    </svg>
  );
}
