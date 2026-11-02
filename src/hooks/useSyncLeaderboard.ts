"use client";

import { useCallback } from "react";
import { useDataStore } from "@/lib/repository";
import { LeaderboardService } from "@/lib/gamification/leaderboard-service";
import { BadgeItem } from "@/types/mastery-gamification";

export function useSyncLeaderboard() {
  const { currentUser, firebaseUser } = useDataStore();
  const uid = firebaseUser?.uid || currentUser?.uid || "student-user";

  const awardActivity = useCallback(
    async (
      action: "LECTURE_COMPLETED" | "TOPIC_MASTERED" | "RECALL_COMPLETED" | "PERFECT_EXERCISE",
      additionalPayload?: { minutes?: number; isMastered?: boolean }
    ) => {
      try {
        const { profile, unlockedBadges, xpEarned } = await LeaderboardService.recordActivity(
          uid,
          action,
          additionalPayload
        );

        // If any badges were newly unlocked, display custom visual toast notification
        if (unlockedBadges && unlockedBadges.length > 0) {
          unlockedBadges.forEach((badge) => {
            showBadgeUnlockedNotification(badge);
          });
        }

        return { profile, unlockedBadges, xpEarned };
      } catch (err) {
        console.warn("useSyncLeaderboard awardActivity notice:", err);
        return null;
      }
    },
    [uid]
  );

  return {
    awardActivity,
  };
}

function showBadgeUnlockedNotification(badge: BadgeItem) {
  if (typeof window === "undefined") return;

  const toastContainer = document.createElement("div");
  toastContainer.className =
    "fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-[#FBF6EC] dark:bg-[#221A1C] border-2 border-[#D9A441] rounded-[16px] p-4 shadow-2xl animate-in slide-in-from-bottom duration-300 max-w-sm";

  toastContainer.innerHTML = `
    <div class="h-12 w-12 rounded-full overflow-hidden shrink-0 border border-[#D9A441]/50 bg-white dark:bg-black p-1 shadow-sm">
      <img src="${badge.imageUrl}" alt="${badge.title}" class="h-full w-full object-cover rounded-full" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="text-[10px] font-bold uppercase tracking-wider text-[#D9A441]">Badge Unlocked!</div>
      <div class="font-serif font-bold text-sm text-[#14161F] dark:text-[#F6EBD3] truncate">${badge.title}</div>
      <div class="text-xs text-[#4B5160] dark:text-[#CFC8BB] line-clamp-1">${badge.description}</div>
    </div>
  `;

  document.body.appendChild(toastContainer);

  setTimeout(() => {
    toastContainer.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => {
      toastContainer.remove();
    }, 500);
  }, 5000);
}
