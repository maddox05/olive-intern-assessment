export function SkyHillsBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <svg
        className="absolute inset-x-0 top-0 h-[55vh] w-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbe9a8" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#f7d57c" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f7d57c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="980" cy="120" r="130" fill="url(#sun)" />
        {/* Soft cloud blobs */}
        <g fill="#ffffff" opacity="0.85">
          <ellipse cx="180" cy="170" rx="110" ry="28" />
          <ellipse cx="240" cy="155" rx="60" ry="22" />
          <ellipse cx="130" cy="155" rx="55" ry="20" />
        </g>
        <g fill="#ffffff" opacity="0.75">
          <ellipse cx="780" cy="240" rx="130" ry="30" />
          <ellipse cx="850" cy="225" rx="60" ry="22" />
          <ellipse cx="720" cy="225" rx="50" ry="18" />
        </g>
        <g fill="#ffffff" opacity="0.7">
          <ellipse cx="430" cy="320" rx="95" ry="22" />
          <ellipse cx="490" cy="308" rx="42" ry="16" />
        </g>
      </svg>

      {/* Rolling hills pinned to bottom */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[40vh] w-full"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
      >
        <path
          d="M0,260 C200,200 380,330 600,290 C820,250 1000,330 1200,260 L1200,400 L0,400 Z"
          fill="#cfe6d2"
          opacity="0.7"
        />
        <path
          d="M0,310 C220,260 420,360 660,320 C900,280 1060,360 1200,310 L1200,400 L0,400 Z"
          fill="#a8d2ae"
          opacity="0.85"
        />
        <path
          d="M0,360 C260,330 480,380 720,360 C960,340 1080,380 1200,360 L1200,400 L0,400 Z"
          fill="#7fb888"
        />
      </svg>
    </div>
  );
}
