"use client";

import { AssignmentList } from "@/components/assignments/assignment-list";
import { useVault } from "@/lib/notes/use-vault";

export default function AssignmentsPage() {
  const vault = useVault();
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-4xl leading-tight text-app-ink">Assignments</h1>
        <p className="text-sm text-app-ink-muted">PPTs and written work from every course in one place: due dates, what to write, and what you've handed in.</p>
      </header>
      <AssignmentList vault={vault} />
    </div>
  );
}
