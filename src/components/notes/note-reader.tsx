"use client";

import * as React from "react";
import { ExternalLink, Maximize2, Minimize2, Pencil, Sparkles, X } from "lucide-react";
import { VaultNote, toEmbedUrl } from "@/lib/notes/vault-types";
import { FileChip, MediaThumb } from "@/components/notes/note-parts";
import { TopicChecklist } from "@/components/notes/topic-checklist";
import { useNoteTopics } from "@/lib/notes/study";
import { cn } from "@/lib/utils";

export function NoteReader({
  note,
  onClose,
  onEdit,
  onPractice,
}: {
  note: VaultNote;
  onClose: () => void;
  onEdit: () => void;
  onPractice: () => void;
}) {
  const embeddable = note.links.filter((l) => toEmbedUrl(l.url));
  const [active, setActive] = React.useState(0);
  const [full, setFull] = React.useState(false);
  const [zoom, setZoom] = React.useState<string | null>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const current = embeddable[Math.min(active, embeddable.length - 1)];
  const hasDetails = !!note.body || note.mediaIds.length > 0 || note.files.length > 0 || note.links.length > embeddable.length;
  const [details, setDetails] = React.useState(true);
  const prog = useNoteTopics().progress(note.id);

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
      setFull((f) => !f);
    }
  };

  const btn = "rounded-control p-1.5 text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex flex-col overflow-hidden border border-app-border bg-app-surface shadow-2xl",
          full ? "fixed inset-0 rounded-none" : "h-full max-h-[94vh] w-full max-w-6xl rounded-2xl"
        )}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-app-border px-4 py-2.5">
          <h2 className="min-w-0 flex-1 truncate font-display text-lg text-app-ink">{note.title}</h2>
          {embeddable.length > 1 && (
            <div className="flex gap-1">
              {embeddable.map((l, i) => (
                <button key={l.id} onClick={() => setActive(i)} className={cn("rounded-full px-2.5 py-1 text-xs", i === active ? "bg-app-accent text-white" : "bg-app-surface-muted text-app-ink-muted hover:text-app-ink")}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setDetails((d) => !d)} className="rounded-control px-2 py-1 text-xs text-app-ink-muted hover:text-app-ink">
            {details ? "Hide topics" : `Topics ${prog.done}/${prog.total}`}
          </button>
          <button onClick={onPractice} className="inline-flex items-center gap-1 rounded-control bg-[var(--accent-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-accent)]"><Sparkles className="h-3.5 w-3.5" /> Practise</button>
          {current && (<a href={current.url} target="_blank" rel="noreferrer" className={btn} aria-label="Open original" title="Open original"><ExternalLink className="h-4 w-4" /></a>)}
          <button onClick={onEdit} className={btn} aria-label="Edit note" title="Edit"><Pencil className="h-4 w-4" /></button>
          <button onClick={toggleFull} className={btn} aria-label="Fullscreen" title="Fullscreen">{full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
          <button onClick={onClose} className={btn} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {current && (
            <iframe key={current.id} src={toEmbedUrl(current.url)!} title={current.label} className="min-h-0 flex-1 bg-white" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen />
          )}
          {(details || !current) && (
            <aside className={cn("space-y-4 overflow-y-auto p-5", current ? "max-h-[40%] border-t border-app-border lg:max-h-none lg:w-80 lg:border-l lg:border-t-0" : "flex-1")}>
              <TopicChecklist note={note} />
              {note.body && <p className="whitespace-pre-wrap text-sm leading-relaxed text-app-ink">{note.body}</p>}
              {note.mediaIds.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {note.mediaIds.map((id) => (<MediaThumb key={id} id={id} className="aspect-square w-full" onClick={() => setZoom(id)} />))}
                </div>
              )}
              {note.files.length > 0 && (<div className="flex flex-col gap-1.5">{note.files.map((f) => (<FileChip key={f.id} file={f} />))}</div>)}
              {note.links.filter((l) => !toEmbedUrl(l.url)).map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-app-accent hover:underline"><ExternalLink className="h-3.5 w-3.5" /> {l.label}</a>
              ))}
              
            </aside>
          )}
        </div>
      </div>
      {zoom && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" onClick={(e) => { e.stopPropagation(); setZoom(null); }}>
          <ZoomImage id={zoom} />
        </div>
      )}
    </div>
  );
}

import { useMediaUrl } from "@/lib/notes/use-vault";
function ZoomImage({ id }: { id: string }) {
  const url = useMediaUrl(id);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" className="max-h-full max-w-full rounded-lg object-contain" /> : null;
}
