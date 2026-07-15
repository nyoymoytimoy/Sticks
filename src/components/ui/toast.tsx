"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "default" | "success" | "error";
type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };

const ToastContext = createContext<{
  push: (toast: Omit<ToastItem, "id">) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toneClasses: Record<ToastTone, string> = {
  default: "border-border bg-surface-base text-ink-900",
  success: "border-status-success/40 bg-surface-stat text-status-success",
  error: "border-status-error/40 bg-surface-secondary text-status-error",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((toast: Omit<ToastItem, "id">) => {
    setToasts((current) => [...current, { ...toast, id: Date.now() }]);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <RadixToast.Root
            key={toast.id}
            duration={4000}
            onOpenChange={(open) => {
              if (!open) {
                setToasts((current) => current.filter((t) => t.id !== toast.id));
              }
            }}
            className={cn(
              "rounded-lg border px-4 py-3 shadow-lg",
              toneClasses[toast.tone]
            )}
          >
            <RadixToast.Title className="text-sm font-semibold">
              {toast.title}
            </RadixToast.Title>
            {toast.description && (
              <RadixToast.Description className="text-sm opacity-80">
                {toast.description}
              </RadixToast.Description>
            )}
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
