"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { Term, UserSettings } from "@/types/schemas";
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
} from "lucide-react";

export default function SettingsPage() {
  const {
    currentUser,
    dataStore,
    loadDemoData,
    clearDemoData,
    refreshData,
  } = useDataStore();

  const [terms, setTerms] = React.useState<Term[]>([]);
  const [scale, setScale] = React.useState<"10_point" | "4_point">("10_point");
  const [hoursPerCredit, setHoursPerCredit] = React.useState<number>(15);
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("light");
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Term creation dialog
  const [createTermOpen, setCreateTermOpen] = React.useState(false);

  // Account reset dialog
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);
  const [confirmInput, setConfirmInput] = React.useState("");
  const [resetting, setResetting] = React.useState(false);

  // File import ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchSettingsAndTerms = React.useCallback(async () => {
    try {
      const allTerms = await dataStore.getTerms();
      setTerms(allTerms);

      if (currentUser?.settings) {
        setScale(currentUser.settings.gradeScale || "10_point");
        setHoursPerCredit(currentUser.settings.defaultHoursPerCredit || 15);
        setTheme(currentUser.settings.theme || "light");
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, [dataStore, currentUser]);

  React.useEffect(() => {
    fetchSettingsAndTerms();
  }, [fetchSettingsAndTerms]);

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
      {/* Page Header */}
      <div className="border-b border-app-border pb-4">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
          Academic Settings & Preferences
        </h1>
        <p className="text-xs text-app-ink-muted mt-0.5">
          Configure grading rubrics, credit calculation formulas, term lifecycles, and data backups.
        </p>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-control border border-app-danger/30 bg-app-danger/10 p-3 text-xs text-app-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Academic Grading & Credit Preferences */}
      <form onSubmit={handleSaveAcademicPreferences} className="rounded-card border border-app-border bg-app-surface p-5 space-y-5 shadow-sm text-xs">
        <div className="flex items-center gap-2 border-b border-app-border pb-3">
          <Settings className="h-4 w-4 text-app-accent" />
          <h2 className="font-serif text-base font-bold text-app-ink">
            Academic Grading & Credit Parameters
          </h2>
        </div>

        <div className="space-y-4">
          {/* Grade Scale Selection */}
          <div>
            <label className="font-semibold text-app-ink block mb-1">
              Collegiate Grade Scale
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3 rounded-control border cursor-pointer transition-colors ${
                  scale === "10_point"
                    ? "border-app-accent bg-app-accent/5 ring-1 ring-app-accent"
                    : "border-app-border bg-app-surface hover:bg-app-surface-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="scale"
                  value="10_point"
                  checked={scale === "10_point"}
                  onChange={() => setScale("10_point")}
                  className="accent-app-accent mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-app-ink block">
                    10-Point Academic Scale
                  </span>
                  <span className="text-[11px] text-app-ink-muted block leading-relaxed">
                    O (&ge;90%), A+ (&ge;80%), A (&ge;70%), B+ (&ge;60%), B (&ge;50%), P (&ge;40%), F (&lt;40%).
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-control border cursor-pointer transition-colors ${
                  scale === "4_point"
                    ? "border-app-accent bg-app-accent/5 ring-1 ring-app-accent"
                    : "border-app-border bg-app-surface hover:bg-app-surface-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="scale"
                  value="4_point"
                  checked={scale === "4_point"}
                  onChange={() => setScale("4_point")}
                  className="accent-app-accent mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-app-ink block">
                    4.0 Standard Collegiate Scale
                  </span>
                  <span className="text-[11px] text-app-ink-muted block leading-relaxed">
                    A (4.0), A- (3.7), B+ (3.3), B (3.0), B- (2.7), C (2.0), D (1.0), F (0.0).
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Watch Time per Credit Ratio */}
          <div className="space-y-1">
            <label className="font-semibold text-app-ink block">
              Default Watch Hours per Semester Credit Unit
            </label>
            <p className="text-[11px] text-app-ink-muted">
              Used to suggest credits when adding YouTube video lectures. Standard collegiate guideline is 15 contact hours = 1 credit unit.
            </p>
            <div className="flex items-center gap-2 pt-1 w-44">
              <Input
                type="number"
                min={1}
                max={60}
                value={hoursPerCredit}
                onChange={(e) => setHoursPerCredit(Number(e.target.value))}
                className="font-mono text-center tabular-nums"
              />
              <span className="text-app-ink-muted font-medium shrink-0">hours / credit</span>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-app-ink block">
              Interface Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2.5 max-w-sm">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`flex items-center justify-center gap-2 py-2 rounded-control border transition-colors ${
                  theme === "light"
                    ? "border-app-accent bg-app-accent/10 text-app-accent font-semibold"
                    : "border-app-border bg-app-surface text-app-ink-muted hover:text-app-ink"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`flex items-center justify-center gap-2 py-2 rounded-control border transition-colors ${
                  theme === "dark"
                    ? "border-app-accent bg-app-accent/10 text-app-accent font-semibold"
                    : "border-app-border bg-app-surface text-app-ink-muted hover:text-app-ink"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`flex items-center justify-center gap-2 py-2 rounded-control border transition-colors ${
                  theme === "system"
                    ? "border-app-accent bg-app-accent/10 text-app-accent font-semibold"
                    : "border-app-border bg-app-surface text-app-ink-muted hover:text-app-ink"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-app-border flex justify-end">
          <Button type="submit" variant="primary" disabled={loading} className="text-xs">
            {loading ? "Saving..." : "Save Academic Preferences"}
          </Button>
        </div>
      </form>

      {/* 2. Academic Term Manager */}
      <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-4 shadow-sm text-xs">
        <div className="flex items-center justify-between border-b border-app-border pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-app-accent" />
            <h2 className="font-serif text-base font-bold text-app-ink">
              Academic Term Manager
            </h2>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateTermOpen(true)}
            className="gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Academic Term</span>
          </Button>
        </div>

        <div className="space-y-2">
          {terms.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between p-3 rounded-control border transition-colors ${
                t.isCurrent
                  ? "border-app-accent/40 bg-app-accent/5 ring-1 ring-app-accent/30"
                  : "border-app-border bg-app-surface hover:bg-app-surface-muted/30"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-app-ink text-sm">
                    {t.name}
                  </span>
                  {t.isCurrent && (
                    <span className="rounded bg-app-accent text-white font-mono text-[9px] uppercase font-bold px-1.5 py-0.5">
                      Current Active Term
                    </span>
                  )}
                </div>
                {(t.startDate || t.endDate) && (
                  <span className="font-mono text-[11px] text-app-ink-muted block mt-0.5">
                    {t.startDate} &mdash; {t.endDate || "Ongoing"}
                  </span>
                )}
              </div>

              {!t.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetActiveTerm(t.id)}
                  className="text-xs h-7"
                >
                  Set as Active
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Data Backup, Restore & Reset */}
      <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-5 shadow-sm text-xs">
        <div className="flex items-center gap-2 border-b border-app-border pb-3">
          <Database className="h-4 w-4 text-app-accent" />
          <h2 className="font-serif text-base font-bold text-app-ink">
            Data Backup, Migration & Account Reset
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="rounded-control border border-app-border p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-app-ink block text-sm">
                Export Complete Data Backup
              </span>
              <p className="text-[11px] text-app-ink-muted">
                Download a clean, structured JSON file containing all courses, notes, assessments, attempt histories, and planner events.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              className="gap-1.5 text-xs w-full mt-2"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON Backup</span>
            </Button>
          </div>

          {/* Import JSON */}
          <div className="rounded-control border border-app-border p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-app-ink block text-sm">
                Restore from JSON Backup
              </span>
              <p className="text-[11px] text-app-ink-muted">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs w-full mt-2"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload & Restore Backup</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Demo Data & Danger Zone */}
        <div className="border-t border-app-border pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-semibold text-app-ink block">
              Sample Collegiate Dataset
            </span>
            <span className="text-[11px] text-app-ink-muted block">
              Re-populate full demo courses, lecture progress, and exam attempts.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await loadDemoData();
                await fetchSettingsAndTerms();
                setSavedMessage("Academic demo dataset reloaded.");
                setTimeout(() => setSavedMessage(null), 3000);
              }}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reload Demo Data</span>
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setConfirmInput("");
                setResetDialogOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset Account</span>
            </Button>
          </div>
        </div>
      </div>

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
            <div className="flex items-center gap-2 text-app-danger">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Reset Entire Account</DialogTitle>
            </div>
            <DialogDescription>
              This action permanently deletes all enrolled courses, watch tracking histories, notes, and graded assessments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-app-ink font-medium">
              To confirm account erasure, type <strong className="font-mono text-app-danger">CONFIRM RESET</strong> below:
            </p>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="CONFIRM RESET"
              className="font-mono text-xs"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              disabled={resetting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={confirmInput.trim() !== "CONFIRM RESET" || resetting}
              onClick={handleConfirmReset}
            >
              {resetting ? "Resetting..." : "Erase All Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
