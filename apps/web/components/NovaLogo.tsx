interface NovaLogoProps {
  size?: number;
}

export function NovaLogo({ size = 32 }: NovaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer glow ring */}
      <circle cx="16" cy="16" r="15" stroke="url(#nova-gradient)" strokeWidth="1.5" opacity="0.4" />
      
      {/* Inner hexagon shape */}
      <path
        d="M16 4 L26 9.5 L26 22.5 L16 28 L6 22.5 L6 9.5 Z"
        fill="url(#nova-fill)"
        opacity="0.15"
      />
      
      {/* N letter */}
      <path
        d="M10 22V10L16 18V10M16 18L22 10V22"
        stroke="url(#nova-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <defs>
        <linearGradient id="nova-gradient" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="nova-fill" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
      </defs>
    </svg>
  );
}
