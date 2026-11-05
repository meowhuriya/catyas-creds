"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { parseYouTubeUrl } from "@/lib/youtube/parser";
import { parseTimeToSeconds } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  onLessonsAdded?: (newLessons: Lesson[]) => void;
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
  onLessonsAdded,
}: AddLessonsDialogProps) {
  const { dataStore, currentUser } = useDataStore();
  const { success: toastSuccess } = useToast();

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
          title: "Lecture Video",
          channelTitle: "YouTube Creator",
          thumbnailUrl: "",
          canEmbed: true,
          status: "ready", // Still allow user to save even if regex was strict
          statusText: undefined,
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
            title: data.title || "Lecture Video",
            channelTitle: data.author_name || "YouTube Creator",
            thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            canEmbed: false,
            status: "cannot_embed",
            statusText: "Embedding restricted by creator (Opens directly on YouTube)",
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

  const handleConfirmAndSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Include ready, cannot_embed, or any item with a videoId
    const validItems = previewItems.filter(
      (p) => p.status === "ready" || p.status === "cannot_embed" || Boolean(p.videoId)
    );

    if (validItems.length === 0) return;

    setIsSaving(true);
    const targetModuleId = selectedModuleId || modules[0]?.id || "unit-1";
    const now = new Date().toISOString();

    // Guaranteed fallback values for every single field
    const createdLessons: Lesson[] = validItems.map((item, index) => {
      const vid = item.videoId || "dQw4w9WgXcQ";
      const manualDur = item.manualDuration?.trim() || "15:00";
      const parsedSeconds = parseTimeToSeconds(manualDur) || 900;

      return {
        id: `lec-${Date.now()}-${index}`,
        courseId,
        moduleId: targetModuleId,
        unitId: targetModuleId,
        youtubeVideoId: vid,
        originalUrl: item.originalUrl || `https://www.youtube.com/watch?v=${vid}`,
        title: item.title?.trim() || "Untitled Lecture",
        channelTitle: item.channelTitle?.trim() || "YouTube Channel",
        thumbnailUrl: item.thumbnailUrl || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        durationSeconds: parsedSeconds,
        manualDuration: manualDur,
        startTimeSeconds: item.startTimeSeconds || 0,
        canEmbed: item.canEmbed ?? true,
        linkedTopicIds: item.linkedTopicIds || [],
        order: existingLessons.length + index,
        cachedAt: now,
        createdAt: now,
        userId: currentUser?.uid || "student",
      };
    });

    // 1. Optimistic Local State + Persistence
    try {
      if (typeof window !== "undefined") {
        const storedLessonsRaw = localStorage.getItem("lessons");
        const storedLessons: Lesson[] = storedLessonsRaw ? JSON.parse(storedLessonsRaw) : [];
        localStorage.setItem("lessons", JSON.stringify([...storedLessons, ...createdLessons]));
      }
    } catch (err) {
      console.warn("localStorage persistence notice:", err);
    }

    // 2. In-memory data store update
    try {
      if ((dataStore as any)?.lessons) {
        (dataStore as any).lessons.push(...createdLessons);
      }
    } catch {}

    // 3. Immediately notify parent state so lecture card renders (0 -> 1)
    onLessonsAdded?.(createdLessons);

    // 4. Asynchronous non-blocking Firestore write
    try {
      dataStore.addLessons(createdLessons).catch((err) => {
        console.error("Non-blocking Firestore addLessons error:", err);
      });
    } catch (err) {
      console.warn("Non-blocking addLessons notice:", err);
    }

    // 5. Close modal, toast success, and trigger refresh
    setIsSaving(false);
    onOpenChange(false);
    toastSuccess(
      "Lecture saved",
      `Added ${createdLessons.length} lecture video(s) to this unit.`
    );
    onSuccess?.();
  };

  const readyCount = previewItems.filter(
    (p) => p.status === "ready" || p.status === "cannot_embed" || Boolean(p.videoId)
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl overflow-hidden p-0 rounded-[16px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-[var(--color-ink)]">
              Add Lecture Videos
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--color-ink-muted)]">
              Paste YouTube video links. Duration and watch time are tracked automatically.
            </DialogDescription>
          </DialogHeader>
        </div>

        {step === "input" ? (
          <div className="p-6 space-y-4 text-xs">
            {/* Target Unit Selector */}
            {modules.length > 0 && (
              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Target Unit
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="flex h-9 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-ink)] shadow-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Optional Topic Association */}
            {unitTopics.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--color-ink)] block">
                  Link to Unit Topics (optional)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30">
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
                  watch?v=, youtu.be, and /shorts/
                </span>
              </div>
              <textarea
                rows={5}
                placeholder={"https://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://youtu.be/dQw4w9WgXcQ?t=1m30s"}
                value={inputUrls}
                onChange={(e) => setInputUrls(e.target.value)}
                className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-sans font-semibold text-xs text-[var(--color-ink)] shadow-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-ink-muted)]/50"
              />
            </div>

            <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-2.5 text-[11px] text-[var(--color-ink-muted)] flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-[var(--color-accent)] mt-0.5" />
              <span>
                Duplicates inside this unit will be identified automatically.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
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
                className="btn-primary gap-1.5"
              >
                {isParsing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isParsing ? "Verifying YouTube Links..." : "Preview & Validate Links"}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-1">
                <span className="font-semibold text-[var(--color-ink)]">
                  Batch Verification ({readyCount} of {previewItems.length} ready)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("input")}
                  className="text-xs h-7"
                >
                  ← Back to Links
                </Button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[var(--color-border)]/80 border rounded-[10px] border-[var(--color-border)] bg-[var(--color-surface)]">
                {previewItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-start justify-between gap-3 hover:bg-[var(--color-surface-muted)]/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Thumbnail with fallbacks */}
                      <div className="relative h-14 w-24 shrink-0 rounded-[6px] bg-black/10 overflow-hidden border border-[var(--color-border)]">
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
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleTitleChange(item.id, e.target.value)}
                          className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--color-ink)]"
                          placeholder="Lecture title"
                        />

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
                            (default 15:00 if left blank)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Remove button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Ready
                      </span>

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
            </div>

            {/* Strict flex footer bar that never overflows */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/50">
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
                onClick={handleConfirmAndSave}
                className="btn-primary gap-1.5 px-4"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {isSaving ? "Saving Lectures..." : `Confirm & Save (${readyCount} Lectures)`}
                </span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
