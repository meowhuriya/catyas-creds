"use client";

import * as React from "react";
import { Species, bloomSvg, bouquetSvg, flowerSvg } from "@/lib/focus/flowers";

/** Renders the generated flower art. The markup comes from our own generator, never from user text. */
export function Flower({ species, progress, wilted, size = 140, className }: { species: Species; progress: number; wilted?: boolean; size?: number; className?: string }) {
  const uid = React.useId().replace(/:/g, "");
  const html = React.useMemo(() => flowerSvg({ species, progress, uid, wilted, size }), [species, progress, uid, wilted, size]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Bloom({ species, size = 56 }: { species: Species; size?: number }) {
  const uid = React.useId().replace(/:/g, "");
  const html = React.useMemo(() => bloomSvg({ species, uid, size }), [species, uid, size]);
  return <span className="inline-block" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Bouquet({ kinds, size = 260 }: { kinds: Species[]; size?: number }) {
  const uid = React.useId().replace(/:/g, "");
  const html = React.useMemo(() => bouquetSvg(kinds, uid, { size }), [kinds, uid, size]);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Save a bouquet as a PNG picture. */
export function downloadBouquet(kinds: Species[], name: string) {
  const svg = bouquetSvg(kinds, "dl", { size: 900 });
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = 900;
    c.height = 900;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FBF8FF";
    ctx.fillRect(0, 0, 900, 900);
    ctx.drawImage(img, 0, 0, 900, 900);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.download = `${name}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  };
  img.src = url;
}
