import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { CollegeWorkItem } from "@/types/college-works";
import { SEED_COLLEGE_WORKS } from "./seed-data";

export const LOCAL_STORAGE_KEY = "valeria_college_works";
export const getUserStorageKey = (uid: string) => `valeria_college_works_${uid}`;

/**
 * Strips all undefined fields to prevent Firestore serialization errors:
 * "Unsupported field value: undefined"
 */
export function sanitizeWorkForFirestore(
  work: CollegeWorkItem,
  userId?: string
): Record<string, any> {
  const clean: Record<string, any> = {
    id: work.id,
    courseCode: work.courseCode || "MA101BS",
    courseTitle: work.courseTitle || "",
    type: work.type || "assignment",
    title: work.title || "",
    unitOrExp: work.unitOrExp || "",
    dueDate: work.dueDate || "",
    status: work.status || "pending",
    lastUpdatedAt: work.lastUpdatedAt || new Date().toISOString(),
  };

  if (userId) clean.userId = userId;
  else if (work.userId) clean.userId = work.userId;

  if (work.gradeOrMarks !== undefined && work.gradeOrMarks !== null && work.gradeOrMarks !== "") {
    clean.gradeOrMarks = work.gradeOrMarks;
  }
  if (work.notes !== undefined && work.notes !== null && work.notes !== "") {
    clean.notes = work.notes;
  }
  if (work.submissionUrl !== undefined && work.submissionUrl !== null && work.submissionUrl !== "") {
    clean.submissionUrl = work.submissionUrl;
  }
  if (work.attachmentName !== undefined && work.attachmentName !== null && work.attachmentName !== "") {
    clean.attachmentName = work.attachmentName;
  }
  if (work.submittedAt !== undefined && work.submittedAt !== null && work.submittedAt !== "") {
    clean.submittedAt = work.submittedAt;
  }

  return clean;
}

/**
 * Reads local storage works synchronously for fast startup
 */
export function getLocalCollegeWorks(userId?: string): CollegeWorkItem[] {
  if (typeof window === "undefined") return SEED_COLLEGE_WORKS;

  try {
    // 1. Try user-specific local key
    if (userId) {
      const userSaved = localStorage.getItem(getUserStorageKey(userId));
      if (userSaved) {
        const parsed = JSON.parse(userSaved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }

    // 2. Fall back to generic local key
    const genericSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (genericSaved) {
      const parsed = JSON.parse(genericSaved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Failed to read local college works:", err);
  }

  return SEED_COLLEGE_WORKS;
}

/**
 * Writes college works to local storage for instant offline access
 */
export function saveLocalCollegeWorks(works: CollegeWorkItem[], userId?: string): void {
  if (typeof window === "undefined") return;

  try {
    const serialized = JSON.stringify(works);
    localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
    if (userId) {
      localStorage.setItem(getUserStorageKey(userId), serialized);
    }
  } catch (err) {
    console.warn("Failed to save local college works:", err);
  }
}

/**
 * Uploads an array of works to Cloud Firestore under users/{userId}/collegeWorks
 */
export async function uploadWorksToCloud(
  userId: string,
  works: CollegeWorkItem[]
): Promise<void> {
  if (!db || !userId || works.length === 0) return;

  try {
    const batch = writeBatch(db);
    for (const work of works) {
      const clean = sanitizeWorkForFirestore(work, userId);
      const docRef = doc(db, "users", userId, "collegeWorks", work.id);
      batch.set(docRef, clean, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.error("Failed to upload works to Cloud Firestore:", err);
    throw err;
  }
}

/**
 * Saves a single work item to Firestore and local storage.
 * Synchronizes immediately across devices.
 */
export async function saveCollegeWorkToCloud(
  userId: string | null | undefined,
  work: CollegeWorkItem,
  currentWorks: CollegeWorkItem[]
): Promise<CollegeWorkItem[]> {
  const existingIdx = currentWorks.findIndex((w) => w.id === work.id);
  const now = new Date().toISOString();
  const workWithTimestamp: CollegeWorkItem = {
    ...work,
    lastUpdatedAt: now,
    userId: userId || work.userId,
  };

  let updatedList: CollegeWorkItem[];
  if (existingIdx >= 0) {
    updatedList = [...currentWorks];
    updatedList[existingIdx] = workWithTimestamp;
  } else {
    updatedList = [workWithTimestamp, ...currentWorks];
  }

  // 1. Save locally first (optimistic UI)
  saveLocalCollegeWorks(updatedList, userId || undefined);

  // 2. Save to Cloud Firestore
  if (db && userId) {
    try {
      const clean = sanitizeWorkForFirestore(workWithTimestamp, userId);
      const docRef = doc(db, "users", userId, "collegeWorks", work.id);
      await setDoc(docRef, clean, { merge: true });
    } catch (err) {
      console.error(`Error saving work ${work.id} to Firestore:`, err);
    }
  }

  return updatedList;
}

/**
 * Deletes a work item by ID from Firestore and local storage.
 */
export async function deleteCollegeWorkFromCloud(
  userId: string | null | undefined,
  workId: string,
  currentWorks: CollegeWorkItem[]
): Promise<CollegeWorkItem[]> {
  const filtered = currentWorks.filter((w) => w.id !== workId);

  // 1. Remove locally
  saveLocalCollegeWorks(filtered, userId || undefined);

  // 2. Remove from Firestore
  if (db && userId) {
    try {
      const docRef = doc(db, "users", userId, "collegeWorks", workId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(`Error deleting work ${workId} from Firestore:`, err);
    }
  }

  return filtered;
}

/**
 * Merges two arrays of works, picking the newest version of each item by lastUpdatedAt.
 */
export function mergeWorksLists(
  cloudWorks: CollegeWorkItem[],
  localWorks: CollegeWorkItem[]
): { merged: CollegeWorkItem[]; hasNewLocalItems: boolean } {
  const map = new Map<string, CollegeWorkItem>();
  let hasNewLocalItems = false;

  // Insert cloud items first
  for (const item of cloudWorks) {
    map.set(item.id, item);
  }

  // Merge local items
  for (const localItem of localWorks) {
    const cloudItem = map.get(localItem.id);
    if (!cloudItem) {
      // Local has an item not yet in the cloud!
      map.set(localItem.id, localItem);
      hasNewLocalItems = true;
    } else {
      // Both exist: pick newest by lastUpdatedAt
      const cloudTime = new Date(cloudItem.lastUpdatedAt || 0).getTime();
      const localTime = new Date(localItem.lastUpdatedAt || 0).getTime();
      if (localTime > cloudTime) {
        map.set(localItem.id, localItem);
        hasNewLocalItems = true;
      }
    }
  }

  return {
    merged: Array.from(map.values()),
    hasNewLocalItems,
  };
}

/**
 * Real-time listener for Firestore collection: users/{userId}/collegeWorks.
 * Instantly synchronizes changes across all devices logged into the user's Google account.
 */
export function subscribeCollegeWorks(
  userId: string,
  onUpdate: (works: CollegeWorkItem[], source: "cache" | "server") => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db || !userId) {
    return () => {};
  }

  const colRef = collection(db, "users", userId, "collegeWorks");

  return onSnapshot(
    colRef,
    async (snapshot) => {
      const source = snapshot.metadata.fromCache ? "cache" : "server";

      if (snapshot.empty) {
        // First time user is logging in on a device where cloud is empty:
        // Migrate whatever works are stored locally on this machine to the cloud!
        const localWorks = getLocalCollegeWorks(userId);
        if (localWorks.length > 0) {
          try {
            await uploadWorksToCloud(userId, localWorks);
            onUpdate(localWorks, source);
          } catch (e) {
            console.warn("Could not seed initial works to cloud:", e);
            onUpdate(localWorks, source);
          }
        } else {
          onUpdate([], source);
        }
        return;
      }

      // Cloud has documents
      const cloudWorks: CollegeWorkItem[] = [];
      snapshot.forEach((docSnap) => {
        cloudWorks.push(docSnap.data() as CollegeWorkItem);
      });

      // Merge with any offline/local additions that haven't synced yet
      const localWorks = getLocalCollegeWorks(userId);
      const { merged, hasNewLocalItems } = mergeWorksLists(cloudWorks, localWorks);

      // If local has items not in cloud, push them to cloud in background
      if (hasNewLocalItems) {
        uploadWorksToCloud(userId, merged).catch((err) =>
          console.warn("Background upload of new local works failed:", err)
        );
      }

      // Save to local storage for offline resiliency
      saveLocalCollegeWorks(merged, userId);

      // Notify caller
      onUpdate(merged, source);
    },
    (err) => {
      console.warn("Firestore collegeWorks snapshot listener error:", err);
      onError?.(err);
    }
  );
}

/**
 * Manual one-click sync & merge function.
 */
export async function syncAndMergeWorks(
  userId: string,
  currentLocal: CollegeWorkItem[]
): Promise<CollegeWorkItem[]> {
  if (!db || !userId) return currentLocal;

  try {
    const colRef = collection(db, "users", userId, "collegeWorks");
    const snapshot = await getDocs(colRef);

    const cloudWorks: CollegeWorkItem[] = [];
    snapshot.forEach((d) => cloudWorks.push(d.data() as CollegeWorkItem));

    const { merged, hasNewLocalItems } = mergeWorksLists(cloudWorks, currentLocal);

    if (hasNewLocalItems || cloudWorks.length === 0) {
      await uploadWorksToCloud(userId, merged);
    }

    saveLocalCollegeWorks(merged, userId);
    return merged;
  } catch (err) {
    console.error("Manual sync failed:", err);
    throw err;
  }
}
