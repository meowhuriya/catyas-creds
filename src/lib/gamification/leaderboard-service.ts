import { db, auth } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  BadgeItem,
  LeaderboardProfile,
  BadgeCriteriaType,
} from "@/types/mastery-gamification";

const DEFAULT_SYSTEM_BADGES: BadgeItem[] = [
  {
    id: "badge-first-mastery",
    title: "Genesis Spark",
    description: "Achieved >= 70 pts mastery on your first engineering topic.",
    imageUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%238A1627'/><polygon points='50,15 61,38 85,41 68,58 72,82 50,70 28,82 32,58 15,41 39,38' fill='%23D9A441'/></svg>",
    criteriaType: "TOPICS_MASTERED",
    thresholdValue: 1,
    createdByUid: "system",
    createdAt: "2025-08-01T00:00:00.000Z",
    isCustom: false,
  },
  {
    id: "badge-pps-ace",
    title: "C Algorithmist",
    description: "Mastered 5 topics in Programming for Problem Solving.",
    imageUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='90' height='90' x='5' y='5' rx='20' fill='%231E2A38'/><text x='50' y='62' font-family='monospace' font-size='38' font-weight='bold' fill='%235E7B5B' text-anchor='middle'>&lt;/&gt;</text></svg>",
    criteriaType: "TOPICS_MASTERED",
    thresholdValue: 5,
    createdByUid: "system",
    createdAt: "2025-08-01T00:00:00.000Z",
    isCustom: false,
  },
  {
    id: "badge-calculus-king",
    title: "Calculus Titan",
    description: "Mastered 10 topics in Matrices and Calculus.",
    imageUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%234B2E39'/><text x='50' y='65' font-family='serif' font-size='48' font-style='italic' fill='%23F6EBD3' text-anchor='middle'>∫dx</text></svg>",
    criteriaType: "TOPICS_MASTERED",
    thresholdValue: 10,
    createdByUid: "system",
    createdAt: "2025-08-01T00:00:00.000Z",
    isCustom: false,
  },
  {
    id: "badge-streak-7",
    title: "Week of Fire",
    description: "Maintained a continuous 7-day academic study streak.",
    imageUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23A51C30'/><path d='M50,15 Q65,45 80,55 Q80,85 50,85 Q20,85 20,55 Q35,45 50,15 Z' fill='%23D9A441'/></svg>",
    criteriaType: "STREAK_DAYS",
    thresholdValue: 7,
    createdByUid: "system",
    createdAt: "2025-08-01T00:00:00.000Z",
    isCustom: false,
  },
  {
    id: "badge-perfect-khan",
    title: "Khan Perfectionist",
    description: "Achieved full 60/60 points on a Khan Note & Exercise audit.",
    imageUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%235E7B5B'/><circle cx='50' cy='50' r='35' fill='none' stroke='%23FBF6EC' stroke-width='4'/><path d='M35,50 L45,62 L65,38' fill='none' stroke='%23FBF6EC' stroke-width='8' stroke-linecap='round'/></svg>",
    criteriaType: "PERFECT_EXERCISES",
    thresholdValue: 1,
    createdByUid: "system",
    createdAt: "2025-08-01T00:00:00.000Z",
    isCustom: false,
  },
];

const LOCAL_STORAGE_PROFILES_KEY = "valeria_leaderboard_profiles";
const LOCAL_STORAGE_BADGES_KEY = "valeria_badges_catalog";

const inMemoryProfiles = new Map<string, LeaderboardProfile>();
let inMemoryBadges: BadgeItem[] = [...DEFAULT_SYSTEM_BADGES];

export class LeaderboardService {
  // 1. Fetch Badges Catalog
  static async getBadgesCatalog(): Promise<BadgeItem[]> {
    if (db) {
      try {
        const snap = await getDocs(collection(db, "badges_catalog"));
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as BadgeItem);
          const existingIds = new Set(list.map((b) => b.id));
          const merged = [...list];
          for (const sb of DEFAULT_SYSTEM_BADGES) {
            if (!existingIds.has(sb.id)) {
              merged.push(sb);
            }
          }
          return merged;
        }
      } catch (err) {
        console.warn("getBadgesCatalog notice:", err);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_BADGES_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as BadgeItem[];
          const existingIds = new Set(stored.map((b) => b.id));
          const merged = [...stored];
          for (const sb of DEFAULT_SYSTEM_BADGES) {
            if (!existingIds.has(sb.id)) {
              merged.push(sb);
            }
          }
          return merged;
        }
      } catch {}
    }

    return inMemoryBadges;
  }

  // 2. Create Custom Badge
  static async createCustomBadge(
    badgeData: Omit<BadgeItem, "id" | "createdAt" | "isCustom">
  ): Promise<BadgeItem> {
    const id = "badge-custom-" + Date.now();
    const newBadge: BadgeItem = {
      ...badgeData,
      id,
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    if (db && auth?.currentUser) {
      try {
        await setDoc(doc(db, "badges_catalog", id), newBadge);
      } catch (err) {
        console.warn("createCustomBadge Firestore notice:", err);
      }
    }

    inMemoryBadges.push(newBadge);

    if (typeof window !== "undefined") {
      try {
        const catalog = await this.getBadgesCatalog();
        catalog.push(newBadge);
        localStorage.setItem(LOCAL_STORAGE_BADGES_KEY, JSON.stringify(catalog));
      } catch {}
    }

    return newBadge;
  }

  // 3. Get User Profile
  static async getUserProfile(uid: string): Promise<LeaderboardProfile | null> {
    if (inMemoryProfiles.has(uid)) {
      return inMemoryProfiles.get(uid)!;
    }

    if (db && auth?.currentUser) {
      try {
        const snap = await getDoc(doc(db, "leaderboard_profiles", uid));
        if (snap.exists()) {
          const prof = snap.data() as LeaderboardProfile;
          inMemoryProfiles.set(uid, prof);
          return prof;
        }
      } catch (err) {
        console.warn("getUserProfile notice:", err);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY);
        if (raw) {
          const list = JSON.parse(raw) as LeaderboardProfile[];
          const found = list.find((p) => p.uid === uid);
          if (found) {
            inMemoryProfiles.set(uid, found);
            return found;
          }
        }
      } catch {}
    }

    // Construct default baseline profile
    const defaultProfile: LeaderboardProfile = {
      uid,
      displayName: auth?.currentUser?.displayName || "You",
      avatarUrl: auth?.currentUser?.photoURL || undefined,
      squadCode: "CYBER9",
      xp: 0,
      weeklyStudyMinutes: 0,
      topicsMasteredCount: 0,
      currentStreakDays: 1,
      equippedBadges: ["badge-first-mastery"],
      showOnLeaderboard: true,
      updatedAt: new Date().toISOString(),
    };
    inMemoryProfiles.set(uid, defaultProfile);
    return defaultProfile;
  }

  // 4. Get Leaderboard Profiles with Ranking
  static async getLeaderboardProfiles(squadCode?: string): Promise<LeaderboardProfile[]> {
    let profiles: LeaderboardProfile[] = [];

    if (db) {
      try {
        const q = squadCode
          ? query(
              collection(db, "leaderboard_profiles"),
              where("squadCode", "==", squadCode.toUpperCase()),
              where("showOnLeaderboard", "==", true),
              limit(50)
            )
          : query(
              collection(db, "leaderboard_profiles"),
              where("showOnLeaderboard", "==", true),
              limit(50)
            );

        const snap = await getDocs(q);
        if (!snap.empty) {
          profiles = snap.docs.map((d) => d.data() as LeaderboardProfile);
        }
      } catch (err) {
        console.warn("getLeaderboardProfiles Firestore notice:", err);
      }
    }

    // Read from localStorage if any real profiles saved
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY);
        if (raw) {
          const list = JSON.parse(raw) as LeaderboardProfile[];
          for (const item of list) {
            if (!profiles.some((p) => p.uid === item.uid)) {
              if (item.showOnLeaderboard && (!squadCode || item.squadCode === squadCode.toUpperCase())) {
                profiles.push(item);
              }
            }
          }
        }
      } catch {}
    }

    // Read from inMemoryProfiles (for tests and active session)
    for (const [uid, item] of inMemoryProfiles.entries()) {
      if (!profiles.some((p) => p.uid === uid)) {
        if (item.showOnLeaderboard && (!squadCode || item.squadCode === squadCode.toUpperCase())) {
          profiles.push(item);
        }
      }
    }

    // Include current user profile if available
    const curUid = auth?.currentUser?.uid || "demo-student";
    if (!profiles.some((p) => p.uid === curUid)) {
      const userProf = await this.getUserProfile(curUid);
      if (userProf && userProf.showOnLeaderboard) {
        if (!squadCode || userProf.squadCode === squadCode.toUpperCase()) {
          profiles.push(userProf);
        }
      }
    }

    // Sort descending by XP
    return profiles.sort((a, b) => b.xp - a.xp);
  }

  // 5. XP Awarding & Badge Unlocking Sync
  static async recordActivity(
    uid: string,
    action: "LECTURE_COMPLETED" | "TOPIC_MASTERED" | "RECALL_COMPLETED" | "PERFECT_EXERCISE",
    additionalPayload?: { minutes?: number; isMastered?: boolean }
  ): Promise<{ profile: LeaderboardProfile; unlockedBadges: BadgeItem[]; xpEarned: number }> {
    let xpGain = 0;
    if (action === "LECTURE_COMPLETED") xpGain = 40;
    if (action === "TOPIC_MASTERED") xpGain = 100;
    if (action === "RECALL_COMPLETED") xpGain = 25;
    if (action === "PERFECT_EXERCISE") xpGain = 50;

    const profile = (await this.getUserProfile(uid)) || {
      uid,
      displayName: auth?.currentUser?.displayName || "You",
      avatarUrl: auth?.currentUser?.photoURL || undefined,
      squadCode: "CYBER9",
      xp: 0,
      weeklyStudyMinutes: 0,
      topicsMasteredCount: 0,
      currentStreakDays: 1,
      equippedBadges: [],
      showOnLeaderboard: true,
      updatedAt: new Date().toISOString(),
    };

    profile.xp += xpGain;
    if (action === "TOPIC_MASTERED") {
      profile.topicsMasteredCount += 1;
    }
    if (additionalPayload?.minutes) {
      profile.weeklyStudyMinutes += additionalPayload.minutes;
    }
    profile.updatedAt = new Date().toISOString();

    // Check newly unlocked badges
    const catalog = await this.getBadgesCatalog();
    const alreadyEquippedOrUnlocked = new Set(profile.equippedBadges);
    const newlyUnlocked: BadgeItem[] = [];

    for (const b of catalog) {
      if (alreadyEquippedOrUnlocked.has(b.id)) continue;

      let eligible = false;
      if (b.criteriaType === "TOPICS_MASTERED" && profile.topicsMasteredCount >= b.thresholdValue) {
        eligible = true;
      } else if (b.criteriaType === "STREAK_DAYS" && profile.currentStreakDays >= b.thresholdValue) {
        eligible = true;
      } else if (b.criteriaType === "PERFECT_EXERCISES" && action === "PERFECT_EXERCISE") {
        eligible = true;
      }

      if (eligible) {
        newlyUnlocked.push(b);
        if (profile.equippedBadges.length < 3) {
          profile.equippedBadges.push(b.id);
        }
      }
    }

    // Save profile to in-memory cache
    inMemoryProfiles.set(uid, profile);

    // Save profile to Firestore
    if (db && auth?.currentUser) {
      try {
        await setDoc(doc(db, "leaderboard_profiles", uid), profile, { merge: true });
      } catch (err) {
        console.warn("recordActivity Firestore notice:", err);
      }
    }

    // Save to localStorage
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_PROFILES_KEY);
        let list: LeaderboardProfile[] = raw ? JSON.parse(raw) : [];
        list = list.filter((p) => p.uid !== uid);
        list.push(profile);
        localStorage.setItem(LOCAL_STORAGE_PROFILES_KEY, JSON.stringify(list));
      } catch {}
    }

    return { profile: { ...profile }, unlockedBadges: newlyUnlocked, xpEarned: xpGain };
  }

  // 6. Squad & Settings Actions
  static async updateSquad(uid: string, squadCode: string): Promise<LeaderboardProfile> {
    const prof = (await this.getUserProfile(uid))!;
    prof.squadCode = squadCode.trim().toUpperCase().slice(0, 8);
    prof.updatedAt = new Date().toISOString();

    if (db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, "leaderboard_profiles", uid), { squadCode: prof.squadCode });
      } catch {}
    }
    return prof;
  }

  static async toggleVisibility(uid: string, show: boolean): Promise<LeaderboardProfile> {
    const prof = (await this.getUserProfile(uid))!;
    prof.showOnLeaderboard = show;
    prof.updatedAt = new Date().toISOString();

    if (db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, "leaderboard_profiles", uid), { showOnLeaderboard: show });
      } catch {}
    }
    return prof;
  }

  static async toggleBadgeEquipped(uid: string, badgeId: string): Promise<LeaderboardProfile> {
    const prof = (await this.getUserProfile(uid))!;
    const exists = prof.equippedBadges.includes(badgeId);

    if (exists) {
      prof.equippedBadges = prof.equippedBadges.filter((b) => b !== badgeId);
    } else {
      if (prof.equippedBadges.length >= 3) {
        prof.equippedBadges.shift(); // Remove first to keep max 3
      }
      prof.equippedBadges.push(badgeId);
    }

    if (db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, "leaderboard_profiles", uid), {
          equippedBadges: prof.equippedBadges,
        });
      } catch {}
    }
    return prof;
  }
}
