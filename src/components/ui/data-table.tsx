"use client";

import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  tabular?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  className?: string;
  emptyMessage?: string;
  stickyHeader?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  className,
  emptyMessage = "No records found.",
  stickyHeader = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;

    return [...data].sort((a, b) => {
      const valA = (a as any)[sortKey];
      const valB = (b as any)[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [data, sortKey, sortDirection, columns]);

  return (
    <div
      className={cn(
        "relative overflow-x-auto rounded-card border border-app-border bg-app-surface",
        className
      )}
    >
      <table className="w-full text-left text-sm border-collapse">
        <thead
          className={cn(
            "bg-app-surface-muted text-xs font-semibold uppercase tracking-wider text-app-ink-muted border-b border-app-border",
            stickyHeader && "sticky top-0 z-10 backdrop-blur-sm"
          )}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "px-4 py-2.5 font-medium transition-colors select-none",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.sortable && "cursor-pointer hover:text-app-ink",
                  col.className
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    col.align === "right" && "justify-end",
                    col.align === "center" && "justify-center"
                  )}
                >
                  <span>{col.header}</span>
                  {col.sortable && (
                    <span className="text-app-ink-muted/60">
                      {sortKey === col.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-app-accent" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-app-accent" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border/60">
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-app-ink-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-app-surface-muted/50 transition-colors"
              >
                {columns.map((col) => {
                  const content = col.accessor
                    ? col.accessor(row)
                    : (row as any)[col.key];
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-2.5 text-sm text-app-ink whitespace-nowrap",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.tabular && "tabular-nums font-sans font-semibold",
                        col.className
                      )}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
