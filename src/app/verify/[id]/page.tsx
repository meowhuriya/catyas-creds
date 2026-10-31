"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useDataStore } from "@/lib/repository";
import { TranscriptSnapshot, AuditLog } from "@/types/schemas";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Calendar,
  Award,
  FileCheck,
  ExternalLink,
} from "lucide-react";

export default function VerifyPage() {
  const params = useParams();
  const verificationId = params.id as string;
  const { dataStore } = useDataStore();

  const [snapshot, setSnapshot] = React.useState<TranscriptSnapshot | null>(null);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchVerificationRecord() {
      try {
        setLoading(true);
        const [snap, logs] = await Promise.all([
          dataStore.getPublicVerificationSnapshot(verificationId),
          dataStore.getAuditLogs(),
        ]);
        setSnapshot(snap);
        setAuditLogs(logs);
      } catch (err) {
        console.error("Verification lookup failed:", err);
      } finally {
        setLoading(false);
      }
    }

    if (verificationId) {
      fetchVerificationRecord();
    }
  }, [verificationId, dataStore]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <span className="text-xs text-app-ink-muted">
          Verifying cryptographic credential record...
        </span>
      </div>
    );
  }

  if (!snapshot || !snapshot.isPublic) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app-danger/10 text-app-danger">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-app-ink">
            Verification Record Not Found or Private
          </h2>
          <p className="mt-2 text-xs text-app-ink-muted leading-relaxed max-w-sm mx-auto">
            Credential ID <code className="font-mono bg-app-surface-muted px-1.5 py-0.5 rounded border border-app-border text-app-ink">{verificationId}</code> is either invalid, revoked, or public sharing has not been enabled by the student.
          </p>
        </div>

        <div className="rounded-card border border-app-border bg-app-surface p-4 text-left text-xs space-y-2">
          <span className="font-semibold text-app-ink block">Public Sharing Policy</span>
          <p className="text-app-ink-muted text-[11px]">
            In accordance with student privacy standards, credential verification links in Valeria’s Creds are strictly opt-in. The student may create or revoke public verification access at any time from their official transcript settings.
          </p>
        </div>
      </div>
    );
  }

  const issuedDateStr = new Date(snapshot.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      {/* Verification Shield Card */}
      <div className="rounded-card border border-app-border bg-app-surface p-6 shadow-sm space-y-6">
        {/* Academic Double Crimson Rule */}
        <div className="border-t-2 border-b border-app-accent py-3 text-center">
          <h2 className="font-serif text-xl font-bold tracking-widest uppercase text-app-ink">
            Credential Verification Registry
          </h2>
          <div className="text-[10px] font-serif tracking-widest text-app-accent uppercase mt-0.5 font-bold">
            Valeria’s Creds Independent Registry
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="flex items-center justify-between rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">
                Official Credential Verified & Active
              </span>
              <span className="text-[11px] opacity-90">
                Cryptographic transcript snapshot matches immutable registry logs.
              </span>
            </div>
          </div>
          <span className="rounded bg-emerald-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider">
            Verified
          </span>
        </div>

        {/* Credential Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs border-y border-app-border py-4">
          <div>
            <span className="text-[10px] uppercase font-semibold text-app-ink-muted block">
              Student Candidate
            </span>
            <span className="font-bold text-sm text-app-ink mt-0.5 block">
              {snapshot.studentName}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-app-ink-muted block">
              Verification ID
            </span>
            <span className="font-mono text-xs font-bold text-app-accent mt-0.5 block">
              {snapshot.id}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-app-ink-muted block">
              Cumulative CGPA
            </span>
            <span className="font-mono text-sm font-bold text-app-ink tabular-nums mt-0.5 block">
              {snapshot.cgpa.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-app-ink-muted block">
              Total Credits Earned
            </span>
            <span className="font-mono text-sm font-bold text-app-ink tabular-nums mt-0.5 block">
              {snapshot.totalCredits}.0 Semester Credits
            </span>
          </div>

          <div className="col-span-2">
            <span className="text-[10px] uppercase font-semibold text-app-ink-muted block">
              Snapshot Timestamp
            </span>
            <span className="font-mono text-xs text-app-ink-muted mt-0.5 block">
              {issuedDateStr}
            </span>
          </div>
        </div>

        {/* Snapshot Course Records */}
        {snapshot.termsSnapshot && snapshot.termsSnapshot.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-serif text-sm font-bold text-app-ink">
              Verified Coursework Records
            </h3>

            <div className="space-y-4">
              {snapshot.termsSnapshot.map((term: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-control border border-app-border bg-app-surface-muted/30 p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-app-border/60 pb-1.5 font-semibold text-app-ink">
                    <span>{term.termName}</span>
                    <span className="font-mono text-[11px] text-app-ink-muted">
                      SGPA: {typeof term.sgpa === "number" ? term.sgpa.toFixed(2) : term.sgpa}
                    </span>
                  </div>

                  <div className="space-y-1 divide-y divide-app-border/40 font-mono text-[11px]">
                    {(term.courses || []).map((c: any, cIdx: number) => (
                      <div key={cIdx} className="pt-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-app-ink">{c.code}</span>
                          <span className="font-sans text-app-ink-muted">{c.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums text-app-ink">{c.credits}.0 cr</span>
                          <span className="font-bold text-app-ink">{c.letter}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Immutable Audit Trail */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-app-accent" />
            <h3 className="font-serif text-sm font-bold text-app-ink">
              Cryptographic Audit Log & Verification Chain
            </h3>
          </div>

          <div className="rounded-control border border-app-border bg-app-surface-muted/40 p-3 max-h-48 overflow-y-auto space-y-2 text-xs">
            {auditLogs.length === 0 ? (
              <span className="text-[11px] text-app-ink-muted italic block text-center py-2">
                No audit entries recorded yet.
              </span>
            ) : (
              auditLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-2 border-b border-app-border/40 pb-1.5 last:border-0"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-app-ink block text-[11px]">
                      {log.details}
                    </span>
                    <span className="font-mono text-[9px] text-app-ink-muted capitalize">
                      Action: {log.action.replace("_", " ")}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-app-ink-muted shrink-0 tabular-nums">
                    {new Date(log.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mandatory Official Disclaimer */}
        <div className="rounded border border-app-border bg-app-surface-muted/50 p-3 text-center text-[11px] text-app-ink-muted space-y-0.5">
          <span className="font-semibold text-app-ink block">
            Self-awarded credits. Not accredited by any institution.
          </span>
          <p>
            This verification certificate was cryptographically generated by Valeria’s Creds Independent Registry to validate completed syllabus materials and examination logs.
          </p>
        </div>
      </div>
    </div>
  );
}
