import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  tabular?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, tabular, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-control border border-app-border bg-app-surface px-3 py-1 text-sm text-app-ink shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-app-ink-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          tabular && "tabular-nums font-mono",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
