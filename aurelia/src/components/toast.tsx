import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Check, Info } from "./icons";

type Toast = { id: number; text: ReactNode; tone: "ok" | "info" };

const ToastContext = createContext<(text: ReactNode, tone?: Toast["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: ReactNode, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3600);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-md animate-rise items-center gap-3 rounded-full bg-plum py-2.5 pl-3 pr-5 text-sm text-ivory shadow-xl">
            <span className={`grid size-6 place-items-center rounded-full ${t.tone === "ok" ? "bg-[#4cbf7a]/20 text-[#7fd9a2]" : "bg-gold/20 text-gold"}`}>
              {t.tone === "ok" ? <Check size={14} /> : <Info size={14} />}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react/only-export-components
export const useToast = () => useContext(ToastContext);
