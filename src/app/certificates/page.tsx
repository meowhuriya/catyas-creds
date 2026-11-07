"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Trophy,
  Medal,
  Calendar,
  ExternalLink,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  Search,
  Filter,
  Tag,
  Upload,
  Eye,
  ShieldCheck,
  Building,
  Sparkles,
  Share2,
  X,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type ActivityCategory =
  | "hackathon"
  | "competition"
  | "certification"
  | "workshop"
  | "leadership";

export type StandingType =
  | "winner"
  | "runner_up"
  | "finalist"
  | "top_10"
  | "certified"
  | "participant";

export interface ActivityItem {
  id: string;
  title: string;
  category: ActivityCategory;
  issuer: string;
  date: string;
  standing: StandingType;
  standingLabel: string;
  credentialId?: string;
  verificationUrl?: string;
  description: string;
  skills: string[];
  certificateImage?: string; // base64 Data URL or SVG string
  isVerified: boolean;
}

// Helper to generate a crisp SVG certificate data URL for demo or seed items
function generateSvgCertificateDataUrl(
  title: string,
  recipient: string,
  issuer: string,
  award: string,
  credId: string,
  date: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" width="800" height="560">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FDFBF7" />
        <stop offset="100%" stop-color="#F4ECE1" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#E5C158" />
        <stop offset="50%" stop-color="#D4AF37" />
        <stop offset="100%" stop-color="#AA820A" />
      </linearGradient>
    </defs>
    
    <!-- Outer Parchment Background -->
    <rect width="800" height="560" fill="url(#bgGrad)" />
    
    <!-- Ornamental Borders -->
    <rect x="24" y="24" width="752" height="512" fill="none" stroke="#D4AF37" stroke-width="3" rx="8" />
    <rect x="34" y="34" width="732" height="492" fill="none" stroke="#8A1627" stroke-width="1.5" stroke-dasharray="6,4" rx="6" />
    
    <!-- Corner Ornaments -->
    <circle cx="34" cy="34" r="6" fill="#D4AF37" />
    <circle cx="766" cy="34" r="6" fill="#D4AF37" />
    <circle cx="34" cy="526" r="6" fill="#D4AF37" />
    <circle cx="766" cy="526" r="6" fill="#D4AF37" />
    
    <!-- Header -->
    <text x="400" y="85" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#8A1627" letter-spacing="4">OFFICIAL ACADEMIC CREDENTIAL &amp; HONORS</text>
    <text x="400" y="130" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#14161F">Certificate of Achievement</text>
    <line x1="280" y1="145" x2="520" y2="145" stroke="#D4AF37" stroke-width="2" />
    
    <!-- Recipient -->
    <text x="400" y="185" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#6B7280" letter-spacing="2">THIS CERTIFICATE IS PROUDLY CONFERRED UPON</text>
    <text x="400" y="225" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-style="italic" font-weight="bold" fill="#8A1627">${recipient}</text>
    
    <!-- Event & Award Details -->
    <text x="400" y="265" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#4B5563">for exceptional excellence and outstanding standing in</text>
    <text x="400" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#14161F">${title}</text>
    <text x="400" y="335" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="#A51C30">${award}</text>
    
    <!-- Issuer & Date Info -->
    <text x="400" y="375" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#6B7280">Conferred by ${issuer} • Date: ${date}</text>
    
    <!-- Gold Seal Medallion -->
    <g transform="translate(400, 445)">
      <circle r="36" fill="url(#goldGrad)" stroke="#8A1627" stroke-width="2" />
      <circle r="30" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="4,2" />
      <text y="4" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#FFFFFF" letter-spacing="1">VERIFIED</text>
      <text y="16" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#FFFFFF">HONOR</text>
    </g>
    
    <!-- Signatures -->
    <g transform="translate(140, 460)">
      <path d="M 0 0 Q 30 -15 60 0 T 120 -5" fill="none" stroke="#1E293B" stroke-width="1.8" />
      <line x1="0" y1="10" x2="130" y2="10" stroke="#9CA3AF" stroke-width="1" />
      <text x="65" y="25" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#6B7280">Academic Chair</text>
    </g>
    
    <g transform="translate(530, 460)">
      <path d="M 0 -5 Q 40 10 70 -10 T 130 0" fill="none" stroke="#1E293B" stroke-width="1.8" />
      <line x1="0" y1="10" x2="130" y2="10" stroke="#9CA3AF" stroke-width="1" />
      <text x="65" y="25" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#6B7280">Grand Jury Convener</text>
    </g>
    
    <!-- Credential ID Footer -->
    <text x="400" y="515" text-anchor="middle" font-family="monospace" font-size="10" fill="#9CA3AF">Credential ID: ${credId} • Authenticity Hash Verified</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SEED_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-sih-2025",
    title: "Smart India Hackathon (SIH 2025) - Grand Finale",
    category: "hackathon",
    issuer: "Ministry of Education & AICTE",
    date: "Feb 2025",
    standing: "winner",
    standingLabel: "1st Place Winner (Gold)",
    credentialId: "SIH25-FIN-8841-IND",
    verificationUrl: "https://sih.gov.in/verify/SIH25-FIN-8841-IND",
    description:
      "Led team of 6 building an autonomous low-power edge surveillance drone with onboard TinyML crash detection and decentralized telemetry for forest fire prevention.",
    skills: ["Edge AI", "Computer Vision", "Rust", "Embedded C++", "Drone Telemetry"],
    certificateImage: generateSvgCertificateDataUrl(
      "Smart India Hackathon (SIH 2025)",
      "Valeria / Ceen Noir",
      "Ministry of Education & AICTE",
      "1st Place Winner - Grand Finale (Gold)",
      "SIH25-FIN-8841-IND",
      "February 2025"
    ),
    isVerified: true,
  },
  {
    id: "act-icpc-2025",
    title: "ACM ICPC Regional Finalist 2025",
    category: "competition",
    issuer: "International Collegiate Programming Contest",
    date: "Dec 2024",
    standing: "runner_up",
    standingLabel: "Regional 2nd Runner Up (Silver)",
    credentialId: "ICPC-ASIA-WEST-2024-912",
    description:
      "Ranked Top 12 among 350+ collegiate teams solving advanced combinatorial optimization, network flow, and graph theory problems under strict time constraints.",
    skills: ["Algorithms", "Data Structures", "Dynamic Programming", "C++20", "Graph Theory"],
    certificateImage: generateSvgCertificateDataUrl(
      "ACM ICPC Regional Contest",
      "Valeria / Ceen Noir",
      "International Collegiate Programming Contest",
      "Regional 2nd Runner Up (Silver)",
      "ICPC-ASIA-WEST-2024-912",
      "December 2024"
    ),
    isVerified: true,
  },
  {
    id: "act-aws-cert",
    title: "AWS Certified Solutions Architect - Associate",
    category: "certification",
    issuer: "Amazon Web Services",
    date: "Jan 2025",
    standing: "certified",
    standingLabel: "Certified with Distinction (Score 915/1000)",
    credentialId: "AWS-SAA-2025-VLR-004",
    verificationUrl: "https://aws.amazon.com/verification",
    description:
      "Demonstrated mastery in architecting resilient, high-performance, cost-optimized, and secure serverless architectures on AWS Cloud.",
    skills: ["Cloud Architecture", "AWS Lambda", "DynamoDB", "S3", "VPC Networking"],
    certificateImage: generateSvgCertificateDataUrl(
      "AWS Certified Solutions Architect",
      "Valeria / Ceen Noir",
      "Amazon Web Services Training & Certification",
      "Certified with Distinction (Score: 915/1000)",
      "AWS-SAA-2025-VLR-004",
      "January 2025"
    ),
    isVerified: true,
  },
  {
    id: "act-iit-bombay",
    title: "IIT Bombay Techfest Autonomous Robotics Challenge",
    category: "competition",
    issuer: "IIT Bombay Techfest",
    date: "Nov 2024",
    standing: "runner_up",
    standingLabel: "1st Runner Up (Silver)",
    credentialId: "TECHFEST-IITB-24-AUTO-33",
    description:
      "Engineered an autonomous LiDAR-guided ground rover navigating dynamic obstacle arenas without external GPS relying on SLAM.",
    skills: ["ROS 2", "LiDAR SLAM", "Robotics", "Python", "Kalman Filters"],
    certificateImage: generateSvgCertificateDataUrl(
      "IIT Bombay Techfest Autonomous Robotics",
      "Valeria / Ceen Noir",
      "IIT Bombay Student Council",
      "1st Runner Up (Silver)",
      "TECHFEST-IITB-24-AUTO-33",
      "November 2024"
    ),
    isVerified: true,
  },
];

export default function CertificatesPage() {
  const toast = useToast();

  const [activities, setActivities] = React.useState<ActivityItem[]>(SEED_ACTIVITIES);
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Modals
  const [selectedActivityForLightbox, setSelectedActivityForLightbox] =
    React.useState<ActivityItem | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);

  // Add Activity Form State
  const [formTitle, setFormTitle] = React.useState("");
  const [formCategory, setFormCategory] = React.useState<ActivityCategory>("competition");
  const [formIssuer, setFormIssuer] = React.useState("");
  const [formDate, setFormDate] = React.useState("");
  const [formStanding, setFormStanding] = React.useState<StandingType>("winner");
  const [formStandingLabel, setFormStandingLabel] = React.useState("1st Place Winner");
  const [formCredentialId, setFormCredentialId] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formSkills, setFormSkills] = React.useState("");
  const [uploadedCertificateDataUrl, setUploadedCertificateDataUrl] = React.useState<string>("");

  // Load activities from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("valeria_activities_feed");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActivities(parsed);
          }
        }
      } catch (err) {
        console.warn("Error reading activities from localStorage:", err);
      }
    }
  }, []);

  // Save activities to localStorage
  const saveActivities = (list: ActivityItem[]) => {
    setActivities(list);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("valeria_activities_feed", JSON.stringify(list));
      } catch (err) {
        console.warn("Error saving activities to localStorage:", err);
      }
    }
  };

  // Filter activities
  const filteredActivities = React.useMemo(() => {
    return activities.filter((act) => {
      const matchesCategory =
        activeCategory === "all" || act.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        act.title.toLowerCase().includes(q) ||
        act.issuer.toLowerCase().includes(q) ||
        act.standingLabel.toLowerCase().includes(q) ||
        act.skills.some((s) => s.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [activities, activeCategory, searchQuery]);

  // Statistics
  const totalActivities = activities.length;
  const winnersCount = activities.filter(
    (a) => a.standing === "winner" || a.standing === "runner_up"
  ).length;
  const verifiedCount = activities.filter((a) => a.isVerified).length;

  // File Upload Handler (converts image/pdf to base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large", "Please upload a certificate image under 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedCertificateDataUrl(reader.result);
        toast.success("Certificate loaded", `${file.name} ready for saving.`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate SVG Certificate fallback
  const handleGenerateDefaultCertificate = () => {
    if (!formTitle.trim()) {
      toast.error("Title needed", "Enter an activity title first.");
      return;
    }
    const generated = generateSvgCertificateDataUrl(
      formTitle.trim(),
      "Valeria / Ceen Noir",
      formIssuer.trim() || "Academic Honors Committee",
      formStandingLabel.trim() || "Certificate of Excellence",
      formCredentialId.trim() || `VAL-${Date.now().toString().slice(-6)}`,
      formDate.trim() || new Date().toISOString().split("T")[0]
    );
    setUploadedCertificateDataUrl(generated);
    toast.success("Certificate generated", "Official seal certificate template attached!");
  };

  // Save New Activity
  const handleSaveActivity = () => {
    if (!formTitle.trim() || !formIssuer.trim()) {
      toast.error("Required fields", "Please fill in title and organizing body.");
      return;
    }

    const certImage =
      uploadedCertificateDataUrl ||
      generateSvgCertificateDataUrl(
        formTitle.trim(),
        "Valeria / Ceen Noir",
        formIssuer.trim(),
        formStandingLabel.trim(),
        formCredentialId.trim() || `VAL-${Date.now().toString().slice(-6)}`,
        formDate.trim() || "2026"
      );

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      issuer: formIssuer.trim(),
      date: formDate.trim() || "Recent",
      standing: formStanding,
      standingLabel: formStandingLabel.trim() || "Completed",
      credentialId: formCredentialId.trim() || undefined,
      description:
        formDescription.trim() || "Extracurricular milestone added to honors gallery.",
      skills: formSkills
        ? formSkills.split(",").map((s) => s.trim()).filter(Boolean)
        : ["Engineering", "Honors"],
      certificateImage: certImage,
      isVerified: true,
    };

    const updated = [newActivity, ...activities];
    saveActivities(updated);

    // Reset Form
    setShowAddModal(false);
    setFormTitle("");
    setFormIssuer("");
    setFormDate("");
    setFormStandingLabel("1st Place Winner");
    setFormCredentialId("");
    setFormDescription("");
    setFormSkills("");
    setUploadedCertificateDataUrl("");

    toast.success("Activity recorded", `"${newActivity.title}" added with certificate.`);
  };

  // Delete Activity
  const handleDeleteActivity = (id: string) => {
    if (!confirm("Are you sure you want to remove this activity and certificate?")) return;
    const updated = activities.filter((a) => a.id !== id);
    saveActivities(updated);
    if (selectedActivityForLightbox?.id === id) {
      setSelectedActivityForLightbox(null);
    }
    toast.success("Activity removed", "Removed from your honors vault.");
  };

  const copyCredId = (credId: string) => {
    navigator.clipboard.writeText(credId);
    setCopiedId(credId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Credential ID copied", credId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="p-6 rounded-[18px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
              <Award className="h-4 w-4" />
              <span>Extracurricular Honors &amp; Competitions</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                Verified Vault
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--color-ink)]">
              Activity Gallery &amp; Certificate Feed
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-1 max-w-2xl leading-relaxed">
              Log hackathons, coding competitions, research milestones, and verified certifications.
              Click any competition in your feed to inspect the uploaded certificate.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--color-accent)] hover:bg-[#8A1627] text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Activity &amp; Certificate</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--color-border)]">
          <div className="p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">
              Total Activities
            </span>
            <span className="font-serif text-xl font-bold text-[var(--color-ink)]">
              {totalActivities}
            </span>
          </div>

          <div className="p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">
              Podium / Winners
            </span>
            <span className="font-serif text-xl font-bold text-[var(--color-accent)]">
              {winnersCount}
            </span>
          </div>

          <div className="p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">
              Verified Certificates
            </span>
            <span className="font-serif text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {verifiedCount}
            </span>
          </div>

          <div className="p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">
              Honor Points
            </span>
            <span className="font-serif text-xl font-bold text-[#D4AF37]">
              {totalActivities * 250} XP
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          {[
            { id: "all", label: "All Activities" },
            { id: "hackathon", label: "Hackathons" },
            { id: "competition", label: "Competitions" },
            { id: "certification", label: "Certifications" },
            { id: "workshop", label: "Workshops" },
            { id: "leadership", label: "Leadership" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all",
                activeCategory === cat.id
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, issuer, or tech..."
            className="w-full text-xs h-9 pl-9 pr-3 rounded-[8px] bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Activity Gallery Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredActivities.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-[16px] bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] text-xs text-[var(--color-ink-muted)]">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40 text-[var(--color-accent)]" />
            <p className="font-semibold text-sm text-[var(--color-ink)]">No activities found</p>
            <p className="mt-1">
              {searchQuery
                ? `No entries matching "${searchQuery}".`
                : "Add your first competition or certificate to populate the feed."}
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const isGold = act.standing === "winner";
            const isSilver = act.standing === "runner_up";

            return (
              <div
                key={act.id}
                onClick={() => setSelectedActivityForLightbox(act)}
                className="group relative academic-card p-5 rounded-[16px] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div>
                  {/* Top Header: Category & Standing Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] border border-[var(--color-border)]">
                      {act.category}
                    </span>

                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                        isGold &&
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                        isSilver &&
                          "bg-slate-400/10 text-slate-700 dark:text-slate-300 border-slate-400/20",
                        !isGold &&
                          !isSilver &&
                          "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20"
                      )}
                    >
                      {isGold ? (
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                      ) : isSilver ? (
                        <Medal className="h-3.5 w-3.5 text-slate-400" />
                      ) : (
                        <Award className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      )}
                      <span>{act.standingLabel}</span>
                    </div>
                  </div>

                  {/* Title & Issuer */}
                  <h3 className="font-serif text-lg font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors leading-snug">
                    {act.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)] mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span>{act.issuer}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{act.date}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--color-ink-muted)] mt-2 leading-relaxed line-clamp-2">
                    {act.description}
                  </p>

                  {/* Skill Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {act.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-[4px] bg-[var(--color-surface-muted)] text-[var(--color-ink)] text-[10px] font-medium border border-[var(--color-border)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certificate Section Thumbnail Embedded in Feed */}
                <div className="pt-3 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[var(--color-ink)] flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Attached Certificate</span>
                    </span>
                    <span className="text-[11px] text-[var(--color-accent)] font-semibold flex items-center gap-1 group-hover:underline">
                      <Eye className="h-3 w-3" />
                      <span>Click to Inspect</span>
                    </span>
                  </div>

                  {/* Thumbnail Preview Banner */}
                  <div className="relative h-28 w-full rounded-[10px] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-center group/thumb">
                    {act.certificateImage ? (
                      <img
                        src={act.certificateImage}
                        alt={`${act.title} Certificate`}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Award className="h-6 w-6 mx-auto mb-1 text-[var(--color-accent)] opacity-60" />
                        <span className="text-[11px] font-semibold text-[var(--color-ink)]">
                          Certificate on Record
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-full bg-white/90 text-black text-xs font-bold shadow-lg flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Full Certificate</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: FULL CERTIFICATE INSPECTION LIGHTBOX */}
      {selectedActivityForLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in-0">
          <div className="w-full max-w-3xl rounded-[20px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-serif text-base font-bold text-[var(--color-ink)] truncate max-w-md sm:max-w-xl">
                    {selectedActivityForLightbox.title}
                  </h3>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {selectedActivityForLightbox.issuer} • Conferred {selectedActivityForLightbox.date}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedActivityForLightbox(null)}
                className="p-1 rounded-full text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-border)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: High-Res Certificate View */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="rounded-[14px] overflow-hidden border border-[var(--color-border)] shadow-inner bg-[#FBF6EC] flex items-center justify-center">
                {selectedActivityForLightbox.certificateImage ? (
                  <img
                    src={selectedActivityForLightbox.certificateImage}
                    alt={selectedActivityForLightbox.title}
                    className="w-full h-auto object-contain max-h-[500px]"
                  />
                ) : (
                  <div className="py-20 text-center">
                    <Award className="h-12 w-12 mx-auto text-[var(--color-accent)] mb-2" />
                    <p className="font-serif text-lg font-bold text-[var(--color-ink)]">
                      Official Certificate
                    </p>
                  </div>
                )}
              </div>

              {/* Verified Credential Details */}
              <div className="p-4 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--color-ink)]">Credential ID:</span>
                    <span className="font-mono text-[var(--color-accent)] font-bold">
                      {selectedActivityForLightbox.credentialId || "VAL-VERIFIED-AUTH"}
                    </span>
                    <button
                      onClick={() =>
                        copyCredId(
                          selectedActivityForLightbox.credentialId || "VAL-VERIFIED-AUTH"
                        )
                      }
                      className="p-1 rounded hover:bg-[var(--color-border)]"
                      title="Copy credential ID"
                    >
                      {copiedId ===
                      (selectedActivityForLightbox.credentialId || "VAL-VERIFIED-AUTH") ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Cryptographically Signed Record</span>
                  </div>
                </div>

                <p className="text-[var(--color-ink-muted)] leading-relaxed">
                  {selectedActivityForLightbox.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedActivityForLightbox.skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-ink)] text-[10px] font-medium border border-[var(--color-border)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <button
                onClick={() => handleDeleteActivity(selectedActivityForLightbox.id)}
                className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Activity</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedActivityForLightbox.certificateImage && (
                  <a
                    href={selectedActivityForLightbox.certificateImage}
                    download={`${selectedActivityForLightbox.title.replace(/\s+/g, "_")}_Certificate.svg`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-xs font-semibold text-[var(--color-ink)]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </a>
                )}

                <button
                  onClick={() => setSelectedActivityForLightbox(null)}
                  className="px-4 py-2 rounded-[8px] bg-[var(--color-accent)] hover:bg-[#8A1627] text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD ACTIVITY & UPLOAD CERTIFICATE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[18px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                  Add Activity &amp; Certificate
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Record an extracurricular competition, hackathon, or certified course.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Activity / Competition Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Smart India Hackathon 2025"
                  className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="competition">Competition / Contest</option>
                    <option value="certification">Certification / Exam</option>
                    <option value="workshop">Workshop / Conference</option>
                    <option value="leadership">Leadership / Club</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Organizing Body / Issuer *
                  </label>
                  <input
                    type="text"
                    value={formIssuer}
                    onChange={(e) => setFormIssuer(e.target.value)}
                    placeholder="e.g. AICTE / Google / IIT Bombay"
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Standing / Result
                  </label>
                  <select
                    value={formStanding}
                    onChange={(e: any) => {
                      setFormStanding(e.target.value);
                      if (e.target.value === "winner") setFormStandingLabel("1st Place Winner");
                      else if (e.target.value === "runner_up") setFormStandingLabel("1st Runner Up");
                      else if (e.target.value === "finalist") setFormStandingLabel("Grand Finalist");
                      else if (e.target.value === "certified") setFormStandingLabel("Certified");
                    }}
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  >
                    <option value="winner">Winner (1st Place)</option>
                    <option value="runner_up">Runner Up (2nd/3rd)</option>
                    <option value="finalist">Finalist</option>
                    <option value="certified">Certified</option>
                    <option value="participant">Participant</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Award Label Text
                  </label>
                  <input
                    type="text"
                    value={formStandingLabel}
                    onChange={(e) => setFormStandingLabel(e.target.value)}
                    placeholder="e.g. 1st Place Winner (Gold)"
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Date Completed
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="e.g. March 2026"
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--color-ink)] block mb-1">
                    Credential ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formCredentialId}
                    onChange={(e) => setFormCredentialId(e.target.value)}
                    placeholder="e.g. SIH-2025-9921"
                    className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Skills Used (comma-separated)
                </label>
                <input
                  type="text"
                  value={formSkills}
                  onChange={(e) => setFormSkills(e.target.value)}
                  placeholder="e.g. Next.js, PyTorch, Computer Vision, Embedded C"
                  className="w-full h-9 px-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--color-ink)] block mb-1">
                  Description / Project Built
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Briefly describe what you built or accomplished..."
                  className="w-full p-2.5 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)]"
                />
              </div>

              {/* Certificate File Upload & Generator */}
              <div className="p-3.5 rounded-[12px] bg-[var(--color-surface-muted)] border border-dashed border-[var(--color-border)] space-y-2">
                <span className="font-semibold text-[var(--color-ink)] block">
                  Upload Certificate File (PNG, JPG, PDF)
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="text-xs text-[var(--color-ink-muted)] file:mr-2 file:py-1.5 file:px-3 file:rounded-[6px] file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-accent)] file:text-white hover:file:bg-[#8A1627] cursor-pointer"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[var(--color-ink-muted)]">
                    Don't have an image ready?
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateDefaultCertificate}
                    className="text-[11px] font-bold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Generate Official Seal Certificate</span>
                  </button>
                </div>

                {uploadedCertificateDataUrl && (
                  <div className="pt-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Certificate loaded &amp; ready to attach</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveActivity}
                className="px-4 py-2 rounded-[8px] text-xs font-bold bg-[var(--color-accent)] text-white hover:bg-[#8A1627]"
              >
                Save Activity &amp; Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
