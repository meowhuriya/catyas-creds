"use client";

/**
 * Cloud-synced localStorage.
 *
 * A handful of features (Research, Certificates/Activity feed, the lessons cache,
 * appearance/theme/sound preferences) persist in localStorage. This module mirrors
 * those specific keys to Firestore under users/{uid}/syncedStorage so they follow
 * the signed-in Google account to every device, and applies remote changes live.
 *
 * Writes keep using localStorage.setItem/removeItem as before; while a user is
 * signed in, writes to a synced key are intercepted and uploaded (debounced).
 * Values are split into chunks to stay under Firestore's 1 MiB document limit.
 */

import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
} from "firebase/firestore";

export const SYNCED_KEYS = [
  "valeria_research_projects",
  "valeria_activities_feed",
  "lessons",
  "valerias_appearance_settings_v2",
  "app_theme",
  "vc_mode",
  "vc_accent",
  "valeria_sound_enabled",
  "valeria_sound_volume",
  "vc_study_v1",
  "vc_note_topics_v1",
  "vc_exams_v1",
  "vc_focus_days_v1",
  "vc_focus_settings_v1",
  "vc_assignments_v1",
  "vc_garden_v1",
  "vc_pantry_v1",
  "vc_badges_v1",
] as const;

/**
 * User-private keys that belong strictly to one account.
 * These must NEVER bleed, cross-upload, or merge across different Gmail accounts.
 * (Note: focus keys are excluded so focus behavior is not altered).
 */
export const USER_PRIVATE_KEYS = new Set<string>([
  "valeria_research_projects",
  "valeria_activities_feed",
  "vc_assignments_v1",
  "vc_pantry_v1",
  "vc_study_v1",
  "vc_note_topics_v1",
  "vc_exams_v1",
  "vc_badges_v1",
]);

export const SYNC_OWNER_KEY = "valeria_cloud_sync_owner_uid";

export const CLOUD_SYNC_EVENT = "cloud-sync:update";

const SYNCED_SET = new Set<string>(SYNCED_KEYS);
const COLLECTION = "syncedStorage";
const CHUNK_SIZE = 700_000; // characters per chunk doc (well under 1 MiB)
const MAX_VALUE_SIZE = 9_000_000; // single batch must stay under 10 MiB
const UPLOAD_DEBOUNCE_MS = 400;

type RemoteEntry = { value: string | null; rev: string; chunks: number };

let installed = false;
let origSet: ((k: string, v: string) => void) | null = null;
let origRemove: ((k: string) => void) | null = null;
let origGet: ((k: string) => string | null) | null = null;

let activeUid: string | null = null;
let unsubscribeSnapshot: Unsubscribe | null = null;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const knownRevs = new Map<string, string>();
const chunkCounts = new Map<string, number>();

export type CloudSyncStatus = "idle" | "syncing" | "synced" | "error";
let status: CloudSyncStatus = "idle";
let lastError: string | null = null;
export function getCloudSyncStatus() {
  return { status, lastError, uid: activeUid };
}

function newRev(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function metaId(key: string) {
  return encodeURIComponent(key);
}
function chunkId(key: string, i: number) {
  return `${encodeURIComponent(key)}__chunk_${i}`;
}

function rawGet(key: string): string | null {
  try {
    return origGet ? origGet(key) : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function applyLocal(key: string, value: string | null) {
  try {
    if (value === null) {
      if (origRemove) origRemove(key);
      else if (typeof window !== "undefined" && window.localStorage) window.localStorage.removeItem(key);
      else if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    } else {
      if (origSet) origSet(key, value);
      else if (typeof window !== "undefined" && window.localStorage) window.localStorage.setItem(key, value);
      else if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn("[cloud-sync] could not write local copy of", key, err);
  }
  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent(CLOUD_SYNC_EVENT, { detail: { key } }));
    }
  } catch {}
}

function installInterceptor() {
  if (installed || typeof window === "undefined") return;
  const proto = Storage.prototype;
  const setItem = proto.setItem;
  const removeItem = proto.removeItem;
  const getItem = proto.getItem;
  const ls = window.localStorage;

  origSet = (k, v) => setItem.call(ls, k, v);
  origRemove = (k) => removeItem.call(ls, k);
  origGet = (k) => getItem.call(ls, k);

  proto.setItem = function (this: Storage, k: string, v: string) {
    setItem.call(this, k, v);
    if (this === ls && activeUid && SYNCED_SET.has(k)) scheduleUpload(k);
  };
  proto.removeItem = function (this: Storage, k: string) {
    removeItem.call(this, k);
    if (this === ls && activeUid && SYNCED_SET.has(k)) scheduleUpload(k);
  };

  const flushAll = () => {
    for (const k of Array.from(timers.keys())) flushUpload(k);
  };
  window.addEventListener("pagehide", flushAll);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAll();
  });
  installed = true;
}

function scheduleUpload(key: string) {
  const t = timers.get(key);
  if (t) clearTimeout(t);
  timers.set(
    key,
    setTimeout(() => flushUpload(key), UPLOAD_DEBOUNCE_MS)
  );
}

function flushUpload(key: string) {
  const t = timers.get(key);
  if (t) clearTimeout(t);
  timers.delete(key);
  void uploadKey(key);
}

async function uploadKey(key: string): Promise<void> {
  const uid = activeUid;
  if (!db || !uid) return;
  const value = rawGet(key);
  if (value !== null && value.length > MAX_VALUE_SIZE) {
    lastError = `"${key}" is too large to sync (${Math.round(value.length / 1e6)} MB).`;
    console.warn("[cloud-sync]", lastError);
    return;
  }

  const rev = newRev();
  const pieces: string[] = [];
  if (value !== null) {
    for (let i = 0; i < value.length; i += CHUNK_SIZE) pieces.push(value.slice(i, i + CHUNK_SIZE));
    if (pieces.length === 0) pieces.push("");
  }

  const col = collection(db, "users", uid, COLLECTION);
  const batch = writeBatch(db);
  batch.set(doc(col, metaId(key)), {
    kind: "meta",
    key,
    rev,
    chunks: pieces.length,
    deleted: value === null,
    updatedAt: Date.now(),
  });
  pieces.forEach((data, index) => {
    batch.set(doc(col, chunkId(key, index)), { kind: "chunk", key, rev, index, data });
  });
  const oldCount = chunkCounts.get(key) ?? 0;
  for (let i = pieces.length; i < oldCount; i++) batch.delete(doc(col, chunkId(key, i)));

  knownRevs.set(key, rev);
  chunkCounts.set(key, pieces.length);
  try {
    await batch.commit();
    status = "synced";
    lastError = null;
  } catch (err: any) {
    status = "error";
    lastError = err?.message || String(err);
    console.warn("[cloud-sync] upload failed for", key, err);
  }
}

function assemble(snap: QuerySnapshot<DocumentData>): Map<string, RemoteEntry> {
  const metas = new Map<string, any>();
  const chunks = new Map<string, Map<number, any>>();
  snap.forEach((d) => {
    const data = d.data();
    if (!data || typeof data.key !== "string") return;
    if (data.kind === "meta") metas.set(data.key, data);
    else if (data.kind === "chunk") {
      if (!chunks.has(data.key)) chunks.set(data.key, new Map());
      chunks.get(data.key)!.set(data.index, data);
    }
  });

  const out = new Map<string, RemoteEntry>();
  metas.forEach((meta, key) => {
    if (!SYNCED_SET.has(key)) return;
    chunkCounts.set(key, Math.max(chunkCounts.get(key) ?? 0, meta.chunks || 0));
    if (meta.deleted) {
      out.set(key, { value: null, rev: meta.rev, chunks: 0 });
      return;
    }
    const parts = chunks.get(key);
    let value = "";
    for (let i = 0; i < meta.chunks; i++) {
      const c = parts?.get(i);
      if (!c || c.rev !== meta.rev) return; // incomplete; wait for next snapshot
      value += c.data;
    }
    out.set(key, { value, rev: meta.rev, chunks: meta.chunks });
  });
  return out;
}

/** Union two JSON arrays of {id} objects (remote wins on the same id). Otherwise remote wins. */
export function mergeValues(local: string, remote: string): string {
  try {
    const l = JSON.parse(local);
    const r = JSON.parse(remote);
    const isIdArray = (a: unknown) =>
      Array.isArray(a) && a.every((x) => x && typeof x === "object" && typeof (x as any).id === "string");
    if (isIdArray(l) && isIdArray(r)) {
      const seen = new Set((r as any[]).map((x) => x.id));
      const extra = (l as any[]).filter((x) => !seen.has(x.id));
      return extra.length ? JSON.stringify([...(r as any[]), ...extra]) : remote;
    }
  } catch {}
  return remote;
}

/** Start syncing for a signed-in user. Returns a stop function. */
export async function startCloudSync(uid: string): Promise<() => void> {
  if (typeof window === "undefined" || !db) return () => {};
  installInterceptor();
  if (activeUid && activeUid !== uid) stopCloudSync();
  status = "syncing";

  const col = collection(db, "users", uid, COLLECTION);
  const initKey = `cloud_sync_init_${uid}`;
  const firstTimeOnDevice = rawGet(initKey) !== "1";
  const previousOwner = rawGet(SYNC_OWNER_KEY);
  const isDifferentUser = Boolean(previousOwner && previousOwner !== uid);

  try {
    const remote = assemble(await getDocs(col));
    activeUid = uid;

    for (const key of SYNCED_KEYS) {
      const isPrivate = USER_PRIVATE_KEYS.has(key);
      const local = rawGet(key);
      const r = remote.get(key);

      if (isPrivate) {
        // User-private files/assignments/pantry/notes:
        // If switching accounts, NEVER upload the previous account's local data to the new account!
        if (isDifferentUser) {
          if (r && r.value !== null) {
            applyLocal(key, r.value);
            knownRevs.set(key, r.rev);
          } else {
            applyLocal(key, null);
          }
          continue;
        }

        // If this user has no data in Cloud Firestore:
        if (!r || r.value === null) {
          if (firstTimeOnDevice && previousOwner !== uid) {
            // Fresh account or unowned local data: start with empty private state
            applyLocal(key, null);
          } else if (local !== null && !firstTimeOnDevice) {
            await uploadKey(key);
          }
          continue;
        }

        // User has data in Firestore: remote data for this user is authoritative
        knownRevs.set(key, r.rev);
        if (local !== r.value) {
          applyLocal(key, r.value);
        }
        continue;
      }

      // Common / non-private keys (appearance/theme/sound): standard sync
      if (!r) {
        if (local !== null) await uploadKey(key);
        continue;
      }
      knownRevs.set(key, r.rev);

      if (r.value === null) {
        if (firstTimeOnDevice && local !== null) await uploadKey(key);
        else if (local !== null) applyLocal(key, null);
        continue;
      }

      if (firstTimeOnDevice && local !== null && local !== r.value) {
        const merged = mergeValues(local, r.value);
        applyLocal(key, merged);
        if (merged !== r.value) await uploadKey(key);
      } else if (local !== r.value) {
        applyLocal(key, r.value);
      }
    }
    try {
      origSet?.(initKey, "1");
      origSet?.(SYNC_OWNER_KEY, uid);
    } catch {}
    status = "synced";
  } catch (err: any) {
    status = "error";
    lastError = err?.message || String(err);
    console.warn("[cloud-sync] initial sync failed:", err);
    activeUid = uid; // still capture local writes; they'll upload when online
  }

  unsubscribeSnapshot?.();
  unsubscribeSnapshot = onSnapshot(
    col,
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const remote = assemble(snap);
      remote.forEach((entry, key) => {
        if (knownRevs.get(key) === entry.rev) return;
        if (timers.has(key)) return; // a local edit is about to upload; it wins
        knownRevs.set(key, entry.rev);
        if (rawGet(key) !== entry.value) applyLocal(key, entry.value);
      });
    },
    (err) => {
      status = "error";
      lastError = err?.message || String(err);
      console.warn("[cloud-sync] live listener error:", err);
    }
  );

  return stopCloudSync;
}

export function stopCloudSync(clearPrivateData = false) {
  for (const k of Array.from(timers.keys())) flushUpload(k);
  unsubscribeSnapshot?.();
  unsubscribeSnapshot = null;
  activeUid = null;
  knownRevs.clear();
  chunkCounts.clear();
  status = "idle";

  if (clearPrivateData) {
    try {
      if (origRemove) origRemove(SYNC_OWNER_KEY);
      else if (typeof window !== "undefined") window.localStorage.removeItem(SYNC_OWNER_KEY);
      for (const key of USER_PRIVATE_KEYS) {
        applyLocal(key, null);
      }
    } catch {}
  }
}

/** Subscribe to remote updates for one or more keys. */
export function onCloudSyncUpdate(keys: string | string[], cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const wanted = new Set(Array.isArray(keys) ? keys : [keys]);
  const handler = (e: Event) => {
    const key = (e as CustomEvent).detail?.key;
    if (wanted.has(key)) cb();
  };
  window.addEventListener(CLOUD_SYNC_EVENT, handler);
  return () => window.removeEventListener(CLOUD_SYNC_EVENT, handler);
}
