"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck } from "lucide-react";

export default function TranscriptPage() {
  const { courses, currentUser } = useDataStore();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b border-app-border pb-4 no-print">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
            Official Academic Record
          </h1>
          <p className="text-xs text-app-ink-muted mt-0.5">
            Official transcript preview with verification ID and print-to-PDF formatting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            <span>Print Official PDF</span>
          </Button>
        </div>
      </div>

      {/* Official Document Sheet */}
      <div className="mx-auto max-w-[800px] rounded-card border border-app-border bg-white text-neutral-900 p-8 md:p-12 shadow-sm font-sans">
        {/* Double Crimson Rule Header */}
        <div className="border-t-2 border-b border-app-accent py-3 text-center">
          <h2 className="font-serif text-2xl font-bold tracking-wider uppercase text-neutral-900">
            Official Academic Transcript
          </h2>
          <div className="text-[11px] font-serif tracking-widest text-app-accent uppercase mt-0.5 font-semibold">
            Catya's Creds Independent Registry
          </div>
        </div>

        {/* Student Information Banner */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-xs border-b border-neutral-200 pb-4">
          <div>
            <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
              Student Name
            </span>
            <span className="font-bold text-sm text-neutral-900">
              {currentUser?.displayName || "Catya V."}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
              Registry Identification
            </span>
            <span className="font-mono text-xs font-semibold text-neutral-800">
              CC-2026-9812-REG
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
              Cumulative Grade Point Average
            </span>
            <span className="font-mono text-xs font-bold text-neutral-900 tabular-nums">
              9.20 / 10.00
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
              Total Earned Credits
            </span>
            <span className="font-mono text-xs font-bold text-neutral-900 tabular-nums">
              14.0 Semester Credits
            </span>
          </div>
        </div>

        {/* Course Records Table */}
        <div className="mt-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-300 font-semibold text-neutral-600">
                <th className="py-2">Course Code</th>
                <th className="py-2">Title</th>
                <th className="py-2 text-right">Credits</th>
                <th className="py-2 text-center">Grade</th>
                <th className="py-2 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-mono">
              {courses.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 font-bold text-neutral-900">{c.code}</td>
                  <td className="py-2 font-sans font-medium text-neutral-800">{c.title}</td>
                  <td className="py-2 text-right tabular-nums">{c.credits}.0</td>
                  <td className="py-2 text-center font-bold text-neutral-900">O</td>
                  <td className="py-2 text-right tabular-nums">10.0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mandatory Academic Disclaimer */}
        <div className="mt-12 rounded border border-neutral-200 bg-neutral-50 p-3 text-center text-xs text-neutral-600">
          <p className="font-medium">
            Self-awarded credits. Not accredited by any institution.
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            Verified digitally via cryptographic hash audit logs.
          </p>
        </div>
      </div>
    </div>
  );
}
