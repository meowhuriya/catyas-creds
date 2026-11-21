import * as React from "react";

/** Crystal glass butterfly (brand mark). `flap` adds a gentle float. */
export function Butterfly({
  size = 64,
  className = "",
  flap = false,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
  flap?: boolean;
  slow?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/butterfly-real-512.png"
      alt=""
      aria-hidden
      width={size}
      height={size}
      draggable={false}
      className={`select-none object-contain ${flap ? "vc-float" : ""} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Small accent dot. */
export function Diamond({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-eyebrow)] ${className}`} />;
}

/** Kept for compatibility with the (now removed) click effects layer. */
export function butterflySvg(_color: string, size: number) {
  return `<img src="/brand/butterfly-real-512.png" width="${size}" height="${size}" alt="" />`;
}
