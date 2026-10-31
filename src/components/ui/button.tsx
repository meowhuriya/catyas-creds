import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-app-accent text-white hover:bg-app-accent-hover shadow-sm active:scale-[0.99]",
        secondary:
          "bg-app-surface-muted text-app-ink hover:bg-app-border border border-app-border",
        outline:
          "border border-app-border bg-transparent text-app-ink hover:bg-app-surface-muted",
        ghost:
          "text-app-ink-muted hover:text-app-ink hover:bg-app-surface-muted",
        danger:
          "bg-app-danger text-white hover:bg-red-700 shadow-sm",
        link:
          "text-app-accent underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-control gap-1.5",
        md: "h-9 px-4 text-sm rounded-control gap-2",
        lg: "h-11 px-6 text-base rounded-control gap-2.5",
        icon: "h-9 w-9 p-0 rounded-control",
        iconSm: "h-7 w-7 p-0 rounded-control",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
