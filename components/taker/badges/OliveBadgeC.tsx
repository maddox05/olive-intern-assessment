// Ticket-shaped badge variant C — triple-olive cluster on the same
// rounded-rectangle silhouette as A and B.
export function OliveBadgeC({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 168"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="ticketC" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff5d1" />
          <stop offset="50%" stopColor="#f3c84a" />
          <stop offset="100%" stopColor="#a37b1c" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="276" height="164" rx="16" fill="url(#ticketC)" />
      <rect
        x="8"
        y="8"
        width="264"
        height="152"
        rx="12"
        fill="none"
        stroke="rgba(122, 88, 18, 0.55)"
        strokeWidth="0.8"
      />
      <line
        x1="208"
        y1="14"
        x2="208"
        y2="154"
        stroke="rgba(122, 88, 18, 0.6)"
        strokeWidth="1"
        strokeDasharray="3 4"
      />

      <text
        x="20"
        y="34"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="10"
        fontWeight="700"
        letterSpacing="2.6"
        fill="#5e3f08"
      >
        OLIVE TRIO
      </text>

      {/* Triple-olive cluster */}
      <g>
        <ellipse cx="78" cy="110" rx="20" ry="26" fill="#3b6e42" />
        <ellipse cx="74" cy="98" rx="6" ry="10" fill="#5e8a3f" opacity="0.7" />
        <ellipse cx="122" cy="110" rx="20" ry="26" fill="#5e8a3f" />
        <ellipse cx="118" cy="98" rx="6" ry="10" fill="#7fb04f" opacity="0.7" />
        <ellipse cx="100" cy="86" rx="22" ry="28" fill="#7fb04f" />
        <ellipse cx="96" cy="74" rx="7" ry="11" fill="#a8d2ae" opacity="0.7" />
      </g>
      {/* Leaf above */}
      <path
        d="M100 64 C100 48, 124 40, 142 42"
        stroke="#3b6e42"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="138" cy="42" rx="16" ry="6" fill="#7fb888" transform="rotate(15 138 42)" />
      <ellipse cx="124" cy="50" rx="11" ry="4.5" fill="#5e8a3f" transform="rotate(-10 124 50)" />

      <text
        x="240"
        y="84"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="3"
        fill="#5e3f08"
        transform="rotate(-90 240 84)"
        textAnchor="middle"
      >
        FIRST CLASS
      </text>

      <text
        x="20"
        y="148"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="8"
        fontWeight="600"
        letterSpacing="1.6"
        fill="rgba(94, 63, 8, 0.7)"
      >
        OLIVE QUIZ STUDIO · No.003
      </text>
    </svg>
  );
}
