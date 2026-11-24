"use client";

import * as React from "react";
import { collection, doc, getDoc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useDataStore } from "@/lib/repository";
import { compressImage } from "./image-utils";
import { idbDelete, idbGet, idbGetAll, idbPut } from "./vault-db";
import { VaultFileRef, VaultMedia, VaultNote, newId } from "./vault-types";
import { removeFileEverywhere, storeFile, uploadChunks } from "./vault-files";

export type VaultSyncState = "local" | "synced" | "error";

export type SaveNoteInput = Omit<VaultNote, "id" | "createdAt" | "updatedAt"> & { id?: string };

/**
 * Notes live in IndexedDB on this device (instant + offline) and mirror to
 * users/{uid}/vaultNotes and users/{uid}/vaultMedia in Firestore when signed in,
 * so they follow the Google account to every device.
 */
export function useVault() {
  const { firebaseUser } = useDataStore();
  const uid = firebaseUser?.uid ?? null;
  const [notes, setNotes] = React.useState<VaultNote[]>([]);
  const [ready, setReady] = React.useState(false);
  const [syncState, setSyncState] = React.useState<VaultSyncState>("local");
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const notesRef = React.useRef<VaultNote[]>([]);

  const commit = React.useCallback((next: VaultNote[]) => {
    notesRef.current = next;
    setNotes(next);
  }, []);

  React.useEffect(() => {
    let alive = true;
    idbGetAll<VaultNote>("notes")
      .then((list) => alive && commit(list.map((n) => ({ ...n, files: n.files ?? [] }))))
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [commit]);

  React.useEffect(() => {
    if (!db || !uid || !ready) return;
    const firestore = db;
    let first = true;
    const unsub = onSnapshot(
      collection(firestore, "users", uid, "vaultNotes"),
      async (snap) => {
        let next = [...notesRef.current];
        let changed = false;
        for (const ch of snap.docChanges()) {
          const remote = { ...(ch.doc.data() as VaultNote), files: (ch.doc.data() as VaultNote).files ?? [] };
          if (ch.type === "removed") {
            next = next.filter((n) => n.id !== ch.doc.id);
            await idbDelete("notes", ch.doc.id).catch(() => {});
            changed = true;
            continue;
          }
          const local = next.find((n) => n.id === remote.id);
          if (!local || local.updatedAt < remote.updatedAt) {
            next = [...next.filter((n) => n.id !== remote.id), remote];
            await idbPut("notes", remote).catch(() => {});
            changed = true;
          }
        }
        if (first) {
          first = false;
          // Upload anything made on this device before sign-in or while offline.
          const remoteMap = new Map(snap.docs.map((d) => [d.id, d.data() as VaultNote]));
          for (const n of next) {
            const r = remoteMap.get(n.id);
            if (!r || r.updatedAt < n.updatedAt) {
              setDoc(doc(firestore, "users", uid, "vaultNotes", n.id), n).catch(() => {});
              for (const f of n.files) {
                idbGet<{ id: string; blob: Blob }>("files", f.id)
                  .then((rec) => rec && uploadChunks(uid, f, rec.blob))
                  .catch(() => {});
              }
              for (const mid of n.mediaIds) {
                idbGet<VaultMedia>("media", mid)
                  .then((m) => m && setDoc(doc(firestore, "users", uid, "vaultMedia", mid), m))
                  .catch(() => {});
              }
            }
          }
        }
        if (changed) commit(next);
        setSyncState("synced");
        setSyncError(null);
      },
      (err) => {
        setSyncState("error");
        setSyncError(err.message);
      }
    );
    return unsub;
  }, [uid, ready, commit]);

  const saveNote = React.useCallback(
    async (input: SaveNoteInput): Promise<VaultNote> => {
      const now = new Date().toISOString();
      const existing = input.id ? notesRef.current.find((n) => n.id === input.id) : undefined;
      // A note saved without a name takes its first file's name ("Untitled note" helps nobody).
      const untitled = !input.title?.trim() || /^untitled( note)?$/i.test(input.title.trim());
      const fileName = input.files?.[0]?.name?.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_-]+/g, " ").trim();
      const note: VaultNote = {
        ...input,
        title: untitled && fileName ? fileName : input.title,
        id: existing?.id ?? input.id ?? newId("note"),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      // Drop photos the user removed while editing.
      const removed = (existing?.mediaIds ?? []).filter((m) => !note.mediaIds.includes(m));
      const removedFiles = (existing?.files ?? []).filter((f) => !note.files.some((x) => x.id === f.id));
      commit([...notesRef.current.filter((n) => n.id !== note.id), note]);
      await idbPut("notes", note);
      for (const mid of removed) {
        await idbDelete("media", mid).catch(() => {});
        if (db && uid) deleteDoc(doc(db, "users", uid, "vaultMedia", mid)).catch(() => {});
      }
      for (const f of removedFiles) await removeFileEverywhere(uid, f);
      if (db && uid) setDoc(doc(db, "users", uid, "vaultNotes", note.id), note).catch((e) => {
        setSyncState("error");
        setSyncError(e?.message ?? "Could not sync");
      });
      return note;
    },
    [commit, uid]
  );

  const removeNote = React.useCallback(
    async (id: string) => {
      const target = notesRef.current.find((n) => n.id === id);
      commit(notesRef.current.filter((n) => n.id !== id));
      await idbDelete("notes", id);
      for (const mid of target?.mediaIds ?? []) {
        await idbDelete("media", mid).catch(() => {});
        if (db && uid) deleteDoc(doc(db, "users", uid, "vaultMedia", mid)).catch(() => {});
      }
      for (const f of target?.files ?? []) await removeFileEverywhere(uid, f);
      if (db && uid) deleteDoc(doc(db, "users", uid, "vaultNotes", id)).catch(() => {});
    },
    [commit, uid]
  );

  /** Compresses and stores a photo, returning its media id to attach to a note. */
  const addImage = React.useCallback(
    async (file: File, noteId: string): Promise<string> => {
      const dataUrl = await compressImage(file);
      const media: VaultMedia = {
        id: newId("img"),
        noteId,
        name: file.name || "photo.jpg",
        dataUrl,
        createdAt: new Date().toISOString(),
      };
      await idbPut("media", media);
      if (db && uid) setDoc(doc(db, "users", uid, "vaultMedia", media.id), media).catch(() => {});
      return media.id;
    },
    [uid]
  );

  /** Stores a document (PPT, PDF, Word...) and returns its reference to attach to a note. */
  const addFile = React.useCallback((file: File): Promise<VaultFileRef> => storeFile(uid, file), [uid]);

  return { notes, ready, syncState, syncError, signedIn: Boolean(uid), saveNote, removeNote, addImage, addFile };
}

/** Loads one photo (local first, then cloud) as a displayable data URL. */
export function useMediaUrl(id: string): string | null {
  const { firebaseUser } = useDataStore();
  const uid = firebaseUser?.uid ?? null;
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      let media = await idbGet<VaultMedia>("media", id);
      if (!media && db && uid) {
        const snap = await getDoc(doc(db, "users", uid, "vaultMedia", id));
        if (snap.exists()) {
          media = snap.data() as VaultMedia;
          await idbPut("media", media);
        }
      }
      if (alive) setUrl(media?.dataUrl ?? null);
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, uid]);

  return url;
}
