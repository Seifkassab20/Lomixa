import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getDoctors, getHospitals, saveHospital, saveDoctor, generateId, Hospital } from '@/lib/store';
import { Stethoscope, Calendar, Activity, Users, ArrowRight, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';



export function HospitalDashboard() {
  const { userId, user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [myFacility, setMyFacility] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<ReturnType<typeof getDoctors>>([]);
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);

  const loadData = React.useCallback(() => {
    const hospitals = getHospitals();
    const mine = hospitals.find(h => h.userId === userId);
    setMyFacility(mine || null);
    
    const allDocs = getDoctors();
    const facilityDocs = allDocs.filter(d => d.hospitalId === mine?.id);
    setDoctors(facilityDocs);
    
    const allVisits = getVisits();
    const facilityVisits = allVisits.filter(v => v.hospitalId === mine?.id);
    setVisits(facilityVisits);
  }, [userId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const earningsValue = formatCurrency(myFacility?.balance || 0, myFacility?.location?.country || 'sa');



  const handleToggleDoctor = (doc: any) => {
    saveDoctor({ ...doc, isActive: !doc.isActive });
    if (myFacility) {
      setDoctors(getDoctors().filter(d => d.hospitalId === myFacility.id));
    }
  };

  const months = [1, 2, 3, 4, 5, 6].map(m => t(`month_${m}`));

  const monthlyData = months.map((name, i) => ({
    name,
    visits: visits.filter(v => new Date(v.date).getMonth() === i).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('totalDoctors'), value: doctors.length, sub: myFacility?.type === 'clinic' ? t('clinic') : t('inYourFacility'), icon: Stethoscope, color: 'emerald' },
          { label: t('visitsThisWeek'), value: visits.filter(v => { const d = new Date(v.date); const now = new Date(); const diff = (now.getTime() - d.getTime()) / 86400000; return diff <= 7; }).length, sub: `${visits.filter(v => v.status === 'Pending').length} ${t('pendingCount')}`, icon: Calendar, color: 'blue' },
          { label: t('completedVisits'), value: visits.filter(v => v.status === 'Completed').length, sub: t('completedVisitsAll'), icon: Activity, color: 'amber' },
          { label: t('earnings'), value: earningsValue, sub: t('estFromVisits'), icon: DollarSign, color: 'purple' },
        ].map(({ label, value, sub, icon: Icon, color }) => (

          <div key={label} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</span>
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", 
                color === 'emerald' && "bg-emerald-100 dark:bg-emerald-500/20",
                color === 'blue' && "bg-blue-100 dark:bg-blue-500/20",
                color === 'amber' && "bg-amber-100 dark:bg-amber-500/20",
                color === 'purple' && "bg-purple-100 dark:bg-purple-500/20"
              )}>
                <Icon className={cn("h-4 w-4", 
                  color === 'emerald' && "text-emerald-600 dark:text-emerald-400",
                  color === 'blue' && "text-blue-600 dark:text-blue-400",
                  color === 'amber' && "text-amber-600 dark:text-amber-400",
                  color === 'purple' && "text-purple-600 dark:text-purple-400"
                )} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="font-semibold dark:text-white">{t('doctorsOverview')}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter italic">{t('clinicalStaffDirectory')}</p>
            </div>
          </div>
          {doctors.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">{t('noDoctorsAdded')}</div>
          ) : (
            <div className="space-y-3">
              {doctors.slice(0, 4).map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm shadow-inner group-hover:scale-110 transition-transform">
                      {doc.name.split(' ').filter(n => ['Dr.', 'Prof.', 'Asst.', 'Assoc.', 'Dr', 'Prof', 'Asst', 'Assoc'].every(t => !n.startsWith(t))).map(n => n[0]).join('').slice(0, 2) || doc.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-black dark:text-white flex items-center gap-2">
                        {doc.name}
                        {!doc.isActive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest">{t(`spec_${doc.specialty}`) || doc.specialty}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                      {doc.availability?.filter(s => !s.isBooked).length || 0} {t('open')}
                    </div>
                    <button
                      onClick={() => handleToggleDoctor(doc)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all",
                        doc.isActive 
                          ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                      )}
                    >
                      {doc.isActive ? t('deactivate') : t('activate')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <h3 className="font-semibold dark:text-white mb-4">{t('monthlyVisitActivity')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
              <Tooltip 
                cursor={{ fill: 'currentColor', opacity: 0.05 }}
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="visits" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: t('manageDoctors') || 'Manage Doctors', href: '/doctors', icon: Stethoscope },
          { label: t('allBookings') || 'All Bookings', href: '/bookings', icon: Calendar },
        ].map(({ label, href, icon: Icon }) => (
          <button key={label} onClick={() => navigate(href)} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-6 flex items-center justify-between hover:border-emerald-500/50 hover:shadow-md transition-all group text-left">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest italic">{label}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
