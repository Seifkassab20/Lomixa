import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getSalesReps, getPharmaCompanies, saveSalesRep, generateId } from '@/lib/store';
import { Calendar, CreditCard, Clock, Target, Video, Phone, MapPin, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JitsiMeeting } from '@/components/JitsiMeeting';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/currency';

export function RepDashboard() {
  const { userId, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);
  const [balance, setBalance] = useState(0);
  const [country, setCountry] = useState('sa');
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(500);
  const [meetingRoom, setMeetingRoom] = useState<string | null>(null);
  const [repInfo, setRepInfo] = useState({ name: '', pharmaId: '', pharmaName: '', target: 25 });

  useEffect(() => {
    const reps = getSalesReps();
    let myRep = reps.find(r => r.userId === userId);
    if (!myRep && userId) {
      const companies = getPharmaCompanies();
      const myCompany = companies.find(c => c.userId === userId) || companies[0];
      myRep = {
        id: userId,
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('repUser'),
        email: user?.email || '',
        phone: user?.user_metadata?.mobile || '',
        pharmaId: myCompany?.id || 'default',
        pharmaName: myCompany?.name || t('myPharma'),
        visitsThisMonth: 0,
        target: 25,
        userId: userId,
        balance: 0,
        isActive: true,
        isVerified: true,
      };
      saveSalesRep(myRep);
    }
    if (myRep) {
      setRepInfo({ name: myRep.name, pharmaId: myRep.pharmaId, pharmaName: myRep.pharmaName, target: myRep.target });
      const myVisits = getVisits().filter(v => v.repId === myRep!.id);
      setVisits(myVisits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setBalance(myRep!.balance || 0);
      setCountry(myRep!.location?.country || 'sa');
    }
  }, [userId, t, user?.email, user?.user_metadata?.full_name, user?.user_metadata?.mobile]);

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
    <div className="space-y-6">
      {meetingRoom && <JitsiMeeting roomName={meetingRoom} displayName={repInfo.name} onClose={() => setMeetingRoom(null)} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('visitsThisMonth'), value: monthVisits, sub: `${t('target')}: ${repInfo.target}`, icon: Calendar, color: 'emerald' },
          { label: t('myCredits') || 'My Balance', value: formatCurrency(balance, country), sub: t('availableForBookings'), icon: CreditCard, color: 'blue' },
          { label: t('pendingApprovals'), value: pendingVisits.length, sub: t('awaitingResponse'), icon: Clock, color: 'amber' },
          { label: t('confirmedVisits'), value: confirmedVisits.length, sub: t('readyToAttend'), icon: Target, color: 'purple' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</span>
              <div className={`h-8 w-8 rounded-lg bg-${color}-100 dark:bg-${color}-500/20 flex items-center justify-center`}>
                <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold dark:text-white">{t('monthlyTarget')}</h3>
          <span className="text-sm text-gray-500 dark:text-slate-400">{monthVisits} / {repInfo.target} {t('myVisits')}</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.round((monthVisits / repInfo.target) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400 dark:text-slate-500">0</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{Math.round((monthVisits / repInfo.target) * 100)}{t('percentCompleted')}</span>
          <span className="text-xs text-gray-400 dark:text-slate-500">{repInfo.target}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Visits */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold dark:text-white">{t('upcomingVisits')}</h3>
            <button onClick={() => navigate('/visits')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">{t('viewAll')}</button>
          </div>
          {recentVisits.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-slate-500 mb-3">{t('noVisitsYet')}</p>
              <Button onClick={() => navigate('/book')} className="bg-emerald-600 hover:bg-emerald-700 text-white">{t('bookNewVisit')}</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVisits.map(visit => {
                const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
                return (
                  <div key={visit.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium dark:text-white">{visit.doctorName}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{visit.date} at {visit.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {visit.status === 'Confirmed' && visit.visitType === 'Video' && (
                        <Button size="sm" onClick={() => setMeetingRoom(`lomixa_${visit.id}`)} className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                          <Video className="h-3 w-3" /> {t('join')}
                        </Button>
                      )}
                      <span className={cn('text-xs font-medium', statusColors[visit.status])}>
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
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
            <h3 className="font-semibold dark:text-white mb-4">{t('quickActions')}</h3>
            <div className="space-y-2">
              {[
                { label: t('bookNewVisit'), href: '/book', icon: Calendar, primary: true },
                { label: t('myVisits'), href: '/visits', icon: Clock, primary: false },
              ].map(({ label, href, icon: Icon, primary }) => (
                <Button key={label} onClick={() => navigate(href)} className={cn('w-full justify-start gap-2', primary ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white bg-gray-100 hover:bg-gray-200 text-gray-900')} variant="ghost">
                  <Icon className="h-4 w-4" />{label}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
               <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{t('myCredits') || 'My Balance'}</div>
               <Button size="sm" variant="ghost" onClick={() => setShowTopup(true)} className="h-6 text-[10px] uppercase font-black tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 h-7 rounded-lg">
                  {t('topUp') || 'Add Funds'}
               </Button>
            </div>
             <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(balance, country)}</div>
             <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">{t('availableForBookings')}</div>
          </div>

          {showTopup && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-md border dark:border-slate-800 shadow-3xl animate-in zoom-in-95">
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-2xl font-black italic uppercase tracking-tighter dark:text-white">{t('topUpBalance') || 'Top Up My Balance'}</h2>
                     <button onClick={() => setShowTopup(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                     </button>
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">
                          Amount ({formatCurrency(0, country).split('0')[1].trim() || formatCurrency(0, country).split('٠')[1]?.trim() || 'Amount'})
                        </Label>
                        <Input type="number" value={topupAmount} onChange={e => setTopupAmount(parseInt(e.target.value) || 0)} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xl font-black italic px-6 focus:border-emerald-500" />
                     </div>
                     <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 space-y-4">
                        <div className="bg-slate-100 dark:bg-slate-900 h-10 rounded-xl px-4 flex items-center gap-3">
                           <CreditCard className="w-4 h-4 text-slate-400" />
                           <span className="text-xs font-mono tracking-tighter text-slate-400">•••• •••• •••• 1234</span>
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
                           toast({ title: t('topupSuccess') || 'Balance updated successfully!', variant: 'success' });
                         }
                       }}
                       className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest italic"
                     >
                        Confirm Payment
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
