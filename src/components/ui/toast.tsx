"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = "toast-" + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || 4500;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = React.useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "success" });
    },
    [showToast]
  );

  const info = React.useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "info" });
    },
    [showToast]
  );

  const error = React.useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "error" });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, info, error }}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex max-w-md flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const type = t.type || "info";

          const bgBorder =
            type === "success"
              ? "border-[#1F7A4D]/30 bg-[var(--color-surface)] text-[var(--color-ink)] shadow-md"
              : type === "error"
              ? "border-[#B3261E]/30 bg-[var(--color-surface)] text-[var(--color-ink)] shadow-md"
              : "border-[var(--color-accent)]/30 bg-[var(--color-surface)] text-[var(--color-ink)] shadow-md";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-[10px] border p-3.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${bgBorder}`}
              role="alert"
            >
              <div className="shrink-0 mt-0.5">
                {type === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-[#1F7A4D]" />
                )}
                {type === "error" && (
                  <AlertCircle className="h-4 w-4 text-[#B3261E]" />
                )}
                {type === "info" && (
                  <Info className="h-4 w-4 text-[var(--color-accent)]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-serif text-xs font-bold text-[var(--color-ink)]">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 rounded p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside ToastProvider
    return {
      showToast: () => {},
      success: (t: string, d?: string) => console.log(`[Toast Success] ${t}: ${d}`),
      info: (t: string, d?: string) => console.log(`[Toast Info] ${t}: ${d}`),
      error: (t: string, d?: string) => console.error(`[Toast Error] ${t}: ${d}`),
    };
  }
  return context;
}
