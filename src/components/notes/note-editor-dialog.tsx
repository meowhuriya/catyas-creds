"use client";

import * as React from "react";
import { FilePlus2, ImagePlus, Link2, Loader2, Pin, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { SaveNoteInput } from "@/lib/notes/use-vault";
import {
  VAULT_SECTIONS,
  MAX_FILE_BYTES,
  VaultFileRef,
  VaultLink,
  VaultNote,
  VaultSection,
  classifyLink,
  formatBytes,
  newId,
} from "@/lib/notes/vault-types";
import { FileChip, LinkChip, MediaThumb } from "./note-parts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  defaultSection: VaultSection;
  note: VaultNote | null;
  onSave: (input: SaveNoteInput) => Promise<VaultNote>;
  onDelete: (id: string) => Promise<void>;
  onAddImage: (file: File, noteId: string) => Promise<string>;
  onAddFile: (file: File) => Promise<VaultFileRef>;
}

export function NoteEditorDialog({
  open,
  onOpenChange,
  courseId,
  defaultSection,
  note,
  onSave,
  onDelete,
  onAddImage,
  onAddFile,
}: Props) {
  const { success, error } = useToast();
  const [draftId, setDraftId] = React.useState(() => newId("note"));
  const [section, setSection] = React.useState<VaultSection>(defaultSection);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [links, setLinks] = React.useState<VaultLink[]>([]);
  const [mediaIds, setMediaIds] = React.useState<string[]>([]);
  const [files, setFiles] = React.useState<VaultFileRef[]>([]);
  const [pinned, setPinned] = React.useState(false);
  const [linkInput, setLinkInput] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const docRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setDraftId(note?.id ?? newId("note"));
    setSection(note?.section ?? defaultSection);
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setLinks(note?.links ?? []);
    setMediaIds(note?.mediaIds ?? []);
    setFiles(note?.files ?? []);
    setPinned(note?.pinned ?? false);
    setLinkInput("");
    setConfirmDelete(false);
  }, [open, note, defaultSection]);

  const addLink = () => {
    const link = classifyLink(linkInput);
    if (!link) {
      error("That link doesn't look right", "Paste a full web address, like a YouTube or Google Drive link.");
      return;
    }
    setLinks((prev) => [...prev, link]);
    setLinkInput("");
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        error("Photos only", `"${file.name}" isn't an image. Add videos as a YouTube or Drive link instead.`);
        continue;
      }
      try {
        added.push(await onAddImage(file, draftId));
      } catch (e) {
        error("Couldn't add photo", e instanceof Error ? e.message : "Try a different image.");
      }
    }
    setMediaIds((prev) => [...prev, ...added]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDocs = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    const added: VaultFileRef[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        error("File is too big", `"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)}. Upload larger decks to Google Drive and add the link instead.`);
        continue;
      }
      try {
        added.push(await onAddFile(file));
      } catch {
        error("Couldn't add file", `"${file.name}" could not be stored.`);
      }
    }
    setFiles((prev) => [...prev, ...added]);
    setUploading(false);
    if (docRef.current) docRef.current.value = "";
  };

  const canSave = (title.trim() || body.trim() || mediaIds.length || links.length || files.length) && !uploading && !saving;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        id: draftId,
        courseId,
        section,
        title: title.trim() || body.trim().split("\n")[0].slice(0, 60) || "Untitled note",
        body: body.trim(),
        links,
        mediaIds,
        files,
        pinned,
      });
      success("Saved", "Your note is in the vault.");
      onOpenChange(false);
    } catch {
      error("Couldn't save", "Something went wrong saving this note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Section">
              {VAULT_SECTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={section === s.key}
                  onClick={() => setSection(s.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    section === s.key
                      ? "border-app-accent bg-app-accent text-white"
                      : "border-app-border text-app-ink-muted hover:text-app-ink"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Unit 2 important questions)"
              maxLength={120}
              aria-label="Title"
            />

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write or paste your notes here. Anything your teacher sent on WhatsApp goes here."
              rows={7}
              maxLength={20000}
              aria-label="Note text"
              className="w-full resize-y rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm text-app-ink shadow-sm placeholder:text-app-ink-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-app-ink-muted">Photos</span>
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  Add photos
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
              {mediaIds.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {mediaIds.map((id) => (
                    <div key={id} className="group relative">
                      <MediaThumb id={id} className="aspect-square w-full" onClick={() => setLightbox(id)} />
                      <button
                        type="button"
                        onClick={() => setMediaIds((prev) => prev.filter((m) => m !== id))}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-app-ink-muted">
                  Files (PPT, PDF, Word, Excel)
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => docRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                  Attach files
                </Button>
                <input
                  ref={docRef}
                  type="file"
                  accept=".ppt,.pptx,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.key,.odp,.ods,.odt,.mp3,.m4a,.png,.jpg,.jpeg,.ipynb,.py,.c,.cpp,.java"
                  multiple
                  hidden
                  onChange={(e) => handleDocs(e.target.files)}
                />
              </div>
              {files.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {files.map((f) => (
                    <span key={f.id} className="flex items-center gap-1">
                      <FileChip file={f} />
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                        className="rounded-full p-1 text-app-ink-muted hover:text-app-danger"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-app-ink-muted">
                Up to {formatBytes(MAX_FILE_BYTES)} each (PPTs, PDFs, docs, zips). They open instantly on this device and sync to your other devices in the background. For anything bigger, upload it to Google Drive and paste the link below.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-ink-muted">
                Videos and links
              </span>
              <div className="flex gap-2">
                <Input
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLink();
                    }
                  }}
                  placeholder="Paste a YouTube, Drive or any link"
                  inputMode="url"
                  aria-label="Add link"
                />
                <Button type="button" variant="outline" onClick={addLink} disabled={!linkInput.trim()}>
                  <Link2 className="h-4 w-4" /> Add
                </Button>
              </div>
              {links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {links.map((l) => (
                    <span key={l.id} className="inline-flex max-w-full items-center gap-1">
                      <LinkChip link={l} />
                      <button
                        type="button"
                        onClick={() => setLinks((prev) => prev.filter((x) => x.id !== l.id))}
                        className="rounded-full p-1 text-app-ink-muted hover:text-app-danger"
                        aria-label={`Remove ${l.label}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-app-ink-muted">
                Videos are saved as links so the app stays light. Upload them to YouTube (unlisted) or Google Drive first.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-app-ink">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
              <Pin className="h-3.5 w-3.5 text-app-accent" /> Pin to the top
            </label>
          </div>

          <DialogFooter className="items-center gap-2">
            {note && (
              <div className="mr-auto">
                {confirmDelete ? (
                  <span className="flex items-center gap-2 text-xs">
                    Delete this note?
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={async () => {
                        await onDelete(note.id);
                        onOpenChange(false);
                      }}
                    >
                      Yes, delete
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                      Keep
                    </Button>
                  </span>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                )}
              </div>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!canSave}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-label="Photo preview"
        >
          <LightboxImage id={lightbox} />
          <button className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white" aria-label="Close preview">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}

function LightboxImage({ id }: { id: string }) {
  return <MediaThumb id={id} className="max-h-[90vh] max-w-full border-0 object-contain" />;
}
