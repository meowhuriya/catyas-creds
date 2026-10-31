"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { DataTable, Column } from "@/components/ui/data-table";
import { Course } from "@/types/schemas";
import { Stat } from "@/components/ui/stat";

export default function GradesPage() {
  const { courses, currentTerm } = useDataStore();

  const gradeRows = courses.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    credits: c.credits,
    percent: "92.5%",
    letter: "O",
    points: 10,
    status: "Completed",
  }));

  const columns: Column<(typeof gradeRows)[0]>[] = [
    { key: "code", header: "Code", sortable: true, tabular: true },
    { key: "title", header: "Course Title", sortable: true },
    { key: "credits", header: "Credits", sortable: true, align: "right", tabular: true },
    { key: "percent", header: "Score", sortable: true, align: "right", tabular: true },
    { key: "letter", header: "Grade", sortable: true, align: "center", tabular: true },
    { key: "points", header: "Grade Points", sortable: true, align: "right", tabular: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-app-border pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
            Grades & Academic Standings
          </h1>
          <p className="text-xs text-app-ink-muted mt-0.5">
            Semester Grade Point Average (SGPA) and course mark breakdowns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat label="Current Term SGPA" value="9.40" unit="/ 10.00" subtext="Semester 2, 2025-26" />
        <Stat label="Total Term Credits" value="11" unit="cr" subtext="Active registrations" />
        <Stat label="Cumulative CGPA" value="9.20" unit="/ 10.00" subtext="Across all enrolled terms" />
      </div>

      <DataTable
        data={gradeRows}
        columns={columns}
        keyExtractor={(r) => r.id}
      />
    </div>
  );
}
