"use client";

import * as React from "react";
import { Video } from "lucide-react";

interface YouTubeThumbnailProps {
  videoId: string;
  alt: string;
  className?: string;
}

export function YouTubeThumbnail({
  videoId,
  alt,
  className = "h-full w-full object-cover",
}: YouTubeThumbnailProps) {
  const [stage, setStage] = React.useState<"mq" | "hq" | "fallback">("mq");

  React.useEffect(() => {
    setStage("mq");
  }, [videoId]);

  if (stage === "fallback" || !videoId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)]">
        <div className="flex flex-col items-center gap-1">
          <Video className="h-6 w-6 stroke-[1.5]" />
          <span className="text-[10px] uppercase font-sans font-semibold tracking-wider font-semibold">
            Lecture
          </span>
        </div>
      </div>
    );
  }

  const src =
    stage === "mq"
      ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
      : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (stage === "mq") {
          setStage("hq");
        } else {
          setStage("fallback");
        }
      }}
    />
  );
}
