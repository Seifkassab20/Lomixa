import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LucideIcon, AlertTriangle, ShieldAlert, Trash2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  icon?: LucideIcon;
}

export function ActionConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText,
  variant = 'info',
  icon: Icon
}: ActionConfirmModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const variants = {
    danger: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: 'text-red-500',
      button: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
      gradient: 'from-red-500/5',
      defaultIcon: Trash2
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: 'text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
      gradient: 'from-amber-500/5',
      defaultIcon: AlertTriangle
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-500',
      button: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20',
      gradient: 'from-blue-500/5',
      defaultIcon: ShieldAlert
    },
    success: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-500',
      button: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20',
      gradient: 'from-emerald-500/5',
      defaultIcon: CheckCircle
    }
  };

  const activeVariant = variants[variant];
  const ActiveIcon = Icon || activeVariant.defaultIcon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#0c121d] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Top Pattern Decor */}
            <div className={cn("absolute top-0 left-0 right-0 h-32 bg-gradient-to-b to-transparent pointer-events-none", activeVariant.gradient)} />
            
            <div className="p-8 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-6">
                {/* Icon */}
                <div className={cn("h-20 w-20 rounded-[2rem] flex items-center justify-center border shadow-lg", activeVariant.bg, activeVariant.border)}>
                  <ActiveIcon className={cn("h-10 w-10", activeVariant.icon)} />
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-white tracking-tight italic uppercase leading-tight">
                    {title}
                  </h2>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto uppercase tracking-wide">
                    {message}
                  </p>
                </div>

                <div className="flex flex-col w-full gap-3 pt-4">
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={cn(
                      "h-14 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98]",
                      activeVariant.button
                    )}
                  >
                    {confirmText || t('confirm') || 'Confirm Action'}
                  </button>
                  <button
                    onClick={onClose}
                    className="h-14 rounded-2xl text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                  >
                    {cancelText || t('cancel') || 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
