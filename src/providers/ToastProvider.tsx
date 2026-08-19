"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastTone = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (tone: ToastTone, message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global dispatcher to allow calling toast.error() outside React components if needed
let globalToastDispatcher: ((item: Omit<ToastItem, "id">) => void) | null = null;

export const toast = {
  error: (message: string, title?: string, duration?: number) => {
    if (globalToastDispatcher) {
      globalToastDispatcher({ tone: "error", message, title, duration });
    } else {
      console.error("[Toast Error]", message);
    }
  },
  success: (message: string, title?: string, duration?: number) => {
    if (globalToastDispatcher) {
      globalToastDispatcher({ tone: "success", message, title, duration });
    }
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalToastDispatcher) {
      globalToastDispatcher({ tone: "warning", message, title, duration });
    }
  },
  info: (message: string, title?: string, duration?: number) => {
    if (globalToastDispatcher) {
      globalToastDispatcher({ tone: "info", message, title, duration });
    }
  },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (tone: ToastTone, message: string, title?: string, duration = 4500) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, tone, message, title, duration };

      setToasts((prev) => [newToast, ...prev].slice(0, 4)); // Giữ tối đa 4 thông báo cùng lúc

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const error = useCallback(
    (message: string, title = "Lỗi Xác Thực / Xử Lý", duration = 5000) => {
      showToast("error", message, title, duration);
    },
    [showToast]
  );

  const success = useCallback(
    (message: string, title = "Thành Công", duration = 4000) => {
      showToast("success", message, title, duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, title = "Cảnh Báo", duration = 4500) => {
      showToast("warning", message, title, duration);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title = "Thông Báo", duration = 4000) => {
      showToast("info", message, title, duration);
    },
    [showToast]
  );

  useEffect(() => {
    globalToastDispatcher = ({ tone, message, title, duration }) => {
      showToast(tone, message, title, duration);
    };
    return () => {
      globalToastDispatcher = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, error, success, warning, info, dismissToast }}>
      {children}

      {/* Floating Toast Viewport */}
      <div
        aria-live="assertive"
        className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 w-full max-w-sm sm:max-w-md pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isError = t.tone === "error";
          const isSuccess = t.tone === "success";
          const isWarning = t.tone === "warning";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-lg border p-4 shadow-2xl transition-all duration-300 font-mono text-xs animate-in slide-in-from-top-4 fade-in ${
                isError
                  ? "bg-[#140b0f]/95 border-rose-500/80 text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.3)]"
                  : isSuccess
                  ? "bg-[#0b1712]/95 border-emerald-500/80 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                  : isWarning
                  ? "bg-[#17130b]/95 border-amber-500/80 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                  : "bg-[#0b1419]/95 border-cyan-500/80 text-cyan-100 shadow-[0_0_30px_rgba(0,217,255,0.3)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {isError && <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />}
                  {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {t.tone === "info" && <Info className="w-5 h-5 text-cyan-400" />}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  {t.title && (
                    <div
                      className={`font-bold uppercase tracking-wider text-[11px] ${
                        isError
                          ? "text-rose-300"
                          : isSuccess
                          ? "text-emerald-300"
                          : isWarning
                          ? "text-amber-300"
                          : "text-cyan-300"
                      }`}
                    >
                      {t.title}
                    </div>
                  )}
                  <p className="text-xs font-sans leading-relaxed text-white/95 break-words whitespace-pre-line">
                    {t.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="shrink-0 p-1 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
