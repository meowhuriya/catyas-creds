"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { Term, Course, UserSettings } from "@/types/schemas";
import { CreateTermDialog } from "@/components/courses/create-term-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Settings,
  Calendar,
  Database,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Sun,
  Moon,
  Laptop,
  AlertTriangle,
  Plus,
  Palette,
  BookOpen,
  Image as ImageIcon,
  Type,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  AppearanceSettings,
  BackgroundType,
  CheckSize,
  PatternStrength,
  AccentColor,
  TextSize,
  DEFAULT_APPEARANCE,
  loadSavedAppearance,
  saveAppearanceSettings,
  applyAppearanceToDOM,
  saveCustomWallpaper,
  getCustomWallpaper,
  deleteCustomWallpaper,
  processImageFile,
} from "@/lib/appearance";
import { cleanSyllabusTitle } from "@/lib/utils";

export default function SettingsPage() {
  const {
    currentUser,
    dataStore,
    courses,
    isSampleActive,
    loadDemoData,
    clearDemoData,
    restoreOriginalSyllabus,
    refreshData,
  } = useDataStore();

  const [terms, setTerms] = React.useState<Term[]>([]);
  const [scale, setScale] = React.useState<"10_point" | "4_point">("10_point");
  const [hoursPerCredit, setHoursPerCredit] = React.useState<number>(15);
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("light");
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Appearance state (PART D)
  const [appearance, setAppearance] = React.useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  const [customWallpaperUrl, setCustomWallpaperUrl] = React.useState<string | null>(null);

  // Term creation dialog
  const [createTermOpen, setCreateTermOpen] = React.useState(false);

  // Syllabus restore confirmation dialogs
  const [restoreAllConfirmOpen, setRestoreAllConfirmOpen] = React.useState(false);
  const [restoreCourseId, setRestoreCourseId] = React.useState<string>("");
  const [restoreCourseConfirmOpen, setRestoreCourseConfirmOpen] = React.useState(false);

  // Account reset dialog
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);
  const [confirmInput, setConfirmInput] = React.useState("");
  const [resetting, setResetting] = React.useState(false);

  // File import ref & wallpaper input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const wallpaperInputRef = React.useRef<HTMLInputElement>(null);

  const fetchSettingsAndTerms = React.useCallback(async () => {
    try {
      const allTerms = await dataStore.getTerms();
      setTerms(allTerms);

      if (currentUser?.settings) {
        setScale(currentUser.settings.gradeScale || "10_point");
        setHoursPerCredit(currentUser.settings.defaultHoursPerCredit || 15);
        setTheme(currentUser.settings.theme || "light");
      }

      // Load appearance
      const apper = loadSavedAppearance();
      setAppearance(apper);
      const img = await getCustomWallpaper();
      setCustomWallpaperUrl(img);
      applyAppearanceToDOM(apper, img);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, [dataStore, currentUser]);

  React.useEffect(() => {
    fetchSettingsAndTerms();
  }, [fetchSettingsAndTerms]);

  // Handle Appearance Changes
  const updateAppearance = (updates: Partial<AppearanceSettings>) => {
    setAppearance((prev) => {
      const next = { ...prev, ...updates };
      saveAppearanceSettings(next);
      applyAppearanceToDOM(next, customWallpaperUrl);
      return next;
    });
  };

  const handleCustomWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const dataUrl = await processImageFile(file, 1920);
      await saveCustomWallpaper(dataUrl);
      setCustomWallpaperUrl(dataUrl);
      const nextApper = { ...appearance, bgType: "custom" as BackgroundType };
      setAppearance(nextApper);
      saveAppearanceSettings(nextApper);
      applyAppearanceToDOM(nextApper, dataUrl);
      setSavedMessage("Custom background image uploaded and saved locally.");
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (err) {
      console.error("Failed to process image:", err);
      setErrorMessage("Could not load selected image.");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoading(false);
      if (wallpaperInputRef.current) wallpaperInputRef.current.value = "";
    }
  };

  const handleResetWallpaper = async () => {
    await deleteCustomWallpaper();
    setCustomWallpaperUrl(null);
    updateAppearance({ bgType: "gingham", customDim: 20, customBlur: 0 });
    setSavedMessage("Background reset to default soft red gingham.");
    setTimeout(() => setSavedMessage(null), 3000);
  };

  // Instant theme switcher
  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (newTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      // Re-apply alpha for dark/light
      applyAppearanceToDOM(appearance, customWallpaperUrl);
    }
    await dataStore.updateSettings({ theme: newTheme });
    await refreshData();
  };

  // Save academic preferences
  const handleSaveAcademicPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await dataStore.updateSettings({
        gradeScale: scale,
        defaultHoursPerCredit: Number(hoursPerCredit) || 15,
        theme,
      });

      await refreshData();
      setSavedMessage("Academic preferences successfully updated.");
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setErrorMessage("Failed to save preferences.");
    } finally {
      setLoading(false);
    }
  };

  // Set active term
  const handleSetActiveTerm = async (termId: string) => {
    try {
      await dataStore.setCurrentTerm(termId);
      await refreshData();
      await fetchSettingsAndTerms();
      setSavedMessage("Active term updated.");
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (err) {
      console.error("Failed to set active term:", err);
    }
  };

  // Export clean JSON
  const handleExportJson = async () => {
    try {
      const jsonStr = await dataStore.exportAllDataJson();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `valerias-creds-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export data:", err);
    }
  };

  // Import JSON
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await dataStore.importAllDataJson(text);
      await refreshData();
      await fetchSettingsAndTerms();
      setSavedMessage("Coursework data successfully restored from JSON backup.");
      setTimeout(() => setSavedMessage(null), 3500);
    } catch (err) {
      console.error("Failed to import backup:", err);
      setErrorMessage("Invalid JSON backup file.");
      setTimeout(() => setErrorMessage(null), 3500);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Restore Syllabus Handlers (PART B)
  const handleRestoreAllSyllabus = async () => {
    try {
      setLoading(true);
      await restoreOriginalSyllabus();
      await refreshData();
      await fetchSettingsAndTerms();
      setRestoreAllConfirmOpen(false);
      setSavedMessage("Original syllabus restored for all 19 courses (651 topics). Your notes and watch progress were preserved.");
      setTimeout(() => setSavedMessage(null), 4000);
    } catch (err) {
      console.error("Failed to restore all syllabus:", err);
      setErrorMessage("Could not restore syllabus.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSingleCourse = async () => {
    if (!restoreCourseId) return;
    try {
      setLoading(true);
      await restoreOriginalSyllabus(restoreCourseId);
      await refreshData();
      await fetchSettingsAndTerms();
      setRestoreCourseConfirmOpen(false);
      const restored = courses.find((c) => c.id === restoreCourseId);
      setSavedMessage(`Original syllabus restored for ${restored?.code || "course"}.`);
      setTimeout(() => setSavedMessage(null), 3500);
    } catch (err) {
      console.error("Failed to restore single course:", err);
      setErrorMessage("Could not restore course syllabus.");
    } finally {
      setLoading(false);
    }
  };

  // Reset Account confirmation
  const handleConfirmReset = async () => {
    if (confirmInput.trim() !== "CONFIRM RESET") return;
    try {
      setResetting(true);
      await dataStore.resetAccount();
      await refreshData();
      await fetchSettingsAndTerms();
      setResetDialogOpen(false);
      setConfirmInput("");
      setSavedMessage("Account data has been completely cleared.");
      setTimeout(() => setSavedMessage(null), 3500);
    } catch (err) {
      console.error("Failed to reset account:", err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Page Header (Solid cream panel) */}
      <div className="p-5 rounded-[18px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] shadow-sm">
        <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#14161F] dark:text-[#F6EBD3]">
          Academic Settings & Appearance
        </h1>
        <p className="text-sm text-[#4B5160] dark:text-[#CFC8BB] mt-1">
          Customize page appearance, restore canonical syllabus curricula, configure grading rubrics, and manage data.
        </p>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-[10px] border border-[#5E7B5B]/30 bg-[#5E7B5B]/10 p-3.5 text-sm text-[#234D20] dark:text-[#88C485]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5E7B5B]" />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-[10px] border border-[#C62F3C]/30 bg-[#C62F3C]/10 p-3.5 text-sm text-[#8A1627] dark:text-[#F07B88]">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#C62F3C]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Appearance & Background Customization */}
      <div className="academic-card p-5 space-y-6 text-sm">
        <div className="flex items-center justify-between border-b border-[#E5D5C5] pb-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#A51C30]" />
            <h2 className="font-serif text-base font-bold text-[#14161F] dark:text-[#F6EBD3]">
              Appearance & Background Theme
            </h2>
          </div>
          <span className="eyebrow-label text-[#8A1627]">
            Full Gingham
          </span>
        </div>

        <div className="space-y-5">
          {/* Background Type */}
          <div>
            <label className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block mb-2">
              Background
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "gingham", label: "Gingham", desc: "Seamless red check tile on cream" },
                { id: "plain", label: "Plain paper", desc: "Warm clean solid cream #FAF7F2" },
                { id: "custom", label: "My own image", desc: "Local wallpaper with dim & blur" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateAppearance({ bgType: opt.id as BackgroundType })}
                  className={`flex flex-col items-start p-3.5 rounded-[10px] border text-left transition-all ${
                    appearance.bgType === opt.id
                      ? "border-[#A51C30] bg-[#A51C30]/5 ring-1 ring-[#A51C30]"
                      : "border-[#E5D5C5] bg-white dark:bg-[#1E1416] hover:bg-[#FAF7F2]"
                  }`}
                >
                  <span className="font-semibold text-sm text-[#14161F] dark:text-[#F6EBD3]">
                    {opt.label}
                  </span>
                  <span className="text-xs text-[#4B5160] dark:text-[#CFC8BB] mt-0.5">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Check Size & Pattern Strength (when Gingham is selected) */}
          {appearance.bgType === "gingham" && (
            <div className="space-y-4 pt-1 border-t border-[#E5D5C5]/70">
              {/* Check Size */}
              <div>
                <label className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block mb-1">
                  Check Size
                </label>
                <span className="text-xs text-[#4B5160] dark:text-[#CFC8BB] block mb-2">
                  Scale of the red gingham tile grid
                </span>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {[
                    { id: "small", label: "Small (0.35)", scale: "0.35" },
                    { id: "medium", label: "Medium (0.60)", scale: "0.60" },
                    { id: "large", label: "Large (1.00)", scale: "1.00" },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => updateAppearance({ checkSize: sz.id as CheckSize })}
                      className={`py-2 px-3 rounded-[8px] border text-center transition-all ${
                        (appearance.checkSize || "medium") === sz.id
                          ? "border-[#A51C30] bg-[#A51C30]/10 text-[#A51C30] dark:text-[#F07B88] font-semibold"
                          : "border-[#E5D5C5] dark:border-[#3D2D31] bg-white dark:bg-[#1E1416] text-[#4B5160] dark:text-[#D1C7B7] hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
                      }`}
                    >
                      <span className="text-xs font-semibold">{sz.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Strength */}
              <div>
                <label className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block mb-1">
                  Strength
                </label>
                <span className="text-xs text-[#4B5160] dark:text-[#CFC8BB] block mb-2">
                  Pattern visibility veil (Bold shows the check directly)
                </span>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {[
                    { id: "bold", label: "Bold (veil 0)", veil: "0" },
                    { id: "medium", label: "Medium (veil 0.3)", veil: "0.3" },
                    { id: "soft", label: "Soft (veil 0.55)", veil: "0.55" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updateAppearance({ patternStrength: st.id as PatternStrength })}
                      className={`py-2 px-3 rounded-[8px] border text-center transition-all ${
                        appearance.patternStrength === st.id
                          ? "border-[#A51C30] bg-[#A51C30]/10 text-[#A51C30] dark:text-[#F07B88] font-semibold"
                          : "border-[#E5D5C5] dark:border-[#3D2D31] bg-white dark:bg-[#1E1416] text-[#4B5160] dark:text-[#D1C7B7] hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
                      }`}
                    >
                      <span className="text-xs font-semibold">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* My Own Image Controls */}
          {appearance.bgType === "custom" && (
            <div className="p-4 rounded-[10px] border border-[#E5D5C5] bg-[#FAF7F2]/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block">
                    Device-Only Wallpaper Image
                  </span>
                  <span className="text-xs text-[#4B5160] dark:text-[#CFC8BB]">
                    Downscaled to max 1920px. Stored only on this browser (IndexedDB).
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={wallpaperInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomWallpaperUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => wallpaperInputRef.current?.click()}
                    className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Choose image</span>
                  </button>
                  {customWallpaperUrl && (
                    <button
                      type="button"
                      onClick={handleResetWallpaper}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Dim & Blur Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5D5C5]/60">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#14161F] dark:text-[#F6EBD3]">Dark Dim Overlay</span>
                    <span className="font-semibold text-[#8A1627] dark:text-[#F07B88] tabular-nums">{appearance.customDim}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={appearance.customDim}
                    onChange={(e) => updateAppearance({ customDim: Number(e.target.value) })}
                    className="w-full accent-[#A51C30]"
                  />
                  <p className="text-[11px] text-[#4B5160] dark:text-[#D1C7B7]">Darkens the background so page text and cards stay WCAG AA legible.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#14161F] dark:text-[#F6EBD3]">Background Blur</span>
                    <span className="font-semibold text-[#8A1627] dark:text-[#F07B88] tabular-nums">{appearance.customBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={appearance.customBlur}
                    onChange={(e) => updateAppearance({ customBlur: Number(e.target.value) })}
                    className="w-full accent-[#A51C30]"
                  />
                  <p className="text-[11px] text-[#4B5160] dark:text-[#D1C7B7]">Softens sharp wallpaper details behind content gaps.</p>
                </div>
              </div>
            </div>
          )}

          {/* Accent Color Palette */}
          <div>
            <label className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block mb-2">
              Accent Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {[
                { id: "crimson", label: "Crimson", color: "#A51C30" },
                { id: "tomato", label: "Tomato", color: "#C62F3C" },
                { id: "mustard", label: "Mustard", color: "#D9A441" },
                { id: "sage", label: "Sage", color: "#5E7B5B" },
                { id: "plum", label: "Plum", color: "#7A3F6E" },
              ].map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => updateAppearance({ accentColor: acc.id as AccentColor })}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] border text-xs font-semibold transition-all ${
                    appearance.accentColor === acc.id
                      ? "border-[#14161F] dark:border-[#F6EBD3] bg-[#14161F] dark:bg-[#F6EBD3] text-white dark:text-[#14161F] shadow-xs"
                      : "border-[#E5D5C5] dark:border-[#3D2D31] bg-white dark:bg-[#1E1416] text-[#14161F] dark:text-[#F6EBD3] hover:bg-[#FAF7F2] dark:hover:bg-[#251A1D]"
                  }`}
                >
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                  <span>{acc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Size */}
          <div>
            <label className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block mb-2">
              Text Size
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              {[
                { id: "normal", label: "Normal (16px base)" },
                { id: "large", label: "Large (17px base)" },
              ].map((ts) => (
                <button
                  key={ts.id}
                  type="button"
                  onClick={() => updateAppearance({ textSize: ts.id as TextSize })}
                  className={`py-2 px-3 rounded-[8px] border text-center transition-all ${
                    appearance.textSize === ts.id
                      ? "border-[#A51C30] bg-[#A51C30]/10 text-[#A51C30] dark:text-[#F07B88] font-semibold"
                      : "border-[#E5D5C5] dark:border-[#3D2D31] bg-white dark:bg-[#1E1416] text-[#4B5160] dark:text-[#D1C7B7] hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
                  }`}
                >
                  <span className="text-xs font-semibold">{ts.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Syllabus Restore & Curriculum Integrity (PART B) */}
      <div className="academic-card p-5 space-y-5 text-sm">
        <div className="flex items-center justify-between border-b border-[#E5D5C5] pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#A51C30]" />
            <h2 className="font-serif text-base font-bold text-[#14161F] dark:text-[#F6EBD3]">
              Curriculum & Syllabus Restore
            </h2>
          </div>
          <span className="eyebrow-label text-[#8A1627]">
            651 Topics Canonical
          </span>
        </div>

        <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB]">
          Restore the official, calibrated 19-course syllabus seed (Sem 1: 325 topics, Sem 2: 326 topics). Restoring resets titles and units to original specifications without erasing your personal notes or study logs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Restore Single Course */}
          <div className="p-4 rounded-[10px] border border-[#E5D5C5] bg-white dark:bg-[#1E1416] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-sm text-[#14161F] dark:text-[#F6EBD3] block">
                Restore Individual Course
              </span>
              <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7] mt-1">
                Select a single course to reset its unit titles and topics to the original syllabus seed.
              </p>
            </div>

            <div className="space-y-2">
              <select
                value={restoreCourseId}
                onChange={(e) => setRestoreCourseId(e.target.value)}
                className="w-full text-xs p-2 rounded-[6px] border border-[#E5D5C5] dark:border-[#3D2D31] bg-white dark:bg-[#1E1416] text-[#14161F] dark:text-[#F6EBD3]"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!restoreCourseId}
                onClick={() => setRestoreCourseConfirmOpen(true)}
                className="btn-secondary w-full text-xs py-1.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                Restore Course Syllabus
              </button>
            </div>
          </div>

          {/* Restore All Courses */}
          <div className="p-4 rounded-[10px] border border-[#E5D5C5] dark:border-[#3D2D31] bg-white dark:bg-[#1E1416] space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-sm text-[#14161F] dark:text-[#F6EBD3] block">
                Restore Entire Syllabus (All 19 Courses)
              </span>
              <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7] mt-1">
                Recalibrates all 19 courses across Semesters 1 and 2 (651 topics total).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setRestoreAllConfirmOpen(true)}
              className="btn-primary w-full text-xs py-2 inline-flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore Original Syllabus (All Courses)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sample Data Management (PART A) */}
      <div className="academic-card p-5 space-y-4 text-sm">
        <div className="flex items-center justify-between border-b border-[#E5D5C5] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#D9A441]" />
            <h2 className="font-serif text-base font-bold text-[#14161F] dark:text-[#F6EBD3]">
              Sample Data & Mock Demonstrations
            </h2>
          </div>
          {isSampleActive ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D9A441]/20 text-[#8A5A12] dark:text-[#F0B533] border border-[#D9A441]/40">
              Sample data active
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#5E7B5B]/15 text-[#234D20] dark:text-[#88C485] border border-[#5E7B5B]/30">
              Real data only (Default)
            </span>
          )}
        </div>

        <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB]">
          By default, Valeria's Creds displays only real verified study sessions, genuine topic scores, and true course credits. Sample demo data (such as sample quiz attempts and mock lecture progress) lives exclusively behind this switch.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div>
            <span className="font-semibold text-sm text-[#14161F] dark:text-[#F6EBD3] block">
              {isSampleActive ? "Sample Data Loaded" : "Clean State Active"}
            </span>
            <span className="text-xs text-[#4B5160] dark:text-[#D1C7B7]">
              {isSampleActive
                ? "The dashboard currently reflects demo study hours and assessment attempts."
                : "All metrics reflect 0.0 study hours and zero invented scores."}
            </span>
          </div>

          {isSampleActive ? (
            <button
              type="button"
              onClick={async () => {
                await clearDemoData();
                await fetchSettingsAndTerms();
                setSavedMessage("Sample data cleared. Returned to clean, real-data state.");
                setTimeout(() => setSavedMessage(null), 3500);
              }}
              className="btn-secondary text-xs py-1.5 px-3 border-[#C62F3C] text-[#C62F3C] hover:bg-[#C62F3C]/5"
            >
              Clear sample data
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                await loadDemoData();
                await fetchSettingsAndTerms();
                setSavedMessage("Sample data loaded. A 'Sample data' indicator is displayed on the dashboard.");
                setTimeout(() => setSavedMessage(null), 3500);
              }}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Load sample data
            </button>
          )}
        </div>
      </div>

      {/* 4. Academic Grading & Credit Preferences */}
      <form onSubmit={handleSaveAcademicPreferences} className="academic-card p-5 space-y-5 text-sm">
        <div className="flex items-center gap-2 border-b border-[#E5D5C5] pb-3">
          <Settings className="h-4 w-4 text-[#A51C30]" />
          <h2 className="font-serif text-base font-bold text-[#14161F] dark:text-[#F6EBD3]">
            Academic Grading & Credit Parameters
          </h2>
        </div>

        <div className="space-y-4">
          {/* Grade Scale Selection */}
          <div>
            <label className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block mb-1">
              Collegiate Grade Scale
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3 rounded-[10px] border cursor-pointer transition-colors ${
                  scale === "10_point"
                    ? "border-[#A51C30] bg-[#A51C30]/5 ring-1 ring-[#A51C30]"
                    : "border-[#E5D5C5] bg-white dark:bg-[#1E1416] hover:bg-[#FAF7F2]"
                }`}
              >
                <input
                  type="radio"
                  name="scale"
                  value="10_point"
                  checked={scale === "10_point"}
                  onChange={() => setScale("10_point")}
                  className="accent-[#A51C30] mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block text-sm">
                    10-Point Academic Scale
                  </span>
                  <span className="text-xs text-[#4B5160] dark:text-[#CFC8BB] block leading-relaxed">
                    O (&ge;90%), A+ (&ge;80%), A (&ge;70%), B+ (&ge;60%), B (&ge;50%), P (&ge;40%), F (&lt;40%).
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-[10px] border cursor-pointer transition-colors ${
                  scale === "4_point"
                    ? "border-[#A51C30] bg-[#A51C30]/5 ring-1 ring-[#A51C30]"
                    : "border-[#E5D5C5] bg-white dark:bg-[#1E1416] hover:bg-[#FAF7F2]"
                }`}
              >
                <input
                  type="radio"
                  name="scale"
                  value="4_point"
                  checked={scale === "4_point"}
                  onChange={() => setScale("4_point")}
                  className="accent-[#A51C30] mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block text-sm">
                    4.0 Standard Collegiate Scale
                  </span>
                  <span className="text-xs text-[#4B5160] dark:text-[#CFC8BB] block leading-relaxed">
                    A (4.0), A- (3.7), B+ (3.3), B (3.0), B- (2.7), C (2.0), D (1.0), F (0.0).
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Watch Time per Credit Ratio */}
          <div className="space-y-1">
            <label className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block">
              Default Watch Hours per Semester Credit Unit
            </label>
            <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB]">
              Used to suggest credits when adding YouTube video lectures. Standard collegiate guideline is 15 contact hours = 1 credit unit.
            </p>
            <div className="flex items-center gap-2 pt-1 w-48">
              <Input
                type="number"
                min={1}
                max={60}
                value={hoursPerCredit}
                onChange={(e) => setHoursPerCredit(Number(e.target.value))}
                className="text-center tabular-nums text-sm font-semibold"
              />
              <span className="text-[#4B5160] dark:text-[#D1C7B7] font-medium shrink-0 text-xs">hours / credit</span>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block">
              Light / Dark Mode
            </label>
            <div className="grid grid-cols-3 gap-2.5 max-w-sm">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`flex items-center justify-center gap-2 py-2 rounded-[8px] border transition-colors ${
                  theme === "light"
                    ? "border-[#A51C30] bg-[#A51C30]/10 text-[#A51C30] dark:text-[#F07B88] font-semibold"
                    : "border-[#E5D5C5] dark:border-[#3D2D31] bg-white dark:bg-[#1E1416] text-[#4B5160] dark:text-[#D1C7B7] hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`flex items-center justify-center gap-2 py-2 rounded-[8px] border transition-colors ${
                  theme === "dark"
                    ? "border-[#A51C30] bg-[#A51C30]/10 text-[#A51C30] dark:text-[#F07B88] font-semibold"
                    : "border-[#E5D5C5] dark:border-[#3D2D31] bg-white dark:bg-[#1E1416] text-[#4B5160] dark:text-[#D1C7B7] hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`flex items-center justify-center gap-2 py-2 rounded-[8px] border transition-colors ${
                  theme === "system"
                    ? "border-[#A51C30] bg-[#A51C30]/10 text-[#A51C30] dark:text-[#F07B88] font-semibold"
                    : "border-[#E5D5C5] dark:border-[#3D2D31] bg-white dark:bg-[#1E1416] text-[#4B5160] dark:text-[#D1C7B7] hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5D5C5] flex justify-end">
          <Button type="submit" disabled={loading} className="btn-primary text-xs px-4">
            {loading ? "Saving..." : "Save Academic Preferences"}
          </Button>
        </div>
      </form>

      {/* 5. Academic Term Manager */}
      <div className="academic-card p-5 space-y-4 text-sm">
        <div className="flex items-center justify-between border-b border-[#E5D5C5] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#A51C30]" />
            <h2 className="font-serif text-base font-bold text-[#14161F] dark:text-[#F6EBD3]">
              Academic Term Manager
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setCreateTermOpen(true)}
            className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Academic Term</span>
          </button>
        </div>

        <div className="space-y-2">
          {terms.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between p-3.5 rounded-[10px] border transition-colors ${
                t.isCurrent
                  ? "border-[#A51C30]/40 bg-[#A51C30]/5 ring-1 ring-[#A51C30]/30"
                  : "border-[#E5D5C5] bg-white dark:bg-[#1E1416] hover:bg-[#FAF7F2]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#14161F] dark:text-[#F6EBD3] text-sm">
                    {t.name}
                  </span>
                  {t.isCurrent && (
                    <span className="rounded bg-[#A51C30] text-white text-[10px] uppercase font-bold px-2 py-0.5">
                      Current Active Term
                    </span>
                  )}
                </div>
                {(t.startDate || t.endDate) && (
                  <span className="text-xs text-[#4B5160] dark:text-[#CFC8BB] block mt-0.5">
                    {t.startDate} &mdash; {t.endDate || "Ongoing"}
                  </span>
                )}
              </div>

              {!t.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleSetActiveTerm(t.id)}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  Set as Active
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Data Backup, Restore & Reset */}
      <div className="academic-card p-5 space-y-5 text-sm">
        <div className="flex items-center gap-2 border-b border-[#E5D5C5] pb-3">
          <Database className="h-4 w-4 text-[#A51C30]" />
          <h2 className="font-serif text-base font-bold text-[#14161F] dark:text-[#F6EBD3]">
            Data Backup, Migration & Account Reset
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="rounded-[10px] border border-[#E5D5C5] dark:border-[#3D2D31] p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block text-sm">
                Export Complete Data Backup
              </span>
              <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7]">
                Download a clean, structured JSON file containing all courses, notes, assessments, attempt histories, and planner events.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportJson}
              className="btn-secondary w-full text-xs py-2 inline-flex items-center justify-center gap-1.5 mt-2"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON Backup</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="rounded-[10px] border border-[#E5D5C5] dark:border-[#3D2D31] p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block text-sm">
                Restore from JSON Backup
              </span>
              <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7]">
                Upload a previously exported backup file to restore your coursework, lecture progress, and academic grades.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary w-full text-xs py-2 inline-flex items-center justify-center gap-1.5 mt-2"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload & Restore Backup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-[#E5D5C5] dark:border-[#3D2D31] pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-semibold text-[#14161F] dark:text-[#F6EBD3] block">
              Danger Zone: Account Reset
            </span>
            <span className="text-xs text-[#4B5160] dark:text-[#D1C7B7] block">
              Erase all local courses, notes, and study progress.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmInput("");
              setResetDialogOpen(true);
            }}
            className="btn-secondary text-xs py-1.5 px-3 border-[#C62F3C] text-[#C62F3C] hover:bg-[#C62F3C]/10 inline-flex items-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset Account</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog: Restore Single Course */}
      <Dialog open={restoreCourseConfirmOpen} onOpenChange={setRestoreCourseConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#A51C30]">
              <RotateCcw className="h-5 w-5" />
              <DialogTitle>Restore Course Syllabus?</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to restore the canonical syllabus for this course? All default unit titles and topics from the Meridian Year 1 curriculum seed will be restored. Your existing notes and lecture progress will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 border-t border-[#E5D5C5]">
            <button
              type="button"
              className="btn-secondary text-xs py-1.5 px-3"
              onClick={() => setRestoreCourseConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary text-xs py-1.5 px-3"
              onClick={handleRestoreSingleCourse}
            >
              {loading ? "Restoring..." : "Restore Course"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Restore All Courses */}
      <Dialog open={restoreAllConfirmOpen} onOpenChange={setRestoreAllConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#A51C30]">
              <RotateCcw className="h-5 w-5" />
              <DialogTitle>Restore All 19 Courses?</DialogTitle>
            </div>
            <DialogDescription>
              This will recalibrate all 19 courses across Semesters 1 and 2 to the exact 651 syllabus topics (Sem 1: 325 topics, Sem 2: 326 topics). Any edited unit titles will revert to canonical syllabus text.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 border-t border-[#E5D5C5]">
            <button
              type="button"
              className="btn-secondary text-xs py-1.5 px-3"
              onClick={() => setRestoreAllConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary text-xs py-1.5 px-3"
              onClick={handleRestoreAllSyllabus}
            >
              {loading ? "Restoring..." : "Restore All 19 Courses"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Term Dialog */}
      <CreateTermDialog
        open={createTermOpen}
        onOpenChange={setCreateTermOpen}
        onSuccess={fetchSettingsAndTerms}
      />

      {/* Type-to-Confirm Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#C62F3C]">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Reset Entire Account</DialogTitle>
            </div>
            <DialogDescription>
              This action permanently deletes all enrolled courses, watch tracking histories, notes, and graded assessments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-[#14161F] font-medium">
              To confirm account erasure, type <strong className="font-semibold text-[#C62F3C]">CONFIRM RESET</strong> below:
            </p>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="CONFIRM RESET"
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-[#E5D5C5]">
            <button
              type="button"
              className="btn-secondary text-xs py-1.5 px-3"
              onClick={() => setResetDialogOpen(false)}
              disabled={resetting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary text-xs py-1.5 px-3 bg-[#C62F3C] hover:bg-[#8A1627]"
              disabled={confirmInput.trim() !== "CONFIRM RESET" || resetting}
              onClick={handleConfirmReset}
            >
              {resetting ? "Resetting..." : "Erase All Data"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
