"use client";

import * as React from "react";
import { ExternalLink, Maximize2, Minimize2, X } from "lucide-react";
import { VaultLink, toEmbedUrl } from "@/lib/notes/vault-types";

export function LinkViewer({ link, onClose }: { link: VaultLink; onClose: () => void }) {
  const embed = toEmbedUrl(link.url);
  const [full, setFull] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.fullscreenElement && onClose();
    const onFs = () => setFull(!!document.fullscreenElement);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await boxRef.current?.requestFullscreen();
    } catch {
      setFull((f) => !f); // fallback for browsers without the Fullscreen API
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        className={
          "flex flex-col overflow-hidden border border-app-border bg-app-surface shadow-2xl " +
          (full ? "fixed inset-0 rounded-none" : "h-full max-h-[92vh] w-full max-w-5xl rounded-2xl")
        }
      >
        <div className="flex items-center gap-2 border-b border-app-border px-4 py-2.5">
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-app-ink">{link.label}</span>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-xs text-app-ink-muted hover:text-app-ink"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open original
          </a>
          <button onClick={toggleFull} aria-label="Fullscreen" className="rounded-control p-1.5 text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink">
            {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={onClose} aria-label="Close" className="rounded-control p-1.5 text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        {embed ? (
          <iframe
            src={embed}
            title={link.label}
            className="min-h-0 w-full flex-1 bg-white"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-app-ink-muted">
            This link can&apos;t be shown inside the app. Use &ldquo;Open original&rdquo;.
          </div>
        )}
        <p className="border-t border-app-border px-4 py-1.5 text-[11px] text-app-ink-muted">
          Blank or &ldquo;no access&rdquo;? In Drive set the file to <b>Anyone with the link → Viewer</b>.
        </p>
      </div>
    </div>
  );
}
