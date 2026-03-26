import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getDoctors, saveDoctor, generateId } from '@/lib/store';
import { Calendar, Clock, CheckCircle2, DollarSign, Video, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { JitsiMeeting } from '@/components/JitsiMeeting';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function DoctorDashboard() {
  const { userId, user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);
  const [doctorId, setDoctorId] = useState('');
  const [meetingRoom, setMeetingRoom] = useState<string | null>(null);

  useEffect(() => {
    const doctors = getDoctors();
    let myDoc = doctors.find(d => d.userId === userId);
    if (!myDoc && userId) {
      myDoc = {
        id: generateId(),
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
      saveDoctor(myDoc);
    }
    if (myDoc) {
      setDoctorId(myDoc.id);
      const myVisits = getVisits().filter(v => v.doctorId === myDoc!.id);
      setVisits(myVisits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }
  }, [userId]);

  const today = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.date === today);
  const pendingVisits = visits.filter(v => v.status === 'Pending');
  const confirmedToday = todayVisits.filter(v => v.status === 'Confirmed');

  const TYPE_ICONS = { 'In Person': MapPin, Video, Call: Phone, Text: Clock };

  const statusLabel: Record<string, string> = {
    Pending: t('pending'), Confirmed: t('confirmed'), Completed: t('completed'), Cancelled: t('cancelled'),
  };

  return (
    <div className="space-y-6">
      {meetingRoom && <JitsiMeeting roomName={meetingRoom} displayName="Doctor" onClose={() => setMeetingRoom(null)} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('visitsTodayLabel'), value: todayVisits.length, sub: `${confirmedToday.length} ${t('confirmed')}`, icon: Calendar, color: 'emerald' },
          { label: t('pendingRequests'), value: pendingVisits.length, sub: t('needYourAction'), icon: Clock, color: 'amber' },
          { label: t('totalVisitsLabel'), value: visits.length, sub: `${visits.filter(v => v.status === 'Completed').length} ${t('completedVisitsStat')}`, icon: CheckCircle2, color: 'blue' },
          { label: t('earnings'), value: `﷼${visits.filter(v => v.status === 'Completed').reduce((sum, v) => sum + (v.price || 150), 0).toLocaleString()}`, sub: t('estFromVisits'), icon: DollarSign, color: 'purple' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold dark:text-white">{t('pendingRequests')}</h3>
            <button onClick={() => navigate('/my-bookings')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">{t('viewAll')}</button>
          </div>
          {pendingVisits.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">{t('noPendingRequests')}</div>
          ) : (
            <div className="space-y-3">
              {pendingVisits.slice(0, 3).map(visit => {
                const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
                return (
                  <div key={visit.id} className="p-3 rounded-lg border dark:border-slate-700 bg-amber-50/50 dark:bg-amber-500/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium dark:text-white">{visit.pharmaName}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{t('rep')}: {visit.repName} • {visit.visitType}</div>
                        <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">{visit.date} at {visit.time}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/my-bookings')}>
                          {t('review')}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold dark:text-white">{t('todayVisits')}</h3>
            <span className="text-xs text-gray-400 dark:text-slate-500">{new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          {todayVisits.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">{t('noVisitsToday')}</div>
          ) : (
            <div className="space-y-3">
              {todayVisits.map(visit => {
                const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
                return (
                  <div key={visit.id} className="p-3 rounded-lg border dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium dark:text-white">{visit.pharmaName}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{visit.time} • {visit.durationMinutes}min</div>
                      </div>
                    </div>
                    {visit.status === 'Confirmed' && visit.visitType === 'Video' && (
                      <Button size="sm" onClick={() => setMeetingRoom(`lomixa_${visit.id}`)} className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                        <Video className="h-3 w-3" /> {t('join')}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: t('myBookings'), href: '/my-bookings', icon: Calendar },
          { label: t('mySchedule'), href: '/schedule', icon: Clock },
          { label: t('settings'), href: '/settings', icon: CheckCircle2 },
        ].map(({ label, href, icon: Icon }) => (
          <button key={label} onClick={() => navigate(href)} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5 flex flex-col items-center gap-3 hover:border-emerald-500/50 hover:shadow-md transition-all group">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium dark:text-slate-300">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
