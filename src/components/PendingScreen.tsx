import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Clock, LogOut, ArrowRight, UserCog } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';

interface PendingScreenProps {
  role: string | null;
  onSignOut: () => void;
}

export function PendingScreen({ role, onSignOut }: PendingScreenProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refreshVerificationStatus } = useAuth();

  // Proactively check for status updates while on the pending screen
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      refreshVerificationStatus();
    }, 5000); // Check every 5s
    return () => clearInterval(intervalId);
  }, [refreshVerificationStatus]);

  return (
    <div className="min-h-screen w-full bg-[#050b14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-[#0a111c]/80 backdrop-blur-xl border border-white/5 rounded-[3rem] p-12 text-center relative z-10 shadow-2xl"
      >
        <div className="mb-8 flex justify-center">
          <div className="h-24 w-24 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 relative">
            <Clock className="w-12 h-12 animate-pulse" />
            <div className="absolute -top-2 -right-2 bg-amber-500 text-black p-1.5 rounded-full">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase mb-4">
          {t('registrationPendingTitle') || 'Awaiting Approval'}
        </h1>
        
        <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10">
          {t('registrationPendingDesc') || 'Your account is currently under administrative review. This usually takes 24-48 hours. We will notify you once your access is granted.'}
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-sm">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t('currentRole') || 'Selected Role'}</span>
            <span className="text-white font-black uppercase italic tracking-tighter text-lg">{role || 'User'}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4">
            <Button 
              onClick={() => navigate('/select-role')}
              className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-emerald-900/20"
            >
              <UserCog className="w-4 h-4" />
              {t('changeRegistration') || 'Change Registration / Role'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost"
              onClick={onSignOut}
              className="h-16 rounded-2xl border border-white/10 text-slate-400 hover:bg-red-500/10 hover:text-red-500 font-bold uppercase tracking-widest text-xs gap-3"
            >
              <LogOut className="w-4 h-4" />
              {t('signOut')}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="mt-12 text-center relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">
          LOMIXA Healthcare Systems Security Protocols
        </p>
      </div>
    </div>
  );
}
