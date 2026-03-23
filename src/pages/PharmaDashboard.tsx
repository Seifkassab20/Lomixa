import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getSalesReps, getPharmaCompanies, getDoctors, getNotifications, savePharmaCompany, generateId } from '@/lib/store';
import { Users, Activity, CreditCard, Calendar as CalendarIcon, Video, Phone, MapPin, MessageSquare, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
  const [credits, setCredits] = useState(0);

  const loadData = useCallback(() => {
    const companies = getPharmaCompanies();
    let mine = companies.find(c => c.userId === userId);
    if (!mine && userId) {
      mine = {
        id: generateId(),
        name: user?.user_metadata?.organization || user?.email?.split('@')[1]?.split('.')[0] || 'My Pharma Company',
        credits: 100,
        userId,
        isActive: true,
        isVerified: false,
      };
      savePharmaCompany(mine);
    }
    setCredits(mine?.credits ?? 0);
    setReps(getSalesReps().filter(r => r.pharmaId === mine?.id));
    setVisits(getVisits().filter(v => v.pharmaId === mine?.id));
  }, [userId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const monthlyData = (() => {
    const months = isRTL
      ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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
    <div className="space-y-6">
      {/* Low Credits Warning */}
      {credits <= 10 && credits >= 0 && (
        <div className={cn(
          'rounded-xl p-4 flex items-start gap-3 border',
          credits === 0
            ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
        )}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">
              {credits === 0 ? t('outOfCredits') : t('lowCredits', { count: credits })}
            </div>
            <div className="text-xs mt-0.5 opacity-80">
              {credits === 0 ? t('outOfCreditsDesc') : t('lowCreditsDesc')}
            </div>
            <button onClick={() => navigate('/bundles')} className="mt-2 text-xs underline font-medium">
              {t('buyBundle_link')}
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('totalReps'), value: reps.length, sub: `${reps.filter(r => r.visitsThisMonth > 0).length} ${t('active')}`, icon: Users, color: 'emerald' },
          { label: t('totalVisits'), value: visits.length, sub: `${visits.filter(v => v.status === 'Pending').length} ${t('pendingCount')}`, icon: CalendarIcon, color: 'blue' },
          { label: t('conversionRate'), value: visits.length > 0 ? `${Math.round((visits.filter(v => v.status === 'Completed').length / visits.length) * 100)}%` : '0%', sub: t('completedVisitsStat'), icon: TrendingUp, color: 'amber' },
          { label: t('availableCredits'), value: credits.toLocaleString(), sub: '', icon: CreditCard, color: 'purple' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</span>
              <div className={`h-8 w-8 rounded-lg bg-${color}-100 dark:bg-${color}-500/20 flex items-center justify-center`}>
                <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            {sub && <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Visits */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('recentVisits')}</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')} className="text-xs text-emerald-600 dark:text-emerald-400">{t('viewAll')}</Button>
          </div>
          {recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">{t('noVisitsBooked')}</div>
          ) : (
            <div className="space-y-3">
              {recent.map(visit => {
                const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
                return (
                  <div key={visit.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium dark:text-white">{visit.doctorName}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{t('rep')}: {visit.repName} • {visit.visitType}</div>
                      </div>
                    </div>
                    <span className={cn('px-2.5 py-0.5 text-[10px] rounded-full border font-medium', STATUS_COLORS[visit.status])}>
                      {statusLabel[visit.status] || visit.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('monthlyVisits')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="visits" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: t('manageRepresentatives') || 'Manage Representatives', href: '/subordinates', icon: Users },
          { label: t('allBookings'), href: '/bookings', icon: CalendarIcon },
        ].map(({ label, href, icon: Icon }) => (
          <button key={label} onClick={() => navigate(href)} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-6 flex items-center justify-between hover:border-emerald-500/50 hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-widest">{label}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
