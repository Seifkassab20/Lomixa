import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, Activity, Stethoscope, Briefcase, Camera, 
  MapPin, User, Shield, Check, ArrowRight, Eye, Upload, 
  Plus, X, PlusCircle, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { saveDoctor, saveHospital, savePharmaCompany, saveSalesRep, getDoctors, generateId } from '@/lib/store';

const CITY_MAP: Record<string, string[]> = {
  sa: ['riyadh', 'jeddah', 'dammam', 'makkah', 'medina', 'buraidah', 'tabuk', 'abha', 'khobar', 'hofuf'],
  uae: ['dubai', 'abudhabi', 'sharjah', 'alain', 'ajman', 'rak'],
  egypt: ['cairo', 'alex', 'giza', 'mansoura', 'sharm', 'hurghada'],
  jordan: ['amman', 'zarqa', 'irbid'],
  kuwait: ['kuwait_city', 'jahra', 'hawalli', 'salmiya'],
  oman: ['muscat', 'salalah', 'sohar', 'nizwa'],
  qatar: ['doha', 'wakrah', 'khor', 'rayyan'],
  bahrain: ['manama', 'muharraq', 'riffa', 'hamad'],
  iraq: ['baghdad', 'erbil', 'basra', 'mosul', 'suly', 'najaf'],
  libya: ['tripoli', 'benghazi', 'misrata', 'bayda'],
};

const DISTRICT_MAP: Record<string, string[]> = {
  cairo: ['maadi', 'dokki', 'helio', 'nasr', 'zamalek', 'tagamoa'],
  riyadh: ['olaya', 'malaz', 'sulaimaniyah', 'nakheel', 'hittin'],
  jeddah: ['shati', 'rawdah', 'khalidiyah'],
  dubai: ['marina', 'deira', 'bur_dubai', 'barsha', 'jumeirah'],
  dammam: ['khaleej', 'shati_dammam'],
  makkah: ['aziziyah', 'zahir'],
  medina: ['awali', 'salam'],
  buraidah: ['fayziyah', 'rayyan_b'],
  tabuk: ['rawdah_t'],
  abha: ['mahala'],
  abudhabi: ['khalidiya_ad', 'reem'],
  alex: ['sidi_gaber', 'smouha'],
  amman: ['abdoun', 'jabal_amman'],
  kuwait_city: ['sharq', 'qibla'],
  doha: ['pearl', 'west_bay'],
};

const DOCTOR_TITLES = ['dr', 'prof', 'assoc', 'asst', 'consultant', 'specialist'];
const SPECIALTIES = ['cardio', 'derm', 'endo', 'gastro', 'neuro', 'onco', 'ortho', 'pedia', 'psych', 'pulmo', 'gp'];
const REP_ROLES = ['med', 'sup', 'dist', 'mark', 'prod', 'sales', 'sales_dir', 'mark_dir', 'biz', 'biz_dir'];
const PHARMA_CATEGORIES = ['Anti-Infectives', 'Cardiovascular', 'CNS', 'Respiratory', 'Gastroenterology', 'Oncology', 'Endocrinology', 'Dermatology', 'Urology', 'Ophthalmology'];

export function Register() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '', password: '', phone: '',
    fullNameAr: '', fullNameEn: '',
    country: 'sa', cities: [] as string[], areas: [] as string[], address: '',
    title: '', specialty: '', yearsExperience: '',
    roleTitle: '', pharmaCompany: '',
    licenseNumber: '', clinicName: '', profBio: '',
    hospitalType: 'hospital',
    products: [{ category: '', name: '', form: '', description: '', indications: '', doses: '' }],
  });

  useEffect(() => {
    if (role) setSelectedRole(role === 'subordinate' ? 'rep' : role);
  }, [role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value, 
      ...(name === 'country' ? { cities: [], areas: [] } : {}) 
    }));
  };

  const toggleCity = (cityKey: string) => {
    const exists = formData.cities.includes(cityKey);
    setFormData(p => ({
      ...p,
      cities: exists ? p.cities.filter(c => c !== cityKey) : [...p.cities, cityKey],
      // If city removed, remove its districts too
      areas: exists ? p.areas.filter(a => !DISTRICT_MAP[cityKey]?.includes(a)) : p.areas
    }));
  };

  const toggleDistrict = (areaKey: string) => {
    setFormData(p => ({
      ...p,
      areas: p.areas.includes(areaKey) ? p.areas.filter(a => a !== areaKey) : [...p.areas, areaKey]
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedRole) throw new Error(t('pleaseSelectRole'));
      const displayName = isRTL ? formData.fullNameAr : formData.fullNameEn;
      if (!isSupabaseConfigured) {
        localStorage.setItem('demo_email', formData.email);
        localStorage.setItem('demo_name', displayName);
        window.location.href = '/';
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { ...formData, role: selectedRole, full_name: displayName } }
      });
      if (error) throw error;
      
      let finalIsVerified = false;
      const userId = data.user?.id;
      if (userId) {
        // Initial Grid Presence Creation (Linking with pre-invited records)
        if (selectedRole === 'doctor') {
          const existing = getDoctors().find(d => d.email?.toLowerCase() === formData.email.toLowerCase());
          finalIsVerified = existing?.isVerified || false;
          
          saveDoctor({
            id: existing?.id || generateId(),
            userId,
            name: displayName,
            email: formData.email,
            phone: formData.phone,
            specialty: formData.specialty || existing?.specialty || 'General Practice',
            experienceYears: parseInt(formData.yearsExperience) || existing?.experienceYears || 0,
            hospitalId: existing?.hospitalId || null as any,
            hospitalName: existing?.hospitalName || formData.clinicName || 'Independent',
            availability: existing?.availability || [],
            isActive: true,
            isVerified: true,
            role: 'doctor'
          });
        } else if (selectedRole === 'pharma') {
          savePharmaCompany({ 
            id: generateId(), userId, name: displayName, 
            credits: 50, isActive: true, isVerified: false,
            phone: formData.phone,
            role: 'pharma'
          });
        } else if (selectedRole === 'hospital') {
          saveHospital({ 
            id: generateId(), 
            userId, 
            name: displayName, 
            location: `${formData.cities.join(', ')} - ${formData.areas.join(', ')} - ${formData.address}`,
            isActive: true, 
            isVerified: false,
            type: formData.hospitalType as any,
            phone: formData.phone,
            role: 'hospital'
          });
        } else if (selectedRole === 'rep') {
          saveSalesRep({
            id: generateId(), userId, name: displayName, email: formData.email, phone: formData.phone,
            pharmaId: null as any, pharmaName: formData.pharmaCompany || 'Independent',
            target: 500, visitsThisMonth: 0, credits: 0, isActive: true, isVerified: true,
            role: 'rep'
          });
        }
      }

      // If they were pre-verified (invited by hospital), they can proceed to login
      if (finalIsVerified) {
        toast('Identity Linked! Your account is active per facility invitation. Please login.', 'success');
        window.location.href = '/login';
        return;
      }

      // Mandatory: Sign out immediately as the account is pending admin approval
      await supabase.auth.signOut();
      toast('Registration Successful! Your account is now pending administrative approval.', 'success');
      navigate('/login');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-white font-sans flex flex-col items-center py-16 px-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Logo Header */}
      <div className="w-full max-w-3xl mx-auto mb-16 flex flex-col items-center gap-6">
        <Link to="/" className="flex flex-col items-center gap-4 group">
          <div className="bg-white rounded-[2.5rem] p-3 w-20 h-20 shadow-2xl group-hover:scale-105 transition-transform hover:rotate-2">
             <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-4xl font-black italic tracking-tighter uppercase">{t('appName')}</span>
        </Link>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 w-full max-w-3xl mx-auto">
        <div className="max-w-3xl mx-auto space-y-16">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/select-role')} className="text-slate-500 hover:text-white transition-all flex items-center gap-2 text-sm font-bold group px-4 py-2">
               <ArrowRight className={cn("w-5 h-5 transition-transform", isRTL ? "" : "rotate-180 group-hover:-translate-x-1")} />
               {t('back_to_selection')}
            </button>
            <button onClick={() => i18n.changeLanguage(isRTL ? 'en' : 'ar')} className="px-6 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 transition-all">
               {isRTL ? 'English' : 'عربي'}
            </button>
          </div>

          <div className="flex items-center gap-8">
             <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20 shadow-2xl">
                {selectedRole === 'pharma' && <Building2 className="w-10 h-10 text-white" />}
                {selectedRole === 'hospital' && <Activity className="w-10 h-10 text-white" />}
                {selectedRole === 'doctor' && <Stethoscope className="w-10 h-10 text-white" />}
                {selectedRole === 'rep' && <Briefcase className="w-10 h-10 text-white" />}
             </div>
             <div>
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">{t('createAccount')}</h1>
                <p className="text-slate-500 font-black tracking-[0.2em] text-xs opacity-70">
                   {t(`roleSelection.${selectedRole || 'rep'}.title`).toUpperCase()}
                </p>
             </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-16 pb-32">
            {/* Standard Profile Section */}
            <div className="rounded-[3rem] p-12 bg-slate-900/30 border border-slate-800/50 backdrop-blur-md shadow-3xl space-y-10">
               <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="relative group/pic cursor-pointer">
                    <div className="w-32 h-32 rounded-[2.5rem] border-2 border-dashed border-slate-700 group-hover/pic:border-emerald-500 transition-all flex items-center justify-center overflow-hidden bg-slate-950/80">
                       {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <Camera className="w-10 h-10 text-slate-700 opacity-40 group-hover/pic:text-emerald-500 transition-all" />}
                    </div>
                    <input type="file" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setPreviewImage(reader.result as string);
                          reader.readAsDataURL(file);
                       }
                    }} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2.5 rounded-2xl shadow-xl border-4 border-[#050b14]">
                       <Upload className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('fullNameAr')}</Label>
                          <Input name="fullNameAr" value={formData.fullNameAr} onChange={handleChange} required className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold text-right text-lg" dir="rtl" />
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('fullNameEn')}</Label>
                          <Input name="fullNameEn" value={formData.fullNameEn} onChange={handleChange} required className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold text-lg" />
                       </div>
                    </div>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-800/50">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('email')}</Label>
                     <Input type="email" name="email" value={formData.email} onChange={handleChange} required className="h-14 rounded-2xl bg-black/40 border-slate-800" />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('mobile')}</Label>
                     <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+966 5X XXX XXXX" className="h-14 rounded-2xl bg-black/40 border-slate-800" />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('password')}</Label>
                     <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required className="h-14 rounded-2xl bg-black/40 border-slate-800 tracking-widest text-lg" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className={cn("absolute top-1/2 -translate-y-1/2 px-4", isRTL ? "left-0" : "right-0")}>
                           <Eye className="w-6 h-6 text-slate-500 hover:text-emerald-500 transition-colors" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Hierarchical Location Group */}
            <div className="rounded-[3rem] p-12 bg-slate-900/30 border border-slate-800/50 shadow-3xl space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -z-10"></div>
               <div className="flex items-center gap-4 border-b border-slate-800/50 pb-8">
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                     <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase">{t('location_sec')}</h3>
               </div>
               
               <div className="space-y-12">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('country')}</Label>
                    <select name="country" value={formData.country} onChange={handleChange} required className="w-full h-15 rounded-2xl bg-black/40 border border-slate-800 px-6 font-black outline-none appearance-none focus:border-emerald-500 transition-all cursor-pointer">
                       {Object.keys(CITY_MAP).map(c => <option key={c} value={c}>{t(`country_${c}`)}</option>)}
                    </select>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('operation_cities')}</Label>
                    <div className="flex flex-wrap gap-3">
                       {CITY_MAP[formData.country]?.map(cityKey => (
                          <button key={cityKey} type="button" onClick={() => toggleCity(cityKey)} className={cn(
                             "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-3",
                             formData.cities.includes(cityKey) ? "bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/20" : "bg-black/30 border-slate-800 text-slate-500 hover:border-slate-700"
                          )}>
                             {t(`city_${cityKey}`)} {formData.cities.includes(cityKey) && <Check className="w-4 h-4" />}
                          </button>
                       ))}
                    </div>
                  </div>

                  {formData.cities.length > 0 && (
                    <div className="space-y-8 animate-in fade-in duration-500 pt-8 border-t border-slate-800/30">
                       <div className="flex items-center gap-3 text-emerald-500 opacity-80">
                          <LayoutGrid className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('districtCoverage')}</span>
                       </div>
                       
                       <div className="space-y-8">
                          {formData.cities.map(city => (
                            <div key={city} className="space-y-4">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-emerald-500 pl-3 ml-2">
                                  {t(`city_${city}`)}
                               </p>
                               <div className="flex flex-wrap gap-2.5">
                                  {(DISTRICT_MAP[city] || ['other']).map(areaKey => (
                                    <button
                                      key={areaKey} type="button"
                                      onClick={() => toggleDistrict(areaKey)}
                                      className={cn(
                                        "px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                                        formData.areas.includes(areaKey) ? "bg-blue-600 border-blue-400 text-white shadow-lg" : "bg-slate-950/50 border-slate-800 text-slate-600 hover:border-slate-700"
                                      )}
                                    >
                                      {t(`area_${areaKey}`)}
                                    </button>
                                  ))}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-4">
                    <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('address_label')}</Label>
                    <Input name="address" value={formData.address} onChange={handleChange} placeholder={t('address_placeholder')} className="h-16 rounded-2xl bg-black/40 border-slate-800 px-6 font-bold" />
                  </div>
               </div>
            </div>

            {/* Unique Domain Section */}
            <div className="rounded-[4rem] p-14 bg-gradient-to-br from-emerald-500/10 to-blue-500/5 border border-emerald-500/20 shadow-3xl space-y-12">
               <div className="flex items-center gap-4 border-b border-emerald-500/20 pb-8">
                  <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 shadow-emerald-500/10 shadow-xl">
                     <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase">{selectedRole === 'admin' ? 'Nexus Credentials' : t('domain_sec')}</h3>
               </div>

               {selectedRole === 'admin' && (
                  <div className="space-y-6">
                     <div className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20">
                        <p className="text-xs text-emerald-500/70 font-bold italic leading-relaxed">
                           You are registering as a LOMIXA System Overlord. This account will have absolute control over credits, account status, and system-wide configurations. 
                        </p>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">Access Token (Optional)</Label>
                        <Input placeholder="X-NEXUS-ROOT-KEY" className="h-14 rounded-2xl bg-black/40 border-slate-800" />
                     </div>
                  </div>
               )}

               {(selectedRole === 'pharma' || selectedRole === 'hospital') && (
                  <div className="space-y-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {selectedRole === 'pharma' && (
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('pharma_cat_label')}</Label>
                              <select name="specialty" value={formData.specialty} onChange={handleChange} className="w-full h-15 rounded-2xl bg-black/60 border border-slate-800 px-6 font-black text-sm outline-none focus:border-emerald-500/50 transition-all cursor-pointer">
                                 {PHARMA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                           </div>
                        )}
                         {selectedRole === 'hospital' && (
                            <div className="space-y-6">
                               <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('hospitalType')}</Label>
                                 <div className="flex gap-4">
                                   {['hospital', 'clinic'].map(type => (
                                     <button
                                       key={type}
                                       type="button"
                                       onClick={() => setFormData(p => ({ ...p, hospitalType: type }))}
                                       className={cn(
                                         "flex-1 h-14 rounded-2xl border font-black uppercase text-xs transition-all",
                                         formData.hospitalType === type 
                                           ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                                           : "bg-black/40 border-slate-800 text-slate-500 hover:border-slate-700"
                                       )}
                                     >
                                       {t(type === 'hospital' ? 'hospitalKey' : 'clinic')}
                                     </button>
                                   ))}
                                 </div>
                               </div>
                               <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('hospital_level_label')}</Label>
                                 <select name="specialty" value={formData.specialty} onChange={handleChange} className="w-full h-15 rounded-2xl bg-black/60 border border-slate-800 px-6 font-black text-sm outline-none focus:border-emerald-500/50 transition-all cursor-pointer">
                                    <option value="primary">{t('primaryCare')}</option>
                                    <option value="secondary">{t('secondaryCare')}</option>
                                    <option value="tertiary">{t('tertiaryCare')}</option>
                                 </select>
                               </div>
                            </div>
                         )}
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase text-slate-500 px-2 italic">{t('org_size_label')}</Label>
                           <Input type="number" name="yearsExperience" value={formData.yearsExperience} onChange={handleChange} placeholder={t('totalWorkforce')} className="h-15 rounded-2xl bg-black/60 border-slate-800 font-black px-6" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                        {['commCert', 'natAddress', 'vatCert'].map(doc => (
                          <label key={doc} className="flex flex-col items-center justify-center p-10 rounded-[3rem] bg-black/40 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group space-y-4 text-center">
                             <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all shadow-inner">
                                <Upload className="w-6 h-6 text-slate-600 group-hover:text-emerald-500" />
                             </div>
                              <div className="space-y-1">
                                 <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-emerald-400 leading-tight italic">{t(doc)}</span>
                                 <span className="block text-[8px] font-black text-slate-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">{t('uploadRestriction')}</span>
                              </div>
                             <input type="file" className="hidden" />
                          </label>
                        ))}
                     </div>
                  </div>
               )}

               {selectedRole === 'doctor' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="md:col-span-2 space-y-3">
                       <Label className="text-[10px] font-black tracking-widest text-slate-500 px-2 uppercase">{t('roleTitle')}</Label>
                       <select name="title" value={formData.title} onChange={handleChange} className="w-full h-15 rounded-2xl bg-black/60 border-slate-800 px-6 font-black mt-3 outline-none focus:border-emerald-500/50 transition-all">
                          {DOCTOR_TITLES.map(k => <option key={k} value={k}>{t(`title_${k}`)}</option>)}
                       </select>
                     </div>
                     <div className="space-y-3">
                       <Label className="text-[10px] font-black text-slate-500 px-2 uppercase">{t('specialty')}</Label>
                       <select name="specialty" value={formData.specialty} onChange={handleChange} className="w-full h-15 rounded-2xl bg-black/60 border-slate-800 px-6 font-black outline-none focus:border-emerald-500/50 transition-all">
                          {SPECIALTIES.map(k => <option key={k} value={k}>{t(`spec_${k}`)}</option>)}
                       </select>
                     </div>
                     <div className="space-y-3">
                       <Label className="text-[10px] font-black text-slate-500 px-2 uppercase">{t('yearsExperience')}</Label>
                       <Input type="number" name="yearsExperience" value={formData.yearsExperience} onChange={handleChange} className="h-15 rounded-2xl bg-black/60 border-slate-800 px-6 font-black" />
                     </div>
                     <div className="space-y-3">
                       <Label className="text-[10px] font-black text-slate-500 px-2 uppercase italic">{t('license_number')}</Label>
                       <Input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="MC-XXXXXXX" className="h-15 rounded-2xl bg-black/60 border-slate-800 px-6 font-black" />
                     </div>
                     <div className="space-y-3">
                       <Label className="text-[10px] font-black text-slate-500 px-2 uppercase italic">{t('clinic_name')}</Label>
                       <Input name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder="Elite Medical Center" className="h-15 rounded-2xl bg-black/60 border-slate-800 px-6 font-black" />
                     </div>
                     <div className="md:col-span-2 space-y-3">
                       <Label className="text-[10px] font-black text-slate-500 px-2 uppercase italic">{t('prof_bio')}</Label>
                       <textarea 
                          name="profBio" 
                          value={formData.profBio} 
                          onChange={handleChange} 
                          placeholder={t('prof_bio')}
                          className="w-full h-28 rounded-3xl bg-black/60 border border-slate-800 p-5 text-sm font-bold focus:border-emerald-500/50 outline-none transition-all resize-none shadow-inner"
                       />
                     </div>
                  </div>
               )}

               {selectedRole === 'rep' && (
                  <div className="space-y-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-slate-500 px-2 uppercase">{t('pharmaCompany')}</Label>
                           <Input name="pharmaCompany" value={formData.pharmaCompany} onChange={handleChange} className="h-15 rounded-2xl bg-black/60 border-slate-800 px-6 font-black" />
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-slate-500 px-2 uppercase">{t('officialRole')}</Label>
                           <select name="roleTitle" value={formData.roleTitle} onChange={handleChange} className="w-full h-15 rounded-2xl bg-black/60 border-slate-800 px-6 font-black outline-none">
                              {REP_ROLES.map(k => <option key={k} value={k}>{t(`rep_${k}`)}</option>)}
                           </select>
                        </div>
                     </div>
                     <div className="pt-10 space-y-8">
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                           <h4 className="text-sm font-black italic tracking-widest uppercase">{t('product_portfolio')}</h4>
                           <Button type="button" variant="outline" onClick={() => setFormData(p => ({ ...p, products: [...p.products, { category: '', name: '', form: '', description: '', indications: '', doses: '' }] }))} className="h-12 rounded-2xl border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 px-6 group transition-all">
                              <PlusCircle className="w-5 h-5 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                           </Button>
                        </div>
                        <div className="space-y-8">
                           {formData.products.map((p, i) => (
                             <div key={i} className="p-10 rounded-[3rem] bg-black/60 border border-slate-800 relative group/item">
                                {i > 0 && <button type="button" onClick={() => setFormData(old => ({ ...old, products: old.products.filter((_, idx) => idx !== i) }))} className="absolute top-6 right-8 text-slate-700 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                       <Label className="text-[10px] font-bold text-slate-600 px-2 uppercase">{t('brand_name')}</Label>
                                       <Input value={p.name} onChange={e => {
                                          const prods = [...formData.products];
                                          prods[i].name = e.target.value;
                                          setFormData(f => ({ ...f, products: prods }));
                                       }} className="h-12 rounded-2xl bg-slate-900/40 border-slate-800" />
                                    </div>
                                    <div className="space-y-2">
                                       <Label className="text-[10px] font-bold text-slate-600 px-2 uppercase">{t('product_cat')}</Label>
                                       <Input value={p.category} onChange={e => {
                                          const prods = [...formData.products];
                                          prods[i].category = e.target.value;
                                          setFormData(f => ({ ...f, products: prods }));
                                       }} className="h-12 rounded-2xl bg-slate-900/40 border-slate-800" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                       <Label className="text-[10px] font-bold text-slate-600 px-2 uppercase">{t('indications')}</Label>
                                       <Input value={p.indications} onChange={e => {
                                          const prods = [...formData.products];
                                          prods[i].indications = e.target.value;
                                          setFormData(f => ({ ...f, products: prods }));
                                       }} className="h-12 rounded-2xl bg-slate-900/40 border-slate-800" />
                                    </div>
                                 </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               )}
            </div>

            <Button type="submit" disabled={loading} className="w-full h-24 rounded-[3.5rem] bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-2xl shadow-[0_30px_80px_-15px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] border-t border-white/20 group/submit">
               {loading ? <Activity className="w-9 h-9 animate-spin" /> : <div className="flex items-center gap-6"><span className="tracking-[0.2em] italic uppercase">{t('create_identity')}</span><ArrowRight className={cn("w-8 h-8 group-hover/submit:translate-x-3 transition-transform", isRTL && "-scale-x-100")} /></div>}
            </Button>
          </form>

          <footer className="py-24 text-center border-t border-slate-800/30">
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3">
               <span>{t('alreadyHaveAccount')}</span>
               <Link to="/login" className="text-emerald-500 font-extrabold hover:text-white transition-all underline underline-offset-8 decoration-emerald-500/30 font-black">{t('signIn')}</Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
