import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getDoctors, getHospitals, saveHospital, saveDoctor, generateId, Hospital } from '@/lib/store';
import { Stethoscope, Calendar, Activity, Users, ArrowRight, DollarSign, Plus } from 'lucide-react';
import { formatCurrency, getCurrencyInfo } from '@/lib/currency';

import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';



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

  const currencyInfo = getCurrencyInfo(myFacility?.location?.country || user?.user_metadata?.country || 'sa');
  const earningsValue = `${(myFacility?.balance || 0).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currencyInfo.code}`;



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
    <div className="space-y-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('totalDoctors'), value: doctors.length, sub: myFacility?.type === 'clinic' ? t('clinic') : t('inYourFacility'), icon: Stethoscope, color: 'emerald' },
          { label: t('visitsThisWeek'), value: visits.filter(v => { const d = new Date(v.date); const now = new Date(); const diff = (now.getTime() - d.getTime()) / 86400000; return diff <= 7; }).length, sub: `${visits.filter(v => v.status === 'Pending').length} ${t('pendingCount')}`, icon: Calendar, color: 'blue' },
          { label: t('completedVisits'), value: visits.filter(v => v.status === 'Completed').length, sub: t('completedVisitsAll'), icon: Activity, color: 'amber' },
          { label: t('earnings'), value: earningsValue, sub: t('estFromVisits'), icon: DollarSign, color: 'purple' },
        ].map(({ label, value, sub, icon: Icon, color }) => (

          <div key={label} className="glass-card shadow-premium border dark:border-white/5 rounded-[2rem] p-6 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</span>
              <div className="h-10 w-10 rounded-2xl bg-brand/10 flex items-center justify-center shadow-inner">
                <Icon className="h-5 w-5 text-brand" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{value}</div>
            {sub && <div className="text-[10px] font-bold text-brand mt-2 uppercase tracking-widest">{sub}</div>}
          </div>
        ))}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


        <div className="glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
                <Users className="w-5 h-5 text-brand" />
                {t('doctorsOverview')}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] italic opacity-60 ml-8">{t('clinicalStaffDirectory')}</p>
            </div>
            <Button onClick={() => navigate('/doctors?add=true')} size="sm" className="bg-brand/10 text-brand hover:bg-brand hover:text-white border border-brand/20 text-[10px] font-black uppercase tracking-widest px-4 h-10 rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> {t('add')}
            </Button>
          </div>
          {doctors.length === 0 ? (
            <div className="py-12 text-center text-sm font-medium text-slate-400 dark:text-slate-500 italic uppercase tracking-widest">{t('noDoctorsAdded')}</div>
          ) : (
            <div className="space-y-4">
              {doctors.slice(0, 4).map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl border dark:border-white/5 hover:bg-white dark:hover:bg-white/5 transition-all group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
                      {doc.name.split(' ').filter(n => ['Dr.', 'Prof.', 'Asst.', 'Assoc.', 'Dr', 'Prof', 'Asst', 'Assoc'].every(t => !n.startsWith(t))).map(n => n[0]).join('').slice(0, 2) || doc.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        {doc.name}
                        {!doc.isActive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{t(`spec_${doc.specialty}`) === `spec_${doc.specialty}` ? doc.specialty : t(`spec_${doc.specialty}`)}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">
                      {doc.availability?.filter(s => !s.isBooked).length || 0} {t('open')}
                    </div>
                    <button
                      onClick={() => handleToggleDoctor(doc)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        doc.isActive 
                          ? "bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 hover:bg-emerald-500 hover:text-white"
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

        <div className="glass-card shadow-premium border dark:border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white mb-8 flex items-center gap-3">
             <Activity className="w-5 h-5 text-brand" />
             {t('monthlyVisitActivity')}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          { label: t('manageDoctors') || 'Manage Doctors', href: '/doctors', icon: Stethoscope },
          { label: t('allBookings') || 'All Bookings', href: '/bookings', icon: Calendar },
        ].map(({ label, href, icon: Icon }) => (
          <button key={label} onClick={() => navigate(href)} className="glass-card shadow-premium border dark:border-white/5 rounded-[2rem] p-8 flex items-center justify-between hover:shadow-2xl transition-all group text-left">
            <div className="flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
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
