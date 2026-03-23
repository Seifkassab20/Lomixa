import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getDoctors, getHospitals, saveHospital, saveDoctor, generateId, Hospital } from '@/lib/store';
import { Stethoscope, Calendar, Activity, Users, Plus, X, Mail, Phone, Hash, Award, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const SPECIALTIES = ['cardio', 'derm', 'endo', 'gastro', 'neuro', 'onco', 'ortho', 'pedia', 'psych', 'pulmo', 'gp'];
const DOCTOR_TITLES = ['dr', 'prof', 'assoc', 'asst', 'consultant', 'specialist'];

export function HospitalDashboard() {
  const { userId, user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [myFacility, setMyFacility] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<ReturnType<typeof getDoctors>>([]);
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  
  const [newDoc, setNewDoc] = useState({
    title: 'dr',
    name: '',
    email: '',
    phone: '',
    specialty: 'gp',
    experienceYears: '5'
  });

  useEffect(() => {
    const hospitals = getHospitals();
    let mine = hospitals.find(h => h.userId === userId);
    if (!mine && userId) {
      mine = {
        id: generateId(),
        name: user?.user_metadata?.organization || 'My Hospital',
        location: user?.user_metadata?.location || 'Riyadh',
        userId,
        isActive: true,
        isVerified: false,
        type: 'hospital'
      };
      saveHospital(mine);
    }
    setMyFacility(mine || null);
    
    const refresh = () => {
      const allDocs = getDoctors();
      const facilityDocs = allDocs.filter(d => d.hospitalId === mine?.id);
      setDoctors(facilityDocs);
      
      const allVisits = getVisits();
      const facilityVisits = allVisits.filter(v => v.hospitalId === mine?.id);
      setVisits(facilityVisits);
    };
    refresh();
  }, [userId]);

  const handleToggleDoctor = (doc: any) => {
    saveDoctor({ ...doc, isActive: !doc.isActive });
    if (myFacility) {
      setDoctors(getDoctors().filter(d => d.hospitalId === myFacility.id));
    }
  };

  const handleOnboardDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myFacility) return;
    
    setIsOnboarding(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      
      const doctorId = generateId();
      saveDoctor({
        id: doctorId,
        userId: '',
        name: `${t(`title_${newDoc.title}`)} ${newDoc.name}`,
        email: newDoc.email,
        phone: newDoc.phone,
        specialty: newDoc.specialty,
        experienceYears: parseInt(newDoc.experienceYears),
        hospitalId: myFacility.id,
        hospitalName: myFacility.name,
        isActive: true,
        isVerified: myFacility.isVerified || false,
        availability: []
      });
      
      setDoctors(getDoctors().filter(d => d.hospitalId === myFacility.id));
      setShowOnboarding(false);
      setNewDoc({ title: 'dr', name: '', email: '', phone: '', specialty: 'gp', experienceYears: '5' });
    } finally {
      setIsOnboarding(false);
    }
  };

  const months = isRTL
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو']
    : ['Jan','Feb','Mar','Apr','May','Jun'];

  const monthlyData = months.map((name, i) => ({
    name,
    visits: visits.filter(v => new Date(v.date).getMonth() === i).length,
  }));

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOnboarding(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white italic tracking-tight">{t('onboardPractitioner')}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">{t('inviteDoctorDesc')}</p>
                  </div>
                  <button onClick={() => setShowOnboarding(false)} className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <form onSubmit={handleOnboardDoctor} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('roleTitle')}</label>
                      <select 
                        value={newDoc.title}
                        onChange={e => setNewDoc({...newDoc, title: e.target.value})}
                        className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all"
                      >
                        {DOCTOR_TITLES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('fullName')}</label>
                      <input 
                        required
                        value={newDoc.name}
                        onChange={e => setNewDoc({...newDoc, name: e.target.value})}
                        placeholder="John Doe"
                        className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('email')}</label>
                      <div className="relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          required
                          type="email"
                          value={newDoc.email}
                          onChange={e => setNewDoc({...newDoc, email: e.target.value})}
                          placeholder={t('email_placeholder')}
                          className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 pl-14 pr-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('mobile')}</label>
                      <div className="relative group">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          required
                          value={newDoc.phone}
                          onChange={e => setNewDoc({...newDoc, phone: e.target.value})}
                          placeholder={t('phone_placeholder')}
                          className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 pl-14 pr-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('specialty')}</label>
                      <select 
                        value={newDoc.specialty}
                        onChange={e => setNewDoc({...newDoc, specialty: e.target.value})}
                        className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all"
                      >
                        {SPECIALTIES.map(s => <option key={s} value={s}>{t(`spec_${s}`)}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('yearsExperience')}</label>
                      <div className="relative group">
                        <Award className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="number"
                          value={newDoc.experienceYears}
                          onChange={e => setNewDoc({...newDoc, experienceYears: e.target.value})}
                          className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 pl-14 pr-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isOnboarding}
                      className="w-full h-16 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black uppercase tracking-widest italic shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
                    >
                      {isOnboarding ? (
                        <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>{t('generateClinicalInvite')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('totalDoctors'), value: doctors.length, sub: myFacility?.type === 'clinic' ? t('clinic') : t('inYourFacility'), icon: Stethoscope, color: 'emerald' },
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
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="font-semibold dark:text-white">{t('doctorsOverview')}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter italic">{t('clinicalStaffDirectory')}</p>
            </div>
            <button 
              onClick={() => setShowOnboarding(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              <span>{t('addDoctor')}</span>
            </button>
          </div>
          {doctors.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">{t('noDoctorsAdded')}</div>
          ) : (
            <div className="space-y-3">
              {doctors.slice(0, 4).map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm shadow-inner group-hover:scale-110 transition-transform">
                      {doc.name.split(' ').filter(n => ['Dr', 'Prof', 'Asst', 'Assoc'].every(t => !n.startsWith(t))).map(n => n[0]).join('').slice(0, 2) || doc.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-black dark:text-white flex items-center gap-2">
                        {doc.name}
                        {!doc.isActive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest">{t(`spec_${doc.specialty}`)}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                      {doc.availability.filter(s => !s.isBooked).length} {t('open')}
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
          { label: t('allBookings'), href: '/bookings', icon: Calendar },
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
