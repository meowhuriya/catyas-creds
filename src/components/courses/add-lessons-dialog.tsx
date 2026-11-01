"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { parseYouTubeUrl } from "@/lib/youtube/parser";
import { parseTimeToSeconds } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { YouTubeThumbnail } from "@/components/courses/youtube-thumbnail";
import { Module, Lesson, Topic } from "@/types/schemas";
import { Trash2, AlertCircle, Loader2, CheckSquare, Square, Clock } from "lucide-react";

interface AddLessonsDialogProps {
  courseId: string;
  modules: Module[];
  existingLessons: Lesson[];
  topics?: Topic[];
  targetUnitId?: string;
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
  manualDuration?: string;
  linkedTopicIds: string[];
}

export function AddLessonsDialog({
  courseId,
  modules,
  existingLessons,
  topics = [],
  targetUnitId,
  open,
  onOpenChange,
  onSuccess,
}: AddLessonsDialogProps) {
  const { dataStore, refreshData } = useDataStore();

  const [inputUrls, setInputUrls] = React.useState("");
  const [selectedModuleId, setSelectedModuleId] = React.useState<string>(
    targetUnitId || modules[0]?.id || ""
  );
  const [selectedTopicIds, setSelectedTopicIds] = React.useState<string[]>([]);
  const [previewItems, setPreviewItems] = React.useState<PreviewItem[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [step, setStep] = React.useState<"input" | "preview">("input");

  // Keep selected module aligned when targetUnitId changes or modal opens
  React.useEffect(() => {
    if (targetUnitId) {
      setSelectedModuleId(targetUnitId);
    } else if (modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(modules[0].id);
    }
  }, [targetUnitId, modules, selectedModuleId]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setInputUrls("");
      setPreviewItems([]);
      setSelectedTopicIds([]);
      setStep("input");
      if (targetUnitId) {
        setSelectedModuleId(targetUnitId);
      }
    }
  }, [open, targetUnitId]);

  // Available topics for selected unit
  const unitTopics = React.useMemo(() => {
    return topics.filter((t) => t.unitId === selectedModuleId);
  }, [topics, selectedModuleId]);

  // Existing video IDs in the current unit/module to block duplicates
  const existingVideoIdsInUnit = React.useMemo(() => {
    return new Set(
      existingLessons
        .filter((l) => l.moduleId === selectedModuleId || l.unitId === selectedModuleId)
        .map((l) => l.youtubeVideoId)
    );
  }, [existingLessons, selectedModuleId]);

  const toggleTopicSelection = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

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
          thumbnailUrl: "",
          canEmbed: false,
          status: "invalid",
          statusText: parsed.error || "Invalid YouTube link",
          linkedTopicIds: [...selectedTopicIds],
        });
        continue;
      }

      const videoId = parsed.videoId!;

      // Block duplicates inside unit (and within current batch)
      if (existingVideoIdsInUnit.has(videoId) || seenInBatch.has(videoId)) {
        previews.push({
          id: "preview-" + Math.random().toString(36).substring(2, 8),
          originalUrl: line,
          videoId,
          title: "Duplicate lecture video",
          channelTitle: "-",
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          canEmbed: true,
          status: "duplicate",
          statusText: "Already added to this unit",
          linkedTopicIds: [...selectedTopicIds],
        });
        continue;
      }

      seenInBatch.add(videoId);

      // Fetch metadata from official oEmbed route
      try {
        const res = await fetch(`/api/youtube/oembed?id=${videoId}`);
        const data = await res.json();

        if (!data.canEmbed) {
          previews.push({
            id: "preview-" + Math.random().toString(36).substring(2, 8),
            originalUrl: line,
            videoId,
            startTimeSeconds: parsed.startTimeSeconds || 0,
            title: data.title || "Lecture Video (Embedding Restricted)",
            channelTitle: data.author_name || "YouTube Creator",
            thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            canEmbed: false,
            status: "cannot_embed",
            statusText: "Embedding restricted by creator (Watch on YouTube only)",
            linkedTopicIds: [...selectedTopicIds],
          });
        } else {
          previews.push({
            id: "preview-" + Math.random().toString(36).substring(2, 8),
            originalUrl: line,
            videoId,
            startTimeSeconds: parsed.startTimeSeconds || 0,
            title: data.title || "Lecture Video",
            channelTitle: data.author_name || "YouTube Creator",
            thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            canEmbed: true,
            status: "ready",
            linkedTopicIds: [...selectedTopicIds],
          });
        }
      } catch {
        previews.push({
          id: "preview-" + Math.random().toString(36).substring(2, 8),
          originalUrl: line,
          videoId,
          startTimeSeconds: parsed.startTimeSeconds || 0,
          title: "Lecture Video",
          channelTitle: "YouTube Creator",
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          canEmbed: true,
          status: "ready",
          linkedTopicIds: [...selectedTopicIds],
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
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  const handleDurationChange = (id: string, newDuration: string) => {
    setPreviewItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, manualDuration: newDuration } : item))
    );
  };

  const handleSaveLessons = async () => {
    // Only save valid (ready or cannot_embed) items. Duplicates & invalids are rejected.
    const validItems = previewItems.filter(
      (p) => p.status === "ready" || p.status === "cannot_embed"
    );

    if (validItems.length === 0) return;

    try {
      setIsSaving(true);
      let targetModuleId = selectedModuleId;

      if (!targetModuleId) {
        const createdMod = await dataStore.createModule({
          courseId,
          title: "Unit 1: Foundations",
          order: 0,
          isCollapsed: false,
        });
        targetModuleId = createdMod.id;
      }

      const lessonsToCreate = validItems.map((item, idx) => {
        const parsedSeconds = item.manualDuration
          ? parseTimeToSeconds(item.manualDuration)
          : null;

        return {
          courseId,
          moduleId: targetModuleId,
          unitId: targetModuleId,
          youtubeVideoId: item.videoId!,
          originalUrl: item.originalUrl,
          title: item.title,
          channelTitle: item.channelTitle,
          thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
          durationSeconds: parsedSeconds,
          manualDuration: item.manualDuration || undefined,
          startTimeSeconds: item.startTimeSeconds || 0,
          canEmbed: item.canEmbed,
          linkedTopicIds: item.linkedTopicIds || [],
          order: existingLessons.length + idx,
          cachedAt: new Date().toISOString(),
        };
      });

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
          <DialogTitle className="font-serif">Add Lecture Videos</DialogTitle>
          <DialogDescription>
            Paste individual YouTube video links. Watch time will be verified through the official player.
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4 text-xs">
            {/* Target Unit Selector */}
            {modules.length > 0 && (
              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Target Unit
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="flex h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-ink)] shadow-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Optional Topic Linking */}
            {unitTopics.length > 0 && (
              <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[var(--color-ink)] text-xs">
                    Link to Topics in this Unit (Optional)
                  </label>
                  <span className="text-[10px] text-[var(--color-ink-muted)]">
                    Completing linked videos awards 40 mastery points
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                  {unitTopics.map((top) => {
                    const isChecked = selectedTopicIds.includes(top.id);
                    return (
                      <button
                        key={top.id}
                        type="button"
                        onClick={() => toggleTopicSelection(top.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-medium border transition-colors ${
                          isChecked
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-3 w-3 text-[var(--color-accent)]" />
                        ) : (
                          <Square className="h-3 w-3 text-[var(--color-ink-muted)]" />
                        )}
                        <span className="truncate max-w-[200px]">{top.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multiline Links Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[var(--color-ink)] block">
                  YouTube Video Links (one per line)
                </label>
                <span className="text-[11px] text-[var(--color-ink-muted)]">
                  watch?v=, youtu.be, /shorts/, and timestamp (?t=) links
                </span>
              </div>
              <textarea
                rows={5}
                placeholder={"https://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://youtu.be/dQw4w9WgXcQ?t=1m30s"}
                value={inputUrls}
                onChange={(e) => setInputUrls(e.target.value)}
                className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-sans font-semibold text-xs text-[var(--color-ink)] shadow-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-ink-muted)]/50"
              />
            </div>

            <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-2.5 text-[11px] text-[var(--color-ink-muted)] flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-[var(--color-accent)] mt-0.5" />
              <span>
                Playlist-only links are not supported. Duplicates inside this unit will be blocked automatically.
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
                <span>{isParsing ? "Verifying YouTube Links..." : "Preview & Validate Links"}</span>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <span className="font-semibold text-[var(--color-ink)]">
                Batch Verification ({readyCount} of {previewItems.length} ready)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("input")}
                className="text-xs h-7"
              >
                ← Back to Links
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border)]/80 border rounded-[8px] border-[var(--color-border)] bg-[var(--color-surface)]">
              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 flex items-start justify-between gap-3 hover:bg-[var(--color-surface-muted)]/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Thumbnail with fallbacks */}
                    <div className="relative h-14 w-24 shrink-0 rounded-[4px] bg-black/10 overflow-hidden border border-[var(--color-border)]">
                      {item.videoId ? (
                        <YouTubeThumbnail
                          videoId={item.videoId}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-[var(--color-surface-muted)] text-[var(--color-danger)]">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Title editable if embedding is off or student wants manual title */}
                      {item.status === "cannot_embed" ? (
                        <div>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleTitleChange(item.id, e.target.value)}
                            className="w-full rounded border border-amber-500/50 bg-amber-500/5 px-2 py-0.5 text-xs font-semibold text-[var(--color-ink)]"
                            placeholder="Enter manual video title"
                          />
                        </div>
                      ) : (
                        <h4 className="font-serif text-xs font-bold text-[var(--color-ink)] truncate">
                          {item.title}
                        </h4>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-muted)]">
                        <span>Channel: {item.channelTitle}</span>
                        {item.startTimeSeconds ? (
                          <>
                            <span>•</span>
                            <span className="font-sans font-semibold tabular-nums">
                              Start: {item.startTimeSeconds}s
                            </span>
                          </>
                        ) : null}
                      </div>

                      {/* Manual duration input option */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <Clock className="h-3 w-3 text-[var(--color-ink-muted)]" />
                        <input
                          type="text"
                          placeholder="Duration (e.g. 15:30)"
                          value={item.manualDuration || ""}
                          onChange={(e) => handleDurationChange(item.id, e.target.value)}
                          className="h-5 w-28 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 text-[10px] font-sans font-semibold text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/50"
                        />
                        <span className="text-[10px] text-[var(--color-ink-muted)]">
                          (optional; captured automatically in player)
                        </span>
                      </div>

                      {item.statusText && (
                        <span className="block text-[10px] text-[var(--color-danger)] font-medium">
                          {item.statusText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge & Remove button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "ready" && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Ready
                      </span>
                    )}
                    {item.status === "duplicate" && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        Duplicate
                      </span>
                    )}
                    {item.status === "cannot_embed" && (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400 border border-blue-500/20">
                        Cannot Embed
                      </span>
                    )}
                    {item.status === "invalid" && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400 border border-red-500/20">
                        Invalid
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveRow(item.id)}
                      className="rounded p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-danger)] transition-colors"
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
                  {isSaving ? "Saving Lectures..." : `Confirm & Save (${readyCount} Lectures)`}
                </span>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
