"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { collectMaterial } from "@/lib/notes/material";
import { useNoteTopics } from "@/lib/notes/study";
import { chunkText, parseQuestions } from "@/lib/notes/parse-questions";
import { VaultNote } from "@/lib/notes/vault-types";

/** Reads a note's files/photos/links/text with Gemini and adds the questions (or topics) it finds. */
export function useImportQuestions(subjectTitle?: string) {
  const { firebaseUser } = useDataStore();
  const nt = useNoteTopics();
  const [busy, setBusy] = React.useState<{ noteId: string; kind: "topics" | "questions" } | null>(null);
  const [msg, setMsg] = React.useState<{ noteId: string; lines: string[] } | null>(null);

  const [progress, setProgress] = React.useState("");

  type Item = { text: string; chapter?: string; marks?: number };

  const callAi = async (kind: string, body: Record<string, unknown>): Promise<Item[]> => {
    const res = await fetch("/api/ai/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "extract", kind, subject: subjectTitle ?? "", ...body }),
    });
    const raw = await res.text();
    let data: { error?: string; items?: Item[] } = {};
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
              ? "Google took too long on one piece."
              : `The server returned an error (${res.status}). Check /api/ai/status?check=1`)
      );
    }
    return data.items;
  };

  const run = async (note: VaultNote, kind: "topics" | "questions", opts: { ai?: boolean; replace?: boolean } = {}) => {
    setBusy({ noteId: note.id, kind });
    setMsg(null);
    setProgress("Reading your files");
    const all: Item[] = [];
    const problems: string[] = [];
    try {
      const m = await collectMaterial([note], firebaseUser?.uid ?? null);
      // Each job is small, so none of them can time out. Results are kept as they arrive.
      type Job = { label: string; go: () => Promise<Item[]> };
      const jobs: Job[] = [];
      const local = kind === "questions" ? parseQuestions(m.text) : [];
      if (local.length) {
        all.push(...local);
      } else if (opts.ai) {
        if (m.text.trim().length > 40) for (const c of chunkText(m.text)) jobs.push({ label: "text", go: () => callAi(kind, { text: c }) });
        for (const img of m.images) jobs.push({ label: "file", go: () => callAi(kind, { images: [img] }) });
        for (const l of m.links) jobs.push({ label: "Drive link", go: () => callAi(kind, { links: [l] }) });
      } else if (kind === "questions") {
        // No numbering found: take every line that ends with a question mark.
        const qs = m.text.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 12 && /\?\s*$/.test(l));
        if (qs.length >= 3) all.push(...qs.map((text) => ({ text })));
      }

      let done = 0;
      const total = jobs.length;
      const queue = [...jobs];
      const worker = async () => {
        for (let j = queue.shift(); j; j = queue.shift()) {
          try {
            all.push(...(await j.go()));
          } catch (e) {
            try {
              all.push(...(await j.go())); // one retry
            } catch (e2) {
              problems.push(e2 instanceof Error ? e2.message : String(e));
            }
          }
          done++;
          setProgress(`AI is reading part ${Math.min(done + 1, total)} of ${total} (${all.length} found so far)`);
        }
      };
      if (total) setProgress(`AI is reading part 1 of ${total}`);
      await Promise.all([worker(), worker()]);

      const seen = new Set<string>();
      const items = all.filter((i) => {
        const k = i.text.trim().toLowerCase();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      if (!items.length) {
        throw new Error(
          problems[0] ||
            (opts.ai
              ? "AI couldn't find any questions in this."
              : m.images.length || m.links.length
                ? "This file is a scan or photos, so there's no text to read. Press 'Use AI' to read it."
                : "I couldn't spot numbered questions (1. 2. 3.) in this file. Press 'Use AI' to try anyway.")
        );
      }

      const have = new Set((opts.replace ? [] : nt.topics[note.id] ?? []).map((i) => i.text.toLowerCase()));
      const fresh = items.filter((t) => !have.has(t.text.trim().toLowerCase()));
      if (opts.replace) nt.clear(note.id);
      nt.add(note.id, items);
      setMsg({
        noteId: note.id,
        lines: [
          fresh.length
            ? `Added ${fresh.length} ${kind === "questions" ? "questions" : "topics"}${local.length ? " (read straight from the file, no AI)" : ""}. Delete any that don't belong.`
            : "Nothing new found. Your list already has these.",
          ...(problems.length ? [`${problems.length} part(s) failed (${problems[0]}). Press Import again to fill the gaps.`] : []),
          ...m.warnings,
        ],
      });
    } catch (e) {
      setMsg({ noteId: note.id, lines: [e instanceof Error ? e.message : "Something went wrong"] });
    } finally {
      setBusy(null);
      setProgress("");
    }
  };

  return { run, busy, msg, progress };
}

export function hasImportSource(note: VaultNote) {
  return !!note.body.trim() || note.files.length > 0 || note.mediaIds.length > 0 || note.links.some((l) => l.kind === "drive");
}
