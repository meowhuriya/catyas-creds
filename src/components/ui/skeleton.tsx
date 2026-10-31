import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-control bg-app-surface-muted border border-app-border/40",
        className
      )}
      {...props}
    />
  );
}
