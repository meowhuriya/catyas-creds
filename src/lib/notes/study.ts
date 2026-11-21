"use client";

import * as React from "react";
import { CLOUD_SYNC_EVENT } from "@/lib/cloud-sync/synced-storage";
import { newId } from "@/lib/notes/vault-types";

export interface StudyItem {
  id: string;
  text: string;
  done: boolean;
  weak?: boolean; // added from an AI practice miss
}
export interface SubjectStudy {
  examDate?: string; // yyyy-mm-dd
  items: StudyItem[];
}
type StudyMap = Record<string, SubjectStudy>;

const KEY = "vc_study_v1";

function read(): StudyMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as StudyMap;
  } catch {
    return {};
  }
}

export function useStudy(subjectId: string) {
  const [map, setMap] = React.useState<StudyMap>({});
  React.useEffect(() => {
    const load = () => setMap(read());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(CLOUD_SYNC_EVENT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(CLOUD_SYNC_EVENT, load);
    };
  }, []);

  const data: SubjectStudy = map[subjectId] ?? { items: [] };

  const update = React.useCallback(
    (fn: (s: SubjectStudy) => SubjectStudy) => {
      const all = read();
      all[subjectId] = fn(all[subjectId] ?? { items: [] });
      try {
        localStorage.setItem(KEY, JSON.stringify(all));
      } catch {
        /* storage full or blocked */
      }
      setMap(all);
    },
    [subjectId]
  );

  return {
    data,
    addItems: (texts: string[], weak = false) =>
      update((s) => {
        const have = new Set(s.items.map((i) => i.text.toLowerCase()));
        const fresh = texts
          .map((t) => t.trim())
          .filter((t) => t && !have.has(t.toLowerCase()))
          .map((text) => ({ id: newId("chk"), text, done: false, weak }));
        return { ...s, items: [...s.items, ...fresh] };
      }),
    toggle: (id: string) => update((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),
    remove: (id: string) => update((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) })),
    setExamDate: (d: string) => update((s) => ({ ...s, examDate: d || undefined })),
  };
}
