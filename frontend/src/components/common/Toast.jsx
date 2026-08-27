import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

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
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              icon: CheckCircle2,
              bg: 'bg-slate-900 border-emerald-500/50 text-emerald-400',
              iconColor: 'text-emerald-400',
            },
            error: {
              icon: XCircle,
              bg: 'bg-slate-900 border-rose-500/50 text-rose-400',
              iconColor: 'text-rose-400',
            },
            warning: {
              icon: AlertCircle,
              bg: 'bg-slate-900 border-amber-500/50 text-amber-400',
              iconColor: 'text-amber-400',
            },
            info: {
              icon: Info,
              bg: 'bg-slate-900 border-indigo-500/50 text-indigo-400',
              iconColor: 'text-indigo-400',
            },
          }[toast.type] || {
            icon: Info,
            bg: 'bg-slate-900 border-slate-700 text-slate-300',
            iconColor: 'text-slate-400',
          };

          const Icon = typeConfig.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md animate-fade-in ${typeConfig.bg}`}
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${typeConfig.iconColor}`} />
              <p className="text-sm font-medium text-white flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors"
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
