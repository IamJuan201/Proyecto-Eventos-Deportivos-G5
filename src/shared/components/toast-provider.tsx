"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useTranslate } from "@/shared/i18n/locale-provider";

type ToastKind = "success" | "error" | "info";
type ToastInput = { title: string; message?: string; kind?: ToastKind };
type ToastItem = ToastInput & { id: number };
type ToastContextValue = { showToast: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const isError = toast.kind === "error";
  const t = useTranslate();
  return (
    <article className={`toast-card toast-${toast.kind ?? "success"}`} role={isError ? "alert" : "status"}>
      <span className="toast-icon" aria-hidden="true">{isError ? "!" : toast.kind === "info" ? "i" : "✓"}</span>
      <div className="toast-copy"><strong>{toast.title}</strong>{toast.message && <span>{toast.message}</span>}</div>
      <button className="toast-dismiss" type="button" aria-label={t("Cerrar notificación")} onClick={() => onDismiss(toast.id)}>×</button>
    </article>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslate();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const showToast = useCallback((toast: ToastInput) => {
    const id = ++nextId.current;
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), toast.kind === "error" ? 6500 : 4500);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

  return <ToastContext.Provider value={{ showToast }}>{children}<div className="toast-viewport" aria-label={t("Notificaciones")} aria-live="polite" aria-relevant="additions">{toasts.map((toast) => <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider.");
  return context.showToast;
}
