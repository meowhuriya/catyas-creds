"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import {
  Course,
  Term,
  Module,
  Topic,
  Assessment,
  Attempt,
  Submission,
  LessonProgress,
  TranscriptSnapshot,
} from "@/types/schemas";
import {
  calculateCourseGrades,
  calculateSGPA,
  calculateCGPA,
  getAcademicStanding,
  CourseTermRecord,
} from "@/lib/grading/grading-engine";
import {
  calculateUnitMastery,
  calculateCourseMastery,
} from "@/lib/mastery/mastery-engine";
import { Button } from "@/components/ui/button";
import {
  Printer,
  ShieldCheck,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Lock,
} from "lucide-react";
import QRCode from "qrcode";

export default function TranscriptPage() {
  const { dataStore, currentUser } = useDataStore();

  const [terms, setTerms] = React.useState<Term[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [attempts, setAttempts] = React.useState<Attempt[]>([]);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [snapshots, setSnapshots] = React.useState<TranscriptSnapshot[]>([]);
  const [activeSnapshot, setActiveSnapshot] = React.useState<TranscriptSnapshot | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  const scale = currentUser?.settings?.gradeScale || "10_point";

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [allTerms, allCourses, allProgress, allSnaps, allTopics] =
        await Promise.all([
          dataStore.getTerms(),
          dataStore.getCourses(),
          dataStore.getAllLessonProgress(),
          dataStore.getTranscriptSnapshots(),
          dataStore.getAllTopics(),
        ]);

      const nestedModules = await Promise.all(
        allCourses.map((c) => dataStore.getModules(c.id))
      );
      const flatModules = nestedModules.flat();

      setTerms(allTerms);
      setCourses(allCourses);
      setModules(flatModules);
      setTopics(allTopics);
      setProgressList(allProgress);
      setSnapshots(allSnaps);

      // Fetch assessments
      const nestedAsms = await Promise.all(
        allCourses.map((c) => dataStore.getAssessments(c.id))
      );
      const allAsms = nestedAsms.flat();
      setAssessments(allAsms);

      // Fetch attempts and submissions
      const [allAtts, allSubs] = await Promise.all([
        Promise.all(allAsms.map((a) => dataStore.getAttempts(a.id))).then((res) =>
          res.flat()
        ),
        Promise.all(allAsms.map((a) => dataStore.getSubmission(a.id))).then((res) =>
          res.filter(Boolean) as Submission[]
        ),
      ]);

      setAttempts(allAtts);
      setSubmissions(allSubs);

      // Active snapshot
      const existingSnap = allSnaps[allSnaps.length - 1] || null;
      setActiveSnapshot(existingSnap);
    } catch (err) {
      console.error("Failed to load transcript data:", err);
    } finally {
      setLoading(false);
    }
  }, [dataStore]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute course grades with true mastery calculations
  const courseGradeRecords = React.useMemo(() => {
    return courses.map((course) => {
      const courseAsms = assessments.filter((a) => a.courseId === course.id);
      const courseModules = modules.filter((m) => m.courseId === course.id);
      const courseTopics = topics.filter((t) => t.courseId === course.id);

      const unitScores = courseModules.map((m) => {
        const mTopics = courseTopics.filter((t) => t.unitId === m.id);
        return calculateUnitMastery(
          mTopics,
          m.electiveExperimentsCount || course.electiveExperimentsCount
        ).score;
      });
      const courseMasteryScore = calculateCourseMastery(unitScores).courseScore;

      const gradeRes = calculateCourseGrades(
        course,
        courseMasteryScore,
        courseAsms,
        attempts,
        submissions,
        scale
      );

      return { course, gradeResult: gradeRes };
    });
  }, [courses, assessments, attempts, submissions, modules, topics, scale]);

  // Retake counts
  const codeOccurrences = React.useMemo(() => {
    const counts: Record<string, number> = {};
    courses.forEach((c) => {
      const code = c.code.trim().toUpperCase();
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [courses]);

  // Term records for GPA calculations
  const allTermRecords: CourseTermRecord[] = React.useMemo(() => {
    return courseGradeRecords.map(({ course, gradeResult }) => ({
      courseId: course.id,
      courseCode: course.code,
      termId: course.termId,
      credits: course.credits,
      percentage: gradeResult.currentGrade,
      letter: gradeResult.letter,
      gradePoints: gradeResult.points,
      passed: gradeResult.passed,
      termDate: course.createdAt,
    }));
  }, [courseGradeRecords]);

  // Cumulative CGPA
  const cgpa = React.useMemo(() => {
    return calculateCGPA(allTermRecords);
  }, [allTermRecords]);

  const totalAttemptedCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  const totalEarnedCredits = courseGradeRecords
    .filter((r) => r.gradeResult.passed)
    .reduce((acc, r) => acc + r.course.credits, 0);

  const academicStanding = getAcademicStanding(cgpa, scale);

  // Group by term
  const termGroups = React.useMemo(() => {
    return terms.map((term) => {
      const termCourses = courseGradeRecords.filter(
        (r) => r.course.termId === term.id
      );
      const termRecords = allTermRecords.filter((r) => r.termId === term.id);
      const sgpa = calculateSGPA(termRecords);
      const attempted = termCourses.reduce((acc, r) => acc + r.course.credits, 0);
      const earned = termCourses
        .filter((r) => r.gradeResult.passed)
        .reduce((acc, r) => acc + r.course.credits, 0);

      return {
        term,
        courses: termCourses,
        attempted,
        earned,
        sgpa,
      };
    });
  }, [terms, courseGradeRecords, allTermRecords]);

  // QR Code Generation
  React.useEffect(() => {
    if (activeSnapshot) {
      const verificationUrl = typeof window !== "undefined"
        ? `${window.location.origin}/verify/${activeSnapshot.id}`
        : `/verify/${activeSnapshot.id}`;

      QRCode.toDataURL(verificationUrl, {
        width: 110,
        margin: 1,
        color: { dark: "#1B1F2A", light: "#FFFFFF" },
      })
        .then(setQrCodeUrl)
        .catch(console.error);
    } else {
      setQrCodeUrl("");
    }
  }, [activeSnapshot]);

  // Create verification link snapshot (Opt-in)
  const handleCreateVerificationSnapshot = async (makePublic = false) => {
    try {
      setActionLoading(true);
      const termsSummary = termGroups.map((tg) => ({
        termName: tg.term.name,
        sgpa: tg.sgpa,
        earnedCredits: tg.earned,
        courses: tg.courses.map((c) => ({
          code: c.course.code,
          title: c.course.title,
          credits: c.course.credits,
          letter: c.gradeResult.letter,
          gradePoints: c.gradeResult.points,
        })),
      }));

      const created = await dataStore.createTranscriptSnapshot({
        studentName: currentUser?.displayName || "Valeria V.",
        cgpa,
        totalCredits: totalEarnedCredits,
        isPublic: makePublic,
        termsSnapshot: termsSummary,
      });

      // Log audit
      await dataStore.logAudit(
        "grade_updated",
        created.id,
        `Created official verification snapshot ${created.id} (Public: ${makePublic})`
      );

      setActiveSnapshot(created);
      await loadData();
    } catch (err) {
      console.error("Failed to create snapshot:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle public sharing
  const handleTogglePublic = async () => {
    if (!activeSnapshot) return;
    try {
      setActionLoading(true);
      const nextPublic = !activeSnapshot.isPublic;
      await dataStore.toggleSnapshotPublic(activeSnapshot.id, nextPublic);
      await dataStore.logAudit(
        "grade_updated",
        activeSnapshot.id,
        `Toggled verification snapshot ${activeSnapshot.id} public status to: ${nextPublic}`
      );
      setActiveSnapshot((prev) => (prev ? { ...prev, isPublic: nextPublic } : null));
      await loadData();
    } catch (err) {
      console.error("Failed to toggle public sharing:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Copy link
  const handleCopyLink = () => {
    if (!activeSnapshot) return;
    const url = `${window.location.origin}/verify/${activeSnapshot.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const issueDateFormatted = activeSnapshot
    ? new Date(activeSnapshot.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar (Solid cream panel, Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-[18px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] shadow-sm no-print">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
            Official Academic Transcript
          </h1>
          <p className="text-xs text-app-ink-muted mt-0.5">
            Cryptographically verifiable academic record with print-to-PDF layout and QR verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeSnapshot ? (
            <div className="flex items-center gap-2">
              <Button
                variant={activeSnapshot.isPublic ? "outline" : "primary"}
                size="sm"
                onClick={handleTogglePublic}
                disabled={actionLoading}
                className="gap-1.5 text-xs"
              >
                {activeSnapshot.isPublic ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Revoke Public Link</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Make Link Public</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-1.5 text-xs"
                title="Copy public verification link"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-app-success" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy Link"}</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreateVerificationSnapshot(true)}
              disabled={actionLoading}
              className="gap-1.5 text-xs"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Create Verification Link</span>
            </Button>
          )}

          <Button
            onClick={handlePrint}
            variant="primary"
            size="sm"
            className="gap-1.5 text-xs shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save PDF</span>
          </Button>
        </div>
      </div>

      {/* Official A4 Document Container */}
      <div className="official-transcript mx-auto max-w-[820px] rounded-card border border-app-border bg-white text-neutral-900 p-8 md:p-12 shadow-sm font-sans">
        {/* Double Crimson Rule Header */}
        <div className="border-t-2 border-b border-app-accent py-3.5 text-center">
          <h2 className="font-serif text-2xl font-bold tracking-widest uppercase text-neutral-900">
            Official Academic Transcript
          </h2>
          <div className="text-[11px] font-serif tracking-widest text-app-accent uppercase mt-0.5 font-bold">
            Valeria’s Creds Registry of Academic Records
          </div>
        </div>

        {/* Student & Credential Registry Header */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs border-b border-neutral-300 pb-4">
          <div>
            <span className="text-neutral-500 block uppercase tracking-wider text-[10px] font-semibold">
              Student Name
            </span>
            <span className="font-bold text-sm text-neutral-900">
              {currentUser?.displayName || "Valeria V."}
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block uppercase tracking-wider text-[10px] font-semibold">
              Registry Identification
            </span>
            <span className="font-sans font-semibold text-xs font-semibold text-neutral-800">
              VC-2026-9812-REG
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block uppercase tracking-wider text-[10px] font-semibold">
              Curricular Program
            </span>
            <span className="text-xs font-medium text-neutral-800">
              B.S. Collegiate Equivalent
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block uppercase tracking-wider text-[10px] font-semibold">
              Official Issue Date
            </span>
            <span className="font-sans font-semibold text-xs text-neutral-800">
              {issueDateFormatted}
            </span>
          </div>
        </div>

        {/* Academic Terms Course Tables */}
        <div className="mt-6 space-y-6">
          {termGroups.map((tg) => {
            if (tg.courses.length === 0) return null;

            return (
              <div key={tg.term.id} className="term-block break-inside-avoid">
                {/* Term Subheader */}
                <div className="flex items-center justify-between border-b border-neutral-400 pb-1 mb-2">
                  <span className="font-serif text-sm font-bold uppercase tracking-wider text-neutral-900">
                    {tg.term.name}
                  </span>
                  <span className="text-[11px] font-sans font-semibold text-neutral-600">
                    Term SGPA: <strong className="text-neutral-900 font-bold tabular-nums">{tg.sgpa.toFixed(2)}</strong>
                  </span>
                </div>

                {/* Courses Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-300 font-semibold text-neutral-600">
                      <th className="py-1.5 w-24">Course</th>
                      <th className="py-1.5">Course Title</th>
                      <th className="py-1.5 w-28">Department</th>
                      <th className="py-1.5 text-right w-16">Credits</th>
                      <th className="py-1.5 text-center w-16">Grade</th>
                      <th className="py-1.5 text-right w-16">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-sans font-semibold">
                    {tg.courses.map(({ course, gradeResult }) => {
                      const isRetake = (codeOccurrences[course.code.trim().toUpperCase()] || 0) > 1;

                      return (
                        <tr key={course.id}>
                          <td className="py-1.5 font-bold text-neutral-900">
                            {course.code}
                            {isRetake && <span className="text-[10px] text-amber-700 ml-1 font-sans font-bold">(R)</span>}
                          </td>
                          <td className="py-1.5 font-sans font-medium text-neutral-800">
                            {course.title}
                          </td>
                          <td className="py-1.5 font-sans text-neutral-600">
                            {course.department}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-neutral-800">
                            {course.credits}.0
                          </td>
                          <td className="py-1.5 text-center font-bold text-neutral-900 font-serif">
                            {gradeResult.letter}
                          </td>
                          <td className="py-1.5 text-right tabular-nums font-semibold text-neutral-900">
                            {gradeResult.points.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-neutral-400 font-sans text-[11px] text-neutral-600">
                      <td colSpan={3} className="py-1.5 font-medium italic">
                        Term Subtotals
                      </td>
                      <td className="py-1.5 text-right font-sans font-semibold font-semibold tabular-nums text-neutral-800">
                        {tg.earned}.0 cr
                      </td>
                      <td colSpan={2} className="py-1.5 text-right font-sans font-semibold font-bold tabular-nums text-neutral-900">
                        SGPA: {tg.sgpa.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })}
        </div>

        {/* Cumulative Totals Summary Box */}
        <div className="mt-8 border-t-2 border-b-2 border-neutral-400 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans font-semibold break-inside-avoid">
          <div>
            <span className="text-[10px] font-sans uppercase text-neutral-500 block font-semibold">
              Total Credits Attempted
            </span>
            <span className="font-bold text-sm text-neutral-900 tabular-nums">
              {totalAttemptedCredits}.0 Units
            </span>
          </div>

          <div>
            <span className="text-[10px] font-sans uppercase text-neutral-500 block font-semibold">
              Total Credits Earned
            </span>
            <span className="font-bold text-sm text-neutral-900 tabular-nums">
              {totalEarnedCredits}.0 Units
            </span>
          </div>

          <div>
            <span className="text-[10px] font-sans uppercase text-neutral-500 block font-semibold">
              Cumulative CGPA ({scale === "10_point" ? "10-Pt" : "4.0"})
            </span>
            <span className="font-bold text-sm text-app-accent tabular-nums">
              {cgpa.toFixed(2)} {scale === "10_point" ? "/ 10.00" : "/ 4.00"}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-sans uppercase text-neutral-500 block font-semibold">
              Academic Standing
            </span>
            <span className="font-sans font-bold text-xs text-neutral-900 leading-tight block">
              {academicStanding}
            </span>
          </div>
        </div>

        {/* Verification QR & Cryptographic Block */}
        <div className="mt-8 pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4 break-inside-avoid">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-app-accent font-semibold text-[11px] uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Official Digital Credential Verification</span>
            </div>
            <div className="font-sans font-semibold text-[11px] text-neutral-800" data-testid="verification-id-container">
              Verification ID: <strong>{activeSnapshot?.id || "UNVERIFIED-DRAFT"}</strong>
            </div>
            <div className="text-[11px] text-neutral-500 max-w-sm">
              Scan this QR code or navigate to{" "}
              <span className="font-sans font-semibold font-medium text-neutral-700">/verify/{activeSnapshot?.id || "[id]"}</span>{" "}
              to audit the cryptographic timestamped coursework record.
            </div>
            <div className="pt-1">
              <span
                className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  activeSnapshot?.isPublic
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {activeSnapshot?.isPublic ? "Public Verification Active" : "Private Verification (Opt-In)"}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="shrink-0 p-1.5 border border-neutral-300 rounded bg-white">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Verification QR Code"
                className="h-24 w-24 object-contain"
              />
            ) : (
              <div className="h-24 w-24 flex items-center justify-center text-[10px] text-neutral-400 border border-dashed border-neutral-200">
                QR Pending
              </div>
            )}
          </div>
        </div>

        {/* Signature Block */}
        <div className="mt-12 pt-6 border-t border-neutral-300 grid grid-cols-2 gap-12 text-center text-xs break-inside-avoid">
          <div>
            <div className="border-b border-neutral-500 h-8 mx-auto w-48" />
            <span className="font-serif font-bold text-neutral-900 block mt-1.5">
              Dean of Academic Studies
            </span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Board of Curricular Examiners
            </span>
          </div>

          <div>
            <div className="border-b border-neutral-500 h-8 mx-auto w-48" />
            <span className="font-serif font-bold text-neutral-900 block mt-1.5">
              Office of the Registrar
            </span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Registry of Independent Credentials
            </span>
          </div>
        </div>

        {/* Mandatory Academic Disclaimer */}
        <div className="mt-8 rounded border border-neutral-300 bg-neutral-50 p-3 text-center text-xs text-neutral-700 break-inside-avoid">
          <p className="font-semibold text-neutral-900">
            Self-awarded credits. Not accredited by any institution.
          </p>
          <p className="text-[10px] text-neutral-500 mt-0.5 max-w-lg mx-auto">
            This transcript reflects rigorous independent coursework validated through video lecture timestamp tracking, auto-marked quizzes, and structured rubric evaluations.
          </p>
        </div>
      </div>
    </div>
  );
}
