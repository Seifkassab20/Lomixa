import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PendingScreen } from './PendingScreen';
import { useTranslation } from 'react-i18next';
import { Copilot } from './Copilot';
import { isUserAuthorized, isRepSubscribed, getBundleRequests, useStoreListener, ensureUserEntityExists } from '@/lib/store';
import { ShieldAlert, Rocket, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { emailService } from '@/lib/emailService';
import { useToast } from './ui/Toast';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import logo from '@/assets/logo.svg';
import { MeetingReminderPopup } from './MeetingReminderPopup';

export function Layout() {
  const { user, role, loading, userId, emailVerified, signOut, refreshVerificationStatus, isPending, rejectionReason } = useAuth();
  const [resending, setResending] = useState(false);
   const { toast } = useToast();
  const [, setTick] = React.useState(0);
  useEffect(() => {
    const handleLomixaError = (e: Event) => {
      const customEvent = e as CustomEvent;
      toast(customEvent.detail, 'error');
    };
    window.addEventListener('lomixa_error', handleLomixaError);
    return () => window.removeEventListener('lomixa_error', handleLomixaError);
  }, []);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  useStoreListener(() => setTick(n => n + 1));

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    const portalNames: Record<string, string> = {
      pharma: t('pharmaCompanyFull'),
      hospital: t('hospital'),
      doctor: t('doctor'),
      rep: t('salesRep')
    };
    
    document.title = role 
      ? `LOMIXA - ${portalNames[role] || 'Portal'}` 
      : 'LOMIXA';
  }, [role, i18n.language, t]);

  const [authorized, setAuthorized] = React.useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      if (!loading) setAuthorized(false);
      return;
    }
    
    // Repair/Ensure user profile exists on every refresh
    ensureUserEntityExists(user);

    isUserAuthorized(user.id, user.user_metadata?.role)
      .then(setAuthorized)
      .catch(() => setAuthorized(false));
  }, [user, loading, role]);

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      await emailService.resendVerification(user.id, user.email, user.user_metadata?.full_name || 'User');
      toast(t('verificationEmailSent'), 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setResending(false);
    }
  };

  if (loading || authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#050b14]">
        {/* Loading UI as before */}
        <div className="flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-[2rem] bg-white flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 p-2.5 animate-pulse transition-transform">
             <img src={logo} alt="Lomixa" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-black text-gray-900 dark:text-white tracking-[0.3em] uppercase italic">{t('verifyingSecurity')}</div>
            <div className="h-0.5 w-32 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-1/3 animate-[shimmer_2s_infinite_linear]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || authorized === false) {
    return <Navigate to="/login" replace />;
  }

  if (!emailVerified && isSupabaseConfigured && role !== 'admin' && role !== 'doctor') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050b14] p-6 overflow-hidden relative">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
         <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-12 rounded-[3.5rem] shadow-4xl text-center space-y-8 animate-in zoom-in fade-in duration-500">
            <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-amber-500" />
            </div>
            
            <div className="space-y-4">
               <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Verify Your Email</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                {t('verifyEmailRequirementMsg', 'Please verify your email address to unlock full access to the LOMIXA network.')}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Button 
                onClick={handleResend}
                disabled={resending}
                className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20"
              >
                {resending ? 'Sending...' : t('resendVerificationEmail')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (isSupabaseConfigured) {
                    supabase.auth.getUser().then(() => refreshVerificationStatus());
                  } else {
                    refreshVerificationStatus();
                  }
                }}
                className="h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest"
              >
                {t('iHaveVerified')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowLogoutConfirm(true)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
              >
                {t('signOut')}
              </Button>
            </div>
         </div>
      </div>
    );
  }

  if (!user || authorized === false) {
    return <Navigate to="/login" replace />;
  }

  // Handle Pending Registration State globally
  // Admins always bypass the pending screen
  if (isPending && role !== 'admin' && role !== 'doctor') {
    return (
      <>
        <PendingScreen role={role} rejectionReason={rejectionReason} onSignOut={() => setShowLogoutConfirm(true)} />
        <LogoutConfirmModal 
          isOpen={showLogoutConfirm} 
          onClose={() => setShowLogoutConfirm(false)} 
          onConfirm={() => {
            setShowLogoutConfirm(false);
            signOut();
          }}
        />
      </>
    );
  }

  return (
    <div
      className="flex h-screen bg-app-bg overflow-hidden transition-colors"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <Outlet />
        </main>
        <Copilot />
        <MeetingReminderPopup />
      </div>
      <LogoutConfirmModal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        onConfirm={() => {
          setShowLogoutConfirm(false);
          signOut();
        }}
      />
    </div>
  );
}

