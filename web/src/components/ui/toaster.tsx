"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";
type ToastPayload = {
  id: number;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

let counter = 0;
const listeners = new Set<(t: ToastPayload) => void>();

/** เรียกจากที่ไหนก็ได้: toast({ title: "บันทึกแล้ว" }) */
export function toast(payload: Omit<ToastPayload, "id">) {
  const t: ToastPayload = { id: ++counter, ...payload };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastPayload[]>([]);

  React.useEffect(() => {
    const handler = (t: ToastPayload) => setToasts((prev) => [...prev, t]);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          onOpenChange={(open) => {
            if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id));
          }}
          className={cn(
            "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-[var(--radius)] border p-4 pr-8 shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-80",
            t.variant === "success" && "border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
            t.variant === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
            (!t.variant || t.variant === "default") && "bg-card text-card-foreground"
          )}
        >
          <div className="flex-1">
            {t.title && <ToastPrimitive.Title className="text-sm font-semibold">{t.title}</ToastPrimitive.Title>}
            {t.description && (
              <ToastPrimitive.Description className="text-sm opacity-90">{t.description}</ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 opacity-60 hover:opacity-100">
            <X className="size-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  );
}
