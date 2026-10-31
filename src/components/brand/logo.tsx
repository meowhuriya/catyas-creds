import React from "react";

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-label="Valeria’s Creds Logo"
    >
      <rect width="64" height="64" rx="14" fill="#A51C30" />
      <line
        x1="14"
        y1="2"
        x2="50"
        y2="2"
        stroke="#C79A3B"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <text
        x="30"
        y="46"
        fontFamily="var(--font-source-serif-4), Georgia, serif"
        fontSize="38"
        fontWeight="600"
        fill="#FFFFFF"
        textAnchor="middle"
      >
        V
      </text>
      <circle cx="47" cy="45" r="3" fill="#C79A3B" />
    </svg>
  );
}

export function Wordmark({
  size = "md",
  className = "",
  showTagline = true,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showTagline?: boolean;
}) {
  const isSmall = size === "sm";
  const isLarge = size === "lg";

  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <span
        className={`font-serif font-semibold tracking-tight text-ink dark:text-ink-dark ${
          isSmall ? "text-base" : isLarge ? "text-2xl" : "text-lg"
        }`}
      >
        Valeria’s Creds
      </span>
      {showTagline && (
        <span
          className={`font-sans tracking-[0.2em] uppercase font-medium text-ink-muted dark:text-ink-muted-dark ${
            isSmall ? "text-[8px] mt-0.5" : isLarge ? "text-[10px] mt-1" : "text-[9px] mt-0.5"
          }`}
        >
          Learning Portal
        </span>
      )}
    </div>
  );
}

export function BrandHeader({
  size = 32,
  className = "",
  showTagline = true,
}: {
  size?: number;
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      <Wordmark size={size > 36 ? "lg" : size < 28 ? "sm" : "md"} showTagline={showTagline} />
    </div>
  );
}
