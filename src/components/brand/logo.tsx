import React from "react";

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 flex items-center justify-center ${className}`}
      aria-label="Valeria's Creds Cat Sticker Logo"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cat-sticker.png"
        alt="Valeria's Creds Cat Sticker"
        width={size}
        height={size}
        className="h-full w-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.16)] select-none hover:scale-110 transition-transform duration-200"
      />
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
        className={`font-heading font-semibold tracking-tight text-[var(--color-ink)] ${
          isSmall ? "text-base" : isLarge ? "text-2xl" : "text-lg"
        }`}
      >
        Valeria's Creds
      </span>
      {showTagline && (
        <span
          className={`font-sans tracking-[0.18em] uppercase font-bold text-[var(--color-eyebrow)] ${
            isSmall ? "text-[10px] mt-0.5" : isLarge ? "text-xs mt-1" : "text-[11px] mt-0.5"
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
