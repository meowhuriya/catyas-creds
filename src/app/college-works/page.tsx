"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  FileText,
  FlaskConical,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  ExternalLink,
  BookOpen,
  Award,
  Layers,
  Check,
  X,
  FileCode,
  Tag,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  CollegeWorkItem,
  WorkType,
  WorkStatus,
  ALL_COURSES,
} from "@/types/college-works";

function formatTimestamp(isoOrDateString?: string): string {
  if (!isoOrDateString) return "Not recorded";
  try {
    const d = new Date(isoOrDateString);
    if (isNaN(d.getTime())) return isoOrDateString;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoOrDateString;
  }
}

function getBigStatusBarConfig(work: CollegeWorkItem) {
  const isCompleted = work.status === "submitted" || work.status === "graded";
  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = !isCompleted && Boolean(work.dueDate) && work.dueDate < todayStr;

  if (work.status === "graded") {
    return {
      statusType: "graded" as const,
      bannerClass: "bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white",
      borderClass: "border-purple-500/50 hover:border-purple-500",
      icon: Award,
      title: "COMPLETED & GRADED",
      badge: work.gradeOrMarks ? `Marks: ${work.gradeOrMarks}` : "Verified",
      detail: "Faculty evaluation recorded on official grade sheet",
    };
  }

  if (work.status === "submitted") {
    return {
      statusType: "completed" as const,
      bannerClass: "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white",
      borderClass: "border-emerald-500/50 hover:border-emerald-500",
      icon: CheckCircle2,
      title: "COMPLETED & SUBMITTED",
      badge: "Turned In",
      detail: "Submission recorded on time",
    };
  }

  if (isOverdue) {
    const diffDays = Math.max(
      1,
      Math.round(
        (new Date(todayStr).getTime() - new Date(work.dueDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    return {
      statusType: "overdue" as const,
      bannerClass: "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white",
      borderClass: "border-red-500/60 hover:border-red-500 ring-1 ring-red-500/30",
      icon: AlertTriangle,
      title: "OVER THE DUE DATE — NOT COMPLETED",
      badge: `${diffDays} Day${diffDays > 1 ? "s" : ""} Overdue`,
      detail: `Submission deadline was ${work.dueDate}`,
    };
  }

  if (work.status === "in_progress") {
    return {
      statusType: "in_progress" as const,
      bannerClass: "bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white",
      borderClass: "border-sky-500/40 hover:border-sky-500",
      icon: Clock,
      title: "IN PROGRESS — NOT COMPLETED YET",
      badge: "In Progress",
      detail: `Target Deadline: ${work.dueDate}`,
    };
  }

  // Pending
  return {
    statusType: "pending" as const,
    bannerClass: "bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white",
    borderClass: "border-amber-500/40 hover:border-amber-500",
    icon: Clock,
    title: "PENDING SUBMISSION — NOT COMPLETED",
    badge: "Pending",
    detail: `Submission target: ${work.dueDate}`,
  };
}

const SEED_COLLEGE_WORKS: CollegeWorkItem[] = [
  {
    id: "work-1",
    courseCode: "CH106BS",
    courseTitle: "Engineering Chemistry Lab",
    type: "record",
    title: "Exp 3: Conductometric Titration of Strong Acid (HCl) with Strong Base (NaOH)",
    unitOrExp: "Experiment #3",
    dueDate: "2026-10-28",
    status: "graded",
    gradeOrMarks: "10/10",
    notes:
      "Calculated equivalence point at sharp conductance minimum (14.2 mL). Verification endorsed by Prof. K. Rao. Viva questions covered Kohlrausch's law.",
    submissionUrl: "https://drive.google.com/open?id=ch106bs-exp3-record",
    attachmentName: "CH106BS_Exp3_Observation_Record.pdf",
    submittedAt: "2026-10-27T16:45:00",
    lastUpdatedAt: "2026-10-29T11:15:00",
  },
  {
    id: "work-2",
    courseCode: "MA101BS",
    courseTitle: "Matrices and Calculus",
    type: "assignment",
    title: "Assignment 2: Cayley-Hamilton Theorem & Diagonalization of Symmetric Matrices",
    unitOrExp: "Unit 2 Tutorial",
    dueDate: "2026-11-05",
    status: "submitted",
    gradeOrMarks: "Pending Grading",
    notes:
      "Verified characteristic polynomial det(A - λI) = 0 for 3x3 matrices and evaluated inverse matrix A^-1 via Cayley-Hamilton expansion.",
    submissionUrl: "https://drive.google.com/open?id=ma101bs-assign2",
    attachmentName: "MA101BS_Assignment2_Calculus.pdf",
    submittedAt: "2026-11-04T18:20:00",
    lastUpdatedAt: "2026-11-04T18:20:00",
  },
  {
    id: "work-3",
    courseCode: "CS107ES",
    courseTitle: "Programming for Problem Solving Lab",
    type: "record",
    title: "Exp 5: Dynamic Memory Allocation (malloc, calloc, realloc) & Pointer Manipulation",
    unitOrExp: "Experiment #5",
    dueDate: "2026-10-30",
    status: "graded",
    gradeOrMarks: "9.5/10",
    notes:
      "Implemented dynamic 2D matrix allocation and freed all memory blocks with zero Valgrind memory leaks. Deducted 0.5 for missing boundary assertions.",
    submissionUrl: "https://github.com/valeria/cs107es-lab/tree/exp5",
    attachmentName: "CS107ES_Exp5_Pointer_Report.pdf",
    submittedAt: "2026-10-29T21:10:00",
    lastUpdatedAt: "2026-11-01T09:30:00",
  },
  {
    id: "work-4",
    courseCode: "CH102BS",
    courseTitle: "Engineering Chemistry",
    type: "assignment",
    title: "Assignment 3: Corrosion Kinetics and Sacrificial Anode Cathodic Protection",
    unitOrExp: "Unit 3 Tutorial",
    dueDate: "2026-11-18",
    status: "in_progress",
    notes:
      "Deriving Nernst equation for galvanic cells and calculating corrosion rates via Faraday's Law. 3 of 5 questions completed.",
    lastUpdatedAt: "2026-11-06T14:10:00",
  },
  {
    id: "work-5",
    courseCode: "CS105ES",
    courseTitle: "Programming for Problem Solving",
    type: "assignment",
    title: "Assignment 4: Recursive Algorithms — Tower of Hanoi and Fibonacci Time Complexity",
    unitOrExp: "Unit 4 Problem Set",
    dueDate: "2026-11-04",
    status: "pending",
    notes:
      "Formulate recurrence relations T(n) = 2T(n-1) + 1 and trace call-stack execution diagrams.",
    lastUpdatedAt: "2026-11-05T10:00:00",
  },
  {
    id: "work-6",
    courseCode: "ME109ES",
    courseTitle: "Engineering Workshop",
    type: "record",
    title: "Exp 2: Carpentry Joint Fabrication — Mortise and Tenon Woodworking Joint",
    unitOrExp: "Experiment #2",
    dueDate: "2026-11-02",
    status: "submitted",
    gradeOrMarks: "Grade A",
    notes:
      "Chiseled 50mm x 25mm mortise cavity and planed tenon tongue to ±0.5mm tolerance. Verified right angle with try square.",
    submissionUrl: "https://drive.google.com/open?id=me109es-exp2",
    attachmentName: "ME109ES_Exp2_Carpentry_Record.pdf",
    submittedAt: "2026-11-01T15:40:00",
    lastUpdatedAt: "2026-11-03T16:00:00",
  },
  {
    id: "work-7",
    courseCode: "EC104ES",
    courseTitle: "Electronic Devices and Circuits",
    type: "assignment",
    title: "Assignment 1: V-I Characteristics of PN Junction Diode and Zener Breakdown",
    unitOrExp: "Unit 1 Assignment",
    dueDate: "2026-11-22",
    status: "pending",
    notes:
      "Plot forward bias threshold voltage (0.7V for Si) and calculate reverse saturation current I_s.",
    lastUpdatedAt: "2026-11-05T12:00:00",
  },
  {
    id: "work-8",
    courseCode: "CS208ES",
    courseTitle: "Python Programming Lab",
    type: "record",
    title: "Exp 4: Object-Oriented File I/O & Custom Exception Handling in Python 3",
    unitOrExp: "Experiment #4",
    dueDate: "2026-11-04",
    status: "graded",
    gradeOrMarks: "10/10",
    notes:
      "Designed CSV parsing class with context managers (with open) and custom NegativeBalanceException for banking simulator.",
    submissionUrl: "https://github.com/valeria/cs208es-python/exp4",
    attachmentName: "CS208ES_Exp4_Python_Record.pdf",
    submittedAt: "2026-11-03T19:25:00",
    lastUpdatedAt: "2026-11-05T17:15:00",
  },
];

export default function CollegeWorksPage() {
  const toast = useToast();

  const [works, setWorks] = React.useState<CollegeWorkItem[]>(SEED_COLLEGE_WORKS);
  const [selectedSubsection, setSelectedSubsection] = React.useState<"all" | "assignment" | "record">("all");
  const [selectedCourseFilter, setSelectedCourseFilter] = React.useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CollegeWorkItem | null>(null);

  // Form Fields
  const [formCourseCode, setFormCourseCode] = React.useState("MA101BS");
  const [formType, setFormType] = React.useState<WorkType>("assignment");
  const [formTitle, setFormTitle] = React.useState("");
  const [formUnitOrExp, setFormUnitOrExp] = React.useState("");
  const [formDueDate, setFormDueDate] = React.useState("");
  const [formStatus, setFormStatus] = React.useState<WorkStatus>("pending");
  const [formGradeOrMarks, setFormGradeOrMarks] = React.useState("");
  const [formNotes, setFormNotes] = React.useState("");
  const [formSubmissionUrl, setFormSubmissionUrl] = React.useState("");
  const [formAttachmentName, setFormAttachmentName] = React.useState("");

  // Load from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("valeria_college_works");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWorks(parsed);
          }
        }
      } catch (err) {
        console.warn("Error reading college works from localStorage:", err);
      }
    }
  }, []);

  // Save to localStorage
  const saveWorks = (list: CollegeWorkItem[]) => {
    setWorks(list);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("valeria_college_works", JSON.stringify(list));
      } catch (err) {
        console.warn("Error saving college works to localStorage:", err);
      }
    }
  };

  // Open modal for new item
  const handleOpenNewModal = (defaultType: WorkType = "assignment") => {
    setEditingItem(null);
    setFormCourseCode(selectedCourseFilter !== "all" ? selectedCourseFilter : "CH102BS");
    setFormType(defaultType);
    setFormTitle("");
    setFormUnitOrExp(defaultType === "assignment" ? "Unit 1 Assignment" : "Experiment #1");
    setFormDueDate(new Date().toISOString().split("T")[0]);
    setFormStatus("pending");
    setFormGradeOrMarks("");
    setFormNotes("");
    setFormSubmissionUrl("");
    setFormAttachmentName("");
    setIsModalOpen(true);
  };

  // Open modal for editing existing item
  const handleOpenEditModal = (item: CollegeWorkItem) => {
    setEditingItem(item);
    setFormCourseCode(item.courseCode);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormUnitOrExp(item.unitOrExp);
    setFormDueDate(item.dueDate);
    setFormStatus(item.status);
    setFormGradeOrMarks(item.gradeOrMarks || "");
    setFormNotes(item.notes || "");
    setFormSubmissionUrl(item.submissionUrl || "");
    setFormAttachmentName(item.attachmentName || "");
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveItem = () => {
    if (!formTitle.trim()) {
      toast.error("Title required", "Please enter a title for this college work.");
      return;
    }

    const courseObj = ALL_COURSES.find((c) => c.code === formCourseCode) || {
      code: formCourseCode,
      title: "Academic Course",
    };

    const nowIso = new Date().toISOString();

    if (editingItem) {
      // Update
      const wasSubmitted = editingItem.status === "submitted" || editingItem.status === "graded";
      const isNowSubmitted = formStatus === "submitted" || formStatus === "graded";
      const newSubmittedAt =
        isNowSubmitted && !wasSubmitted
          ? nowIso
          : !isNowSubmitted
          ? undefined
          : editingItem.submittedAt || nowIso;

      const updatedList = works.map((w) => {
        if (w.id !== editingItem.id) return w;
        return {
          ...w,
          courseCode: formCourseCode,
          courseTitle: courseObj.title,
          type: formType,
          title: formTitle.trim(),
          unitOrExp: formUnitOrExp.trim() || (formType === "assignment" ? "Assignment" : "Lab Record"),
          dueDate: formDueDate || w.dueDate,
          status: formStatus,
          gradeOrMarks: formGradeOrMarks.trim() || undefined,
          notes: formNotes.trim() || undefined,
          submissionUrl: formSubmissionUrl.trim() || undefined,
          attachmentName: formAttachmentName.trim() || undefined,
          submittedAt: newSubmittedAt,
          lastUpdatedAt: nowIso,
        };
      });

      saveWorks(updatedList);
      toast.success("Updated", `"${formTitle.trim()}" has been updated.`);
    } else {
      // Create New
      const isSubmitted = formStatus === "submitted" || formStatus === "graded";
      const newItem: CollegeWorkItem = {
        id: `work-${Date.now()}`,
        courseCode: formCourseCode,
        courseTitle: courseObj.title,
        type: formType,
        title: formTitle.trim(),
        unitOrExp: formUnitOrExp.trim() || (formType === "assignment" ? "Assignment" : "Lab Record"),
        dueDate: formDueDate || new Date().toISOString().split("T")[0],
        status: formStatus,
        gradeOrMarks: formGradeOrMarks.trim() || undefined,
        notes: formNotes.trim() || undefined,
        submissionUrl: formSubmissionUrl.trim() || undefined,
        attachmentName: formAttachmentName.trim() || undefined,
        submittedAt: isSubmitted ? nowIso : undefined,
        lastUpdatedAt: nowIso,
      };

      const updatedList = [newItem, ...works];
      saveWorks(updatedList);
      toast.success("Created", `New ${formType} added for ${formCourseCode}.`);
    }

    setIsModalOpen(false);
  };

  // Delete
  const handleDeleteItem = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    const remaining = works.filter((w) => w.id !== id);
    saveWorks(remaining);
    toast.success("Deleted", `Item removed from College Works.`);
  };

  // Quick Toggle Status
  const handleQuickToggleStatus = (item: CollegeWorkItem) => {
    const nextStatus: WorkStatus =
      item.status === "pending"
        ? "in_progress"
        : item.status === "in_progress"
        ? "submitted"
        : item.status === "submitted"
        ? "graded"
        : "pending";

    const nowIso = new Date().toISOString();
    const updated = works.map((w) => {
      if (w.id !== item.id) return w;
      return {
        ...w,
        status: nextStatus,
        submittedAt: nextStatus === "submitted" || nextStatus === "graded" ? w.submittedAt || nowIso : undefined,
        lastUpdatedAt: nowIso,
      };
    });

    saveWorks(updated);
    toast.info("Status updated", `Moved to ${nextStatus.replace("_", " ")}.`);
  };

  // Filtered List
  const filteredWorks = React.useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return works.filter((w) => {
      // Subsection filter
      if (selectedSubsection !== "all" && w.type !== selectedSubsection) return false;
      // Course filter
      if (selectedCourseFilter !== "all" && w.courseCode !== selectedCourseFilter) return false;
      // Status filter
      if (selectedStatusFilter === "overdue") {
        const isCompleted = w.status === "submitted" || w.status === "graded";
        const isOverdue = !isCompleted && Boolean(w.dueDate) && w.dueDate < today;
        if (!isOverdue) return false;
      } else if (selectedStatusFilter !== "all" && w.status !== selectedStatusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = w.title.toLowerCase().includes(q);
        const matchesCourse = w.courseCode.toLowerCase().includes(q) || w.courseTitle.toLowerCase().includes(q);
        const matchesUnit = w.unitOrExp.toLowerCase().includes(q);
        const matchesNotes = w.notes?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesCourse && !matchesUnit && !matchesNotes) return false;
      }
      return true;
    });
  }, [works, selectedSubsection, selectedCourseFilter, selectedStatusFilter, searchQuery]);

  // Statistics
  const todayStr = new Date().toISOString().split("T")[0];
  const totalCount = works.length;
  const assignmentCount = works.filter((w) => w.type === "assignment").length;
  const recordCount = works.filter((w) => w.type === "record").length;
  const overdueCount = works.filter((w) => {
    const isCompleted = w.status === "submitted" || w.status === "graded";
    return !isCompleted && Boolean(w.dueDate) && w.dueDate < todayStr;
  }).length;
  const submittedOrGradedCount = works.filter((w) => w.status === "submitted" || w.status === "graded").length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-[18px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
              <ClipboardCheck className="h-4 w-4" />
              <span>Academic Submissions &amp; Records</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                19 Courses Enrolled
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--color-ink)]">
              College Works Hub
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-1 max-w-2xl leading-relaxed">
              Track, submit, and verify coursework across all 19 B.Tech CSE subjects. Filter by course,
              manage theory <strong>Assignments</strong> and practical <strong>Lab Records</strong>, and
              track exact submission timestamps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenNewModal("assignment")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] text-[var(--color-ink)] text-xs font-bold border border-[var(--color-border)] transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              <span>+ New Assignment</span>
            </button>
            <button
              onClick={() => handleOpenNewModal("record")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[var(--color-accent)] hover:bg-[#8A1627] text-white text-xs font-bold shadow-sm transition-colors"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>+ New Lab Record</span>
            </button>
          </div>
        </div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-[var(--color-border)]">
          <div className="p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">
              Total Works
            </span>
            <span className="font-serif text-xl font-bold text-[var(--color-ink)]">{totalCount}</span>
          </div>

          <div className="p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">
              Theory Assignments
            </span>
            <span className="font-serif text-xl font-bold text-blue-600 dark:text-blue-400">
              {assignmentCount}
            </span>
          </div>

          <div className="p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">
              Practical Lab Records
            </span>
            <span className="font-serif text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {recordCount}
            </span>
          </div>

          <div className="p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">
              Over the Due Date
            </span>
            <span
              className={cn(
                "font-serif text-xl font-bold",
                overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-[var(--color-ink)]"
              )}
            >
              {overdueCount}
            </span>
          </div>

          <div className="p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">
              Completed &amp; Graded
            </span>
            <span className="font-serif text-xl font-bold text-purple-600 dark:text-purple-400">
              {submittedOrGradedCount} / {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Subsections & Filtering Bar */}
      <div className="space-y-3">
        {/* Subsection Switcher (Assignments vs Lab Records) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-[12px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
            <button
              onClick={() => setSelectedSubsection("all")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all",
                selectedSubsection === "all"
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All College Works</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedSubsection("assignment")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all",
                selectedSubsection === "assignment"
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Assignments</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                {assignmentCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedSubsection("record")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all",
                selectedSubsection === "record"
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
              )}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Lab Records</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                {recordCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search works, codes, experiments..."
              className="w-full text-xs h-9 pl-9 pr-3 rounded-[8px] bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Course Filter Dropdown & Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[14px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          {/* Course Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-ink)] shrink-0 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              <span>Course Filter:</span>
            </span>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="text-xs h-8 px-2.5 rounded-[6px] bg-[var(--color-surface-muted)] text-[var(--color-ink)] border border-[var(--color-border)] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              <option value="all">All 19 B.Tech Courses ({works.length} works)</option>
              {ALL_COURSES.map((c) => {
                const count = works.filter((w) => w.courseCode === c.code).length;
                return (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.title} {count > 0 ? `(${count})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] mr-1">Status:</span>
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "in_progress", label: "In Progress" },
              { id: "overdue", label: overdueCount > 0 ? `Overdue (${overdueCount})` : "Overdue" },
              { id: "submitted", label: "Submitted" },
              { id: "graded", label: "Graded" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatusFilter(st.id)}
                className={cn(
                  "px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-colors",
                  selectedStatusFilter === st.id
                    ? "bg-[var(--color-surface-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]/30"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* College Works Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWorks.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-[16px] bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] text-xs text-[var(--color-ink-muted)]">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--color-accent)]" />
            <p className="font-semibold text-sm text-[var(--color-ink)]">No college works found</p>
            <p className="mt-1">
              {searchQuery
                ? `No submissions or records matching "${searchQuery}".`
                : "Add an assignment or lab record to populate this course section."}
            </p>
            <button
              onClick={() => handleOpenNewModal("assignment")}
              className="mt-3 px-4 py-2 rounded-[8px] bg-[var(--color-accent)] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First College Work</span>
            </button>
          </div>
        ) : (
          filteredWorks.map((work) => {
            const isRecord = work.type === "record";
            const isSubmitted = work.status === "submitted" || work.status === "graded";
            const barConfig = getBigStatusBarConfig(work);
            const StatusIcon = barConfig.icon;

            return (
              <div
                key={work.id}
                className={cn(
                  "academic-card rounded-[18px] border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md",
                  barConfig.borderClass
                )}
              >
                {/* 1. BIG BOLD STATUS BAR ACROSS ENTIRE TOP OF CARD */}
                <div
                  className={cn(
                    "w-full px-4 py-2.5 flex items-center justify-between text-white font-sans text-xs font-bold tracking-wide shadow-xs",
                    barConfig.bannerClass
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon className="h-4 w-4 shrink-0" />
                    <span className="uppercase tracking-wider font-extrabold truncate">
                      {barConfig.title}
                    </span>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/25 text-white border border-white/20 uppercase tracking-wider ml-2">
                    {barConfig.badge}
                  </span>
                </div>

                {/* 2. CARD CONTENT CONTAINER */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Course Tag & Subsection Pill */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] px-2 py-0.5 rounded-[6px] bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                          {work.courseCode}
                        </span>
                        <span className="text-xs text-[var(--color-ink-muted)] truncate max-w-[140px] sm:max-w-xs">
                          {work.courseTitle}
                        </span>
                      </div>

                      {/* Subsection Type Badge */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                          isRecord
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        )}
                      >
                        {isRecord ? (
                          <>
                            <FlaskConical className="h-3 w-3" />
                            <span>Lab Record</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-3 w-3" />
                            <span>Assignment</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Title & Unit / Exp */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-[var(--color-ink-muted)]">
                        {work.unitOrExp}
                      </span>
                      <h3 className="font-serif text-base font-bold text-[var(--color-ink)] leading-snug">
                        {work.title}
                      </h3>
                    </div>

                    {/* Status & Deadline Details Row */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-2 border-t border-[var(--color-border)]/70 text-xs">
                      {/* Interactive Cycle Button */}
                      <button
                        onClick={() => handleQuickToggleStatus(work)}
                        title="Click to cycle status (Pending -> In Progress -> Submitted -> Graded)"
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors",
                          work.status === "graded" &&
                            "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                          work.status === "submitted" &&
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                          work.status === "in_progress" &&
                            "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                          work.status === "pending" &&
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        )}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span className="capitalize">{work.status.replace("_", " ")}</span>
                      </button>

                      {/* Grade or Marks if present */}
                      {work.gradeOrMarks && (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[var(--color-surface-muted)] text-[var(--color-ink)] font-semibold border border-[var(--color-border)]">
                          Marks: {work.gradeOrMarks}
                        </span>
                      )}

                      {/* Due Date with Overdue Indicator */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 ml-auto font-medium",
                          barConfig.statusType === "overdue"
                            ? "text-red-600 dark:text-red-400 font-bold"
                            : "text-[var(--color-ink-muted)]"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>Due: {work.dueDate}</span>
                      </span>
                    </div>

                    {/* Notes / Instructions Snippet */}
                    {work.notes && (
                      <p className="text-xs text-[var(--color-ink-muted)] mt-2 leading-relaxed line-clamp-2 bg-[var(--color-surface-muted)] p-2 rounded-[8px] border border-[var(--color-border)]/60">
                        {work.notes}
                      </p>
                    )}

                    {/* Submission Link or Attachment Preview */}
                    {(work.submissionUrl || work.attachmentName) && (
                      <div className="mt-2.5 flex items-center gap-2 text-xs">
                        {work.submissionUrl && (
                          <a
                            href={work.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--color-accent)] font-semibold hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>View Submission Link</span>
                          </a>
                        )}
                        {work.attachmentName && (
                          <span className="inline-flex items-center gap-1 text-[var(--color-ink-muted)] bg-[var(--color-surface-muted)] px-2 py-0.5 rounded text-[11px] border border-[var(--color-border)]">
                            <FileCode className="h-3 w-3" />
                            <span>{work.attachmentName}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Section: PROMINENT TIMESTAMPS & EDIT/DELETE ACTIONS */}
                  <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
                    {/* Timestamps Container */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[var(--color-ink-muted)] bg-[var(--color-surface-muted)]/60 p-2 rounded-[8px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                        <span>
                          Last Updated:{" "}
                          <strong className="text-[var(--color-ink)] font-medium">
                            {formatTimestamp(work.lastUpdatedAt)}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={cn(
                            "h-3.5 w-3.5",
                            isSubmitted ? "text-emerald-500" : "text-amber-500"
                          )}
                        />
                        <span>
                          {isSubmitted ? (
                            <>
                              Submitted:{" "}
                              <strong className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {formatTimestamp(work.submittedAt)}
                              </strong>
                            </>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Not submitted yet
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions: Edit & Delete */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenEditModal(work)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-semibold text-[var(--color-ink)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] border border-[var(--color-border)] transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteItem(work.id, work.title)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-lg rounded-[18px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                  {editingItem ? "Edit College Work" : "Add College Work"}
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Manage theory assignment or laboratory observation record.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Subsection Selection (Assignment vs Lab Record) */}
              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Subsection Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("assignment");
                      if (!editingItem) setFormUnitOrExp("Unit Assignment");
                    }}
                    className={cn(
                      "p-2.5 rounded-[8px] border text-xs font-bold flex items-center justify-center gap-2 transition-all",
                      formType === "assignment"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-xs"
                        : "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] border-[var(--color-border)]"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Theory Assignment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType("record");
                      if (!editingItem) setFormUnitOrExp("Experiment Record");
                    }}
                    className={cn(
                      "p-2.5 rounded-[8px] border text-xs font-bold flex items-center justify-center gap-2 transition-all",
                      formType === "record"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs"
                        : "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] border-[var(--color-border)]"
                    )}
                  >
                    <FlaskConical className="h-4 w-4" />
                    <span>Laboratory Record</span>
                  </button>
                </div>
              </div>

              {/* Course Selector */}
              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Enrolled Course (19 B.Tech Courses) *
                </label>
                <select
                  value={formCourseCode}
                  onChange={(e) => setFormCourseCode(e.target.value)}
                  className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)] font-medium"
                >
                  {ALL_COURSES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Title / Experiment Name *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Exp 4: Titration of Strong Acid or Assignment 2: Cayley Hamilton Theorem"
                  className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                />
              </div>

              {/* Unit / Exp Number & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Unit / Experiment #
                  </label>
                  <input
                    type="text"
                    value={formUnitOrExp}
                    onChange={(e) => setFormUnitOrExp(e.target.value)}
                    placeholder="e.g. Experiment #4 or Unit 2"
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  />
                </div>
              </div>

              {/* Status & Grade/Marks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Submission Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="graded">Graded / Verified</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Marks / Grade (Optional)
                  </label>
                  <input
                    type="text"
                    value={formGradeOrMarks}
                    onChange={(e) => setFormGradeOrMarks(e.target.value)}
                    placeholder="e.g. 10/10, A+, 95%"
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  />
                </div>
              </div>

              {/* Submission URL & Attachment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Submission URL / Link
                  </label>
                  <input
                    type="url"
                    value={formSubmissionUrl}
                    onChange={(e) => setFormSubmissionUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Attachment Name
                  </label>
                  <input
                    type="text"
                    value={formAttachmentName}
                    onChange={(e) => setFormAttachmentName(e.target.value)}
                    placeholder="e.g. Chemistry_Lab_Exp4.pdf"
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Notes / Faculty Feedback / Viva Preparation
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notes on methodology, viva questions, professor instructions..."
                  className="w-full p-2.5 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                />
              </div>

              {/* Timestamp Info Box in Edit Mode */}
              {editingItem && (
                <div className="p-3 rounded-[10px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-ink-muted)]">Previous Update:</span>
                    <span className="font-medium text-[var(--color-ink)]">{formatTimestamp(editingItem.lastUpdatedAt)}</span>
                  </div>
                  {editingItem.submittedAt && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-ink-muted)]">Submission Recorded:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatTimestamp(editingItem.submittedAt)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-4 py-2 rounded-[8px] text-xs font-bold bg-[var(--color-accent)] text-white hover:bg-[#8A1627]"
              >
                {editingItem ? "Update College Work" : "Save College Work"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
