import React from "react";

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div style={{ width: size, height: size }} className={`vc-logo relative shrink-0 ${className}`} aria-label="Valeria's Creds">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/butterfly-real-180.png" alt="Valeria's Creds butterfly" width={size} height={size} className="h-full w-full select-none object-contain" draggable={false} />
    </div>
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
        className={`font-display font-semibold tracking-[-0.02em] text-[var(--color-ink)] ${
          isSmall ? "text-[15px]" : isLarge ? "text-2xl" : "text-lg"
        }`}
      >
        Valeria's Creds
      </span>
      {showTagline && (
        <span
          className={`font-sans font-medium text-[var(--ink-faint)] ${
            isSmall ? "text-[11px] mt-0.5" : isLarge ? "text-[13px] mt-1" : "text-[12px] mt-0.5"
          }`}
        >
          Learning portal
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
