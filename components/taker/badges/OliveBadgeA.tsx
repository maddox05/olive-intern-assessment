// Ticket-shaped badge — landscape 5:3 (matches HOLO.png reference).
// All 3 badges share this outer silhouette so the HolographicBadge
// overlay can sit on top with rounded-2xl and clip cleanly.
export function OliveBadgeA({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 168"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="ticketA" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3c84a" />
          <stop offset="55%" stopColor="#d4a84b" />
          <stop offset="100%" stopColor="#a37b1c" />
        </linearGradient>
      </defs>

      {/* Outer ticket — rounded rectangle */}
      <rect x="2" y="2" width="276" height="164" rx="16" fill="url(#ticketA)" />
      {/* Inner ticket frame */}
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

      {/* Perforation between left section and the "stub" on right */}
      <line
        x1="208"
        y1="14"
        x2="208"
        y2="154"
        stroke="rgba(122, 88, 18, 0.6)"
        strokeWidth="1"
        strokeDasharray="3 4"
      />

      {/* Top wordmark */}
      <text
        x="20"
        y="34"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="10"
        fontWeight="700"
        letterSpacing="2.6"
        fill="#5e3f08"
      >
        OLIVE BADGE
      </text>

      {/* Big single olive (variant A signature) */}
      <ellipse cx="100" cy="100" rx="32" ry="40" fill="#3b6e42" />
      <ellipse cx="92" cy="86" rx="9" ry="14" fill="#5e8a3f" opacity="0.7" />
      <path
        d="M100 70 C100 50, 122 40, 140 41"
        stroke="#3b6e42"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="138" cy="41" rx="18" ry="7" fill="#7fb888" transform="rotate(20 138 41)" />
      <ellipse cx="125" cy="49" rx="13" ry="5.5" fill="#5e8a3f" transform="rotate(-15 125 49)" />

      {/* Right stub — vertical "ADMIT ONE" style label */}
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
        OFFICIAL
      </text>

      {/* Bottom wordmark */}
      <text
        x="20"
        y="148"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="8"
        fontWeight="600"
        letterSpacing="1.6"
        fill="rgba(94, 63, 8, 0.7)"
      >
        OLIVE QUIZ STUDIO · No.001
      </text>
    </svg>
  );
}
