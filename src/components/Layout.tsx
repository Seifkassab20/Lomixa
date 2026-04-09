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

  if (!user || authorized === false) {
    return <Navigate to="/login" replace />;
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
