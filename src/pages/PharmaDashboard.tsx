import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getSalesReps, getPharmaCompanies, getDoctors, getNotifications, savePharmaCompany, generateId } from '@/lib/store';
import { Users, Activity, CreditCard, Calendar as CalendarIcon, Video, Phone, MapPin, MessageSquare, TrendingUp, AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCurrency, getCurrencyInfo } from '@/lib/currency';



const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30',
};

export function PharmaDashboard() {
  const { userId, user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);
  const [reps, setReps] = useState<ReturnType<typeof getSalesReps>>([]);
  const [balance, setBalance] = useState(0);

  const loadData = useCallback(() => {
    const companies = getPharmaCompanies();
    // Safety check: find all matching profiles and pick the one with the highest balance 
    // This resolves potential sync-race duplicates
    const matches = companies.filter(c => c.userId === userId || c.id === userId);
    let mine = matches.length > 0 ? matches.sort((a, b) => (b.balance || 0) - (a.balance || 0))[0] : null;

    if (!mine && userId) {
      mine = {
        id: userId,
        name: user?.user_metadata?.organization || user?.email?.split('@')[1]?.split('.')[0] || t('myPharma'),
        balance: 50, // Starting balance from registration
        userId: userId,
        isActive: true,
        isVerified: false,
      };
      savePharmaCompany(mine);
    }
    setBalance(mine?.balance ?? 0);
    setReps(getSalesReps().filter(r => r.pharmaId === mine?.id || r.pharmaId === mine?.userId));
    setVisits(getVisits().filter(v => v.pharmaId === mine?.id || v.pharmaId === mine?.userId));
  }, [userId, t, user?.user_metadata?.organization, user?.email]);

  const companies = getPharmaCompanies();
  const mine = companies.find(c => c.userId === userId) || companies.find(c => c.id === userId);
  const country = mine?.location?.country || user?.user_metadata?.country || 'sa';

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const monthlyData = (() => {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => t(`month_${m}`));
    return months.map((name, i) => ({
      name,
      visits: visits.filter(v => new Date(v.date).getMonth() === i).length,
    }));
  })();
  const chartData = monthlyData.some(m => m.visits > 0)
    ? monthlyData.filter(m => m.visits > 0)
    : monthlyData.slice(0, 6);

  const TYPE_ICONS = { 'In Person': MapPin, Video, Call: Phone, Text: MessageSquare };
  const recent = visits.slice(0, 5);

  const statusLabel: Record<string, string> = {
    Pending: t('pending'), Confirmed: t('confirmed'), Completed: t('completed'), Cancelled: t('cancelled'),
  };

  return (
    <div className="space-y-10">
      {/* Low Balance Warning */}
      {balance <= 500 && balance >= 0 && (
        <div className={cn(
          'rounded-3xl p-6 flex items-start gap-4 border backdrop-blur-md',
          balance === 0
            ? 'bg-red-500/10 border-red-500/20 text-red-500'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
        )}>
          <div className={cn(
            "p-3 rounded-2xl shadow-inner",
            balance === 0 ? "bg-red-500/10" : "bg-amber-500/10"
          )}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-black text-lg uppercase italic tracking-tighter">
              {balance === 0 ? t('outOfCredits') : t('lowCredits', { amount: formatCurrency(balance, country) })}
            </div>
            <div className="text-xs font-bold mt-1 opacity-80 uppercase tracking-widest leading-relaxed">
              {balance === 0 ? t('outOfCreditsDesc') : t('lowCreditsDesc')}
            </div>
            <Button onClick={() => navigate('/bundles')} variant="link" className="mt-4 p-0 h-auto text-xs font-black uppercase tracking-[0.2em] underline underline-offset-4">
              {t('buyBundle_link')} <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: t('totalReps'), value: reps.length, sub: `${reps.filter(r => r.visitsThisMonth > 0).length} ${t('active')}`, icon: Users, color: 'emerald' },
          { label: t('totalVisits'), value: visits.length, sub: `${visits.filter(v => v.status === 'Pending').length} ${t('pendingCount')}`, icon: CalendarIcon, color: 'blue' },
          { label: t('conversionRate'), value: visits.length > 0 ? `${Math.round((visits.filter(v => v.status === 'Completed').length / visits.length) * 100)}%` : '0%', sub: t('completedVisitsStat'), icon: TrendingUp, color: 'amber' },
          { label: t('availableCredits'), value: `${balance.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${getCurrencyInfo(country).code}`, sub: '', icon: CreditCard, color: 'purple' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 opacity-60">{label}</span>
              <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Icon className="h-6 w-6 text-brand" />
              </div>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">{value}</div>
            {sub && <div className="text-[10px] font-bold text-brand mt-4 uppercase tracking-[0.2em] italic">{sub}</div>}
          </div>
        ))}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


        {/* Recent Visits */}
        <div className="lg:col-span-2 glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-brand" />
                {t('recentVisits')}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] italic opacity-60 ml-8">{t('latestActivityOverview')}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')} className="text-[10px] font-black uppercase tracking-widest text-brand hover:bg-brand/10 h-10 px-4 rounded-xl border border-brand/20">
              {t('viewAll')}
            </Button>
          </div>
          {recent.length === 0 ? (
            <div className="py-16 text-center text-sm font-medium text-slate-400 dark:text-slate-500 italic uppercase tracking-[0.3em]">{t('noVisitsBooked')}</div>
          ) : (
            <div className="space-y-4">
              {recent.map(visit => {
                const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
                return (
                  <div key={visit.id} className="flex items-center justify-between p-4 rounded-2xl border dark:border-white/5 hover:bg-white dark:hover:bg-white/5 transition-all group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand shadow-inner group-hover:scale-110 transition-transform">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{visit.doctorName}</div>
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('rep')}: {visit.repName} • {visit.visitType}</div>
                      </div>
                    </div>
                    <span className={cn('px-4 py-2 text-[10px] rounded-xl border font-black uppercase tracking-widest italic shadow-sm', STATUS_COLORS[visit.status])}>
                      {statusLabel[visit.status] || visit.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-brand" />
            {t('monthlyVisits')}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
              <Tooltip 
                cursor={{ fill: 'currentColor', opacity: 0.05 }}
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
              />
              <Bar dataKey="visits" fill="var(--brand-clr)" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: t('addRep') || 'Add Representative', href: '/subordinates?add=true', icon: Plus, color: 'emerald' },
          { label: t('manageRepresentatives') || 'Manage Representatives', href: '/subordinates', icon: Users, color: 'slate' },
          { label: t('allBookings'), href: '/bookings', icon: CalendarIcon, color: 'slate' },
        ].map(({ label, href, icon: Icon, color }) => (
          <button key={label} onClick={() => navigate(href)} className={cn(
            "glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between hover:shadow-2xl transition-all group",
            color === 'emerald' ? "hover:border-emerald-500/30 bg-emerald-500/5" : "hover:border-emerald-500/20"
          )}>
            <div className="flex items-center gap-6">
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500",
                color === 'emerald' ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/40" : "bg-emerald-500/10 text-emerald-500 shadow-inner"
              )}>
                <Icon className="h-7 w-7" />
              </div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em] italic">{label}</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-500/5 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
