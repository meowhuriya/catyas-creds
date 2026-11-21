import { doc, getDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { idbDelete, idbGet, idbPut } from "./vault-db";
import { VaultFileRef, newId } from "./vault-types";

/** Characters per Firestore chunk doc (multiple of 4 so base64 slices decode independently). */
const CHUNK_CHARS = 600_000;

interface StoredFile {
  id: string;
  blob: Blob;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function chunkId(fileId: string, i: number) {
  return `${fileId}_${i}`;
}

/* ---------- upload progress (so the UI can show "Syncing 40%") ---------- */
const progress = new Map<string, number>();
const listeners = new Set<() => void>();
function setProgress(id: string, value: number | null) {
  if (value === null) progress.delete(id);
  else progress.set(id, value);
  listeners.forEach((l) => l());
}
export function getUploadProgress(id: string): number | null {
  return progress.has(id) ? progress.get(id)! : null;
}
export function subscribeUploads(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Chunks per batched write: 8 x 600k chars stays well under Firestore's 10 MiB request limit. */
const CHUNKS_PER_BATCH = 8;

export async function uploadChunks(uid: string, ref: VaultFileRef, blob: Blob): Promise<void> {
  if (!db) return;
  const firestore = db;
  setProgress(ref.id, 0);
  try {
    const b64 = await blobToBase64(blob);
    for (let start = 0; start < ref.chunks; start += CHUNKS_PER_BATCH) {
      const batch = writeBatch(firestore);
      const end = Math.min(start + CHUNKS_PER_BATCH, ref.chunks);
      for (let i = start; i < end; i++) {
        batch.set(doc(firestore, "users", uid, "vaultFileChunks", chunkId(ref.id, i)), {
          fileId: ref.id,
          index: i,
          data: b64.slice(i * CHUNK_CHARS, (i + 1) * CHUNK_CHARS),
        });
      }
      await batch.commit();
      setProgress(ref.id, Math.round((end / ref.chunks) * 100));
    }
  } finally {
    setTimeout(() => setProgress(ref.id, null), 1200);
  }
}

export async function removeFileEverywhere(uid: string | null, ref: VaultFileRef): Promise<void> {
  await idbDelete("files", ref.id).catch(() => {});
  if (db && uid) {
    for (let i = 0; i < ref.chunks; i++) {
      deleteDoc(doc(db, "users", uid, "vaultFileChunks", chunkId(ref.id, i))).catch(() => {});
    }
  }
}

/** Stores a file locally and starts mirroring it to the cloud. */
export async function storeFile(uid: string | null, file: File): Promise<VaultFileRef> {
  const base64Len = Math.ceil(file.size / 3) * 4;
  const ref: VaultFileRef = {
    id: newId("file"),
    name: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    chunks: Math.max(1, Math.ceil(base64Len / CHUNK_CHARS)),
  };
  await idbPut("files", { id: ref.id, blob: file } satisfies StoredFile);
  if (db && uid) uploadChunks(uid, ref, file).catch((e) => console.warn("[vault] file upload failed", e));
  return ref;
}

/** Returns the file bytes: local copy first, else reassembled from cloud chunks. */
export async function loadFileBlob(uid: string | null, ref: VaultFileRef): Promise<Blob> {
  const local = await idbGet<StoredFile>("files", ref.id);
  if (local) return local.blob;
  if (!db || !uid) throw new Error("This file isn't on this device yet. Sign in to download it.");
  const firestore = db;
  // Fetch in groups of 10 so big files don't open dozens of requests at once.
  const snaps = [] as Awaited<ReturnType<typeof getDoc>>[];
  for (let start = 0; start < ref.chunks; start += 10) {
    const group = await Promise.all(
      Array.from({ length: Math.min(10, ref.chunks - start) }, (_, k) =>
        getDoc(doc(firestore, "users", uid, "vaultFileChunks", chunkId(ref.id, start + k)))
      )
    );
    snaps.push(...group);
  }
  const parts: Uint8Array[] = [];
  for (const snap of snaps) {
    if (!snap.exists()) throw new Error("The file is still uploading from your other device. Try again in a minute.");
    const bin = atob((snap.data() as { data: string }).data);
    const bytes = new Uint8Array(bin.length);
    for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
    parts.push(bytes);
  }
  const blob = new Blob(parts as BlobPart[], { type: ref.mime });
  await idbPut("files", { id: ref.id, blob } satisfies StoredFile).catch(() => {});
  return blob;
}

export async function downloadVaultFile(uid: string | null, ref: VaultFileRef): Promise<void> {
  const blob = await loadFileBlob(uid, ref);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ref.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
