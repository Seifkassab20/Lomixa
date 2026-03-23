import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 top-6 right-6 left-6 pointer-events-none z-[9999] flex flex-col items-center lg:items-end gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <div className={`
                flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border min-w-[320px] max-w-md
                ${t.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-200' : 
                  t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' : 
                  'bg-slate-900/90 border-slate-700 text-slate-200'}
                backdrop-blur-md
              `}>
                {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />}
                {t.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />}
                {t.type === 'info' && <Info className="h-5 w-5 text-blue-400 shrink-0" />}
                
                <p className="text-sm font-medium flex-1 leading-tight">{t.message}</p>
                
                <button 
                  onClick={() => removeToast(t.id)}
                  className="hover:bg-white/10 p-1 rounded-full transition-colors shrink-0"
                >
                  <X className="h-4 w-4 opacity-50" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
