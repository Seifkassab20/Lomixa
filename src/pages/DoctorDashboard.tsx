import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getDoctors, saveDoctor, generateId, getAppointments, Appointment, getServerTime } from '@/lib/store';
import { Calendar, Clock, CheckCircle2, DollarSign, Video, Phone, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { JitsiMeeting } from '@/components/JitsiMeeting';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/currency';
import { VideoCall } from '@/components/VideoCall';



export function DoctorDashboard() {
  const { userId, user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);
  const [doctorId, setDoctorId] = useState('');
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [balance, setBalance] = useState(0);
  const [country, setCountry] = useState(user?.user_metadata?.country || 'sa');
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [myDoc, setMyDoc] = useState<any>(null);
  
  const refreshData = () => {
    const doctors = getDoctors();
    let doc = doctors.find(d => d.userId === userId);
    if (!doc && userId) {
      doc = {
        id: userId,
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('docUser'),
        specialty: user?.user_metadata?.specialty || t('spec_general'),
        experienceYears: user?.user_metadata?.experienceYears || 0,
        phone: user?.user_metadata?.mobile || '',
        email: user?.email || '',
        hospitalId: 'default',
        hospitalName: user?.user_metadata?.organization || t('hospital'),
        availability: [],
        userId,
        isActive: true,
        isVerified: true,
      };
      saveDoctor(doc);
    }
    if (doc) {
      setMyDoc(doc);
      setDoctorId(doc.id);
      setBalance(doc.balance || 0);
      setCountry(doc.location?.country || user?.user_metadata?.country || 'sa');
      const myVisits = getVisits().filter(v => v.doctorId === doc!.id);
      setVisits(myVisits.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
      getServerTime().then(setServerTime);
    }, 10000);
    getServerTime().then(setServerTime);
    return () => clearInterval(interval);
  }, [userId]);

  const today = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.date === today);
  const pendingVisits = visits.filter(v => v.status === 'Pending');
  const confirmedToday = todayVisits.filter(v => v.status === 'Confirmed');

  const TYPE_ICONS = { 'In Person': MapPin, Video, Call: Phone, Text: Clock };

  const statusLabel: Record<string, string> = {
    Pending: t('pending'), Confirmed: t('confirmed'), Completed: t('completed'), Cancelled: t('cancelled'),
  };

  const isAffiliated = !doctorId || (getDoctors().find(d => d.id === doctorId)?.hospitalId !== 'default');
  const kpiCardsCount = isAffiliated ? 3 : 4;

  return (
    <div className="space-y-10">
      {activeAppointment && <VideoCall appointment={activeAppointment} onClose={() => setActiveAppointment(null)} />}

      {/* Live Meeting Alert */}
      {(() => {
        const liveMeeting = visits.find(v => {
          if (v.status !== 'Confirmed' || v.visitType !== 'Video') return false;
          const appointment = getAppointments().find(a => 
            a.doctorId === v.doctorId && 
            new Date(a.startTime).toDateString() === new Date(v.date).toDateString()
          );
          if (!appointment) return false;
          const now = serverTime.getTime();
          const start = new Date(appointment.startTime).getTime();
          const end = new Date(appointment.endTime).getTime();
          const fiveMins = 5 * 60 * 1000;
          return now >= (start - fiveMins) && now <= end;
        });

        if (!liveMeeting) return null;

        const appointment = getAppointments().find(a => 
          a.doctorId === liveMeeting.doctorId && 
          new Date(a.startTime).toDateString() === new Date(liveMeeting.date).toDateString()
        )!;

        const isNow = serverTime.getTime() >= new Date(appointment.startTime).getTime();

        return (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6 mb-8"
          >
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 animate-pulse">
                <Video className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">{isNow ? 'Meeting is Live' : 'Meeting Starting Soon'}</span>
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Session With {liveMeeting.repName}</h2>
                <p className="text-sm text-blue-100/80 font-medium">{liveMeeting.time} ({liveMeeting.durationMinutes}min) • {liveMeeting.pharmaName}</p>
              </div>
            </div>
            <Button 
              onClick={() => setActiveAppointment(appointment)}
              className="bg-white text-blue-600 hover:bg-blue-50 h-14 rounded-2xl px-10 font-black uppercase tracking-widest italic shadow-xl"
            >
              <Video className="h-5 w-5 mr-2" /> {t('joinNow')}
            </Button>
          </motion.div>
        );
      })()}

      {/* KPI Cards */}
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-8",
        kpiCardsCount === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
      )}>


        {[
          { label: t('visitsTodayLabel'), value: todayVisits.length, sub: `${confirmedToday.length} ${t('confirmed')}`, icon: Calendar, color: 'emerald' },
          { label: t('pendingRequests'), value: pendingVisits.length, sub: t('needYourAction'), icon: Clock, color: 'amber' },
          { label: t('totalVisitsLabel'), value: visits.length, sub: `${visits.filter(v => v.status === 'Completed').length} ${t('completedVisitsStat')}`, icon: CheckCircle2, color: 'blue' },
          ...((!doctorId || (getDoctors().find(d => d.id === doctorId)?.hospitalId === 'default')) 
            ? [{ label: t('earnings'), value: formatCurrency(balance, country), sub: t('estFromVisits'), icon: DollarSign, color: 'purple' }] 
            : []
          ),
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


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


        {/* Pending Requests */}
        <div className="glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              {t('pendingRequests')}
            </h3>
            <button onClick={() => navigate('/my-bookings')} className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline">{t('viewAll')}</button>
          </div>
          {pendingVisits.length === 0 ? (
            <div className="py-12 text-center text-sm font-medium text-slate-400 dark:text-slate-500 italic uppercase tracking-widest">{t('noPendingRequests')}</div>
          ) : (
            <div className="space-y-4">
              {pendingVisits.slice(0, 3).map(visit => {
                const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
                return (
                  <div key={visit.id} className="p-4 rounded-2xl border dark:border-white/5 bg-amber-500/5 hover:bg-amber-500/10 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{visit.pharmaName}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{t('rep')}: {visit.repName} • {visit.visitType}</div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase mt-1 italic">{visit.date} at {visit.time}</div>
                        </div>
                      </div>
                      <Button size="sm" className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest px-4" onClick={() => navigate('/my-bookings')}>
                        {t('review')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-500" />
              {t('todayVisits')}
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          {todayVisits.length === 0 ? (
            <div className="py-12 text-center text-sm font-medium text-slate-400 dark:text-slate-500 italic uppercase tracking-widest">{t('noVisitsToday')}</div>
          ) : (
            <div className="space-y-4">
              {todayVisits.map(visit => {
                const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
                return (
                  <div key={visit.id} className="p-4 rounded-2xl border dark:border-white/5 hover:bg-white dark:hover:bg-white/5 transition-all flex items-center justify-between shadow-sm group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{visit.pharmaName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{visit.time} • {visit.durationMinutes}min</div>
                      </div>
                    </div>
                    {visit.status === 'Confirmed' && visit.visitType === 'Video' && (() => {
                        const appointment = getAppointments().find(a => 
                           a.doctorId === visit.doctorId && 
                           new Date(a.startTime).toDateString() === new Date(visit.date).toDateString()
                        );
                        
                        if (!appointment) return null;
                        
                        const now = serverTime.getTime();
                        const start = new Date(appointment.startTime).getTime();
                        const end = new Date(appointment.endTime).getTime();
                        const fiveMins = 5 * 60 * 1000;
                        
                        const isNow = now >= start && now <= end;
                        const isFuture = now < (start - fiveMins);
                        const isEnded = now > end;
                        
                        if (isEnded || isFuture) return null;

                        return (
                          <Button 
                            size="sm" 
                            onClick={() => setActiveAppointment(appointment)} 
                            className={cn(
                              "h-9 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg transition-all",
                              isNow 
                                ? "bg-[#39b596] hover:bg-emerald-500 text-white shadow-emerald-500/20 animate-pulse" 
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                            )}
                          >
                            <Video className="h-4 w-4" /> {t('joinNow') || 'Join Now'}
                          </Button>
                        );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {[
          { label: t('myBookings'), href: '/my-bookings', icon: Calendar },
          { label: t('mySchedule'), href: '/schedule', icon: Clock },
          { label: t('settings'), href: '/settings', icon: CheckCircle2 },
        ].map(({ label, href, icon: Icon }) => (
          <button key={label} onClick={() => navigate(href)} className="glass-card shadow-premium border dark:border-white/5 rounded-[2rem] p-8 flex flex-col items-center gap-4 hover:shadow-2xl transition-all group">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
              <Icon className="h-7 w-7" />
            </div>
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em] italic">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
