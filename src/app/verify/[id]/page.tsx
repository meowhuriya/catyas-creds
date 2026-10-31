"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useDataStore } from "@/lib/repository";
import { TranscriptSnapshot } from "@/types/schemas";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default function VerifyPage() {
  const params = useParams();
  const verificationId = params.id as string;
  const { dataStore } = useDataStore();
  const [snapshot, setSnapshot] = React.useState<TranscriptSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchSnapshot() {
      try {
        setLoading(true);
        const data = await dataStore.getPublicVerificationSnapshot(verificationId);
        setSnapshot(data);
      } catch (err) {
        console.error("Verification lookup failed:", err);
      } finally {
        setLoading(false);
      }
    }
    if (verificationId) {
      fetchSnapshot();
    }
  }, [verificationId, dataStore]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <span className="text-xs text-app-ink-muted">Verifying credential record...</span>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-control bg-red-500/10 text-app-danger mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-lg font-bold text-app-ink">
          Verification Record Not Found or Private
        </h2>
        <p className="mt-2 text-xs text-app-ink-muted leading-relaxed">
          The requested credential ID is either invalid, expired, or public sharing has not been enabled by the student.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-card border border-app-border bg-app-surface p-6 shadow-sm">
      <div className="flex items-center gap-2 text-app-success border-b border-app-border pb-3">
        <ShieldCheck className="h-5 w-5" />
        <span className="font-serif text-base font-bold">
          Verified Academic Record
        </span>
      </div>

      <div className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between py-1 border-b border-app-border/40">
          <span className="text-app-ink-muted">Verification ID:</span>
          <span className="font-mono font-bold text-app-ink">{snapshot.id}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-app-border/40">
          <span className="text-app-ink-muted">Student Name:</span>
          <span className="font-semibold text-app-ink">{snapshot.studentName}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-app-border/40">
          <span className="text-app-ink-muted">Cumulative GPA:</span>
          <span className="font-mono font-bold text-app-ink tabular-nums">{snapshot.cgpa}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-app-border/40">
          <span className="text-app-ink-muted">Credits Earned:</span>
          <span className="font-mono font-bold text-app-ink tabular-nums">{snapshot.totalCredits}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-app-border/40">
          <span className="text-app-ink-muted">Issued Date:</span>
          <span className="font-mono text-app-ink">{snapshot.issuedAt.split("T")[0]}</span>
        </div>
      </div>

      <div className="mt-6 rounded border border-app-border bg-app-surface-muted/50 p-3 text-center text-[11px] text-app-ink-muted">
        Self-awarded credits. Not accredited by any institution.
      </div>
    </div>
  );
}
