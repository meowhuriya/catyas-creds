"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText } from "lucide-react";
import { SectionBar } from "@/components/ui/section-bar";

export default function PrivacyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Header Bar */}
      <SectionBar className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-[8px] bg-white dark:bg-[#1A1214] border border-[#CFC8BB] text-[#14161F] dark:text-[#F6EBD3] hover:text-[#A51C30] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="eyebrow-label text-[#8A1627] block text-[10px]">
              LEGAL & COMPLIANCE
            </span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#14161F] dark:text-[#F6EBD3]">
              Privacy Policy & Terms
            </h1>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#4B5160] dark:text-[#D1C7B7]">
          Valeria&apos;s Creds v1.0
        </span>
      </SectionBar>

      {/* Main Content Card */}
      <div className="academic-card p-6 sm:p-8 space-y-6 bg-white dark:bg-[#1A1214] border border-[#E4D9C0] dark:border-[#3D2D31]">
        <div className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-[#14161F] dark:text-[#F6EBD3]">
            1. Overview & Data Ownership
          </h2>
          <p className="text-sm text-[#4B5160] dark:text-[#D1C7B7] leading-relaxed">
            Valeria&apos;s Creds is an open, student-first learning management system designed to track
            higher education coursework, syllabus progress, lecture study hours, and academic mastery.
            All user data, study sessions, and progress marks remain the property of the student.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-[#14161F] dark:text-[#F6EBD3]">
            2. Local & Cloud Storage
          </h2>
          <p className="text-sm text-[#4B5160] dark:text-[#D1C7B7] leading-relaxed">
            In demonstration mode, all curriculum progress, focus sessions, and attendance logs are
            stored strictly in your browser&apos;s local storage (IndexedDB / localStorage). When signed in
            with Firebase, your progress syncs securely via authenticated Cloud Firestore rules.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-[#14161F] dark:text-[#F6EBD3]">
            3. YouTube Embedded Player Terms
          </h2>
          <p className="text-sm text-[#4B5160] dark:text-[#D1C7B7] leading-relaxed">
            Educational lectures embedded within the portal use the official YouTube IFrame Player API.
            By utilizing the video player, you acknowledge and agree to be bound by the{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noreferrer"
              className="text-[#A51C30] dark:text-[#F07B88] hover:underline font-semibold"
            >
              YouTube Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-[#A51C30] dark:text-[#F07B88] hover:underline font-semibold"
            >
              Google Privacy Policy
            </a>
            .
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-[#14161F] dark:text-[#F6EBD3]">
            4. Academic Integrity & Disclaimer
          </h2>
          <p className="text-sm text-[#4B5160] dark:text-[#D1C7B7] leading-relaxed">
            Credits and degrees awarded within this portal are self-awarded and non-accredited. They serve
            as verified personal study records for self-directed university curriculum mastery.
          </p>
        </div>

        <div className="pt-4 border-t border-[#E4D9C0] dark:border-[#3D2D31] flex items-center justify-between text-xs text-[#4B5160] dark:text-[#D1C7B7]">
          <span>Effective Date: November 2026</span>
          <Link href="/" className="text-[#A51C30] dark:text-[#F07B88] font-semibold hover:underline">
            Return to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
