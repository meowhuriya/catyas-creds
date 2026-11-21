"use client";

import * as React from "react";
import { Download, ExternalLink, Eye, FileText, Link2, Loader2, Paperclip, Pin, Presentation, Play } from "lucide-react";
import { useDataStore } from "@/lib/repository";
import { downloadVaultFile, getUploadProgress, subscribeUploads } from "@/lib/notes/vault-files";
import { useMediaUrl } from "@/lib/notes/use-vault";
import { VaultFileRef, VaultLink, VaultNote, formatBytes, toEmbedUrl, youTubeThumb } from "@/lib/notes/vault-types";
import { useToast } from "@/components/ui/toast";
import { LinkViewer } from "@/components/notes/link-viewer";
import { cn } from "@/lib/utils";

export function MediaThumb({
  id,
  className,
  onClick,
}: {
  id: string;
  className?: string;
  onClick?: () => void;
}) {
  const url = useMediaUrl(id);
  if (!url) {
    return <div className={cn("animate-pulse rounded-control bg-app-surface-muted", className)} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Note attachment"
      loading="lazy"
      onClick={onClick}
      className={cn("rounded-control object-cover border border-app-border", onClick && "cursor-zoom-in", className)}
    />
  );
}

export function LinkChip({ link }: { link: VaultLink }) {
  const [open, setOpen] = React.useState(false);
  const thumb = link.kind === "video" ? youTubeThumb(link.url) : null;
  const canEmbed = !!toEmbedUrl(link.url);
  const Inner = (
    <>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="h-6 w-10 rounded-sm object-cover" />
      ) : link.kind === "video" ? (
        <Play className="h-3.5 w-3.5 text-app-accent" />
      ) : link.kind === "drive" ? (
        <FileText className="h-3.5 w-3.5 text-app-accent" />
      ) : (
        <Link2 className="h-3.5 w-3.5 text-app-accent" />
      )}
      <span className="truncate">{link.label}</span>
      {canEmbed ? <Eye className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100" /> : <ExternalLink className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100" />}
    </>
  );
  const cls =
    "group inline-flex max-w-full items-center gap-2 rounded-control border border-app-border bg-app-surface-muted px-2 py-1.5 text-xs font-medium text-app-ink transition-colors hover:border-app-accent";
  if (!canEmbed) {
    return (
      <a href={link.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className={cls}>
        {Inner}
      </a>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cls}
        title="Preview here"
      >
        {Inner}
      </button>
      {open && <LinkViewer link={link} onClose={() => setOpen(false)} />}
    </>
  );
}

export function FileChip({ file, compact }: { file: VaultFileRef; compact?: boolean }) {
  const { firebaseUser } = useDataStore();
  const { error } = useToast();
  const [busy, setBusy] = React.useState(false);
  const syncing = React.useSyncExternalStore(
    subscribeUploads,
    () => getUploadProgress(file.id),
    () => null
  );
  const isDeck = /\.(pptx?|key|odp)$/i.test(file.name);
  const Icon = isDeck ? Presentation : FileText;
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        setBusy(true);
        try {
          await downloadVaultFile(firebaseUser?.uid ?? null, file);
        } catch (err) {
          error("Couldn't open file", err instanceof Error ? err.message : "Try again.");
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex max-w-full items-center gap-2 rounded-control border border-app-border bg-app-surface-muted px-2 py-1.5 text-left text-xs font-medium text-app-ink transition-colors hover:border-app-accent"
      title={`Download ${file.name}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-app-accent" />
      <span className="truncate">{file.name}</span>
      {!compact && <span className="shrink-0 text-app-ink-muted">{formatBytes(file.size)}</span>}
      {syncing !== null && (
        <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-1.5 text-[10px] font-semibold text-[var(--color-accent)]">
          Syncing {syncing}%
        </span>
      )}
      {busy ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : <Download className="h-3 w-3 shrink-0 opacity-50" />}
    </button>
  );
}

export function NoteCard({ note, onOpen }: { note: VaultNote; onOpen: () => void }) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group vc-tile vc-notch flex cursor-pointer flex-col gap-3 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-xl leading-snug text-app-ink line-clamp-2">{note.title}</h3>
        {note.pinned && <Pin className="h-4 w-4 shrink-0 fill-[var(--color-eyebrow)] text-[var(--color-eyebrow)]" aria-label="Pinned" />}
      </div>
      {note.body && <p className="whitespace-pre-wrap text-sm text-app-ink-muted line-clamp-3">{note.body}</p>}
      {note.mediaIds.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {note.mediaIds.slice(0, 4).map((id) => (
            <MediaThumb key={id} id={id} className="aspect-square w-full" />
          ))}
        </div>
      )}
      {note.files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {note.files.slice(0, 2).map((f) => (
            <FileChip key={f.id} file={f} compact />
          ))}
          {note.files.length > 2 && (
            <span className="flex items-center gap-1 text-[11px] text-app-ink-muted">
              <Paperclip className="h-3 w-3" /> +{note.files.length - 2} more files
            </span>
          )}
        </div>
      )}
      {note.links.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {note.links.slice(0, 3).map((l) => (
            <LinkChip key={l.id} link={l} />
          ))}
        </div>
      )}
      <p className="mt-auto text-[11px] text-app-ink-muted">
        {note.mediaIds.length > 0 && `${note.mediaIds.length} photo${note.mediaIds.length > 1 ? "s" : ""} · `}
        Updated {new Date(note.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
      </p>
    </article>
  );
}
