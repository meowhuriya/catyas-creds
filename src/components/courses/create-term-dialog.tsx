"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTermDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTermDialogProps) {
  const { dataStore, refreshData } = useDataStore();
  const [name, setName] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [isCurrent, setIsCurrent] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a term name (e.g. Semester 1, 2026-27).");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await dataStore.createTerm({
        name: name.trim(),
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate: endDate || new Date(Date.now() + 120 * 86400000).toISOString().split("T")[0],
        isCurrent,
      });

      await refreshData();
      setName("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to create term");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Academic Term</DialogTitle>
            <DialogDescription>
              Add a new semester or quarter to organize your credit-bearing courses.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-control border border-app-danger/30 bg-app-danger/10 p-2.5 text-xs text-app-danger">
              {error}
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-app-ink block mb-1">
                Term Name *
              </label>
              <Input
                placeholder="e.g. Semester 1, 2026-27"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-app-ink block mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold text-app-ink block mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isCurrentTerm"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="h-4 w-4 rounded border-app-border text-app-accent focus:ring-app-accent"
              />
              <label htmlFor="isCurrentTerm" className="text-xs text-app-ink cursor-pointer">
                Set as active current term
              </label>
            </div>
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
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Creating..." : "Create Term"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
