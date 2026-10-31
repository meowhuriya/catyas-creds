"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Trash2, Database, Save } from "lucide-react";

export default function SettingsPage() {
  const {
    currentUser,
    dataStore,
    loadDemoData,
    clearDemoData,
    refreshData,
  } = useDataStore();

  const [scale, setScale] = React.useState<"10_point" | "4_point">("10_point");
  const [hoursPerCredit, setHoursPerCredit] = React.useState<number>(15);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (currentUser?.settings) {
      setScale(currentUser.settings.gradeScale || "10_point");
      setHoursPerCredit(currentUser.settings.defaultHoursPerCredit || 15);
    }
  }, [currentUser]);

  const handleSaveSettings = async () => {
    await dataStore.updateSettings({
      gradeScale: scale,
      defaultHoursPerCredit: Number(hoursPerCredit),
    });
    await refreshData();
    setSavedMessage("Settings successfully saved.");
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleExportJson = async () => {
    const jsonStr = await dataStore.exportAllDataJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catyas-creds-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-app-border pb-4">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
          Academic Settings & Preferences
        </h1>
        <p className="text-xs text-app-ink-muted mt-0.5">
          Configure grading rubrics, credit calculation formulas, and data management
        </p>
      </div>

      {savedMessage && (
        <div className="rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-app-success">
          {savedMessage}
        </div>
      )}

      {/* Grading Scale */}
      <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-4">
        <h3 className="font-serif text-base font-semibold text-app-ink">
          Grading Scale Standard
        </h3>
        <p className="text-xs text-app-ink-muted">
          Select between the collegiate 10-point scale (O, A+, A, B+, B, P, F) or 4.0 GPA scale.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setScale("10_point")}
            className={`flex flex-col rounded-control border p-3 text-left transition-colors ${
              scale === "10_point"
                ? "border-app-accent bg-app-accent/5 font-medium"
                : "border-app-border bg-app-surface hover:bg-app-surface-muted"
            }`}
          >
            <span className="font-serif text-sm text-app-ink">10-Point Scale</span>
            <span className="text-[11px] text-app-ink-muted mt-0.5">
              90-100 O (10), 80-89 A+ (9), 70-79 A (8)...
            </span>
          </button>

          <button
            type="button"
            onClick={() => setScale("4_point")}
            className={`flex flex-col rounded-control border p-3 text-left transition-colors ${
              scale === "4_point"
                ? "border-app-accent bg-app-accent/5 font-medium"
                : "border-app-border bg-app-surface hover:bg-app-surface-muted"
            }`}
          >
            <span className="font-serif text-sm text-app-ink">4.0 GPA Scale</span>
            <span className="text-[11px] text-app-ink-muted mt-0.5">
              4.0 A, 3.7 A-, 3.3 B+, 3.0 B...
            </span>
          </button>
        </div>
      </div>

      {/* Credit Calculation Rule */}
      <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-4">
        <h3 className="font-serif text-base font-semibold text-app-ink">
          Credit Calculation Formula
        </h3>
        <p className="text-xs text-app-ink-muted">
          Suggested course credits are automatically computed from total verified watch time.
        </p>

        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            max={100}
            value={hoursPerCredit}
            onChange={(e) => setHoursPerCredit(Number(e.target.value))}
            className="w-24 text-center font-mono tabular-nums"
          />
          <span className="text-sm text-app-ink">
            Lecture Watch Hours = 1 Academic Credit
          </span>
        </div>

        <Button onClick={handleSaveSettings} size="sm" className="gap-1.5 text-xs">
          <Save className="h-3.5 w-3.5" />
          <span>Save Preferences</span>
        </Button>
      </div>

      {/* Demo Data & Persistence */}
      <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-4">
        <h3 className="font-serif text-base font-semibold text-app-ink">
          Demo Dataset & Backup
        </h3>
        <p className="text-xs text-app-ink-muted">
          Load or reset the high-fidelity university demo catalog (2 terms, 4 courses, quizzes, assignments).
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={loadDemoData} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Database className="h-3.5 w-3.5 text-app-ink-muted" />
            <span>Reload Demo Data</span>
          </Button>

          <Button onClick={handleExportJson} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            <span>Export All Data (JSON)</span>
          </Button>

          <Button onClick={clearDemoData} variant="danger" size="sm" className="gap-1.5 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All Data</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
