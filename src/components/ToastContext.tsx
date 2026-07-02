import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType, duration = 2000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastObj = useMemo(() => ({
    success: (msg: string, dur?: number) => addToast(msg, 'success', dur),
    error: (msg: string, dur?: number) => addToast(msg, 'error', dur),
    info: (msg: string, dur?: number) => addToast(msg, 'info', dur),
    warning: (msg: string, dur?: number) => addToast(msg, 'warning', dur),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: toastObj }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

function ToastCard({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4000;

  React.useEffect(() => {
    if (paused) return;
    const intervalTime = 20;
    const steps = duration / intervalTime;
    const stepSize = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onRemove(toast.id);
          return 0;
        }
        return prev - stepSize;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [paused, duration, toast.id, onRemove]);

  const config = {
    success: {
      bg: 'bg-white border-emerald-500/30 shadow-emerald-500/5',
      iconBg: 'bg-emerald-50 text-emerald-600',
      progressBg: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    error: {
      bg: 'bg-white border-rose-500/30 shadow-rose-500/5',
      iconBg: 'bg-rose-50 text-rose-600',
      progressBg: 'bg-rose-500',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-white border-sky-500/30 shadow-sky-500/5',
      iconBg: 'bg-sky-50 text-sky-600',
      progressBg: 'bg-sky-500',
      icon: Info,
    },
    warning: {
      bg: 'bg-white border-amber-500/30 shadow-amber-500/5',
      iconBg: 'bg-amber-50 text-amber-600',
      progressBg: 'bg-amber-500',
      icon: AlertCircle,
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95, x: 50 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 30, transition: { duration: 0.2 } }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`w-80 md:w-96 rounded-xl border p-4 pointer-events-auto flex items-start gap-3 shadow-xl relative overflow-hidden transition-all duration-300 ${config.bg}`}
      id={`toast-${toast.id}`}
    >
      <div className={`p-2 rounded-lg shrink-0 ${config.iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 pr-4">
        <h5 className="text-xs font-bold text-[#06065C] tracking-wide uppercase mb-0.5">
          {toast.type === 'success' && 'Success'}
          {toast.type === 'error' && 'Error'}
          {toast.type === 'info' && 'Information'}
          {toast.type === 'warning' && 'Warning'}
        </h5>
        <p className="text-xs text-[#334155] font-medium leading-relaxed break-words">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
        id={`toast-close-${toast.id}`}
      >
        <X className="h-4 w-4" />
      </button>
      
      {/* Visual progress bar at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
        <div 
          className={`h-full transition-all duration-100 ease-linear ${config.progressBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-full" id="toast-container">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}
