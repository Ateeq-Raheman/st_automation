import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              icon: CheckCircle2,
              bg: 'bg-white dark:bg-slate-800 border-emerald-500/50 text-emerald-700',
              iconColor: 'text-emerald-600',
            },
            error: {
              icon: XCircle,
              bg: 'bg-white dark:bg-slate-800 border-rose-500/50 text-rose-700',
              iconColor: 'text-rose-600',
            },
            warning: {
              icon: AlertCircle,
              bg: 'bg-white dark:bg-slate-800 border-amber-500/50 text-amber-700',
              iconColor: 'text-amber-600',
            },
            info: {
              icon: Info,
              bg: 'bg-white dark:bg-slate-800 border-brand-red/50 text-brand-red',
              iconColor: 'text-brand-red',
            },
          }[toast.type] || {
            icon: Info,
            bg: 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200',
            iconColor: 'text-brand-grey',
          };

          const Icon = typeConfig.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md animate-fade-in ${typeConfig.bg}`}
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${typeConfig.iconColor}`} />
              <p className="text-sm font-medium text-brand-black dark:text-slate-50 flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-brand-grey hover:text-brand-black dark:text-slate-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
