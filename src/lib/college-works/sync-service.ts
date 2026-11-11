import { auth, db, isFirebaseConfigured } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocsFromServer,
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
const getDeletedStorageKey = (uid?: string) =>
  uid ? `valeria_college_works_deleted_${uid}` : "valeria_college_works_deleted_guest";
const getPendingStorageKey = (uid?: string) =>
  uid ? `valeria_college_works_pending_${uid}` : "valeria_college_works_pending_guest";
const getCloudInitStorageKey = (uid: string) => `valeria_college_works_cloud_init_${uid}`;

const CLOUD_ACK_TIMEOUT_MS = 8000;

export type SyncErrorKind =
  | "permission-denied"
  | "unauthenticated"
  | "offline"
  | "failed-precondition"
  | "quota"
  | "unconfigured"
  | "unknown";

export interface SyncErrorInfo {
  code: string;
  kind: SyncErrorKind;
  title: string;
  message: string;
  actionHint: string;
}

export interface CloudMutationResult {
  works: CollegeWorkItem[];
  synced: boolean;
  error?: SyncErrorInfo;
}

export interface MergeWorksOptions {
  deletedIds?: Record<string, string>;
  pendingUploadIds?: Set<string>;
  treatLocalOnlyAsNew?: boolean;
}

/**
 * Maps Firebase/Firestore errors into accurate user-facing diagnostics
 * instead of masking permission or configuration issues as network offline.
 */
export function classifyFirestoreError(err: unknown): SyncErrorInfo {
  const rawCode =
    typeof (err as any)?.code === "string" ? String((err as any).code) : "";
  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : "Unknown synchronization error.";
  const normalized = `${rawCode} ${rawMessage}`.toLowerCase();

  if (rawCode === "permission-denied" || normalized.includes("missing or insufficient permissions")) {
    return {
      code: rawCode || "permission-denied",
      kind: "permission-denied",
      title: "Cloud Rules Blocked Sync",
      message:
        "Firestore rejected access (permission-denied). Your Firebase project rules must allow authenticated reads/writes to users/{uid}/collegeWorks.",
      actionHint:
        "Publish firestore.rules in Firebase Console -> Firestore Database -> Rules (or run firebase deploy --only firestore:rules).",
    };
  }

  if (
    rawCode === "unauthenticated" ||
    normalized.includes("unauthenticated") ||
    normalized.includes("auth token")
  ) {
    return {
      code: rawCode || "unauthenticated",
      kind: "unauthenticated",
      title: "Google Session Expired",
      message: "Your Google sign-in token needs refreshing before syncing with Cloud Firestore.",
      actionHint: "Sign out and sign back in with your Gmail account, then click Sync Now.",
    };
  }

  if (
    rawCode === "unavailable" ||
    rawCode === "deadline-exceeded" ||
    normalized.includes("client is offline") ||
    normalized.includes("network") ||
    normalized.includes("timed out") ||
    normalized.includes("fetch")
  ) {
    return {
      code: rawCode || "unavailable",
      kind: "offline",
      title: "Cloud Connection Unavailable",
      message:
        "Saved locally on this device, but could not reach Cloud Firestore servers yet.",
      actionHint: "Check your internet/VPN connection and click Sync Now.",
    };
  }

  if (rawCode === "failed-precondition") {
    return {
      code: rawCode,
      kind: "failed-precondition",
      title: "Browser Cache Conflict",
      message: rawMessage,
      actionHint: "Reload this page or close duplicate tabs and click Sync Now.",
    };
  }

  if (rawCode === "resource-exhausted") {
    return {
      code: rawCode,
      kind: "quota",
      title: "Firestore Quota Reached",
      message: rawMessage,
      actionHint: "Wait a short moment and click Sync Now again.",
    };
  }

  if (rawCode === "app/no-app" || normalized.includes("not configured") || normalized.includes("not initialized")) {
    return {
      code: rawCode || "unconfigured",
      kind: "unconfigured",
      title: "Firebase Not Configured",
      message: rawMessage,
      actionHint: "Verify NEXT_PUBLIC_FIREBASE_* environment variables and reload.",
    };
  }

  return {
    code: rawCode || "unknown",
    kind: "unknown",
    title: "Sync Error",
    message: rawCode ? `${rawCode}: ${rawMessage}` : rawMessage,
    actionHint: "Retry Sync Now or check browser console logs.",
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out (${timeoutMs}ms): client is offline or blocked.`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function getDeletedWorksMap(userId?: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getDeletedStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveDeletedWorksMap(map: Record<string, string>, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getDeletedStorageKey(userId), JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

function markWorkDeletedLocally(workId: string, deletedAt: string, userId?: string): void {
  const map = getDeletedWorksMap(userId);
  map[workId] = deletedAt;
  saveDeletedWorksMap(map, userId);
}

function clearWorkDeletedLocally(workId: string, userId?: string): void {
  const map = getDeletedWorksMap(userId);
  if (workId in map) {
    delete map[workId];
    saveDeletedWorksMap(map, userId);
  }
}

function getPendingUploadIds(userId?: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(getPendingStorageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((x) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function savePendingUploadIds(ids: Set<string>, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getPendingStorageKey(userId), JSON.stringify(Array.from(ids)));
  } catch {
    // ignore storage quota errors
  }
}

function markWorkPendingUpload(workId: string, userId?: string): void {
  const ids = getPendingUploadIds(userId);
  ids.add(workId);
  savePendingUploadIds(ids, userId);
}

function clearPendingUploadIds(workIds: string[], userId?: string): void {
  if (workIds.length === 0) return;
  const ids = getPendingUploadIds(userId);
  let changed = false;
  for (const id of workIds) {
    if (ids.delete(id)) changed = true;
  }
  if (changed) savePendingUploadIds(ids, userId);
}

function hasCompletedInitialCloudSync(userId: string): boolean {
  if (typeof window === "undefined" || !userId) return false;
  try {
    return localStorage.getItem(getCloudInitStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

function markInitialCloudSyncDone(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(getCloudInitStorageKey(userId), "1");
  } catch {
    // ignore
  }
}

async function ensureAuthTokenReady(userId: string): Promise<void> {
  if (auth?.currentUser && auth.currentUser.uid === userId) {
    await auth.currentUser.getIdToken();
  }
}

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
 * Reads local storage works synchronously for fast startup.
 * Distinguishes empty arrays ("[]") from uninitialized devices so a fresh
 * signed-in second device does not re-seed deleted sample works into the cloud.
 */
export function getLocalCollegeWorks(userId?: string): CollegeWorkItem[] {
  if (typeof window === "undefined") return SEED_COLLEGE_WORKS;

  try {
    // 1. Try user-specific local key
    if (userId) {
      const userSaved = localStorage.getItem(getUserStorageKey(userId));
      if (userSaved !== null) {
        const parsed = JSON.parse(userSaved);
        if (Array.isArray(parsed)) return parsed;
      }

      // Migrate pre-login generic local edits only if this user hasn't synced on this device yet
      if (!hasCompletedInitialCloudSync(userId)) {
        const genericSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (genericSaved !== null) {
          const parsed = JSON.parse(genericSaved);
          if (Array.isArray(parsed)) return parsed;
        }
      }

      // Signed-in fresh device waits for cloud snapshot instead of injecting seed works
      return [];
    }

    // 2. Guest mode: return saved works (even if intentionally empty [])
    const genericSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (genericSaved !== null) {
      const parsed = JSON.parse(genericSaved);
      if (Array.isArray(parsed)) return parsed;
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
    if (userId) {
      localStorage.setItem(getUserStorageKey(userId), serialized);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
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
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase Firestore is not configured in this browser.");
  }
  if (!userId || works.length === 0) return;

  await ensureAuthTokenReady(userId);

  const CHUNK_SIZE = 400;
  for (let i = 0; i < works.length; i += CHUNK_SIZE) {
    const chunk = works.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const work of chunk) {
      const clean = sanitizeWorkForFirestore(work, userId);
      const docRef = doc(db, "users", userId, "collegeWorks", work.id);
      batch.set(docRef, clean, { merge: true });
    }
    await withTimeout(batch.commit(), CLOUD_ACK_TIMEOUT_MS, "Firestore upload");
  }

  clearPendingUploadIds(
    works.map((w) => w.id),
    userId
  );
  markInitialCloudSyncDone(userId);
}

/**
 * Deletes an array of deleted work IDs from Cloud Firestore and clears their tombstones.
 */
async function deleteWorksFromCloud(userId: string, workIds: string[]): Promise<void> {
  if (!db || !userId || workIds.length === 0) return;

  await ensureAuthTokenReady(userId);

  const CHUNK_SIZE = 400;
  for (let i = 0; i < workIds.length; i += CHUNK_SIZE) {
    const chunk = workIds.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, "users", userId, "collegeWorks", id));
    }
    await withTimeout(batch.commit(), CLOUD_ACK_TIMEOUT_MS, "Firestore delete");
  }

  const deletedMap = getDeletedWorksMap(userId);
  for (const id of workIds) {
    delete deletedMap[id];
  }
  saveDeletedWorksMap(deletedMap, userId);
}

/**
 * Saves a single work item to Firestore and local storage.
 * Reports honest cloud sync status instead of silently ignoring failures.
 */
export async function saveCollegeWorkToCloud(
  userId: string | null | undefined,
  work: CollegeWorkItem,
  currentWorks: CollegeWorkItem[]
): Promise<CloudMutationResult> {
  const existingIdx = currentWorks.findIndex((w) => w.id === work.id);
  const now = work.lastUpdatedAt || new Date().toISOString();
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

  // 1. Save locally first (optimistic UI & offline resilience)
  clearWorkDeletedLocally(work.id, userId || undefined);
  markWorkPendingUpload(work.id, userId || undefined);
  saveLocalCollegeWorks(updatedList, userId || undefined);

  // 2. If guest mode, local save completes the operation
  if (!userId) {
    return { works: updatedList, synced: false };
  }

  if (!db || !isFirebaseConfigured) {
    return {
      works: updatedList,
      synced: false,
      error: classifyFirestoreError(new Error("Firebase Firestore is not configured.")),
    };
  }

  // 3. Persist to Cloud Firestore
  try {
    await ensureAuthTokenReady(userId);
    const clean = sanitizeWorkForFirestore(workWithTimestamp, userId);
    const docRef = doc(db, "users", userId, "collegeWorks", work.id);
    await withTimeout(setDoc(docRef, clean, { merge: true }), CLOUD_ACK_TIMEOUT_MS, "Firestore save");
    clearPendingUploadIds([work.id], userId);
    markInitialCloudSyncDone(userId);
    return { works: updatedList, synced: true };
  } catch (err) {
    console.error(`Error saving work ${work.id} to Firestore:`, err);
    return {
      works: updatedList,
      synced: false,
      error: classifyFirestoreError(err),
    };
  }
}

/**
 * Deletes a work item by ID from Firestore and local storage.
 * Records a deletion tombstone so offline/multi-device merges do not resurrect it.
 */
export async function deleteCollegeWorkFromCloud(
  userId: string | null | undefined,
  workId: string,
  currentWorks: CollegeWorkItem[]
): Promise<CloudMutationResult> {
  const filtered = currentWorks.filter((w) => w.id !== workId);
  const now = new Date().toISOString();

  // 1. Remove locally and record tombstone
  markWorkDeletedLocally(workId, now, userId || undefined);
  clearPendingUploadIds([workId], userId || undefined);
  saveLocalCollegeWorks(filtered, userId || undefined);

  // 2. Guest mode
  if (!userId) {
    return { works: filtered, synced: false };
  }

  if (!db || !isFirebaseConfigured) {
    return {
      works: filtered,
      synced: false,
      error: classifyFirestoreError(new Error("Firebase Firestore is not configured.")),
    };
  }

  // 3. Remove from Firestore
  try {
    await ensureAuthTokenReady(userId);
    const docRef = doc(db, "users", userId, "collegeWorks", workId);
    await withTimeout(deleteDoc(docRef), CLOUD_ACK_TIMEOUT_MS, "Firestore delete");
    return { works: filtered, synced: true };
  } catch (err) {
    console.error(`Error deleting work ${workId} from Firestore:`, err);
    return {
      works: filtered,
      synced: false,
      error: classifyFirestoreError(err),
    };
  }
}

/**
 * Merges cloud and local arrays of works, picking the newest version by lastUpdatedAt
 * while respecting pending offline uploads and deletion tombstones.
 */
export function mergeWorksLists(
  cloudWorks: CollegeWorkItem[],
  localWorks: CollegeWorkItem[],
  options: MergeWorksOptions = {}
): {
  merged: CollegeWorkItem[];
  hasNewLocalItems: boolean;
  deletedIdsToRemoveFromCloud: string[];
} {
  const {
    deletedIds = {},
    pendingUploadIds,
    treatLocalOnlyAsNew = true,
  } = options;

  const map = new Map<string, CollegeWorkItem>();
  const deletedCloudIds = new Set<string>();
  const deletedIdsToRemoveFromCloud: string[] = [];
  let hasNewLocalItems = false;

  // Insert non-deleted cloud items first
  for (const item of cloudWorks) {
    const deletedAt = deletedIds[item.id];
    if (deletedAt) {
      const deletedTime = new Date(deletedAt).getTime();
      const cloudTime = new Date(item.lastUpdatedAt || 0).getTime();
      if (deletedTime >= cloudTime) {
        deletedCloudIds.add(item.id);
        deletedIdsToRemoveFromCloud.push(item.id);
        continue;
      }
    }
    map.set(item.id, item);
  }

  // Merge local items
  for (const localItem of localWorks) {
    if (deletedCloudIds.has(localItem.id)) continue;

    const deletedAt = deletedIds[localItem.id];
    if (deletedAt) {
      const deletedTime = new Date(deletedAt).getTime();
      const localTime = new Date(localItem.lastUpdatedAt || 0).getTime();
      if (deletedTime >= localTime) continue;
    }

    const cloudItem = map.get(localItem.id);
    if (!cloudItem) {
      const shouldUploadLocalOnly =
        treatLocalOnlyAsNew || Boolean(pendingUploadIds?.has(localItem.id));
      if (shouldUploadLocalOnly) {
        map.set(localItem.id, localItem);
        hasNewLocalItems = true;
      }
    } else {
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
    deletedIdsToRemoveFromCloud,
  };
}

function pruneConfirmedDeletes(
  userId: string,
  cloudIds: Set<string>,
  deletedMap: Record<string, string>
): void {
  const remaining: Record<string, string> = {};
  for (const [id, ts] of Object.entries(deletedMap)) {
    // Keep tombstone only if cloud still contains an undeleted copy
    if (cloudIds.has(id)) {
      remaining[id] = ts;
    }
  }
  if (Object.keys(remaining).length !== Object.keys(deletedMap).length) {
    saveDeletedWorksMap(remaining, userId);
  }
}

function getItemsNeedingUpload(
  cloudWorks: CollegeWorkItem[],
  merged: CollegeWorkItem[]
): CollegeWorkItem[] {
  const cloudById = new Map(cloudWorks.map((w) => [w.id, w]));
  return merged.filter((item) => {
    const cloudItem = cloudById.get(item.id);
    if (!cloudItem) return true;
    const cloudTime = new Date(cloudItem.lastUpdatedAt || 0).getTime();
    const localTime = new Date(item.lastUpdatedAt || 0).getTime();
    return localTime > cloudTime;
  });
}

/**
 * Real-time listener for Firestore collection: users/{userId}/collegeWorks.
 * Uses includeMetadataChanges so the UI knows whether snapshots came from
 * IndexedDB cache or live Cloud Firestore servers, and never overwrites cloud
 * with fallback seed works during offline/cache-only states.
 */
export function subscribeCollegeWorks(
  userId: string,
  onUpdate: (works: CollegeWorkItem[], source: "cache" | "server") => void,
  onError?: (err: unknown, info: SyncErrorInfo) => void
): Unsubscribe {
  if (!userId) return () => {};

  if (!db || !isFirebaseConfigured) {
    const err = new Error("Firebase Firestore is not configured in this browser.");
    onError?.(err, classifyFirestoreError(err));
    return () => {};
  }

  const colRef = collection(db, "users", userId, "collegeWorks");

  return onSnapshot(
    colRef,
    { includeMetadataChanges: true },
    async (snapshot) => {
      const source: "cache" | "server" = snapshot.metadata.fromCache ? "cache" : "server";
      const cloudWorks: CollegeWorkItem[] = [];
      snapshot.forEach((docSnap) => {
        cloudWorks.push(docSnap.data() as CollegeWorkItem);
      });

      const localWorks = getLocalCollegeWorks(userId);
      const deletedIds = getDeletedWorksMap(userId);
      const pendingUploadIds = getPendingUploadIds(userId);
      const alreadySyncedOnce = hasCompletedInitialCloudSync(userId);

      const { merged, hasNewLocalItems, deletedIdsToRemoveFromCloud } = mergeWorksLists(
        cloudWorks,
        localWorks,
        {
          deletedIds,
          pendingUploadIds,
          treatLocalOnlyAsNew: !alreadySyncedOnce,
        }
      );

      // While reading only from local cache, update UI cleanly without pushing seed/cache guesses to server
      if (source === "cache") {
        if (merged.length > 0 || localWorks.length > 0) {
          saveLocalCollegeWorks(merged, userId);
        }
        onUpdate(merged, "cache");
        return;
      }

      // Authoritative server snapshot received
      try {
        if (deletedIdsToRemoveFromCloud.length > 0) {
          await deleteWorksFromCloud(userId, deletedIdsToRemoveFromCloud);
        }

        if (hasNewLocalItems) {
          const itemsToUpload = getItemsNeedingUpload(cloudWorks, merged);
          if (itemsToUpload.length > 0) {
            await uploadWorksToCloud(userId, itemsToUpload);
          }
        }

        const cloudIdSet = new Set(cloudWorks.map((w) => w.id));
        pruneConfirmedDeletes(userId, cloudIdSet, getDeletedWorksMap(userId));
        markInitialCloudSyncDone(userId);
        saveLocalCollegeWorks(merged, userId);
        onUpdate(merged, "server");
      } catch (err) {
        console.warn("Server snapshot reconciliation failed:", err);
        saveLocalCollegeWorks(merged, userId);
        onError?.(err, classifyFirestoreError(err));
      }
    },
    (err) => {
      console.warn("Firestore collegeWorks snapshot listener error:", err);
      onError?.(err, classifyFirestoreError(err));
    }
  );
}

/**
 * Forces a direct server fetch and bi-directional reconciliation for manual sync
 * and startup server verification across devices.
 */
export async function syncAndMergeWorks(
  userId: string,
  currentLocal: CollegeWorkItem[]
): Promise<CollegeWorkItem[]> {
  if (!userId) {
    throw new Error("Sign in with Google before syncing to cloud.");
  }
  if (!db || !isFirebaseConfigured) {
    throw new Error("Firebase Firestore is not configured in this browser.");
  }

  try {
    await ensureAuthTokenReady(userId);
    const colRef = collection(db, "users", userId, "collegeWorks");
    const snapshot = await withTimeout(
      getDocsFromServer(colRef),
      CLOUD_ACK_TIMEOUT_MS,
      "Cloud Firestore sync"
    );

    const cloudWorks: CollegeWorkItem[] = [];
    snapshot.forEach((d) => cloudWorks.push(d.data() as CollegeWorkItem));

    const deletedIds = getDeletedWorksMap(userId);
    const pendingUploadIds = getPendingUploadIds(userId);
    const alreadySyncedOnce = hasCompletedInitialCloudSync(userId);

    const { merged, hasNewLocalItems, deletedIdsToRemoveFromCloud } = mergeWorksLists(
      cloudWorks,
      currentLocal,
      {
        deletedIds,
        pendingUploadIds,
        treatLocalOnlyAsNew: !alreadySyncedOnce,
      }
    );

    if (deletedIdsToRemoveFromCloud.length > 0) {
      await deleteWorksFromCloud(userId, deletedIdsToRemoveFromCloud);
    }

    if (hasNewLocalItems || (cloudWorks.length === 0 && merged.length > 0)) {
      const itemsToUpload = getItemsNeedingUpload(cloudWorks, merged);
      if (itemsToUpload.length > 0) {
        await uploadWorksToCloud(userId, itemsToUpload);
      }
    }

    const cloudIdSet = new Set(cloudWorks.map((w) => w.id));
    pruneConfirmedDeletes(userId, cloudIdSet, getDeletedWorksMap(userId));
    clearPendingUploadIds(
      merged.map((w) => w.id),
      userId
    );
    markInitialCloudSyncDone(userId);
    saveLocalCollegeWorks(merged, userId);
    return merged;
  } catch (err) {
    console.error("Manual sync failed:", err);
    throw err;
  }
}
