export function OliveBadgeB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="bgB" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde98e" />
          <stop offset="100%" stopColor="#c89327" />
        </linearGradient>
        <linearGradient id="ringB" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a37b1c" />
          <stop offset="100%" stopColor="#fbe48a" />
        </linearGradient>
      </defs>
      {/* shield silhouette */}
      <path
        d="M100 12 L180 38 L180 110 C180 152, 145 178, 100 188 C55 178, 20 152, 20 110 L20 38 Z"
        fill="url(#ringB)"
      />
      <path
        d="M100 22 L170 44 L170 108 C170 144, 142 168, 100 178 C58 168, 30 144, 30 108 L30 44 Z"
        fill="url(#bgB)"
      />
      {/* laurel-style olive branches forming a wreath */}
      <g fill="#5e8a3f">
        <ellipse cx="60" cy="100" rx="6" ry="11" transform="rotate(-30 60 100)" />
        <ellipse cx="55" cy="115" rx="6" ry="11" transform="rotate(-15 55 115)" />
        <ellipse cx="55" cy="130" rx="6" ry="11" transform="rotate(10 55 130)" />
        <ellipse cx="140" cy="100" rx="6" ry="11" transform="rotate(30 140 100)" />
        <ellipse cx="145" cy="115" rx="6" ry="11" transform="rotate(15 145 115)" />
        <ellipse cx="145" cy="130" rx="6" ry="11" transform="rotate(-10 145 130)" />
      </g>
      <g fill="#7fb888" opacity="0.85">
        <ellipse cx="65" cy="92" rx="5" ry="9" transform="rotate(-30 65 92)" />
        <ellipse cx="135" cy="92" rx="5" ry="9" transform="rotate(30 135 92)" />
      </g>
      {/* central olive fruit */}
      <ellipse cx="100" cy="120" rx="22" ry="28" fill="#3b6e42" />
      <ellipse cx="94" cy="110" rx="6" ry="10" fill="#7fb04f" opacity="0.7" />
      {/* star above olive */}
      <path
        d="M100 65 L104 76 L116 76 L106 83 L110 95 L100 88 L90 95 L94 83 L84 76 L96 76 Z"
        fill="#fff5d1"
        stroke="#a37b1c"
        strokeWidth="1"
      />
    </svg>
  );
}
