import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Check, Info } from "./icons";

type Toast = { id: number; text: ReactNode; tone: "ok" | "info" };

const ToastContext = createContext<(text: ReactNode, tone?: Toast["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: ReactNode, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 top-20 z-[70] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-md animate-rise items-center gap-3 rounded-2xl bg-ink py-3 pl-3 pr-5 text-sm text-white shadow-2xl">
            <span className={`grid size-7 shrink-0 place-items-center rounded-full ${t.tone === "ok" ? "bg-[#22c55e]/20 text-[#4ade80]" : "bg-accent text-accent-ink"}`}>
              {t.tone === "ok" ? <Check size={15} strokeWidth={2.6} /> : <Info size={15} strokeWidth={2.4} />}
            </span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react/only-export-components
export const useToast = () => useContext(ToastContext);
