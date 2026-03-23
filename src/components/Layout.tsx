import React from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Copilot } from './Copilot';

export function Layout() {
  const { user, role, loading } = useAuth();
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
    const check = async () => {
      if (!user) { setAuthorized(false); return; }
      const { isUserAuthorized } = await import('@/lib/store');
      const v = await isUserAuthorized(user.id, user.user_metadata?.role);
      setAuthorized(v);
    };
    check();
  }, [user, role]);

  if (loading || authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#050b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center animate-pulse">
            <div className="h-5 w-5 rounded bg-white/50" />
          </div>
          <div className="text-sm text-gray-500 dark:text-slate-400">Verifying LOMIXA Security Protocol...</div>
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
