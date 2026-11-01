import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Reusable solid cream surface component.
 * Renders a solid cream (#FBF6EC) surface with a 1px border #E4D9C0, 14px radius and 12px 16px padding.
 * Guarantees zero text sits directly on the gingham pattern.
 */
export function SectionBar({ className, children, ...props }: SectionBarProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] px-4 py-3 shadow-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const PageSection = SectionBar;
