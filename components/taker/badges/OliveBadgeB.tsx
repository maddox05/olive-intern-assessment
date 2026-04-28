// Ticket-shaped badge variant B — laurel-wreath olive on the same
// rounded-rectangle silhouette as A and C.
export function OliveBadgeB({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 168"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="ticketB" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde98e" />
          <stop offset="55%" stopColor="#d4a84b" />
          <stop offset="100%" stopColor="#8a6217" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="276" height="164" rx="16" fill="url(#ticketB)" />
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
        OLIVE LAUREL
      </text>

      {/* Laurel wreath olives encircling a star */}
      <g fill="#3b6e42">
        <ellipse cx="58" cy="92" rx="6" ry="11" transform="rotate(-30 58 92)" />
        <ellipse cx="55" cy="108" rx="6" ry="11" transform="rotate(-15 55 108)" />
        <ellipse cx="60" cy="124" rx="6" ry="11" transform="rotate(15 60 124)" />
        <ellipse cx="142" cy="92" rx="6" ry="11" transform="rotate(30 142 92)" />
        <ellipse cx="145" cy="108" rx="6" ry="11" transform="rotate(15 145 108)" />
        <ellipse cx="140" cy="124" rx="6" ry="11" transform="rotate(-15 140 124)" />
      </g>
      <g fill="#7fb888" opacity="0.85">
        <ellipse cx="65" cy="84" rx="5" ry="9" transform="rotate(-30 65 84)" />
        <ellipse cx="135" cy="84" rx="5" ry="9" transform="rotate(30 135 84)" />
      </g>
      {/* Star in center */}
      <path
        d="M100 76 L106 92 L122 92 L109 102 L114 118 L100 109 L86 118 L91 102 L78 92 L94 92 Z"
        fill="#fff5d1"
        stroke="#a37b1c"
        strokeWidth="1.2"
      />

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
        AWARDED
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
        OLIVE QUIZ STUDIO · No.002
      </text>
    </svg>
  );
}
