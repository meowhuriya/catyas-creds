"use client";

import * as React from "react";
import Link from "next/link";
import {
  FlaskConical,
  BookOpen,
  Sparkles,
  Headphones,
  FileText,
  HelpCircle,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Layers,
  FileCode,
  Tag,
  Loader2,
  X,
  FastForward,
  Rewind,
  BookMarked,
  Share2,
} from "lucide-react";
import { useDataStore } from "@/lib/repository";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface ResearchSource {
  id: string;
  title: string;
  type: "paper" | "syllabus" | "note" | "web";
  content: string;
  author?: string;
  selected: boolean;
  dateAdded: string;
}

export interface DialogueLine {
  speaker: "Alex" | "Sam";
  text: string;
  emotion?: string;
}

export interface AudioOverviewData {
  title: string;
  duration: string;
  dialogue: DialogueLine[];
}

export interface FAQItem {
  question: string;
  answer: string;
  citation: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  abstract: string;
  field: string;
  tags: string[];
  sources: ResearchSource[];
  briefingDoc?: string;
  studyGuide?: string;
  faq?: FAQItem[];
  audioOverview?: AudioOverviewData;
  chatHistory: Array<{ role: "user" | "model"; content: string }>;
  createdAt: string;
}

const SEED_PROJECTS: ResearchProject[] = [
  {
    id: "proj-edge-ai",
    title: "Edge AI Acceleration on Microcontrollers",
    abstract:
      "Investigating INT8 quantization and memory-efficient matrix convolution operators for deploying transformer models on ARM Cortex-M hardware without cloud latency.",
    field: "Embedded AI & Systems",
    tags: ["TinyML", "Quantization", "ARM Cortex-M", "C++", "Neural Acceleration"],
    createdAt: "2026-03-12",
    sources: [
      {
        id: "src-1",
        title: "INT8 Tensor Quantization & Cache Alignment",
        type: "paper",
        author: "Prof. S. Narayanan et al., IEEE Embedded Systems Letters",
        selected: true,
        dateAdded: "2026-03-12",
        content: `Standard float32 activations require 4 bytes per weight. Quantizing activations to asymmetric INT8 reduces memory footprint by 75% with less than 0.8% accuracy degradation on ImageNet benchmarks. 
Crucially, on ARM Cortex-M55 cores with Helium vector extensions, 8-bit SIMD instructions (e.g. SMLAD) execute 4 multiply-accumulates per cycle.
Cache eviction remains the primary bottleneck when SRAM is strictly under 512KB. By tiling intermediate feature maps into 32x32 blocks, L1 cache miss rates drop from 34% to under 4.2%.`,
      },
      {
        id: "src-2",
        title: "B.Tech Unit 5: Smart Materials & Micro-Sensors",
        type: "syllabus",
        author: "Valeria Syllabus Repository (CH102BS)",
        selected: true,
        dateAdded: "2026-03-14",
        content: `Advanced Functional Materials: Piezoelectric sensors and Shape Memory Alloys (SMA) provide direct analog signal transducing without dedicated external op-amps.
When coupling piezoelectric vibration transducers directly to the ADC of an ultra-low-power MCU, power budgets remain strictly under 15 milliwatts.
Applications include autonomous structural health monitoring, smart aerospace wing camber adjustments, and vibration-harvested edge compute nodes.`,
      },
      {
        id: "src-3",
        title: "Pruning & Weight Clustering Benchmarks",
        type: "note",
        author: "Lab Notebook #4",
        selected: true,
        dateAdded: "2026-03-16",
        content: `Iterative magnitude pruning achieved 68% sparsity across fully connected layers without accuracy loss.
Combining weight sharing (k-means clustering to 16 centroids per layer) allows storing weight indices in 4-bit nibbles.
Observed inference latency on STM32H7: 42ms per frame at 21mW total dissipation. Thermal stability verified over a 4-hour continuous inference stress cycle.`,
      },
    ],
    audioOverview: {
      title: "Deep Dive: Cracking TinyML on 512KB SRAM",
      duration: "3 min",
      dialogue: [
        {
          speaker: "Alex",
          text: "Welcome back to the lab briefing! So today, we're looking at something that feels like an impossible engineering puzzle: how do you run modern neural networks on hardware that has less memory than an old digital watch?",
          emotion: "curious",
        },
        {
          speaker: "Sam",
          text: "Right! We're talking microcontrollers with barely 512 kilobytes of SRAM. If you try loading standard float32 tensors, you blow your memory stack before you even finish the first convolution layer.",
          emotion: "explanatory",
        },
        {
          speaker: "Alex",
          text: "And that's where the INT8 quantization paper in our sources comes in. Dropping from 32-bit floats to 8-bit integers immediately cuts your memory footprint by 75%!",
          emotion: "excited",
        },
        {
          speaker: "Sam",
          text: "Exactly. But what really surprised me in the benchmarks was the Helium vector extensions on the ARM Cortex-M55. With SIMD SMLAD instructions, it performs four multiply-accumulates in a single clock cycle.",
          emotion: "thoughtful",
        },
        {
          speaker: "Alex",
          text: "Wait, so you're not just saving memory—you're actually multiplying compute throughput. But what about cache misses?",
          emotion: "curious",
        },
        {
          speaker: "Sam",
          text: "That was the critical insight. Look at Source 1: by tiling the feature maps into 32x32 blocks, cache miss rates plummeted from 34% down to just 4.2%.",
          emotion: "explanatory",
        },
        {
          speaker: "Alex",
          text: "And when you hook that up to the piezoelectric smart sensors from Unit 5, you have a completely self-sustaining edge monitor drawing under 15 milliwatts. Mind blown.",
          emotion: "excited",
        },
        {
          speaker: "Sam",
          text: "It completely redefines what can run on the edge without ever sending raw data to the cloud.",
          emotion: "thoughtful",
        },
      ],
    },
    briefingDoc: `### Executive Briefing: Edge AI Acceleration on Resource-Constrained Microcontrollers

**Primary Thesis**: Deep neural networks can achieve real-time inference latency (<50ms) within ultra-tight 512KB SRAM budgets by combining INT8 quantization, 32x32 cache tiling, and SIMD hardware acceleration.

#### Key Architectural Findings
1. **INT8 Quantization & Memory Compression**: Reduces activation footprint by 75% while preserving 99.2% of baseline accuracy on classification benchmarks [Source 1].
2. **Helium SIMD Vectorization**: Exploiting SMLAD instructions yields four simultaneous multiply-accumulate operations per clock cycle [Source 1].
3. **Cache Tiling**: Constraining working memory to 32x32 sub-matrices slashes L1 cache misses from 34% to 4.2% [Source 1].
4. **Energy Harvesting Integration**: Direct coupling with piezoelectric transducers keeps overall power dissipation under 15mW, enabling batteryless edge deployments [Source 2].

#### Engineering Recommendations
- Implement iterative magnitude pruning prior to INT8 conversion to unlock an additional 60%+ weight sparsity [Source 3].
- Target STM32H7 or Cortex-M55 silicon targets with dedicated DSP/SIMD instruction support for sub-45ms latency.`,
    studyGuide: `### Academic Study Guide: Micro-Neural Systems & Edge Inference

#### Core Concept Mastery Matrix
- **Asymmetric INT8 Quantization**: Mapping high-precision continuous floating-point weights onto discrete 8-bit signed integer values using a scale factor $S$ and zero-point offset $Z$: $q = \\text{round}(r / S) + Z$.
- **Helium Vector Extension**: ARM's M-Profile Vector Extension (MVE) delivering SIMD compute inside microcontroller cores.
- **Cache Tiling**: Decomposing large matrix convolutions into block partitions to guarantee all active sub-matrices reside strictly in L1 cache.

#### Synthesis & Exam Practice
1. **Why does 32x32 cache tiling reduce L1 cache misses from 34% to 4.2%?**
   *Model Answer*: When matrix dimensions exceed cache size, standard row-major traversals trigger continuous cache evictions. 32x32 tiles fit entirely within the 32KB L1 data cache, allowing all reuse to occur in high-speed memory [Source 1].

2. **How do piezoelectric sensors eliminate the need for analog amplification in low-power edge nodes?**
   *Model Answer*: Piezoelectric crystals generate direct voltage spikes upon mechanical strain, enabling direct routing into the microcontroller's low-noise ADC [Source 2].`,
    faq: [
      {
        question: "How does INT8 quantization maintain accuracy with 75% less precision?",
        answer:
          "Neural network weights are typically clustered around zero. By applying per-channel scale factors and zero-point calibration, the dynamic range of critical weights is preserved with under 0.8% degradation.",
        citation: "Source 1, para 1",
      },
      {
        question: "What is the role of SIMD SMLAD instructions in inference speed?",
        answer:
          "The SMLAD instruction carries out two 16-bit or four 8-bit multiply-accumulate operations in a single CPU cycle, effectively quadrupling throughput on ARM Helium cores.",
        citation: "Source 1, para 2",
      },
      {
        question: "Can these models operate entirely off harvested vibrational energy?",
        answer:
          "Yes. Source 2 verifies that when coupled with piezoelectric transducers, total dissipation stays under 15 milliwatts, within the threshold of kinetic vibrational harvesters.",
        citation: "Source 2, para 3",
      },
    ],
    chatHistory: [],
  },
  {
    id: "proj-nitinol",
    title: "Nitinol Shape Memory Alloys in Aerospace Actuators",
    abstract:
      "Investigating martensite-austenite crystallographic phase transformations under thermo-mechanical cycling to replace hydraulic actuators in wing control surfaces.",
    field: "Materials Engineering",
    tags: ["Nitinol", "SMA", "Phase Transformation", "Aerospace", "Austenite"],
    createdAt: "2026-03-08",
    sources: [
      {
        id: "src-nit-1",
        title: "Martensite to Austenite Hysteresis Loops",
        type: "paper",
        author: "Journal of Materials Science & Engineering",
        selected: true,
        dateAdded: "2026-03-08",
        content: `Near-equiatomic NiTi (Nitinol) undergoes a reversible diffusionless solid-state phase transformation. 
At low temperature, the twinned monoclinic B19' martensite phase deforms under stress via detwinning.
Upon Joule heating above the Austenite Finish temperature (Af = 68°C), the crystalline lattice snaps into the ordered cubic B2 austenite parent phase, recovering up to 8% mechanical strain against external loads exceeding 400 MPa.`,
      },
      {
        id: "src-nit-2",
        title: "Thermal Fatigue & Cycle Degradation in Aerospace Actuators",
        type: "paper",
        author: "AIAA Aerospace Actuation Symposium",
        selected: true,
        dateAdded: "2026-03-10",
        content: `Replacing hydraulic actuators with antagonist NiTi wire pairs yields a 42% weight reduction in UAV wing trailing-edge tabs.
However, functional fatigue induces plastic slip dislocation accumulation, causing transformation temperature drift of 4.5°C over 100,000 thermal cycles.
Pre-straining at 3.5% followed by 450°C stress relief annealing stabilizes the hysteresis loop and extends fatigue life past 250,000 cycles.`,
      },
    ],
    audioOverview: {
      title: "Deep Dive: Metal That Remembers Its Shape",
      duration: "2 min",
      dialogue: [
        {
          speaker: "Alex",
          text: "Have you ever bent a piece of metal, heated it up with a heat gun, and watched it magically snap back into a spring? That's Nitinol.",
          emotion: "excited",
        },
        {
          speaker: "Sam",
          text: "It's near-equiatomic Nickel-Titanium. And what's wild is that it's not melting or softening. It's a diffusionless, solid-state phase shift between martensite and austenite.",
          emotion: "explanatory",
        },
        {
          speaker: "Alex",
          text: "And aerospace engineers are using this to replace massive, heavy hydraulic pumps in aircraft wings. The sources show a 42% weight reduction in UAV trailing-edge tabs!",
          emotion: "thoughtful",
        },
        {
          speaker: "Sam",
          text: "Exactly. But there is a catch: thermal fatigue. After 100,000 cycles, the transition temperature drifts by 4.5 degrees. That's why the 450°C stress relief annealing protocol in Source 2 is so vital.",
          emotion: "explanatory",
        },
      ],
    },
    chatHistory: [],
  },
];

export default function ResearchLabPage() {
  const toast = useToast();
  const { courses } = useDataStore();

  const [projects, setProjects] = React.useState<ResearchProject[]>(SEED_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(SEED_PROJECTS[0].id);
  const [activeTab, setActiveTab] = React.useState<
    "audio" | "briefing" | "study" | "faq" | "chat"
  >("audio");

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = React.useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = React.useState(false);
  const [showImportSyllabusModal, setShowImportSyllabusModal] = React.useState(false);
  const [selectedSourceToInspect, setSelectedSourceToInspect] =
    React.useState<ResearchSource | null>(null);

  // New Project Form
  const [newProjectTitle, setNewProjectTitle] = React.useState("");
  const [newProjectAbstract, setNewProjectAbstract] = React.useState("");
  const [newProjectField, setNewProjectField] = React.useState("Artificial Intelligence");
  const [newProjectTags, setNewProjectTags] = React.useState("");

  // Add Source Form
  const [newSourceTitle, setNewSourceTitle] = React.useState("");
  const [newSourceContent, setNewSourceContent] = React.useState("");
  const [newSourceAuthor, setNewSourceAuthor] = React.useState("");
  const [newSourceType, setNewSourceType] = React.useState<
    "paper" | "syllabus" | "note" | "web"
  >("paper");

  // AI Generation State
  const [isSynthesizing, setIsSynthesizing] = React.useState(false);
  const [chatInput, setChatInput] = React.useState("");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  // Web Speech Audio Overview Player
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const [currentLineIndex, setCurrentLineIndex] = React.useState(0);
  const [speechRate, setSpeechRate] = React.useState(1.0);
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const isCancelledRef = React.useRef(false);

  // Initialize projects from localStorage if present
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("valeria_research_projects");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProjects(parsed);
            setSelectedProjectId(parsed[0].id);
          }
        }
      } catch (err) {
        console.warn("Error reading research projects from localStorage", err);
      }
    }
  }, []);

  // Save projects to localStorage on update
  const saveProjects = (updatedList: ResearchProject[]) => {
    setProjects(updatedList);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("valeria_research_projects", JSON.stringify(updatedList));
      } catch (err) {
        console.warn("Error saving research projects to localStorage", err);
      }
    }
  };

  // Populate Web Speech voices
  React.useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const currentProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0] || SEED_PROJECTS[0];

  const selectedSources = currentProject?.sources?.filter((s) => s.selected) || [];

  // Toggle Source Selection
  const toggleSourceSelection = (sourceId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== currentProject.id) return p;
      return {
        ...p,
        sources: p.sources.map((s) =>
          s.id === sourceId ? { ...s, selected: !s.selected } : s
        ),
      };
    });
    saveProjects(updated);
  };

  const selectAllSources = (select: boolean) => {
    const updated = projects.map((p) => {
      if (p.id !== currentProject.id) return p;
      return {
        ...p,
        sources: p.sources.map((s) => ({ ...s, selected: select })),
      };
    });
    saveProjects(updated);
  };

  const deleteSource = (sourceId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== currentProject.id) return p;
      return {
        ...p,
        sources: p.sources.filter((s) => s.id !== sourceId),
      };
    });
    saveProjects(updated);
    toast.success("Source removed", "Source has been deleted from this project.");
  };

  // Create New Project Handler
  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) {
      toast.error("Title required", "Please enter a project title.");
      return;
    }
    const newProj: ResearchProject = {
      id: `proj-${Date.now()}`,
      title: newProjectTitle.trim(),
      abstract:
        newProjectAbstract.trim() || "Independent academic research project.",
      field: newProjectField,
      tags: newProjectTags
        ? newProjectTags.split(",").map((t) => t.trim()).filter(Boolean)
        : ["Research", "Academic"],
      sources: [],
      chatHistory: [],
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = [newProj, ...projects];
    saveProjects(updated);
    setSelectedProjectId(newProj.id);
    setShowNewProjectModal(false);
    setNewProjectTitle("");
    setNewProjectAbstract("");
    setNewProjectTags("");
    toast.success("Project created", `"${newProj.title}" is ready for sources.`);
  };

  // Add Source Handler
  const handleAddSource = () => {
    if (!newSourceTitle.trim() || !newSourceContent.trim()) {
      toast.error("Fields required", "Please provide both a title and source content.");
      return;
    }

    const newSrc: ResearchSource = {
      id: `src-${Date.now()}`,
      title: newSourceTitle.trim(),
      content: newSourceContent.trim(),
      author: newSourceAuthor.trim() || "User Input / Academic Note",
      type: newSourceType,
      selected: true,
      dateAdded: new Date().toISOString().split("T")[0],
    };

    const updated = projects.map((p) => {
      if (p.id !== currentProject.id) return p;
      return {
        ...p,
        sources: [newSrc, ...p.sources],
      };
    });

    saveProjects(updated);
    setShowAddSourceModal(false);
    setNewSourceTitle("");
    setNewSourceContent("");
    setNewSourceAuthor("");
    toast.success("Source added", `"${newSrc.title}" added to project.`);
  };

  // Import Course Syllabus into Project Sources
  const handleImportCourseAsSource = (courseCode: string, courseTitle: string) => {
    const syllabusSrc: ResearchSource = {
      id: `src-course-${Date.now()}`,
      title: `${courseCode} - ${courseTitle} Syllabus`,
      content: `Official Curricular Syllabus for ${courseCode} (${courseTitle}). Topics cover theoretical fundamentals, core mathematical derivations, algorithmic implementations, and laboratory experiments prescribed by academic standards.`,
      author: `Valeria University Curriculum Board (${courseCode})`,
      type: "syllabus",
      selected: true,
      dateAdded: new Date().toISOString().split("T")[0],
    };

    const updated = projects.map((p) => {
      if (p.id !== currentProject.id) return p;
      return {
        ...p,
        sources: [syllabusSrc, ...p.sources],
      };
    });

    saveProjects(updated);
    setShowImportSyllabusModal(false);
    toast.success("Syllabus imported", `Imported ${courseCode} as a research source.`);
  };

  // Synthesize with AI (NotebookLM Mode)
  const handleSynthesize = async (
    mode: "briefing" | "study_guide" | "faq" | "audio_overview"
  ) => {
    if (selectedSources.length === 0) {
      toast.error(
        "No sources selected",
        "Select at least one source on the left to ground the synthesis."
      );
      return;
    }

    try {
      setIsSynthesizing(true);
      toast.info("Synthesizing research", `Running NotebookLM ${mode.replace("_", " ")} engine...`);

      const res = await fetch("/api/ai/notebooklm-synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          projectTitle: currentProject.title,
          sources: selectedSources,
        }),
      });

      if (!res.ok) {
        throw new Error("AI synthesis failed");
      }

      const data = await res.json();

      const updated = projects.map((p) => {
        if (p.id !== currentProject.id) return p;
        if (mode === "briefing") {
          return { ...p, briefingDoc: data.markdown };
        } else if (mode === "study_guide") {
          return { ...p, studyGuide: data.markdown };
        } else if (mode === "faq") {
          return { ...p, faq: data.faq };
        } else if (mode === "audio_overview") {
          return { ...p, audioOverview: data.audioOverview };
        }
        return p;
      });

      saveProjects(updated);
      toast.success("Synthesis complete", `Generated ${mode.replace("_", " ")}.`);
    } catch (err: any) {
      console.error(err);
      toast.error("Generation error", "Failed to generate AI synthesis. Check API key.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Grounded Chat Send
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    if (selectedSources.length === 0) {
      toast.error("No sources", "Select at least 1 source to ground the chat.");
      return;
    }

    const query = chatInput.trim();
    setChatInput("");

    // Optimistic user message
    const updatedWithUser = projects.map((p) => {
      if (p.id !== currentProject.id) return p;
      return {
        ...p,
        chatHistory: [...p.chatHistory, { role: "user" as const, content: query }],
      };
    });
    setProjects(updatedWithUser);

    try {
      setIsSynthesizing(true);
      const res = await fetch("/api/ai/notebooklm-synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          projectTitle: currentProject.title,
          sources: selectedSources,
          userQuery: query,
        }),
      });

      const data = await res.json();
      const botAnswer =
        data.answer || "I could not find relevant grounded evidence in the selected sources.";

      const updatedWithBot = projects.map((p) => {
        if (p.id !== currentProject.id) return p;
        return {
          ...p,
          chatHistory: [
            ...p.chatHistory,
            { role: "user" as const, content: query },
            { role: "model" as const, content: botAnswer },
          ],
        };
      });
      saveProjects(updatedWithBot);
    } catch (err) {
      toast.error("Chat error", "Unable to query sources.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Web Speech Dual-Voice Audio Overview Player
  const stopAudio = React.useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      isCancelledRef.current = true;
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  }, []);

  const speakLine = React.useCallback(
    (index: number) => {
      const dialogue = currentProject?.audioOverview?.dialogue;
      if (!dialogue || index >= dialogue.length || isCancelledRef.current) {
        setIsPlayingAudio(false);
        setCurrentLineIndex(0);
        return;
      }

      setCurrentLineIndex(index);
      const item = dialogue[index];
      const utterance = new SpeechSynthesisUtterance(item.text);
      utteranceRef.current = utterance;

      // Assign distinct voice profiles for Alex vs Sam
      if (voices.length > 0) {
        if (item.speaker === "Alex") {
          // Alex: Prefer natural feminine/warm voice or pitch 1.15
          const femaleVoice = voices.find(
            (v) =>
              v.name.includes("Samantha") ||
              v.name.includes("Victoria") ||
              v.name.includes("Karen") ||
              v.name.includes("Zira") ||
              v.name.includes("Google UK English Female")
          );
          if (femaleVoice) utterance.voice = femaleVoice;
          utterance.pitch = 1.12;
        } else {
          // Sam: Prefer natural masculine/deep voice or pitch 0.88
          const maleVoice = voices.find(
            (v) =>
              v.name.includes("Daniel") ||
              v.name.includes("Alex") ||
              v.name.includes("David") ||
              v.name.includes("Google UK English Male")
          );
          if (maleVoice) utterance.voice = maleVoice;
          utterance.pitch = 0.88;
        }
      } else {
        utterance.pitch = item.speaker === "Alex" ? 1.15 : 0.88;
      }

      utterance.rate = speechRate;

      utterance.onend = () => {
        if (!isCancelledRef.current) {
          speakLine(index + 1);
        }
      };

      utterance.onerror = (e) => {
        console.warn("Speech error:", e);
        setIsPlayingAudio(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [currentProject, voices, speechRate]
  );

  const startAudio = () => {
    if (!currentProject?.audioOverview?.dialogue?.length) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Not supported", "Browser does not support Speech Synthesis API.");
      return;
    }

    stopAudio();
    isCancelledRef.current = false;
    setIsPlayingAudio(true);
    speakLine(currentLineIndex);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success("Copied to clipboard", "Artifact copied successfully.");
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Project Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[16px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <FlaskConical className="h-4 w-4" />
            <span>Research & Lab Studio</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
              NotebookLM Engine
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[var(--color-ink)]">
            {currentProject.title}
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1 max-w-2xl leading-relaxed">
            {currentProject.abstract}
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={selectedProjectId}
            onChange={(e) => {
              stopAudio();
              setSelectedProjectId(e.target.value);
            }}
            className="text-xs h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] text-[var(--color-ink)] border border-[var(--color-border)] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.sources.length} sources)
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[var(--color-accent)] hover:bg-[#8A1627] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Sources, Right Synthesis Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Grounded Sources Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="academic-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[var(--color-accent)]" />
                <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
                  Sources ({currentProject.sources.length})
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowImportSyllabusModal(true)}
                  className="px-2 py-1 text-[11px] font-semibold rounded-[6px] bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] text-[var(--color-ink)] border border-[var(--color-border)] transition-colors"
                  title="Import from 19 course syllabi"
                >
                  + Syllabus
                </button>
                <button
                  onClick={() => setShowAddSourceModal(true)}
                  className="px-2 py-1 text-[11px] font-semibold rounded-[6px] bg-[var(--color-accent)] text-white hover:bg-[#8A1627] transition-colors"
                >
                  + Add Source
                </button>
              </div>
            </div>

            {/* Quick Filter: Select All / Deselect All */}
            <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
              <span>
                {selectedSources.length} of {currentProject.sources.length} sources selected for
                synthesis
              </span>
              <div className="flex items-center gap-2 font-semibold">
                <button
                  onClick={() => selectAllSources(true)}
                  className="hover:text-[var(--color-accent)]"
                >
                  All
                </button>
                <span>•</span>
                <button
                  onClick={() => selectAllSources(false)}
                  className="hover:text-[var(--color-accent)]"
                >
                  None
                </button>
              </div>
            </div>

            {/* Sources List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {currentProject.sources.length === 0 ? (
                <div className="p-6 text-center rounded-[10px] border border-dashed border-[var(--color-border)] text-xs text-[var(--color-ink-muted)]">
                  <Upload className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold">No sources loaded yet</p>
                  <p className="text-[11px] mt-1">
                    Add research papers, notes, or import your B.Tech course topics to ground the AI.
                  </p>
                </div>
              ) : (
                currentProject.sources.map((src) => (
                  <div
                    key={src.id}
                    className={cn(
                      "p-3 rounded-[10px] border transition-all text-xs flex items-start gap-2.5 group cursor-pointer",
                      src.selected
                        ? "bg-[var(--color-surface-muted)] border-[var(--color-accent)]/50 shadow-sm"
                        : "bg-[var(--color-surface)] border-[var(--color-border)] opacity-70 hover:opacity-100"
                    )}
                    onClick={() => setSelectedSourceToInspect(src)}
                  >
                    <input
                      type="checkbox"
                      checked={src.selected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSourceSelection(src.id);
                      }}
                      className="mt-0.5 rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider",
                            src.type === "paper" &&
                              "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                            src.type === "syllabus" &&
                              "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                            src.type === "note" &&
                              "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          )}
                        >
                          {src.type}
                        </span>
                        <h4 className="font-semibold text-[var(--color-ink)] truncate text-xs">
                          {src.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[var(--color-ink-muted)] line-clamp-2 mt-1">
                        {src.content}
                      </p>
                      {src.author && (
                        <p className="text-[10px] text-[var(--color-accent)] mt-1 truncate">
                          {src.author}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSource(src.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-ink-muted)] hover:text-red-500 transition-opacity"
                      title="Remove source"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): NotebookLM Studio Workspace */}
        <div className="lg:col-span-8 space-y-4">
          {/* Studio Tab Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-[12px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("audio")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors",
                  activeTab === "audio"
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                )}
              >
                <Headphones className="h-3.5 w-3.5" />
                <span>Audio Overview</span>
              </button>

              <button
                onClick={() => setActiveTab("briefing")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors",
                  activeTab === "briefing"
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Briefing Doc</span>
              </button>

              <button
                onClick={() => setActiveTab("study")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors",
                  activeTab === "study"
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                )}
              >
                <BookMarked className="h-3.5 w-3.5" />
                <span>Study Guide</span>
              </button>

              <button
                onClick={() => setActiveTab("faq")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors",
                  activeTab === "faq"
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                )}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>FAQ</span>
              </button>

              <button
                onClick={() => setActiveTab("chat")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors",
                  activeTab === "chat"
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Source Chat</span>
              </button>
            </div>

            {/* AI Synthesize Action */}
            <button
              onClick={() => {
                if (activeTab === "audio") handleSynthesize("audio_overview");
                else if (activeTab === "briefing") handleSynthesize("briefing");
                else if (activeTab === "study") handleSynthesize("study_guide");
                else if (activeTab === "faq") handleSynthesize("faq");
              }}
              disabled={isSynthesizing || selectedSources.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] text-[var(--color-accent)] text-xs font-bold border border-[var(--color-accent)]/30 transition-all disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    Generate{" "}
                    {activeTab === "audio"
                      ? "Audio"
                      : activeTab === "briefing"
                      ? "Briefing"
                      : activeTab === "study"
                      ? "Guide"
                      : activeTab === "faq"
                      ? "FAQ"
                      : "Synthesis"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* TAB 1: AUDIO OVERVIEW (DEEP DIVE PODCAST) */}
          {activeTab === "audio" && (
            <div className="space-y-4">
              <div className="academic-card p-5 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-muted)] border border-[var(--color-border)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                        NotebookLM Dual-Host Audio Overview
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[var(--color-ink)] mt-0.5">
                      {currentProject.audioOverview?.title || "Deep Dive Audio Overview"}
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      Lively academic podcast hosted by Alex (Inquisitive) & Sam (Specialist) •{" "}
                      {currentProject.audioOverview?.duration || "3 min"}
                    </p>
                  </div>

                  {/* Player Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setSpeechRate((prev) => (prev === 1.0 ? 1.25 : prev === 1.25 ? 1.5 : 1.0))
                      }
                      className="px-2 py-1 text-[11px] font-bold rounded-[6px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                      title="Adjust playback speed"
                    >
                      {speechRate}x
                    </button>

                    {isPlayingAudio ? (
                      <button
                        onClick={stopAudio}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold shadow-md hover:bg-[#8A1627] transition-all"
                      >
                        <Pause className="h-4 w-4" />
                        <span>Pause Podcast</span>
                      </button>
                    ) : (
                      <button
                        onClick={startAudio}
                        disabled={!currentProject.audioOverview?.dialogue?.length}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold shadow-md hover:bg-[#8A1627] transition-all disabled:opacity-50"
                      >
                        <Play className="h-4 w-4" />
                        <span>Play Podcast</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        stopAudio();
                        setCurrentLineIndex(0);
                      }}
                      className="p-2 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                      title="Restart from beginning"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Animated Waveform Visualization */}
                <div className="flex items-center justify-center gap-1.5 py-4">
                  {[40, 75, 25, 90, 60, 85, 30, 95, 45, 80, 50, 70, 35, 88, 65, 40].map(
                    (val, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "w-1 rounded-full transition-all duration-300",
                          isPlayingAudio
                            ? "bg-[var(--color-accent)] animate-pulse"
                            : "bg-[var(--color-border)]"
                        )}
                        style={{
                          height: isPlayingAudio ? `${Math.max(12, (val * 0.4))}px` : "12px",
                          animationDelay: `${idx * 75}ms`,
                        }}
                      />
                    )
                  )}
                </div>

                {/* Live Teleprompter Transcript */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pt-2 pr-1">
                  {!currentProject.audioOverview?.dialogue?.length ? (
                    <div className="text-center py-8 text-xs text-[var(--color-ink-muted)]">
                      <p>No audio overview script generated for this project yet.</p>
                      <button
                        onClick={() => handleSynthesize("audio_overview")}
                        className="mt-2 text-[var(--color-accent)] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Generate Audio Overview with Gemini</span>
                      </button>
                    </div>
                  ) : (
                    currentProject.audioOverview.dialogue.map((line, idx) => {
                      const isActive = isPlayingAudio && currentLineIndex === idx;
                      const isAlex = line.speaker === "Alex";

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            stopAudio();
                            speakLine(idx);
                            setIsPlayingAudio(true);
                          }}
                          className={cn(
                            "p-3.5 rounded-[12px] border transition-all cursor-pointer text-xs flex gap-3 items-start",
                            isActive
                              ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)] shadow-sm scale-[1.01]"
                              : "bg-[var(--color-surface)] border-[var(--color-border)]/70 hover:border-[var(--color-border)]"
                          )}
                        >
                          <div
                            className={cn(
                              "h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white shadow-sm",
                              isAlex ? "bg-[#8A1627]" : "bg-[#1E293B]"
                            )}
                          >
                            {line.speaker[0]}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-[var(--color-ink)]">
                                {line.speaker}
                              </span>
                              {line.emotion && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] italic">
                                  {line.emotion}
                                </span>
                              )}
                              {isActive && (
                                <span className="text-[10px] text-[var(--color-accent)] font-bold flex items-center gap-1 ml-auto">
                                  <Volume2 className="h-3 w-3 animate-bounce" />
                                  <span>Speaking</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[var(--color-ink)] leading-relaxed">{line.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRIEFING DOCUMENT */}
          {activeTab === "briefing" && (
            <div className="academic-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                    Executive Briefing Document
                  </h3>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Synthesized overview grounded strictly in selected research sources.
                  </p>
                </div>
                {currentProject.briefingDoc && (
                  <button
                    onClick={() => copyToClipboard(currentProject.briefingDoc!, "briefing")}
                    className="p-1.5 text-xs rounded-[6px] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-ink)] inline-flex items-center gap-1.5"
                  >
                    {copiedKey === "briefing" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>Copy</span>
                  </button>
                )}
              </div>

              {!currentProject.briefingDoc ? (
                <div className="text-center py-12 text-xs text-[var(--color-ink-muted)]">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40 text-[var(--color-accent)]" />
                  <p className="font-semibold">No briefing document generated yet.</p>
                  <button
                    onClick={() => handleSynthesize("briefing")}
                    className="mt-3 px-4 py-2 rounded-[8px] bg-[var(--color-accent)] text-white font-semibold inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Briefing with Gemini</span>
                  </button>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-3 whitespace-pre-wrap font-sans text-[var(--color-ink)]">
                  {currentProject.briefingDoc}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STUDY GUIDE */}
          {activeTab === "study" && (
            <div className="academic-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                    Curated Academic Study Guide
                  </h3>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Exam readiness, synthesis questions, formulas, and terminology.
                  </p>
                </div>
                {currentProject.studyGuide && (
                  <button
                    onClick={() => copyToClipboard(currentProject.studyGuide!, "study")}
                    className="p-1.5 text-xs rounded-[6px] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-ink)] inline-flex items-center gap-1.5"
                  >
                    {copiedKey === "study" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>Copy</span>
                  </button>
                )}
              </div>

              {!currentProject.studyGuide ? (
                <div className="text-center py-12 text-xs text-[var(--color-ink-muted)]">
                  <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-40 text-[var(--color-accent)]" />
                  <p className="font-semibold">No study guide generated yet.</p>
                  <button
                    onClick={() => handleSynthesize("study_guide")}
                    className="mt-3 px-4 py-2 rounded-[8px] bg-[var(--color-accent)] text-white font-semibold inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Study Guide with Gemini</span>
                  </button>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-3 whitespace-pre-wrap font-sans text-[var(--color-ink)]">
                  {currentProject.studyGuide}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FAQ & SOURCE CITATIONS */}
          {activeTab === "faq" && (
            <div className="academic-card p-5 space-y-4">
              <div className="border-b border-[var(--color-border)] pb-3">
                <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                  Frequently Asked Questions (Grounded)
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Technical questions extracted and verified against source evidence.
                </p>
              </div>

              {!currentProject.faq?.length ? (
                <div className="text-center py-12 text-xs text-[var(--color-ink-muted)]">
                  <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-40 text-[var(--color-accent)]" />
                  <p className="font-semibold">No FAQs generated yet.</p>
                  <button
                    onClick={() => handleSynthesize("faq")}
                    className="mt-3 px-4 py-2 rounded-[8px] bg-[var(--color-accent)] text-white font-semibold inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Extract Technical FAQs</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentProject.faq.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2 text-xs"
                    >
                      <h4 className="font-bold text-[var(--color-ink)] flex items-start gap-2">
                        <span className="text-[var(--color-accent)] font-serif">Q{idx + 1}.</span>
                        <span>{item.question}</span>
                      </h4>
                      <p className="text-[var(--color-ink-muted)] leading-relaxed pl-6">
                        {item.answer}
                      </p>
                      <div className="pl-6 pt-1 flex items-center gap-1.5 text-[10px] text-[var(--color-accent)] font-medium">
                        <Tag className="h-3 w-3" />
                        <span>Citation: {item.citation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GROUNDED SOURCE CHAT */}
          {activeTab === "chat" && (
            <div className="academic-card p-5 space-y-4 flex flex-col h-[560px]">
              <div className="border-b border-[var(--color-border)] pb-3 shrink-0">
                <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                  Grounded Source Assistant
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Ask any question. Answers are strictly grounded in your {selectedSources.length}{" "}
                  selected sources.
                </p>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {currentProject.chatHistory.length === 0 ? (
                  <div className="text-center py-16 text-xs text-[var(--color-ink-muted)]">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40 text-[var(--color-accent)]" />
                    <p className="font-semibold">Ask anything about your research sources.</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-md mx-auto">
                      <button
                        onClick={() => {
                          setChatInput("What are the main performance trade-offs identified?");
                        }}
                        className="px-2.5 py-1 rounded-full bg-[var(--color-surface-muted)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[11px]"
                      >
                        Performance trade-offs?
                      </button>
                      <button
                        onClick={() => {
                          setChatInput("Summarize the mathematical models or equations used.");
                        }}
                        className="px-2.5 py-1 rounded-full bg-[var(--color-surface-muted)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[11px]"
                      >
                        Mathematical models?
                      </button>
                    </div>
                  </div>
                ) : (
                  currentProject.chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3.5 rounded-[12px] max-w-[85%] leading-relaxed text-xs",
                        msg.role === "user"
                          ? "ml-auto bg-[var(--color-accent)] text-white"
                          : "mr-auto bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                      )}
                    >
                      <div className="font-semibold text-[10px] mb-1 opacity-70 uppercase tracking-wider">
                        {msg.role === "user" ? "You" : "NotebookLM Assistant"}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))
                )}
                {isSynthesizing && (
                  <div className="p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs text-[var(--color-ink-muted)] flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-accent)]" />
                    <span>Searching grounded sources and synthesizing answer...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="pt-2 border-t border-[var(--color-border)] shrink-0 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                  placeholder={`Ask a question based on ${selectedSources.length} sources...`}
                  className="flex-1 text-xs h-9 px-3.5 rounded-[8px] bg-[var(--color-surface-muted)] text-[var(--color-ink)] border border-[var(--color-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isSynthesizing}
                  className="px-4 h-9 rounded-[8px] bg-[var(--color-accent)] hover:bg-[#8A1627] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  Ask
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create New Project */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[16px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                Create New Research Project
              </h3>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="e.g. Byzantine Fault Tolerance in Sub-Second Blockchains"
                  className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Academic Field
                </label>
                <select
                  value={newProjectField}
                  onChange={(e) => setNewProjectField(e.target.value)}
                  className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                >
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Embedded Systems & IoT">Embedded Systems & IoT</option>
                  <option value="Materials Engineering">Materials Engineering</option>
                  <option value="Distributed Systems">Distributed Systems</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Bioinformatics">Bioinformatics</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Project Abstract / Premise
                </label>
                <textarea
                  rows={3}
                  value={newProjectAbstract}
                  onChange={(e) => setNewProjectAbstract(e.target.value)}
                  placeholder="Summarize the core research question or engineering challenge..."
                  className="w-full p-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newProjectTags}
                  onChange={(e) => setNewProjectTags(e.target.value)}
                  placeholder="Consensus, Cryptography, Rust"
                  className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 rounded-[8px] text-xs font-bold bg-[var(--color-accent)] text-white hover:bg-[#8A1627]"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Custom Research Source */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[16px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                Add Research Source
              </h3>
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Source Type
                  </label>
                  <select
                    value={newSourceType}
                    onChange={(e: any) => setNewSourceType(e.target.value)}
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  >
                    <option value="paper">Research Paper / PDF</option>
                    <option value="note">Lab Note / Notebook</option>
                    <option value="web">Web Article / Documentation</option>
                    <option value="syllabus">Syllabus Topic</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Author / Citation
                  </label>
                  <input
                    type="text"
                    value={newSourceAuthor}
                    onChange={(e) => setNewSourceAuthor(e.target.value)}
                    placeholder="e.g. IEEE Transactions, Prof. Rao"
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                  placeholder="e.g. Practical Byzantine Fault Tolerance Implementation Study"
                  className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Source Text Content (Paste text, excerpts, or paper body)
                </label>
                <textarea
                  rows={8}
                  value={newSourceContent}
                  onChange={(e) => setNewSourceContent(e.target.value)}
                  placeholder="Paste the abstract, methodology, equations, or findings here..."
                  className="w-full p-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)] font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSource}
                className="px-4 py-2 rounded-[8px] text-xs font-bold bg-[var(--color-accent)] text-white hover:bg-[#8A1627]"
              >
                Add Source to Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: 1-Click Import from Course Syllabus */}
      {showImportSyllabusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[16px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                  Import Course Syllabus as Source
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Select any B.Tech course syllabus to ground this research project.
                </p>
              </div>
              <button
                onClick={() => setShowImportSyllabusModal(false)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {courses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleImportCourseAsSource(c.code, c.title)}
                  className="p-3 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-muted)] cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[var(--color-accent)] uppercase tracking-wider text-[10px] block">
                      {c.code}
                    </span>
                    <span className="font-semibold text-[var(--color-ink)]">{c.title}</span>
                  </div>
                  <button className="px-2.5 py-1 rounded-[6px] bg-[var(--color-accent)] text-white font-semibold text-[11px]">
                    Import
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Source Inspector */}
      {selectedSourceToInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[16px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                  {selectedSourceToInspect.type}
                </span>
                <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                  {selectedSourceToInspect.title}
                </h3>
                {selectedSourceToInspect.author && (
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {selectedSourceToInspect.author} • Added {selectedSourceToInspect.dateAdded}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedSourceToInspect(null)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 rounded-[10px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] font-mono text-xs whitespace-pre-wrap leading-relaxed text-[var(--color-ink)]">
              {selectedSourceToInspect.content}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)] text-xs">
              <span className="text-[var(--color-ink-muted)]">
                {selectedSourceToInspect.content.split(/\s+/).length} words
              </span>
              <button
                onClick={() => setSelectedSourceToInspect(null)}
                className="px-4 py-2 rounded-[8px] bg-[var(--color-accent)] text-white font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
