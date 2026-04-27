export function OliveLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      {/* Olive */}
      <ellipse cx="16" cy="20" rx="7" ry="9" fill="#5e8a3f" />
      <ellipse cx="14" cy="17" rx="2" ry="3" fill="#7fb04f" opacity="0.7" />
      {/* Stem */}
      <path
        d="M16 11 C16 6, 20 4, 24 5"
        stroke="#3b6e42"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaves */}
      <ellipse cx="22" cy="6" rx="4.5" ry="2" fill="#7fb888" transform="rotate(20 22 6)" />
      <ellipse cx="20" cy="9" rx="3.5" ry="1.6" fill="#5e8a3f" transform="rotate(-15 20 9)" />
    </svg>
  );
}
