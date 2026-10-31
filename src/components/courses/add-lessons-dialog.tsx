"use client";

import * as React from "react";
import Image from "next/image";
import { useDataStore } from "@/lib/repository";
import { parseYouTubeUrl } from "@/lib/youtube/parser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusChip, StatusChipType } from "@/components/ui/status-chip";
import { Module, Lesson } from "@/types/schemas";
import { Trash2, Plus, ExternalLink, Loader2, AlertCircle } from "lucide-react";

interface AddLessonsDialogProps {
  courseId: string;
  modules: Module[];
  existingLessons: Lesson[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PreviewItem {
  id: string; // temporary row key
  originalUrl: string;
  videoId?: string;
  startTimeSeconds?: number;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  canEmbed: boolean;
  status: "ready" | "duplicate" | "invalid" | "cannot_embed";
  statusText?: string;
  isCustomTitle?: boolean;
}

export function AddLessonsDialog({
  courseId,
  modules,
  existingLessons,
  open,
  onOpenChange,
  onSuccess,
}: AddLessonsDialogProps) {
  const { dataStore, refreshData } = useDataStore();

  const [inputUrls, setInputUrls] = React.useState("");
  const [selectedModuleId, setSelectedModuleId] = React.useState<string>(
    modules[0]?.id || ""
  );
  const [previewItems, setPreviewItems] = React.useState<PreviewItem[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [step, setStep] = React.useState<"input" | "preview">("input");

  React.useEffect(() => {
    if (modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setInputUrls("");
      setPreviewItems([]);
      setStep("input");
    }
  }, [open]);

  const existingVideoIds = React.useMemo(() => {
    return new Set(existingLessons.map((l) => l.youtubeVideoId));
  }, [existingLessons]);

  const handleProcessLinks = async () => {
    const lines = inputUrls
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    setIsParsing(true);
    const previews: PreviewItem[] = [];
    const seenInBatch = new Set<string>();

    for (const line of lines) {
      const parsed = parseYouTubeUrl(line);

      if (!parsed.isValid) {
        previews.push({
          id: "preview-" + Math.random().toString(36).substring(2, 8),
          originalUrl: line,
          title: "Invalid URL",
          channelTitle: "-",
          thumbnailUrl: "https://i.ytimg.com/vi/placeholder/hqdefault.jpg",
          canEmbed: false,
          status: "invalid",
          statusText: parsed.error || "Invalid YouTube link",
        });
        continue;
      }

      const videoId = parsed.videoId!;

      // Duplicate check (both in existing course lessons and within current batch)
      if (existingVideoIds.has(videoId) || seenInBatch.has(videoId)) {
        previews.push({
          id: "preview-" + Math.random().toString(36).substring(2, 8),
          originalUrl: line,
          videoId,
          title: "Duplicate lecture video",
          channelTitle: "-",
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          canEmbed: true,
          status: "duplicate",
          statusText: "Already added to this course",
        });
        continue;
      }

      seenInBatch.add(videoId);

      // Fetch metadata from our oEmbed route
      try {
        const res = await fetch(`/api/youtube/oembed?id=${videoId}`);
        const data = await res.json();

        if (!data.canEmbed) {
          previews.push({
            id: "preview-" + Math.random().toString(36).substring(2, 8),
            originalUrl: line,
            videoId,
            startTimeSeconds: parsed.startTimeSeconds || 0,
            title: data.title || "Lecture Video (Restricted)",
            channelTitle: data.author_name || "YouTube Creator",
            thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            canEmbed: false,
            status: "cannot_embed",
            statusText: "Creator restricts embedding (Watch on YouTube only)",
          });
        } else {
          previews.push({
            id: "preview-" + Math.random().toString(36).substring(2, 8),
            originalUrl: line,
            videoId,
            startTimeSeconds: parsed.startTimeSeconds || 0,
            title: data.title || "Lecture Video",
            channelTitle: data.author_name || "YouTube Creator",
            thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            canEmbed: true,
            status: "ready",
          });
        }
      } catch (err) {
        previews.push({
          id: "preview-" + Math.random().toString(36).substring(2, 8),
          originalUrl: line,
          videoId,
          startTimeSeconds: parsed.startTimeSeconds || 0,
          title: "Lecture Video",
          channelTitle: "YouTube Creator",
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          canEmbed: true,
          status: "ready",
        });
      }
    }

    setPreviewItems(previews);
    setIsParsing(false);
    setStep("preview");
  };

  const handleRemoveRow = (id: string) => {
    setPreviewItems((prev) => prev.filter((p) => p.id !== id));
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setPreviewItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, title: newTitle, isCustomTitle: true } : item
      )
    );
  };

  const handleSaveLessons = async () => {
    // Only save valid (ready or cannot_embed) items. Duplicates & invalids are ignored.
    const validItems = previewItems.filter(
      (p) => p.status === "ready" || p.status === "cannot_embed"
    );

    if (validItems.length === 0) return;

    try {
      setIsSaving(true);
      let targetModuleId = selectedModuleId;

      // If course has no modules yet, create a default one
      if (!targetModuleId) {
        const createdMod = await dataStore.createModule({
          courseId,
          title: "Module 1: General Lectures",
          order: 0,
          isCollapsed: false,
        });
        targetModuleId = createdMod.id;
      }

      const lessonsToCreate = validItems.map((item, idx) => ({
        courseId,
        moduleId: targetModuleId,
        youtubeVideoId: item.videoId!,
        originalUrl: item.originalUrl,
        title: item.title,
        channelTitle: item.channelTitle,
        thumbnailUrl: item.thumbnailUrl,
        durationSeconds: null, // Pending duration capture when player mounts
        startTimeSeconds: item.startTimeSeconds || 0,
        canEmbed: item.canEmbed,
        order: existingLessons.length + idx,
        cachedAt: new Date().toISOString(),
      }));

      await dataStore.addLessons(lessonsToCreate);
      await refreshData();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to add lessons:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const readyCount = previewItems.filter(
    (p) => p.status === "ready" || p.status === "cannot_embed"
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Course Lessons</DialogTitle>
          <DialogDescription>
            Paste individual YouTube video links to import lecture videos and track watch progress.
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4 text-xs">
            {modules.length > 0 && (
              <div>
                <label className="font-semibold text-app-ink block mb-1">
                  Target Course Module
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="flex h-9 w-full rounded-control border border-app-border bg-app-surface px-3 py-1 text-xs text-app-ink shadow-sm outline-none focus:ring-2 focus:ring-app-accent"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-app-ink block">
                  YouTube Video Links (one per line)
                </label>
                <span className="text-[11px] text-app-ink-muted">
                  Supports watch?v=, youtu.be, /shorts/, and timestamp links
                </span>
              </div>
              <textarea
                rows={6}
                placeholder="https://www.youtube.com/watch?v=tpIctyqH29Q&#10;https://youtu.be/1S0aBV-Waeo?t=15s&#10;https://www.youtube.com/watch?v=fNk_zzaMoSs"
                value={inputUrls}
                onChange={(e) => setInputUrls(e.target.value)}
                className="w-full rounded-control border border-app-border bg-app-surface p-3 font-mono text-xs text-app-ink shadow-sm outline-none focus:ring-2 focus:ring-app-accent placeholder:text-app-ink-muted/60"
              />
            </div>

            <div className="rounded-control border border-app-border bg-app-surface-muted/50 p-3 text-[11px] text-app-ink-muted flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-app-accent mt-0.5" />
              <span>
                Note: Playlist URLs are not supported. Only individual video links will be imported. Duplicates will be detected automatically.
              </span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isParsing || !inputUrls.trim()}
                onClick={handleProcessLinks}
                className="gap-1.5"
              >
                {isParsing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isParsing ? "Fetching Video Metadata..." : "Verify & Preview Links"}</span>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-app-border pb-2">
              <span className="font-medium text-app-ink">
                Verified Preview ({readyCount} of {previewItems.length} ready to save)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("input")}
                className="text-xs h-7"
              >
                ← Back to links
              </Button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-app-border/80 border rounded-control border-app-border bg-app-surface">
              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 flex items-start justify-between gap-3 hover:bg-app-surface-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Thumbnail */}
                    {item.videoId ? (
                      <div className="relative h-14 w-24 shrink-0 rounded bg-black/10 overflow-hidden border border-app-border/60">
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-24 shrink-0 rounded bg-app-surface-muted flex items-center justify-center border border-app-border/60 text-app-ink-muted">
                        <AlertCircle className="h-5 w-5 text-app-danger/60" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {/* Editable title input if embedding is restricted or custom needed */}
                      {item.status === "cannot_embed" ? (
                        <div>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleTitleChange(item.id, e.target.value)}
                            className="w-full rounded border border-app-warning/50 bg-amber-500/5 px-2 py-0.5 text-xs font-semibold text-app-ink"
                            placeholder="Enter manual lesson title"
                          />
                        </div>
                      ) : (
                        <h4 className="font-semibold text-app-ink truncate text-xs">
                          {item.title}
                        </h4>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-app-ink-muted mt-1">
                        <span>Channel: {item.channelTitle}</span>
                        {item.startTimeSeconds ? (
                          <>
                            <span>•</span>
                            <span className="font-mono tabular-nums">
                              Start: {item.startTimeSeconds}s
                            </span>
                          </>
                        ) : null}
                      </div>

                      {item.statusText && (
                        <span className="mt-1 block text-[10px] text-app-danger">
                          {item.statusText}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "ready" && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-app-success border border-emerald-500/20">
                        Ready
                      </span>
                    )}
                    {item.status === "duplicate" && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-app-warning border border-amber-500/20">
                        Duplicate
                      </span>
                    )}
                    {item.status === "cannot_embed" && (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-app-info border border-blue-500/20">
                        External Only
                      </span>
                    )}
                    {item.status === "invalid" && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-app-danger border border-red-500/20">
                        Invalid
                      </span>
                    )}

                    <button
                      onClick={() => handleRemoveRow(item.id)}
                      className="rounded p-1 text-app-ink-muted hover:text-app-danger hover:bg-app-surface-muted transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("input")}
              >
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving || readyCount === 0}
                onClick={handleSaveLessons}
                className="gap-1.5"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {isSaving ? "Saving Lessons..." : `Confirm & Save (${readyCount} Lessons)`}
                </span>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
