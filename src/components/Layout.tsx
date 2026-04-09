import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useTranslation } from 'react-i18next';
import { Copilot } from './Copilot';
import { isUserAuthorized, isRepSubscribed, getBundleRequests, useStoreListener } from '@/lib/store';
import { ShieldAlert, Rocket, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function Layout() {
  const { user, role, loading, userId } = useAuth();
  const [, setTick] = React.useState(0);
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
    isUserAuthorized(user.id, user.user_metadata?.role)
      .then(setAuthorized)
      .catch(() => setAuthorized(false));
  }, [user, loading, role]);

  if (loading || authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#050b14]">
        <div className="flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-[2rem] bg-white flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 p-2.5 animate-pulse transition-transform">
             <img src="/logo.svg" alt="Lomixa" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-black text-gray-900 dark:text-white tracking-[0.3em] uppercase italic">Verifying Security...</div>
            <div className="h-0.5 w-32 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-1/3 animate-[shimmer_2s_infinite_linear]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rep-Specific Access Control
  const isSubscribed = role === 'rep' ? isRepSubscribed(userId || '') : true;
  const isSubscriptionPath = pathname.includes('rep-subscription');
  const bundleRequests = getBundleRequests();
  const hasPendingRequest = role === 'rep' && !!bundleRequests.find(r => r.pharmaId === userId && r.status === 'pending' && r.type === 'rep');

  if (role === 'rep') {
      console.log(`[Layout.RepControl] ${userId}`, {
        role,
        isSubscribed,
        hasPendingRequest,
        requests: bundleRequests.filter(r => r.pharmaId === userId).length
      });
  }

  if (!user || authorized === false) {
    return <Navigate to="/login" replace />;
  }

  // Use a minimal layout for the Rep Subscription page itself if unsubscribed
  if (role === 'rep' && isSubscriptionPath) {
    return (
       <div className={cn("min-h-screen bg-[#050b14] overflow-y-auto flex flex-col")} dir={isRTL ? 'rtl' : 'ltr'}>
          <header className="h-20 flex items-center px-10 border-b border-white/5 bg-[#050b14]/50 backdrop-blur-xl shrink-0">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-lg shadow-emerald-500/10 p-1.5 transition-transform hover:scale-105">
               <img src="/logo.svg" alt="Lomixa" className="h-full w-full object-contain" />
            </div>
          </header>
          <main className="flex-1 p-0">
            <Outlet />
          </main>
       </div>
    );
  }

  if (role === 'rep' && !isSubscribed) {
    return (
      <div className="min-h-screen bg-[#050b14] flex flex-col font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
        <header className="h-20 flex items-center px-10 border-b border-white/5 bg-[#050b14]/50 backdrop-blur-xl shrink-0">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-lg shadow-emerald-500/10 p-1.5 transition-transform hover:scale-105">
               <img src="/logo.svg" alt="Lomixa" className="h-full w-full object-contain" />
            </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center justify-center w-full max-w-2xl bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[3rem] p-16 text-center animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0 opacity-20"></div>
            
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mb-8 relative",
              hasPendingRequest ? "bg-emerald-500/10" : "bg-amber-500/10"
            )}>
              {hasPendingRequest ? (
                <Clock className="w-12 h-12 text-emerald-500 animate-pulse" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-amber-500" />
              )}
            </div>
            
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">
              {hasPendingRequest ? "Verification" : "Access"} <span className={hasPendingRequest ? "text-emerald-500" : "text-amber-500"}>{hasPendingRequest ? "In Progress" : "Restricted"}</span>
            </h2>
            
            <p className="max-w-md text-slate-400 mb-8 leading-relaxed font-medium italic">
              {hasPendingRequest 
                ? "Your subscription request is currently in the Administrative Audit Desk. Please wait for our team to authorize your credentials and activate your professional portal."
                : "Your professional subscription has expired or is not yet active. Subscribe now to unlock your dashboard and start booking visits."
              }
            </p>

            {!hasPendingRequest && (
              <Button 
                onClick={() => navigate('/rep-subscription')}
                className="h-16 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95"
              >
                <Rocket className="w-5 h-5" />
                Subscribe Now
              </Button>
            )}

            {hasPendingRequest && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                  Awaiting Audit Authority
                </div>
                <button 
                  onClick={async () => {
                    const { supabase } = await import('@/lib/supabase');
                    await supabase.auth.signOut();
                  }}
                  className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] italic hover:text-white transition-colors"
                >
                  Sign out of Portal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
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
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
        <Copilot />
      </div>
    </div>
  );
}
