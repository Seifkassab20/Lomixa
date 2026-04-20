import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Top Pattern Decor */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
            
            <div className="p-8 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-6">
                {/* Icon */}
                <div className="h-20 w-20 rounded-[2rem] bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20 shadow-lg shadow-red-500/5">
                  <LogOut className="h-10 w-10 text-red-500" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase leading-tight">
                    {t('logoutConfirmTitle')}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-[260px] mx-auto">
                    {t('logoutConfirmMessage')}
                  </p>
                </div>

                <div className="flex flex-col w-full gap-3 pt-4">
                  <Button
                    onClick={onConfirm}
                    className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-[0.98]"
                  >
                    {t('logoutConfirmAction')}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="h-14 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
