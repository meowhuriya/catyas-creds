"use client";

import * as React from "react";
import {
  CheckCircle2,
  Circle,
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
  Video as VideoIcon,
  HelpCircle,
  FlaskConical,
  Sparkles,
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
import { Topic, Module, Course } from "@/types/schemas";

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
  className = "",
}: TopicChecklistProps) {
  const [editingTopicId, setEditingTopicId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [newTopicTitle, setNewTopicTitle] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

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
    const newWatchScore = willBeStudied ? 40 : 0;
    const newTopicScore = newWatchScore + t.checkScore;
    await onUpdateTopic(t.id, {
      isStudiedManually: willBeStudied,
      watchScore: newWatchScore,
      topicScore: newTopicScore,
      isDone: newTopicScore >= 70,
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
        <div className="p-3.5 rounded-[10px] bg-[#B7791F]/10 border border-[#B7791F]/30 text-xs text-[#8A5A12] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 shrink-0 text-[#B7791F]" />
            <span>
              <strong>Elective Lab Requirement:</strong> Complete any <strong>{electiveCount}</strong> experiments.
            </span>
          </div>
          <span className="font-mono font-bold text-xs bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded-[4px] border border-[#B7791F]/30 tabular-nums">
            {completedCount} / {requiredTarget} Completed
          </span>
        </div>
      )}

      {/* Topic List */}
      <div className="space-y-2">
        {topics.map((topic, index) => {
          const isDone = topic.isDone;
          const isSelected = topic.isSelectedExperiment !== false;
          const isEditing = editingTopicId === topic.id;
          const nextTopic = topics[index + 1] || null;

          return (
            <div
              key={topic.id}
              className={`group flex items-start justify-between gap-3 p-3 rounded-[10px] border transition-all ${
                isDone
                  ? "bg-[var(--color-surface)] border-[#C79A3B]/40 shadow-sm"
                  : isSelected
                  ? "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-ink-muted)]/40 shadow-sm"
                  : "bg-[var(--color-surface-muted)]/50 border-[var(--color-border)]/50 opacity-60"
              }`}
            >
              {/* Left: Checkbox + Topic Title */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Manual "I Studied This" Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleStudied(topic)}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                    topic.watchScore >= 40
                      ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white"
                      : "border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-surface)]"
                  }`}
                  title={
                    topic.watchScore >= 40
                      ? "Lecture watch verified (+40 pts)"
                      : "Mark 'I studied this' (+40 pts)"
                  }
                >
                  {topic.watchScore >= 40 && <Check className="h-3 w-3 stroke-[3]" />}
                </button>

                {/* Elective Experiment Selector for Lab courses */}
                {isElectiveLab && (
                  <button
                    type="button"
                    onClick={() => handleToggleSelectedExperiment(topic)}
                    className={`mt-0.5 px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase transition-colors shrink-0 ${
                      isSelected
                        ? "bg-[#B7791F]/15 text-[#B7791F] border border-[#B7791F]/30"
                        : "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] border border-[var(--color-border)]"
                    }`}
                    title={isSelected ? "Included in required experiments" : "Click to include in elective set"}
                  >
                    {isSelected ? "Selected Exp" : "Omit Exp"}
                  </button>
                )}

                {/* Title or Inline Edit Input */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEdit(topic.id);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-7 text-xs"
                        autoFocus
                      />
                      <Button type="submit" size="sm" className="h-7 text-[11px] px-2">
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2"
                        onClick={() => setEditingTopicId(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <div className="flex flex-col">
                      <span
                        onDoubleClick={() => handleStartEdit(topic)}
                        className={`text-xs font-medium leading-relaxed cursor-text ${
                          isDone
                            ? "text-[var(--color-ink)] font-semibold"
                            : "text-[var(--color-ink)]"
                        }`}
                      >
                        {topic.title}
                      </span>

                      {/* Sub-meta breakdown: Watch (40 pts) + Check (60 pts) */}
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--color-ink-muted)]">
                        <span className="font-mono">
                          Watch: {topic.watchScore}/40
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          Check: {topic.checkScore}/60
                        </span>
                        <span>•</span>
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            isDone ? "text-[#C79A3B]" : "text-[var(--color-ink)]"
                          }`}
                        >
                          Total: {topic.topicScore}/100
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Quick Check Button & Topic Action Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Ask AI Assistant */}
                {onOpenTopicAi && (
                  <button
                    type="button"
                    onClick={() => onOpenTopicAi(topic)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-semibold text-app-accent border border-app-accent/30 bg-app-accent/5 hover:bg-app-accent/10 transition-colors"
                    title="Ask AI: Explain simply, test me, or flashcards"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>AI</span>
                  </button>
                )}

                {/* Take Quick Check Button */}
                <button
                  type="button"
                  onClick={() => onStartQuickCheck?.(topic)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-semibold transition-colors ${
                    topic.checkScore >= 40
                      ? "bg-[#C79A3B]/15 text-[#C79A3B] border border-[#C79A3B]/30"
                      : "bg-[var(--color-surface-muted)] text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]/80"
                  }`}
                  title="Take Quick Check (3-5 questions to earn up to 60 pts)"
                >
                  <Award className="h-3 w-3" />
                  <span>Check</span>
                </button>

                {/* More Topic Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="p-1 rounded-[4px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 text-xs">
                    <DropdownMenuItem onClick={() => handleStartEdit(topic)}>
                      <Edit2 className="h-3.5 w-3.5 mr-2" />
                      <span>Rename Topic</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setSplitTopic(topic)}>
                      <Scissors className="h-3.5 w-3.5 mr-2" />
                      <span>Split Topic</span>
                    </DropdownMenuItem>

                    {nextTopic && (
                      <DropdownMenuItem
                        onClick={() =>
                          setMergeTopic({ current: topic, next: nextTopic })
                        }
                      >
                        <GitMerge className="h-3.5 w-3.5 mr-2" />
                        <span>Merge With Next</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                    >
                      <ArrowUp className="h-3.5 w-3.5 mr-2" />
                      <span>Move Up</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      disabled={index === topics.length - 1}
                      onClick={() => handleMove(index, "down")}
                    >
                      <ArrowDown className="h-3.5 w-3.5 mr-2" />
                      <span>Move Down</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-[var(--color-danger)] focus:text-[var(--color-danger)]"
                      onClick={() => onDeleteTopic(topic.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      <span>Delete Topic</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Topic Input Form */}
      {isAdding ? (
        <form onSubmit={handleAddSubmit} className="flex items-center gap-2 pt-2">
          <Input
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            placeholder="Enter new topic or task title..."
            className="text-xs"
            autoFocus
          />
          <Button type="submit" size="sm" className="text-xs shrink-0">
            Add
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs shrink-0"
            onClick={() => setIsAdding(false)}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full text-xs gap-1.5 border-dashed"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Topic to {unit.title}</span>
        </Button>
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
