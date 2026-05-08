import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Clock, LogOut, ArrowRight, UserCog, AlertTriangle, XCircle, Mail, MessageSquare, Headphones } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { cn } from '@/lib/utils';

interface PendingScreenProps {
  role: string | null;
  rejectionReason?: string;
  onSignOut: () => void;
}

export function PendingScreen({ role, rejectionReason, onSignOut }: PendingScreenProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refreshVerificationStatus } = useAuth();
  const isRejected = !!rejectionReason;

  // Proactively check for status updates while on the pending screen
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      refreshVerificationStatus();
    }, 5000); // Check every 5s
    return () => clearInterval(intervalId);
  }, [refreshVerificationStatus]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen w-full bg-[#050b14] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] ${isRejected ? 'bg-rose-500/5' : 'bg-emerald-500/5'} rounded-full blur-[160px] pointer-events-none transition-colors duration-1000`}></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`max-w-xl w-full backdrop-blur-3xl border ${isRejected ? 'border-rose-500/20 bg-rose-950/5' : 'border-emerald-500/10 bg-emerald-950/5'} rounded-[3.5rem] p-10 md:p-14 text-center relative z-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden`}
      >
        {/* Animated accent bar */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isRejected ? 'bg-gradient-to-r from-rose-500 via-pink-600 to-rose-500' : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-500'} animate-shimmer opacity-80`}></div>

        <motion.div variants={itemVariants} className="mb-10 flex justify-center">
          <div className={`h-24 w-24 rounded-[2rem] ${isRejected ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'} flex items-center justify-center relative border shadow-2xl transition-all duration-500`}>
            {isRejected ? <XCircle className="w-12 h-12 stroke-[1.5]" /> : <Clock className="w-12 h-12 animate-pulse stroke-[1.5]" />}
            <div className={`absolute -top-2 -right-2 ${isRejected ? 'bg-rose-600' : 'bg-emerald-600'} text-white p-2 rounded-2xl shadow-xl border border-white/10`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4 mb-10">
          <h1 className={`text-3xl md:text-4xl font-black tracking-tight uppercase leading-[1.1] ${isRejected ? 'text-rose-500' : 'text-emerald-500'}`}>
            {isRejected ? 'Registration Rejection' : (t('registrationPendingTitle') || 'Awaiting Approval')}
          </h1>
          {!isRejected && (
            <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-[90%] mx-auto">
              {t('registrationPendingDesc') || 'Your account is currently under administrative review. This usually takes 24-48 hours. We will notify you once your access is granted.'}
            </p>
          )}
        </motion.div>
        
        {isRejected ? (
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="p-7 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/10 text-left relative overflow-hidden group transition-all hover:bg-rose-500/10">
               <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <AlertTriangle className="w-24 h-24 text-rose-500" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3 text-rose-500/70 font-bold uppercase tracking-[0.2em] text-[10px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t('rejectionReason') || 'Rejection Reason'}
                  </div>
                  <p className="text-white text-lg font-bold leading-snug tracking-tight">
                    {rejectionReason}
                  </p>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between mb-8 group transition-all hover:bg-emerald-500/10">
            <div className="text-left">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px] block mb-1 opacity-70">{t('currentRole') || 'Selected Role'}</span>
              <span className="text-white font-black uppercase tracking-tight text-3xl italic">{role || 'User'}</span>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
               <UserCog className="w-7 h-7" />
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3.5 mt-10">
          {isRejected && (
            <Button 
              onClick={() => navigate(`/register/${role}`)}
              className="h-16 rounded-2xl bg-white text-[#050b14] hover:bg-slate-200 font-bold uppercase tracking-widest text-[11px] gap-3 shadow-xl transition-all active:scale-[0.98] border-none"
            >
              <UserCog className="w-4.5 h-4.5" />
              Edit Your Account
              <ArrowRight className="w-4.5 h-4.5" />
            </Button>
          )}
          
          <Button 
            variant="ghost"
            onClick={onSignOut}
            className={cn(
              "h-16 rounded-2xl border border-white/5 font-bold uppercase tracking-widest text-[11px] gap-3 transition-all",
              isRejected 
                ? "text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20" 
                : "text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/20"
            )}
          >
            <LogOut className="w-4.5 h-4.5" />
            {isRejected ? (t('terminateSession') || 'Secure Sign Out') : 'Back to Login'}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-14 text-center relative z-10"
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-700 italic flex items-center justify-center gap-4">
          <span className="h-[1px] w-8 bg-slate-800/50"></span>
          LOMIXA Core Infrastructure Security
          <span className="h-[1px] w-8 bg-slate-800/50"></span>
        </p>
      </motion.div>
    </div>
  );
}
