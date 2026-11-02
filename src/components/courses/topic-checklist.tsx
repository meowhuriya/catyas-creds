"use client";

import * as React from "react";
import {
  MoreVertical,
  Scissors,
  GitMerge,
  Trash2,
  Edit2,
  Plus,
  ArrowUp,
  ArrowDown,
  Check,
  Award,
  FlaskConical,
  Sparkles,
  Target,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SplitTopicDialog } from "@/components/courses/split-topic-dialog";
import { MergeTopicDialog } from "@/components/courses/merge-topic-dialog";
import { SectionBar } from "@/components/ui/section-bar";
import { Topic, Module, Course } from "@/types/schemas";
import { cleanSyllabusTitle } from "@/lib/utils";
import { SoundEngine } from "@/lib/sound-engine";
import { triggerCelebration, triggerFloatingReward } from "@/components/ui/CelebrationOverlay";

interface TopicChecklistProps {
  course: Course;
  unit: Module;
  topics: Topic[];
  onUpdateTopic: (topicId: string, updates: Partial<Topic>) => Promise<void>;
  onCreateTopic: (title: string) => Promise<void>;
  onDeleteTopic: (topicId: string) => Promise<void>;
  onSplitTopic: (topicId: string, title1: string, title2: string) => Promise<void>;
  onMergeTopics: (primaryId: string, secondaryId: string, combinedTitle: string) => Promise<void>;
  onStartQuickCheck?: (topic: Topic) => void;
  onOpenTopicAi?: (topic: Topic) => void;
  onStartMasteryLoop?: (topic: Topic) => void;
  className?: string;
}

export function TopicChecklist({
  course,
  unit,
  topics,
  onUpdateTopic,
  onCreateTopic,
  onDeleteTopic,
  onSplitTopic,
  onMergeTopics,
  onStartQuickCheck,
  onOpenTopicAi,
  onStartMasteryLoop,
  className = "",
}: TopicChecklistProps) {
  const [editingTopicId, setEditingTopicId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [newTopicTitle, setNewTopicTitle] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [hideCompleted, setHideCompleted] = React.useState(false);

  // Split & Merge modal states
  const [splitTopic, setSplitTopic] = React.useState<Topic | null>(null);
  const [mergeTopic, setMergeTopic] = React.useState<{ current: Topic; next: Topic } | null>(null);

  // Lab Elective Calculation ("any N experiments")
  const electiveCount = unit.electiveExperimentsCount || course.electiveExperimentsCount;
  const isElectiveLab = typeof electiveCount === "number" && electiveCount > 0;

  // Selected experiments for elective lab
  const selectedTopics = isElectiveLab
    ? topics.filter((t) => t.isSelectedExperiment !== false)
    : topics;
  const completedCount = selectedTopics.filter((t) => t.isDone).length;
  const requiredTarget = isElectiveLab ? Math.min(electiveCount, topics.length) : topics.length;

  const visibleTopics = React.useMemo(() => {
    if (!hideCompleted) return topics;
    return topics.filter((t) => !t.isDone);
  }, [topics, hideCompleted]);

  const handleStartEdit = (t: Topic) => {
    setEditingTopicId(t.id);
    setEditTitle(t.title);
  };

  const handleSaveEdit = async (topicId: string) => {
    if (editTitle.trim()) {
      await onUpdateTopic(topicId, { title: editTitle.trim() });
    }
    setEditingTopicId(null);
  };

  const handleToggleStudied = async (t: Topic) => {
    const willBeStudied = !t.isStudiedManually;
    SoundEngine.getInstance().playToggle(willBeStudied);
    const newWatchScore = willBeStudied ? 40 : 0;
    const newTopicScore = newWatchScore + (t.checkScore || 0);
    const willBeDone = newTopicScore >= 70;

    if (willBeStudied) {
      triggerFloatingReward("+40 Study Pts");
      if (willBeDone && !t.isDone) {
        SoundEngine.getInstance().playMasteryFanfare();
        triggerCelebration({
          title: "Topic Mastered!",
          subtitle: cleanSyllabusTitle(t.title),
          xp: 100,
        });
      }
    }

    await onUpdateTopic(t.id, {
      isStudiedManually: willBeStudied,
      watchScore: newWatchScore,
      topicScore: newTopicScore,
      isDone: willBeDone,
    });
  };

  const handleToggleSelectedExperiment = async (t: Topic) => {
    await onUpdateTopic(t.id, {
      isSelectedExperiment: !t.isSelectedExperiment,
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    await onCreateTopic(newTopicTitle.trim());
    setNewTopicTitle("");
    setIsAdding(false);
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= topics.length) return;

    const current = topics[index];
    const target = topics[targetIndex];

    await onUpdateTopic(current.id, { order: target.order });
    await onUpdateTopic(target.id, { order: current.order });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Elective Lab Notification Banner */}
      {isElectiveLab && (
        <div className="p-3.5 rounded-[10px] bg-[#D9A441]/10 border border-[#D9A441]/30 text-sm text-[#8A5A12] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 shrink-0 text-[#D9A441]" />
            <span>
              <strong>Elective Lab Requirement:</strong> Complete any <strong>{electiveCount}</strong> experiments.
            </span>
          </div>
          <span className="font-semibold text-xs bg-white/80 dark:bg-black/40 px-2.5 py-1 rounded-[6px] border border-[#D9A441]/30 tabular-nums">
            {completedCount} / {requiredTarget} Completed
          </span>
        </div>
      )}

      {/* Controls Bar above Checklist: One solid cream SectionBar directly above topic list */}
      <SectionBar className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#14161F] dark:text-[#F6EBD3]">
          {topics.length} topics in this unit
        </span>

        <button
          type="button"
          onClick={() => setHideCompleted(!hideCompleted)}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          title={hideCompleted ? "Show all topics" : "Hide completed topics"}
        >
          {hideCompleted ? (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>Show completed</span>
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              <span>Hide completed</span>
            </>
          )}
        </button>
      </SectionBar>

      {/* Checklist in ONE white card with hairline dividers between rows */}
      <div className="bg-white dark:bg-[#1E1416] rounded-[12px] border border-[#E5D5C5] shadow-card overflow-hidden divide-y divide-[#E5D5C5]/70">
        {visibleTopics.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--color-secondary)]">
            {hideCompleted
              ? "All topics in this unit are completed!"
              : "No topics added to this unit yet."}
          </div>
        ) : (
          visibleTopics.map((topic, index) => {
            const isDone = topic.isDone;
            const isSelected = topic.isSelectedExperiment !== false;
            const isEditing = editingTopicId === topic.id;
            const nextTopic = topics[index + 1] || null;
            const cleanedTitle = cleanSyllabusTitle(topic.title);

            // Segmented bar widths (40 watch + 60 check)
            const watchPercent = Math.min(100, Math.max(0, ((topic.watchScore || 0) / 40) * 100));
            const checkPercent = Math.min(100, Math.max(0, ((topic.checkScore || 0) / 60) * 100));

            return (
              <div
                key={topic.id}
                className={`group flex items-start justify-between gap-4 p-4 transition-colors ${
                  isDone
                    ? "bg-[#FAF7F2]/60 dark:bg-[#251A1D]/40"
                    : "hover:bg-[#FAF7F2]/40 dark:hover:bg-[#251A1D]/20"
                }`}
              >
                {/* Left: 22px Checkbox + Topic text & 4px segmented bar */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* 22px Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleStudied(topic)}
                    className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-all ${
                      topic.watchScore >= 40
                        ? "bg-[#A51C30] border-[#A51C30] text-white shadow-xs"
                        : "border-[#CFC8BB] hover:border-[#A51C30] bg-white dark:bg-[#1A1214]"
                    }`}
                    title={
                      topic.watchScore >= 40
                        ? "Lecture watch verified (40 pts) - Click to unmark"
                        : "Mark 'I studied this' (40 pts)"
                    }
                  >
                    {topic.watchScore >= 40 && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>

                  {/* Elective Experiment Selector for Lab courses */}
                  {isElectiveLab && (
                    <button
                      type="button"
                      onClick={() => handleToggleSelectedExperiment(topic)}
                      className={`mt-0.5 px-2 py-0.5 rounded-[4px] text-xs font-semibold uppercase transition-colors shrink-0 ${
                        isSelected
                          ? "bg-[#D9A441]/15 text-[#8A5A12] border border-[#D9A441]/40"
                          : "bg-[var(--color-surface-muted)] text-[var(--color-secondary)] border border-[var(--color-border)]"
                      }`}
                      title={isSelected ? "Included in required experiments" : "Click to include in elective set"}
                    >
                      {isSelected ? "Selected" : "Omit"}
                    </button>
                  )}

                  {/* Topic text & segmented bar */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveEdit(topic.id);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button type="submit" size="sm" className="h-8 text-xs px-3 btn-primary">
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-3 btn-secondary"
                          onClick={() => setEditingTopicId(null)}
                        >
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <div>
                        {/* Topic text 16px weight 500, line-height 1.5 */}
                        <p
                          onDoubleClick={() => handleStartEdit(topic)}
                          className="text-[16px] font-medium leading-[1.5] text-[#14161F] dark:text-[#F6EBD3] cursor-text"
                        >
                          {cleanedTitle}
                        </p>

                        {/* Under the text: 4px segmented bar (40 watch + 60 check) */}
                        <div className="mt-1.5 flex items-center gap-2.5">
                          <div
                            className="h-[4px] w-36 sm:w-44 flex items-center gap-1 rounded-full overflow-hidden bg-[#E5D5C5]/50"
                            title={`Watch: ${topic.watchScore || 0}/40, Check: ${topic.checkScore || 0}/60`}
                          >
                            {/* Watch segment (40%) */}
                            <div className="h-full flex-[4] bg-[#E5D5C5]/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#5E7B5B] transition-all"
                                style={{ width: `${watchPercent}%` }}
                              />
                            </div>
                            {/* Check segment (60%) */}
                            <div className="h-full flex-[6] bg-[#E5D5C5]/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#D9A441] transition-all"
                                style={{ width: `${checkPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Show "Watch 40 · Check 36" ONLY when score is above 0 */}
                          {(topic.topicScore || 0) > 0 && (
                            <span className="text-[13px] text-[#4B5160] dark:text-[#CFC8BB]">
                              Watch {topic.watchScore || 0} · Check {topic.checkScore || 0}
                            </span>
                          )}

                          {/* Smart Spaced Recall Retention Indicator (Phase S1) */}
                          {topic.isConsolidated ? (
                            <span
                              className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/30"
                              title="Topic Consolidated: 4 spaced recall stages successfully completed!"
                            >
                              Consolidated
                            </span>
                          ) : topic.retentionLevel && topic.retentionLevel !== "none" ? (
                            <span
                              className={`px-1.5 py-0.2 rounded-[4px] text-[10px] font-bold capitalize flex items-center gap-1 border ${
                                topic.retentionLevel === "green"
                                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                                  : topic.retentionLevel === "amber"
                                  ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                                  : "bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/30"
                              }`}
                              title={`Spaced retention verified: ${topic.retentionLevel} (Stage ${topic.recallStage || 1})`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  topic.retentionLevel === "green"
                                    ? "bg-emerald-600 dark:bg-emerald-400"
                                    : topic.retentionLevel === "amber"
                                    ? "bg-amber-600 dark:bg-amber-400"
                                    : "bg-red-600 dark:bg-red-400"
                                }`}
                              />
                              <span>{topic.retentionLevel}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Score on the right + Icon-only action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Score on the right: shows as "0/100" with "/100" in muted colour, using tabular numbers */}
                  <span className="text-sm font-semibold tabular-nums text-[#14161F] dark:text-[#F6EBD3] min-w-[54px] text-right">
                    <span>{topic.topicScore || 0}</span>
                    <span className="text-[#4B5160] dark:text-[#A89B9E] font-normal text-xs">/100</span>
                  </span>

                  {/* Action icons: AI, Check and menu (icon-only with tooltips, visible on hover/focus) */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    {/* Ask AI Assistant */}
                    {onOpenTopicAi && (
                      <button
                        type="button"
                        onClick={() => onOpenTopicAi(topic)}
                        className="p-1.5 rounded-[6px] text-[#A51C30] hover:bg-[#A51C30]/10 transition-colors"
                        title="AI study assistant: Explain simply, test me, or flashcards"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                    )}

                    {/* Khan-Style Note Check & Exercise Loop Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onStartMasteryLoop) {
                          onStartMasteryLoop(topic);
                        } else {
                          window.location.href = `/courses/${course.id}/mastery/${topic.id}`;
                        }
                      }}
                      className="p-1.5 rounded-[6px] text-[#8A1627] dark:text-[#F07B88] hover:bg-[#8A1627]/10 transition-colors"
                      title="Khan-Style Note Audit & 5-Question Mastery Exercise Set"
                    >
                      <Target className="h-4 w-4" />
                    </button>

                    {/* Take Quick Check Button */}
                    <button
                      type="button"
                      onClick={() => onStartQuickCheck?.(topic)}
                      className={`p-1.5 rounded-[6px] transition-colors ${
                        (topic.checkScore || 0) >= 40
                          ? "text-[#D9A441] hover:bg-[#D9A441]/10"
                          : "text-[#4B5160] hover:text-[#14161F] hover:bg-[var(--color-surface-muted)]"
                      }`}
                      title="Take Quick Check (3-5 questions to earn up to 60 pts)"
                    >
                      <Award className="h-4 w-4" />
                    </button>

                    {/* More Topic Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="p-1.5 rounded-[6px] text-[#4B5160] hover:text-[#14161F] hover:bg-[var(--color-surface-muted)]"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 text-sm">
                        <DropdownMenuItem onClick={() => handleStartEdit(topic)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          <span>Rename Topic</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => setSplitTopic(topic)}>
                          <Scissors className="h-4 w-4 mr-2" />
                          <span>Split Topic</span>
                        </DropdownMenuItem>

                        {nextTopic && (
                          <DropdownMenuItem
                            onClick={() =>
                              setMergeTopic({ current: topic, next: nextTopic })
                            }
                          >
                            <GitMerge className="h-4 w-4 mr-2" />
                            <span>Merge With Next</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          disabled={index === 0}
                          onClick={() => handleMove(index, "up")}
                        >
                          <ArrowUp className="h-4 w-4 mr-2" />
                          <span>Move Up</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          disabled={index === topics.length - 1}
                          onClick={() => handleMove(index, "down")}
                        >
                          <ArrowDown className="h-4 w-4 mr-2" />
                          <span>Move Down</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-[var(--color-danger)] focus:text-[var(--color-danger)]"
                          onClick={() => onDeleteTopic(topic.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Delete Topic</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Topic Input Form */}
      {isAdding ? (
        <form onSubmit={handleAddSubmit} className="flex items-center gap-2 pt-1">
          <Input
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            placeholder="Enter new topic or experiment title..."
            className="text-sm"
            autoFocus
          />
          <Button type="submit" size="sm" className="btn-primary text-xs shrink-0 px-3">
            Add
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="btn-secondary text-xs shrink-0 px-3"
            onClick={() => setIsAdding(false)}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="btn-secondary w-full text-xs py-2 inline-flex items-center justify-center gap-1.5 border-dashed"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Topic to {cleanSyllabusTitle(unit.title)}</span>
        </button>
      )}

      {/* Modals for Split and Merge operations */}
      <SplitTopicDialog
        topic={splitTopic}
        open={Boolean(splitTopic)}
        onOpenChange={(open) => !open && setSplitTopic(null)}
        onSplit={onSplitTopic}
      />

      <MergeTopicDialog
        topic={mergeTopic?.current || null}
        nextTopic={mergeTopic?.next || null}
        open={Boolean(mergeTopic)}
        onOpenChange={(open) => !open && setMergeTopic(null)}
        onMerge={onMergeTopics}
      />
    </div>
  );
}
