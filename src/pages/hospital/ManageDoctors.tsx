import React, { useState, useEffect } from 'react';
import {
  getDoctors, saveDoctor, deleteDoctor, generateId, Doctor, getHospitals, checkUserExistence
} from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Plus, Trash2, Edit2, X, Phone, Mail, Clock, ShieldCheck, ShieldAlert, Award, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import { ARABIC_COUNTRY_CODES, SPECIALTIES } from '@/lib/constants';

// Helper client that doesn't persist session so signing up a user doesn't log out the admin
const createTempClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-demo-mode';
  return createClient(url, key, { auth: { persistSession: false } });
};

const DOCTOR_TITLES = ['dr', 'prof', 'assoc', 'asst', 'consultant', 'specialist'];

export function ManageDoctors() {
  const { userId } = useAuth();
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    title: 'dr',
    name: '', specialty: '', experienceYears: 0,
    phoneCode: '+966', phone: '', email: '', password: '',
  });

  const hospitals = getHospitals();
  const myHospital = hospitals.find(h => h.userId === userId);

  const refresh = () => {
    const all = getDoctors();
    setDoctors(myHospital ? all.filter(d => d.hospitalId === myHospital.id) : all);
  };

  useEffect(() => { refresh(); }, [myHospital?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = `${form.phoneCode}${form.phone}`;
    const emailExists = await checkUserExistence('email', form.email);
    if (emailExists && (!editingDoc || form.email !== editingDoc.email)) {
      alert(t('emailAlreadyExists'));
      return;
    }

    let finalUserId = editingDoc?.userId || editingDoc?.id || generateId();
    let finalId = editingDoc?.id || finalUserId;

    // If we're adding a new doctor, create their Supabase account too
    if (!editingDoc && form.email && form.password) {
      const tempSupabase = createTempClient();
      const { data: authData, error } = await tempSupabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            role: 'doctor',
            full_name: `${t(`title_${form.title}`)} ${form.name}`,
            phone: fullPhone,
            title: form.title,
            specialty: form.specialty,
            experience_years: form.experienceYears,
            hospital_id: myHospital?.id || 'default',
            hospital_name: myHospital?.name || 'Hospital'
          }
        }
      });
      
      if (error) {
        alert(`${t('errorCreatingAccount') || 'Error creating account'}: ${error.message}`);
        return;
      }
      
      if (authData?.user?.id) {
        finalUserId = authData.user.id;
        finalId = finalUserId;
      }
    }

    const doc: Doctor = {
      id: finalId,
      userId: finalUserId,
      name: editingDoc ? form.name : `${t(`title_${form.title}`)} ${form.name}`,
      specialty: form.specialty,
      experienceYears: form.experienceYears,
      phone: fullPhone,
      email: form.email,
      hospitalId: myHospital?.id || 'default',
      hospitalName: myHospital?.name || 'Hospital',
      location: editingDoc?.location || myHospital?.location || null,
      availability: editingDoc?.availability || [],
      isActive: editingDoc?.isActive ?? true,
      isVerified: true, // Pre-verified by hospital
      role: 'doctor'
    };
    saveDoctor(doc);
    refresh();
    setShowForm(false);
    setEditingDoc(null);
    setForm({ title: 'dr', name: '', specialty: '', experienceYears: 0, phoneCode: '+966', phone: '', email: '', password: '' });
  };

  const handleEdit = (doc: Doctor) => {
    setEditingDoc(doc);
    
    // Parse phone code
    let extractedCode = '+966';
    let extractedNumber = doc.phone;
    for (const c of ARABIC_COUNTRY_CODES) {
      if (doc.phone.startsWith(c.code)) {
        extractedCode = c.code;
        extractedNumber = doc.phone.slice(c.code.length);
        break;
      }
    }

    setForm({ 
      title: 'dr', 
      name: doc.name, 
      specialty: doc.specialty, 
      experienceYears: doc.experienceYears, 
      phoneCode: extractedCode,
      phone: extractedNumber, 
      email: doc.email, 
      password: '' 
    });
    setShowForm(true);
  };

  const toggleActivation = (doc: Doctor) => {
    const updated = { ...doc, isActive: !doc.isActive };
    saveDoctor(updated);
    refresh();
  };

  const handleApprove = (doc: Doctor) => {
    const updated = { ...doc, isVerified: true, isActive: true };
    saveDoctor(updated);
    refresh();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`${t('deleteDoctor') || 'Are you sure you want to remove'} ${name}? ${t('actionCannotBeUndone') || 'This action cannot be undone.'}`)) {
      deleteDoctor(id);
      refresh();
    }
  };

  const filtered = doctors.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{t('manageDoctors')}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('addDoctors')}</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingDoc(null); setForm({ title: 'dr', name: '', specialty: '', experienceYears: 0, phoneCode: '+966', phone: '', email: '', password: '' }); }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" /> {t('addDoctor')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('totalDoctors') || 'Total Doctors', value: doctors.length, color: 'emerald' },
          { label: t('cardiology') || 'Cardiology', value: doctors.filter(d => d.specialty === 'Cardiology').length, color: 'red' },
          { label: t('neurology') || 'Neurology', value: doctors.filter(d => d.specialty === 'Neurology').length, color: 'blue' },
          { label: t('other') || 'Other', value: doctors.filter(d => !['Cardiology', 'Neurology'].includes(d.specialty)).length, color: 'amber' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4">
            <div className="text-2xl font-bold dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchDoctor') || "Search by name or specialty..."} className="dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 max-w-sm" />

      {/* Form Modal (Premium Dashboard Style) */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0c121d] w-full max-w-xl rounded-[2.5rem] border border-white/5 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] overflow-hidden relative"
            >
              <div className="relative p-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                      <Stethoscope className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider italic">{editingDoc ? t('editDoctor') : t('onboardNewSpecialist')}</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('secureIdentityProvisioning')}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(false)} className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('title')}</label>
                       <select 
                        value={form.title}
                        onChange={e => setForm({...form, title: e.target.value})}
                        className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all appearance-none"
                      >
                        {DOCTOR_TITLES.map(title => <option key={title} value={title} className="bg-[#0c121d]">{t(`title_${title}`) || title.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('fullName')}</label>
                      <input 
                        required
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="Ahmed Al-Farsi"
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
                          value={form.email}
                          onChange={e => setForm({...form, email: e.target.value})}
                          placeholder="doctor@hospital.com"
                          className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 pl-14 pr-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('mobile')}</label>
                      <div className="flex gap-2">
                        <div className="relative w-28 group">
                          <select
                            value={form.phoneCode}
                            onChange={e => setForm({...form, phoneCode: e.target.value})}
                            className="w-full h-14 pl-3 pr-8 rounded-2xl bg-black/40 border border-white/10 font-black text-white outline-none focus:border-emerald-500/50 transition-all appearance-none text-[10px]"
                          >
                            {ARABIC_COUNTRY_CODES.map(c => (
                              <option key={c.code} value={c.code} className="bg-[#0c121d]">{c.flag} {c.code}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
                        </div>
                        <div className="relative group flex-1">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                            required
                            value={form.phone}
                            onChange={e => setForm({...form, phone: e.target.value})}
                            placeholder="5X XXX XXXX"
                            className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 pl-10 pr-4 font-black text-white outline-none focus:border-emerald-500/50 transition-all" 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('specialty')}</label>
                      <select 
                        value={form.specialty}
                        onChange={e => setForm({...form, specialty: e.target.value})}
                        required
                        className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all appearance-none"
                      >
                        <option value="" className="bg-[#0c121d]">{t('selectSpecialty')}</option>
                        {SPECIALTIES.map(s => <option key={s} value={s} className="bg-[#0c121d]">{t(s.toLowerCase().replace(' ', '')) || s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('yearsExperience')}</label>
                      <div className="relative group">
                        <Award className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="number"
                          required
                          value={form.experienceYears}
                          onChange={e => setForm({...form, experienceYears: parseInt(e.target.value) || 0})}
                          className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 pl-14 pr-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all" 
                        />
                      </div>
                    </div>
                  </div>

                  {!editingDoc && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('password')}</label>
                      <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/10 mb-2">
                        <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-tight italic">
                          {t('onboardingKeySecurityNote') || "Credential generation will automatically provision a secure workspace for this practitioner."}
                        </p>
                      </div>
                      <input 
                        required
                        type="password"
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-6 font-black text-white outline-none focus:border-emerald-500/50 transition-all" 
                      />
                    </div>
                  )}

                  <div className="pt-6">
                    <button 
                      type="submit"
                      className="w-full h-16 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest italic shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <Check className="w-5 h-5" />
                      <span>{editingDoc ? t('updateProfile') : t('generateClinicalInvite')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Doctor List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 flex flex-col items-center text-center">
          <Stethoscope className="h-12 w-12 text-gray-200 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold dark:text-slate-300">{search ? (t('noDoctorsFound') || 'No doctors match your search') : t('noDoctorsYet')}</h3>
          {!search && <Button onClick={() => setShowForm(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"><Plus className="h-4 w-4" /> {t('addFirstDoctor')}</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                    {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-white line-clamp-1">{doc.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {doc.isVerified ? (
                        doc.isActive ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <ShieldAlert className="w-3 h-3 text-red-500" />
                        )
                      ) : (
                        <Clock className="w-3 h-3 text-amber-500" />
                      )}
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest italic",
                        doc.isVerified ? (doc.isActive ? "text-emerald-500" : "text-red-500") : "text-amber-500"
                      )}>
                        {doc.isVerified ? (doc.isActive ? t('active') : t('inactive') || 'Inactive') : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {doc.isVerified ? (
                  <>
                    <div className="flex items-center gap-1.5 border-r dark:border-slate-700 pr-2 mr-1">
                      <Switch 
                        checked={doc.isActive}
                        onCheckedChange={() => toggleActivation(doc)}
                        className="scale-75"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(doc)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                        <Edit2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 border-r dark:border-slate-700 pr-2 mr-1">
                    <Button size="sm" onClick={() => handleApprove(doc)} className="bg-emerald-500 hover:bg-emerald-400 text-black h-8 text-[10px] uppercase font-black tracking-widest italic rounded-lg">
                      Approve
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-1 ml-1">
                  <button onClick={() => handleDelete(doc.id, doc.name)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{doc.experienceYears} {t('yearsExperienceLabel') || 'years experience'}</div>
                {doc.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{doc.email}</div>}
                {doc.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{doc.phone}</div>}
              </div>
              <div className="mt-3 pt-3 border-t dark:border-slate-700 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('active')}</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">{doc.availability.filter(s => !s.isBooked).length} {t('slotsAvailable') || 'slots available'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
