"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerClose = DialogPrimitive.Close;
const DrawerPortal = DialogPrimitive.Portal;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "right" | "left" | "bottom";
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, side = "right", ...props }, ref) => {
  const sideClasses = {
    right:
      "inset-y-0 right-0 h-full w-full max-w-md border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
    left:
      "inset-y-0 left-0 h-full w-full max-w-md border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
    bottom:
      "inset-x-0 bottom-0 h-auto max-h-[85vh] border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom rounded-t-card",
  };

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col bg-app-surface border-app-border shadow-dialog transition-transform duration-200 ease-in-out focus:outline-none",
          sideClasses[side],
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-app-border p-4">
          <div className="font-serif text-base font-semibold text-app-ink">
            {props["aria-label"] || "Panel"}
          </div>
          <DialogPrimitive.Close className="rounded-control p-1 text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </DialogPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent";

export { Drawer, DrawerTrigger, DrawerClose, DrawerPortal, DrawerOverlay, DrawerContent };
