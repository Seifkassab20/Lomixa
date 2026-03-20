import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getDoctors, getHospitals, saveHospital, generateId } from '@/lib/store';
import { Stethoscope, Calendar, Activity, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export function HospitalDashboard() {
  const { userId, user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [doctors, setDoctors] = useState<ReturnType<typeof getDoctors>>([]);
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);

  useEffect(() => {
    const hospitals = getHospitals();
    let mine = hospitals.find(h => h.userId === userId);
    if (!mine && userId) {
      mine = {
        id: generateId(),
        name: user?.user_metadata?.organization || 'My Hospital',
        location: user?.user_metadata?.location || 'Riyadh',
        userId,
      };
      saveHospital(mine);
    }
    setDoctors(getDoctors().filter(d => d.hospitalId === mine?.id));
    setVisits(getVisits().filter(v => v.hospitalId === mine?.id));
  }, [userId]);

  const months = isRTL
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو']
    : ['Jan','Feb','Mar','Apr','May','Jun'];

  const monthlyData = months.map((name, i) => ({
    name,
    visits: visits.filter(v => new Date(v.date).getMonth() === i).length,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('totalDoctors'), value: doctors.length, sub: t('inYourFacility'), icon: Stethoscope, color: 'emerald' },
          { label: t('visitsThisWeek'), value: visits.filter(v => { const d = new Date(v.date); const now = new Date(); const diff = (now.getTime() - d.getTime()) / 86400000; return diff <= 7; }).length, sub: `${visits.filter(v => v.status === 'Pending').length} ${t('pendingCount')}`, icon: Calendar, color: 'blue' },
          { label: t('completedVisits'), value: visits.filter(v => v.status === 'Completed').length, sub: t('completedVisitsAll'), icon: Activity, color: 'amber' },
          { label: t('pharmaEngagement'), value: [...new Set(visits.map(v => v.pharmaId))].length, sub: t('activeCompanies'), icon: Users, color: 'purple' },
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
        {/* Doctor List Preview */}
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold dark:text-white">{t('doctorsOverview')}</h3>
            <button onClick={() => navigate('/doctors')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">{t('manageAll')}</button>
          </div>
          {doctors.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">{t('noDoctorsAdded')}</div>
          ) : (
            <div className="space-y-3">
              {doctors.slice(0, 4).map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                      {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium dark:text-white">{doc.name}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{doc.specialty}</div>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                    {doc.availability.filter(s => !s.isBooked).length} {t('open')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visit Chart */}
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <h3 className="font-semibold dark:text-white mb-4">{t('monthlyVisitActivity')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: t('manageDoctors'), href: '/doctors', icon: Stethoscope },
          { label: t('allBookings'), href: '/bookings', icon: Calendar },
          { label: t('analytics'), href: '/hospital-analytics', icon: Activity },
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
