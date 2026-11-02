"use client";

import * as React from "react";
import {
  Trophy,
  Users,
  Award,
  Sparkles,
  Flame,
  Shield,
  Upload,
  Copy,
  Check,
  Eye,
  EyeOff,
  Plus,
  Lock,
  Clock,
  BookOpen,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/repository";
import { LeaderboardService } from "@/lib/gamification/leaderboard-service";
import {
  LeaderboardProfile,
  BadgeItem,
  BadgeCriteriaType,
} from "@/types/mastery-gamification";

export default function LeaderboardPage() {
  const { currentUser, firebaseUser } = useDataStore();
  const currentUid = firebaseUser?.uid || currentUser?.uid || "student-user";

  const [activeTab, setActiveTab] = React.useState<"ALL" | "SQUAD">("ALL");
  const [squadCodeInput, setSquadCodeInput] = React.useState("");
  const [copiedSquadCode, setCopiedSquadCode] = React.useState(false);

  // Data states
  const [profiles, setProfiles] = React.useState<LeaderboardProfile[]>([]);
  const [badgesCatalog, setBadgesCatalog] = React.useState<BadgeItem[]>([]);
  const [myProfile, setMyProfile] = React.useState<LeaderboardProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Badge Studio Modal state
  const [badgeStudioOpen, setBadgeStudioOpen] = React.useState(false);
  const [badgeTitle, setBadgeTitle] = React.useState("");
  const [badgeLore, setBadgeLore] = React.useState("");
  const [badgeCriteria, setBadgeCriteria] = React.useState<BadgeCriteriaType>("TOPICS_MASTERED");
  const [badgeThreshold, setBadgeThreshold] = React.useState(5);
  const [badgeImageBase64, setBadgeImageBase64] = React.useState<string | null>(null);
  const [mintingBadge, setMintingBadge] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Load Leaderboard & Badges
  const loadLeaderboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      const userProf = await LeaderboardService.getUserProfile(currentUid);
      setMyProfile(userProf);

      const targetSquad = activeTab === "SQUAD" ? userProf?.squadCode : undefined;
      const [rankedProfiles, catalog] = await Promise.all([
        LeaderboardService.getLeaderboardProfiles(targetSquad),
        LeaderboardService.getBadgesCatalog(),
      ]);

      setProfiles(rankedProfiles);
      setBadgesCatalog(catalog);
    } catch (err) {
      console.warn("Failed to load leaderboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUid, activeTab]);

  React.useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  // Squad Actions
  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squadCodeInput.trim()) return;
    const updated = await LeaderboardService.updateSquad(currentUid, squadCodeInput.trim());
    setMyProfile(updated);
    setSquadCodeInput("");
    loadLeaderboardData();
  };

  const handleCopySquadCode = () => {
    if (myProfile?.squadCode) {
      navigator.clipboard.writeText(myProfile.squadCode);
      setCopiedSquadCode(true);
      setTimeout(() => setCopiedSquadCode(false), 2000);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!myProfile) return;
    const newSetting = !myProfile.showOnLeaderboard;
    const updated = await LeaderboardService.toggleVisibility(currentUid, newSetting);
    setMyProfile(updated);
    loadLeaderboardData();
  };

  const handleToggleEquipBadge = async (badgeId: string) => {
    const updated = await LeaderboardService.toggleBadgeEquipped(currentUid, badgeId);
    setMyProfile(updated);
    loadLeaderboardData();
  };

  // Badge Studio Canvas Image Processing
  const handleBadgeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const size = 120; // 120x120 clean badge dimension
        canvas.width = size;
        canvas.height = size;

        if (ctx) {
          // Crop square center
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const compressed = canvas.toDataURL("image/webp", 0.85);
          setBadgeImageBase64(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleMintCustomBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeTitle.trim() || !badgeLore.trim() || !badgeImageBase64) return;
    setMintingBadge(true);

    try {
      await LeaderboardService.createCustomBadge({
        title: badgeTitle.trim(),
        description: badgeLore.trim(),
        imageUrl: badgeImageBase64,
        criteriaType: badgeCriteria,
        thresholdValue: Number(badgeThreshold) || 1,
        createdByUid: currentUid,
      });

      setBadgeTitle("");
      setBadgeLore("");
      setBadgeImageBase64(null);
      setBadgeStudioOpen(false);
      await loadLeaderboardData();
    } catch (err) {
      console.warn("Error minting badge:", err);
    } finally {
      setMintingBadge(false);
    }
  };

  // Podium (Top 3)
  const topThree = profiles.slice(0, 3);
  const remainingRanked = profiles.slice(3);

  // Badges map for quick lookup
  const badgeMap = React.useMemo(() => {
    const map = new Map<string, BadgeItem>();
    badgesCatalog.forEach((b) => map.set(b.id, b));
    return map;
  }, [badgesCatalog]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4D9C0] dark:border-[#3D2D31] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#8A1627] dark:text-[#F07B88]">
              Academic Honor Roll
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9A441]/15 text-[#8A5A12] dark:text-[#D9A441] border border-[#D9A441]/30">
              Live Season 1
            </span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#14161F] dark:text-[#F6EBD3] mt-1">
            Squad Leaderboard & Badge Vault
          </h1>
          <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB] mt-1">
            Compete with classmates, master curriculum topics, and mint custom milestone badges.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setBadgeStudioOpen(true)}
            className="btn-primary text-xs flex items-center gap-1.5 px-4 h-9 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#D9A441]" />
            <span>Badge Studio</span>
          </Button>

          {/* Privacy Switch */}
          <button
            onClick={handleTogglePrivacy}
            className="h-9 px-3 rounded-[8px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-white/70 dark:bg-black/20 text-xs flex items-center gap-1.5 hover:border-[#8A1627] transition-colors"
            title="Toggle leaderboard visibility"
          >
            {myProfile?.showOnLeaderboard ? (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[11px] font-medium">Public</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-[#8A1627]" />
                <span className="text-[11px] font-medium">Hidden</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs & Squad Invite Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Toggle View */}
        <div className="flex rounded-[10px] p-1 bg-[#E4D9C0]/50 dark:bg-[#2D1E22] w-fit border border-[#E4D9C0] dark:border-[#3D2D31]">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-[7px] transition-all flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-white dark:bg-[#1E1618] text-[#8A1627] dark:text-[#F07B88] shadow-xs"
                : "text-[#4B5160] dark:text-[#CFC8BB] hover:text-[#14161F]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>All CSE Peers</span>
          </button>

          <button
            onClick={() => setActiveTab("SQUAD")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-[7px] transition-all flex items-center gap-1.5 ${
              activeTab === "SQUAD"
                ? "bg-white dark:bg-[#1E1618] text-[#8A1627] dark:text-[#F07B88] shadow-xs"
                : "text-[#4B5160] dark:text-[#CFC8BB] hover:text-[#14161F]"
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-[#D9A441]" />
            <span>My Squad {myProfile?.squadCode && `(${myProfile.squadCode})`}</span>
          </button>
        </div>

        {/* Squad Invite / Join Box */}
        <div className="flex items-center gap-2">
          {myProfile?.squadCode ? (
            <button
              onClick={handleCopySquadCode}
              className="h-9 px-3 rounded-[8px] border border-[#D9A441]/40 bg-[#D9A441]/10 text-xs font-semibold text-[#8A5A12] dark:text-[#E5B555] flex items-center gap-1.5 hover:bg-[#D9A441]/20 transition-colors"
            >
              <span>Squad Code: <span className="font-mono">{myProfile.squadCode}</span></span>
              {copiedSquadCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          ) : null}

          <form onSubmit={handleJoinSquad} className="flex items-center gap-1.5">
            <input
              type="text"
              value={squadCodeInput}
              onChange={(e) => setSquadCodeInput(e.target.value.toUpperCase())}
              placeholder="Join Code (e.g. CYBER9)"
              maxLength={8}
              className="h-9 w-36 px-2.5 rounded-[8px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-white dark:bg-black text-xs font-mono uppercase focus:outline-none focus:border-[#8A1627]"
            />
            <Button type="submit" size="sm" className="btn-secondary h-9 text-xs px-3">
              Join
            </Button>
          </form>
        </div>
      </div>

      {/* =============================================================== */}
      {/* PODIUM: TOP 3 CARDS */}
      {/* =============================================================== */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 items-end">
          {/* #2 Rank (Silver) */}
          {topThree[1] && (
            <div className="order-2 md:order-1 academic-card p-5 text-center relative border-t-4 border-t-[#8C92AC] hover:shadow-lg transition-all">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#8C92AC] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                #2 Silver
              </div>
              <div className="h-16 w-16 mx-auto rounded-full overflow-hidden border-2 border-[#8C92AC] bg-white dark:bg-black p-0.5 mt-2">
                {topThree[1].avatarUrl ? (
                  <img src={topThree[1].avatarUrl} alt={topThree[1].displayName} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-bold text-lg bg-[#8C92AC]/20">
                    {topThree[1].displayName[0]}
                  </div>
                )}
              </div>
              <div className="font-serif font-bold text-base mt-2 truncate">{topThree[1].displayName}</div>
              <div className="text-xl font-serif font-black text-[#8A1627] dark:text-[#F07B88] mt-0.5">
                {topThree[1].xp.toLocaleString()} XP
              </div>

              {/* Equipped Badges */}
              <div className="flex justify-center gap-1.5 mt-2.5">
                {topThree[1].equippedBadges.map((bId) => {
                  const b = badgeMap.get(bId);
                  return b ? (
                    <img key={bId} src={b.imageUrl} alt={b.title} title={b.title} className="h-6 w-6 rounded-full border border-[#8C92AC]/50" />
                  ) : null;
                })}
              </div>

              <div className="text-[11px] text-[#4B5160] dark:text-[#CFC8BB] mt-2 flex justify-center gap-3">
                <span>{topThree[1].topicsMasteredCount} Mastered</span>
                <span>·</span>
                <span>{Math.round(topThree[1].weeklyStudyMinutes / 60)}h Studied</span>
              </div>
            </div>
          )}

          {/* #1 Rank (Gold Champion) */}
          {topThree[0] && (
            <div className="order-1 md:order-2 academic-card p-6 text-center relative border-2 border-[#D9A441] bg-gradient-to-b from-[#D9A441]/10 to-transparent shadow-xl hover:shadow-2xl transition-all scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#D9A441] text-white text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                <span>#1 Champion</span>
              </div>
              <div className="h-20 w-20 mx-auto rounded-full overflow-hidden border-3 border-[#D9A441] bg-white dark:bg-black p-0.5 mt-2 ring-4 ring-[#D9A441]/20">
                {topThree[0].avatarUrl ? (
                  <img src={topThree[0].avatarUrl} alt={topThree[0].displayName} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-bold text-2xl bg-[#D9A441]/20">
                    {topThree[0].displayName[0]}
                  </div>
                )}
              </div>
              <div className="font-serif font-black text-lg mt-2.5 truncate">{topThree[0].displayName}</div>
              <div className="text-2xl font-serif font-black text-[#D9A441] mt-0.5">
                {topThree[0].xp.toLocaleString()} XP
              </div>

              {/* Equipped Badges */}
              <div className="flex justify-center gap-2 mt-3">
                {topThree[0].equippedBadges.map((bId) => {
                  const b = badgeMap.get(bId);
                  return b ? (
                    <img key={bId} src={b.imageUrl} alt={b.title} title={b.title} className="h-7 w-7 rounded-full border-2 border-[#D9A441]" />
                  ) : null;
                })}
              </div>

              <div className="text-xs text-[#4B5160] dark:text-[#CFC8BB] mt-2.5 flex justify-center gap-3 font-semibold">
                <span>{topThree[0].topicsMasteredCount} Topics Mastered</span>
                <span>·</span>
                <span>{Math.round(topThree[0].weeklyStudyMinutes / 60)}h This Week</span>
              </div>
            </div>
          )}

          {/* #3 Rank (Bronze) */}
          {topThree[2] && (
            <div className="order-3 academic-card p-5 text-center relative border-t-4 border-t-[#B87333] hover:shadow-lg transition-all">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#B87333] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                #3 Bronze
              </div>
              <div className="h-16 w-16 mx-auto rounded-full overflow-hidden border-2 border-[#B87333] bg-white dark:bg-black p-0.5 mt-2">
                {topThree[2].avatarUrl ? (
                  <img src={topThree[2].avatarUrl} alt={topThree[2].displayName} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-bold text-lg bg-[#B87333]/20">
                    {topThree[2].displayName[0]}
                  </div>
                )}
              </div>
              <div className="font-serif font-bold text-base mt-2 truncate">{topThree[2].displayName}</div>
              <div className="text-xl font-serif font-black text-[#8A1627] dark:text-[#F07B88] mt-0.5">
                {topThree[2].xp.toLocaleString()} XP
              </div>

              {/* Equipped Badges */}
              <div className="flex justify-center gap-1.5 mt-2.5">
                {topThree[2].equippedBadges.map((bId) => {
                  const b = badgeMap.get(bId);
                  return b ? (
                    <img key={bId} src={b.imageUrl} alt={b.title} title={b.title} className="h-6 w-6 rounded-full border border-[#B87333]/50" />
                  ) : null;
                })}
              </div>

              <div className="text-[11px] text-[#4B5160] dark:text-[#CFC8BB] mt-2 flex justify-center gap-3">
                <span>{topThree[2].topicsMasteredCount} Mastered</span>
                <span>·</span>
                <span>{Math.round(topThree[2].weeklyStudyMinutes / 60)}h Studied</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =============================================================== */}
      {/* RANKED TABLE */}
      {/* =============================================================== */}
      <div className="academic-card overflow-hidden">
        <div className="p-4 border-b border-[#E4D9C0] dark:border-[#3D2D31] flex items-center justify-between">
          <span className="font-serif font-bold text-sm">Full Peer Standings</span>
          <span className="text-xs text-[#4B5160] dark:text-[#CFC8BB]">{profiles.length} Active Students</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E4D9C0]/30 dark:bg-[#221A1C] border-b border-[#E4D9C0] dark:border-[#3D2D31] text-[11px] font-bold uppercase tracking-wider text-[#4B5160] dark:text-[#CFC8BB]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Equipped Badges</th>
                <th className="py-3 px-4 text-center">Mastered</th>
                <th className="py-3 px-4 text-center">Weekly Hours</th>
                <th className="py-3 px-4 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4D9C0]/50 dark:divide-[#3D2D31]">
              {profiles.map((prof, idx) => {
                const isMe = prof.uid === currentUid;
                return (
                  <tr
                    key={prof.uid}
                    className={`transition-colors ${
                      isMe
                        ? "bg-[#8A1627]/10 font-bold text-[#8A1627] dark:text-[#F07B88]"
                        : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-serif font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full overflow-hidden border border-[#CFC8BB] shrink-0 bg-white dark:bg-black">
                        {prof.avatarUrl ? (
                          <img src={prof.avatarUrl} alt={prof.displayName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] font-bold">
                            {prof.displayName[0]}
                          </div>
                        )}
                      </div>
                      <span className="truncate max-w-[140px] sm:max-w-xs">{prof.displayName} {isMe && "(You)"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {prof.equippedBadges.map((bId) => {
                          const b = badgeMap.get(bId);
                          return b ? (
                            <img
                              key={bId}
                              src={b.imageUrl}
                              alt={b.title}
                              title={`${b.title}: ${b.description}`}
                              className="h-5 w-5 rounded-full border border-[#D9A441]"
                            />
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{prof.topicsMasteredCount}</td>
                    <td className="py-3 px-4 text-center">{Math.round(prof.weeklyStudyMinutes / 60)}h</td>
                    <td className="py-3 px-4 text-right font-serif font-bold text-sm">
                      {prof.xp.toLocaleString()} XP
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =============================================================== */}
      {/* BADGE VAULT */}
      {/* =============================================================== */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A1627] dark:text-[#F07B88]">
              Milestone Collection
            </div>
            <h2 className="text-xl font-serif font-bold">Badge Vault</h2>
          </div>
          <span className="text-xs text-[#4B5160] dark:text-[#CFC8BB]">
            Equipped ({myProfile?.equippedBadges?.length || 0}/3)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badgesCatalog.map((b) => {
            const isEquipped = myProfile?.equippedBadges.includes(b.id);
            // Unlock logic
            let isUnlocked = false;
            let currentVal = 0;
            if (b.criteriaType === "TOPICS_MASTERED") {
              currentVal = myProfile?.topicsMasteredCount || 0;
              isUnlocked = currentVal >= b.thresholdValue;
            } else if (b.criteriaType === "STREAK_DAYS") {
              currentVal = myProfile?.currentStreakDays || 0;
              isUnlocked = currentVal >= b.thresholdValue;
            } else {
              isUnlocked = isEquipped || false;
            }

            return (
              <div
                key={b.id}
                className={`p-4 rounded-[14px] border-2 transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? "academic-card border-[#D9A441]/50 shadow-sm"
                    : "border-[#E4D9C0] dark:border-[#3D2D31] bg-black/5 dark:bg-black/20 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`h-14 w-14 rounded-full overflow-hidden border-2 p-0.5 shrink-0 ${
                        isUnlocked ? "border-[#D9A441] bg-white dark:bg-black" : "border-gray-400 grayscale"
                      }`}
                    >
                      <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover rounded-full" />
                    </div>
                    {isUnlocked ? (
                      <button
                        onClick={() => handleToggleEquipBadge(b.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-[6px] transition-colors ${
                          isEquipped
                            ? "bg-[#8A1627] text-white"
                            : "bg-[#E4D9C0]/60 hover:bg-[#8A1627] hover:text-white"
                        }`}
                      >
                        {isEquipped ? "Equipped" : "Equip"}
                      </button>
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>

                  <div className="font-serif font-bold text-sm mt-3">{b.title}</div>
                  <p className="text-[11px] text-[#4B5160] dark:text-[#CFC8BB] mt-1 line-clamp-2">
                    {b.description}
                  </p>
                </div>

                {/* Progress bar if locked */}
                {!isUnlocked && (
                  <div className="mt-3 pt-2 border-t border-[#E4D9C0] dark:border-[#3D2D31]">
                    <div className="flex justify-between text-[10px] text-[#4B5160] mb-1">
                      <span>Progress</span>
                      <span>
                        {currentVal} / {b.thresholdValue}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E4D9C0] dark:bg-[#3D2D31] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8A1627] rounded-full"
                        style={{ width: `${Math.min(100, (currentVal / b.thresholdValue) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =============================================================== */}
      {/* BADGE STUDIO MODAL */}
      {/* =============================================================== */}
      {badgeStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg academic-card p-6 rounded-[18px] border-2 border-[#8A1627] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4D9C0] dark:border-[#3D2D31]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#D9A441]" />
                <h3 className="font-serif font-bold text-base">Badge Studio Uploader</h3>
              </div>
              <button
                onClick={() => setBadgeStudioOpen(false)}
                className="text-xs text-[#4B5160] hover:text-[#8A1627]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleMintCustomBadge} className="space-y-4 mt-4 text-xs">
              {/* Artwork Uploader with Canvas Square Crop */}
              <div>
                <label className="font-semibold block mb-1.5">Custom Artwork (PNG, SVG, WebP)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#CFC8BB] dark:border-[#4B3639] hover:border-[#8A1627] rounded-[12px] p-4 text-center cursor-pointer bg-white/40 dark:bg-black/10"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBadgeImageSelect}
                    className="hidden"
                  />
                  {badgeImageBase64 ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={badgeImageBase64}
                        alt="Badge Preview"
                        className="h-14 w-14 rounded-full border-2 border-[#D9A441] object-cover"
                      />
                      <span className="text-[11px] text-[#5E7B5B] font-semibold">
                        Square Crop Processed! Click to change
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-6 w-6 mx-auto text-[#8A1627]" />
                      <div className="font-semibold text-[11px]">Click to upload badge artwork</div>
                      <div className="text-[10px] text-[#4B5160]">Auto-centered & cropped to 120x120</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="font-semibold block mb-1">Badge Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graph Theory Architect"
                  value={badgeTitle}
                  onChange={(e) => setBadgeTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-[8px] border border-[#CFC8BB] dark:border-[#4B3639] bg-white dark:bg-black text-xs focus:border-[#8A1627] focus:outline-none"
                />
              </div>

              {/* Lore / Description */}
              <div>
                <label className="font-semibold block mb-1">Lore / Unlock Lore</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Awarded for mastering 5 recursive or graph algorithms with full marks."
                  value={badgeLore}
                  onChange={(e) => setBadgeLore(e.target.value)}
                  className="w-full p-2.5 rounded-[8px] border border-[#CFC8BB] dark:border-[#4B3639] bg-white dark:bg-black text-xs focus:border-[#8A1627] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Unlock Rule Dropdown */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Unlock Rule</label>
                  <select
                    value={badgeCriteria}
                    onChange={(e) => setBadgeCriteria(e.target.value as BadgeCriteriaType)}
                    className="w-full h-9 px-2.5 rounded-[8px] border border-[#CFC8BB] dark:border-[#4B3639] bg-white dark:bg-black text-xs focus:border-[#8A1627] focus:outline-none"
                  >
                    <option value="TOPICS_MASTERED">Topics Mastered</option>
                    <option value="STREAK_DAYS">Study Streak Days</option>
                    <option value="WATCH_HOURS">Lecture Watch Hours</option>
                    <option value="PERFECT_EXERCISES">Perfect Khan Exercise</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Target Threshold</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={badgeThreshold}
                    onChange={(e) => setBadgeThreshold(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-[8px] border border-[#CFC8BB] dark:border-[#4B3639] bg-white dark:bg-black text-xs focus:border-[#8A1627] focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBadgeStudioOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={mintingBadge || !badgeImageBase64}
                  className="btn-primary text-xs px-5"
                >
                  {mintingBadge ? "Minting Badge..." : "Mint Badge to Catalog"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
