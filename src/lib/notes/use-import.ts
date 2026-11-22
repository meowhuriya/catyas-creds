"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { collectMaterial } from "@/lib/notes/material";
import { useNoteTopics } from "@/lib/notes/study";
import { VaultNote } from "@/lib/notes/vault-types";

/** Reads a note's files/photos/links/text with Gemini and adds the questions (or topics) it finds. */
export function useImportQuestions(subjectTitle?: string) {
  const { firebaseUser } = useDataStore();
  const nt = useNoteTopics();
  const [busy, setBusy] = React.useState<{ noteId: string; kind: "topics" | "questions" } | null>(null);
  const [msg, setMsg] = React.useState<{ noteId: string; lines: string[] } | null>(null);

  const run = async (note: VaultNote, kind: "topics" | "questions") => {
    setBusy({ noteId: note.id, kind });
    setMsg(null);
    try {
      const m = await collectMaterial([note], firebaseUser?.uid ?? null);
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "extract", kind, subject: subjectTitle ?? "", text: m.text, links: m.links, images: m.images }),
      });
      const raw = await res.text();
      let data: { error?: string; items?: { text: string; chapter?: string; marks?: number }[] } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        /* non-JSON reply */
      }
      if (!res.ok || !data.items) {
        throw new Error(
          data.error ||
            (res.status === 413
              ? "That file is too big to send. Put it on Drive (Anyone with the link) and paste the link in the note."
              : res.status === 504 || res.status === 408
                ? "It took too long. Split the Q-bank by unit, or use a Drive link."
                : `The server returned an error (${res.status}). Check /api/ai/status?check=1`)
        );
      }
      const have = new Set((nt.topics[note.id] ?? []).map((i) => i.text.toLowerCase()));
      const fresh = data.items.filter((t) => !have.has(t.text.trim().toLowerCase()));
      nt.add(note.id, data.items);
      setMsg({
        noteId: note.id,
        lines: [
          fresh.length
            ? `Added ${fresh.length} ${kind === "questions" ? "questions" : "topics"}. Delete any that don't belong.`
            : "Nothing new found. Your list already has these.",
          ...m.warnings,
        ],
      });
    } catch (e) {
      setMsg({ noteId: note.id, lines: [e instanceof Error ? e.message : "Something went wrong"] });
    } finally {
      setBusy(null);
    }
  };

  return { run, busy, msg };
}

export function hasImportSource(note: VaultNote) {
  return !!note.body.trim() || note.files.length > 0 || note.mediaIds.length > 0 || note.links.some((l) => l.kind === "drive");
}
