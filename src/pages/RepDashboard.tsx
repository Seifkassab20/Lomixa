import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getSalesReps, saveSalesRep, useStoreListener, Appointment, getAppointments, getServerTime } from '@/lib/store';
import { Calendar, CreditCard, Clock, Target, Video, Phone, MapPin, X, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VideoCall } from '@/components/VideoCall';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, getCurrencyInfo } from '@/lib/currency';


export function RepDashboard() {
  const { userId, user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);
  const [balance, setBalance] = useState(0);
  const [country, setCountry] = useState(user?.user_metadata?.country || 'sa');
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(500);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [repInfo, setRepInfo] = useState({ name: '', pharmaId: '', pharmaName: '', target: 25, id: '' });

  const loadData = React.useCallback(async () => {
    const reps = getSalesReps();
    const myRep = reps.find(r => r.userId === userId);
    if (myRep) {
       setRepInfo({ id: myRep.id, name: myRep.name, pharmaId: myRep.pharmaId, pharmaName: myRep.pharmaName, target: myRep.target });
       const myVisits = getVisits().filter(v => v.repId === myRep!.id);
       setVisits(myVisits.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
       setBalance(myRep!.balance || 0);
       setCountry(myRep!.location?.country || user?.user_metadata?.country || 'sa');
    }
    setLoading(false);
  }, [userId]);

  useStoreListener(loadData);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
       loadData();
       getServerTime().then(setServerTime);
    }, 10000);
    getServerTime().then(setServerTime);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
     return (
        <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
           <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center animate-spin">
              <div className="h-6 w-6 rounded-lg bg-emerald-500/20" />
           </div>
           <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse italic">{t('synchronizingGrid')}</div>
        </div>
     );
  }

  const TYPE_ICONS = { 'In Person': MapPin, Video, Call: Phone, Text: Clock };
  const thisMonth = new Date().getMonth();
  const monthVisits = visits.filter(v => new Date(v.date).getMonth() === thisMonth && v.status === 'Completed').length;
  const pendingVisits = visits.filter(v => v.status === 'Pending');
  const confirmedVisits = visits.filter(v => v.status === 'Confirmed');
  const recentVisits = visits.slice(0, 5);

  const statusColors: Record<string, string> = {
    Pending: 'text-amber-600 dark:text-amber-400',
    Confirmed: 'text-emerald-600 dark:text-emerald-400',
    Completed: 'text-blue-600 dark:text-blue-400',
    Cancelled: 'text-red-600 dark:text-red-400',
  };
  const statusLabel: Record<string, string> = {
    Pending: t('pending'), Confirmed: t('confirmed'), Completed: t('completed'), Cancelled: t('cancelled'),
  };

  return (
    <div className="space-y-10">
      {activeAppointment && (
        <VideoCall appointment={activeAppointment} onClose={() => setActiveAppointment(null)} />
      )}

      {/* KPI Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('visitsThisMonth'), value: monthVisits, sub: `${t('target')}: ${repInfo.target}`, icon: Calendar, color: 'emerald' },
          { label: t('myCredits'), value: formatCurrency(balance, country), sub: t('availableForBookings'), icon: CreditCard, color: 'blue' },
          { label: t('pendingApprovals'), value: pendingVisits.length, sub: t('awaitingResponse'), icon: Clock, color: 'amber' },
          { label: t('confirmedVisits'), value: confirmedVisits.length, sub: t('readyToAttend'), icon: Target, color: 'purple' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="glass-card shadow-premium border dark:border-white/5 rounded-[2rem] p-6 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</span>
              <div className={`h-10 w-10 rounded-2xl bg-${color}-500/10 flex items-center justify-center shadow-inner`}>
                <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{value}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 uppercase tracking-widest">{sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
            <Target className="w-5 h-5 text-emerald-500" />
            {t('monthlyTarget')}
          </h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{monthVisits} / {repInfo.target} {t('myVisits')}</span>
        </div>
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-0.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{ width: `${Math.min(100, Math.round((monthVisits / repInfo.target) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 px-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">0</span>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">{Math.round((monthVisits / repInfo.target) * 100)}{t('percentCompleted')}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{repInfo.target}</span>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


        {/* Recent Visits */}
        <div className="lg:col-span-2 glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-500" />
              {t('upcomingVisits')}
            </h3>
            <button onClick={() => navigate('/visits')} className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline">{t('viewAll')}</button>
          </div>
          {recentVisits.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-6 italic uppercase tracking-widest">{t('noVisitsYet')}</p>
              <Button onClick={() => navigate('/book')} className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-2xl px-8 font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">{t('bookNewVisit')}</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentVisits.map(visit => {
                const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
                return (
                  <div key={visit.id} className="flex items-center justify-between p-4 rounded-2xl border dark:border-white/5 hover:bg-white dark:hover:bg-white/5 transition-all group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{visit.doctorName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{visit.date} at {visit.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {visit.status === 'Confirmed' && visit.visitType === 'Video' && (() => {
                          const appointment = getAppointments().find(a => 
                             a.doctorId === visit.doctorId && 
                             a.repId === visit.repId && 
                             a.startTime.includes(visit.date)
                          );
                          
                          if (!appointment) return null;
                          
                          const now = serverTime.getTime();
                          const start = new Date(appointment.startTime).getTime();
                          const end = new Date(appointment.endTime).getTime();
                          const isNow = now >= start && now <= end;
                          
                          if (!isNow) return null;

                          return (
                            <Button size="sm" onClick={() => setActiveAppointment(appointment)} className="h-9 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-blue-500/20 animate-pulse">
                              <Video className="h-4 w-4" /> {t('join')}
                            </Button>
                          );
                      })()}
                      <span className={cn('text-[10px] font-black uppercase tracking-widest italic', statusColors[visit.status])}>
                        {statusLabel[visit.status] || visit.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <Activity className="w-5 h-5 text-emerald-500" />
              {t('quickActions')}
            </h3>
            <div className="space-y-3">
              {[
                { label: t('bookNewVisit'), href: '/book', icon: Calendar, primary: true },
                { label: t('myVisits'), href: '/visits', icon: Clock, primary: false },
              ].map(({ label, href, icon: Icon, primary }) => (
                <Button key={label} onClick={() => navigate(href)} className={cn('w-full h-14 rounded-2xl justify-start gap-4 px-6 font-black uppercase tracking-widest italic shadow-lg transition-all active:scale-[0.98]', primary ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white text-slate-900 shadow-none')} variant="ghost">
                  <Icon className="h-5 w-5" />{label}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-premium transition-all hover:bg-emerald-500/15">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">{t('myCredits')}</div>
               <Button size="sm" variant="ghost" onClick={() => setShowTopup(true)} className="h-8 rounded-xl text-[9px] uppercase font-black tracking-[0.2em] text-emerald-600 hover:text-white hover:bg-emerald-500 bg-emerald-500/10 px-3 border border-emerald-500/20 transition-all">
                  {t('topUp')}
               </Button>
            </div>
              <div className="text-4xl font-black italic tracking-tighter text-emerald-700 dark:text-emerald-300 relative z-10">
                {balance.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {getCurrencyInfo(country).code}
              </div>
             <div className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-500/60 mt-2 uppercase tracking-widest relative z-10 italic">{t('availableForBookings')}</div>
          </div>

          {showTopup && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 sm:p-12">
               <div className="glass-card shadow-3xl border dark:border-white/10 rounded-[3rem] p-10 w-full max-w-md animate-in zoom-in-95 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
                  <div className="flex items-center justify-between mb-10 relative z-10">
                     <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">{t('topUpBalance')}</h2>
                     <button onClick={() => setShowTopup(false)} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-white transition-all">
                        <X className="h-5 w-5" />
                     </button>
                  </div>
                  <div className="space-y-8 relative z-10">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6 opacity-60">
                          {t('amount')} ({formatCurrency(0, country).replace(/[0-9.,٠-٩]/g, '').trim()})
                        </Label>
                        <Input type="number" value={topupAmount} onChange={e => setTopupAmount(parseInt(e.target.value) || 0)} className="h-16 rounded-2xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-2xl font-black italic px-8 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" />
                     </div>
                     <div className="p-5 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-4 shadow-inner">
                        <div className="bg-slate-100 dark:bg-white/10 h-12 rounded-xl px-5 flex items-center gap-4">
                           <CreditCard className="w-5 h-5 text-emerald-500" />
                           <span className="text-xs font-mono font-bold tracking-widest text-slate-400">•••• •••• •••• 1234</span>
                        </div>
                     </div>
                     <Button 
                       onClick={() => {
                         const currentRep = getSalesReps().find(r => r.userId === userId);
                         if (currentRep) {
                           const updatedRep = { ...currentRep, balance: (currentRep.balance || 0) + topupAmount };
                           saveSalesRep(updatedRep);
                           setBalance(updatedRep.balance);
                           setShowTopup(false);
                           toast(t('topupSuccess'), 'success');
                         }
                       }}
                       className="w-full h-16 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] italic shadow-2xl shadow-emerald-500/40 transition-all active:scale-[0.98]"
                     >
                        {t('confirmPayment')}
                     </Button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
