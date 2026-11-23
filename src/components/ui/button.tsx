import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-[background-color,color,box-shadow,transform,filter] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "vc-btn-primary rounded-full text-white active:scale-[0.99]",
        secondary:
          "bg-[var(--ctl-fill)] text-app-ink hover:bg-[var(--ctl-fill-strong)]",
        outline:
          "bg-[var(--ctl-fill)] text-app-ink hover:bg-[var(--ctl-fill-strong)]",
        ghost:
          "text-app-ink-muted hover:text-app-ink hover:bg-[var(--ctl-fill)]",
        danger:
          "bg-app-danger text-white hover:brightness-110 shadow-[0_8px_20px_-10px_rgba(220,38,38,0.8)]",
        link:
          "text-app-accent underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        sm: "h-8 px-3.5 text-xs rounded-full gap-1.5",
        md: "h-10 px-[18px] text-sm rounded-full gap-2",
        lg: "h-11 px-6 text-sm font-semibold rounded-full gap-2.5",
        icon: "h-10 w-10 p-0 rounded-full",
        iconSm: "h-8 w-8 p-0 rounded-full",
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
