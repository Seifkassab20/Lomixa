import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, Activity, Stethoscope, Briefcase, Camera, 
  MapPin, User, Shield, Check, ArrowRight, Eye, Upload, 
  Plus, X, PlusCircle, LayoutGrid, Sparkles, Lock, ChevronRight,
  Globe, Facebook, Instagram, Linkedin, Mail, Phone, FileText, Trash2, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { saveDoctor, saveHospital, savePharmaCompany, saveSalesRep, getPharmaCompanies, generateId, pushNotification } from '@/lib/store';
import { sendEmail, EmailTemplates } from '@/lib/email';
import { motion, AnimatePresence } from 'motion/react';
import { ARABIC_COUNTRY_CODES, COUNTRIES, CITY_MAP } from '@/lib/constants';

const DOCTOR_TITLES = ['Dr.', 'Prof.', 'Assoc. Prof.', 'Asst. Prof.', 'Consultant', 'Specialist'];
const SPECIALTIES = ['Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology', 'General Practice'];
const REP_ROLES = ['Medical Representative', 'Sales Supervisor', 'District Manager', 'Marketing Manager', 'Product Manager', 'Sales Manager', 'Sales Director', 'Marketing Director', 'Business Dev Manager', 'Business Dev Director'];
const PHARMA_CATEGORIES = [
  'Analgesics', 'Antipyretics', 'Antibiotics', 'Antivirals', 'Antifungals', 'Antineoplastics', 'Cardiovascular', 
  'Dermatological', 'Endocrine', 'Gastrointestinal', 'Genitourinary', 'Hematological', 'Immunological', 
  'Metabolic', 'Neurological', 'Ophthalmic', 'Otic', 'Respiratory', 'Psychiatric', 'Nutritional', 'Diagnostic', 
  'Biologicals', 'Generics', 'Biosimilars', 'Orphan Drugs', 'Vaccines', 'Vitamins', 'Minerals', 'Supplements', 
  'Hormonal', 'Anesthetics', 'Anticoagulants', 'Antidiabetics', 'Antihyperlipidemics', 'Antihypertensives', 
  'Anti-inflammatories', 'Antiprotozoals', 'Antirheumatics', 'Antiseptics', 'Disinfectants', 'Contraceptives', 
  'Erectile Dysfunction', 'Respiratory Agents'
];

export function Register() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    localStorage.setItem('lomixa_lang', newLang);
  };

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [existingPharmaCompanies, setExistingPharmaCompanies] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phoneCode: '+966',
    phone: '',
    // Personal for Doctor/Rep
    firstName: '',
    middleName: '',
    lastName: '',
    title: '',
    specialty: '',
    yearsExperience: '',
    roleTitle: '',
    // For Pharma/Hospital
    organizationName: '',
    // Location
    country: 'sa',
    city: '',
    cities: [] as string[],
    area: '',
    areas: [] as string[],
    address: '',
    // Rep Specific
    pharmaId: '',
    newPharmaName: '',
    products: [{ id: generateId(), category: '', name: '', form: '', description: '', indications: '', doses: '' }],
    // Document Uploads
    commCertificate: null as File | null,
    natAddress: null as File | null,
    vatCertificate: null as File | null,
  });

  useEffect(() => {
    if (role) {
      const actualRole = role === 'subordinate' ? 'rep' : role;
      setSelectedRole(actualRole);
    }
    setExistingPharmaCompanies(getPharmaCompanies());
  }, [role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'country' ? { city: '', cities: [], areas: [], area: '' } : {})
    }));
  };

  const toggleCity = (city: string) => {
    setFormData(prev => {
      const cities = prev.cities.includes(city) 
        ? prev.cities.filter(c => c !== city) 
        : [...prev.cities, city];
      return { ...prev, cities };
    });
  };

  const handleProductChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const products = [...prev.products];
      products[index] = { ...products[index], [field]: value };
      return { ...prev, products };
    });
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { id: generateId(), category: '', name: '', form: '', description: '', indications: '', doses: '' }]
    }));
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
      toast(`${file.name} uploaded successfully`, 'success');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedRole) throw new Error('Role selection missing.');
      if (!formData.password) throw new Error('A security key is strictly required.');
      
      let finalUserId = generateId();

      if (isSupabaseConfigured) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              role: selectedRole,
              full_name: selectedRole === 'doctor' || selectedRole === 'rep' ? `${formData.firstName} ${formData.lastName}` : formData.organizationName,
              phone: `${formData.phoneCode}${formData.phone}`
            }
          }
        });
        
        if (authError) throw new Error(`Registration failed: ${authError.message}`);
        if (authData?.user?.id) {
          finalUserId = authData.user.id;
        }
      }

      const profileData = {
        id: finalUserId,
        userId: finalUserId,
        email: formData.email,
        phone: `${formData.phoneCode}${formData.phone}`,
        avatar: previewImage || '',
        location: {
          country: formData.country,
          city: selectedRole === 'rep' ? '' : formData.city,
          cities: selectedRole === 'rep' ? formData.cities : [],
          area: formData.area,
          areas: formData.areas,
          address: formData.address,
        },
        verified: false,
        createdAt: new Date().toISOString(),
      };

      if (selectedRole === 'doctor') {
        saveDoctor({
          ...profileData,
          name: `${formData.firstName} ${formData.lastName}`,
          title: formData.title,
          specialty: formData.specialty,
          experienceYears: parseInt(formData.yearsExperience) || 0,
          hospitalId: '',
          hospitalName: '',
          isVerified: false,
          isActive: true,
          availability: [],
        });
      } else if (selectedRole === 'rep') {
        saveSalesRep({
          ...profileData,
          name: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          roleTitle: formData.roleTitle,
          pharmaId: formData.pharmaId || 'temp_pharma',
          pharmaName: formData.pharmaId ? (existingPharmaCompanies.find(p => p.id === formData.pharmaId)?.name) : formData.newPharmaName,
          products: formData.products,
          target: 100,
          visitsThisMonth: 0,
          balance: 0,
          isVerified: false, // Ensures self-registered reps start as PENDING
          isActive: true, // Will go to false if rejected
        });

        if (formData.pharmaId && formData.pharmaId !== 'other') {
          const parentPharma = existingPharmaCompanies.find(p => p.id === formData.pharmaId);
          if (parentPharma && parentPharma.userId) {
            pushNotification({
              userId: parentPharma.userId,
              title: 'New Representative Registration',
              message: `A new sales representative (${formData.firstName} ${formData.lastName}) has registered and is pending your verification.`,
              type: 'info'
            });
          }
        }
      } else if (selectedRole === 'pharma' || selectedRole === 'hospital') {
        const orgData = {
          ...profileData,
          name: formData.organizationName,
          type: selectedRole as any,
          isActive: true,
          isVerified: false,
          documents: {
            commercial: !!formData.commCertificate,
            address: !!formData.natAddress,
            vat: !!formData.vatCertificate,
          }
        };
        if (selectedRole === 'pharma') {
          savePharmaCompany({ ...orgData, balance: 50 });
          pushNotification({
            userId: 'admin',
            title: 'New Pharma Registration',
            message: `A new pharmaceutical company "${formData.organizationName}" has requested to join the network.`,
            type: 'info'
          });
        } else {
          saveHospital({ ...orgData, location: formData.address || '' });
        }
      }

      toast('Registration successful. Awaiting verification.', 'success');
      
      // Send Welcome Email (Real-time)
      const fullName = selectedRole === 'doctor' || selectedRole === 'rep' ? `${formData.firstName} ${formData.lastName}` : formData.organizationName;
      const welcome = EmailTemplates.welcome(fullName);
      sendEmail({ to: formData.email, ...welcome }).catch(console.error);

      navigate('/login');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoleStyle = () => {
    switch(selectedRole) {
      case 'hospital': return 'from-emerald-500 to-teal-700 shadow-emerald-500/20';
      case 'doctor': return 'from-sky-400 to-blue-600 shadow-sky-500/20';
      case 'pharma': return 'from-indigo-500 to-indigo-800 shadow-indigo-500/20';
      case 'rep': return 'from-orange-400 to-amber-600 shadow-orange-500/20';
      default: return 'from-slate-700 to-slate-900';
    }
  };

  const getRoleColor = () => {
    switch(selectedRole) {
      case 'hospital': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
      case 'doctor': return 'text-sky-400 border-sky-400/20 bg-sky-400/5';
      case 'pharma': return 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5';
      case 'rep': return 'text-orange-400 border-orange-400/20 bg-orange-400/5';
      default: return 'text-slate-500 border-slate-500/20 bg-slate-500/5';
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#050b14] text-white font-sans flex flex-col items-center py-20 px-6 relative overflow-x-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10"></div>

      {/* Header Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto mb-20 flex flex-col items-center gap-6"
      >
        <Link to="/" className="flex flex-col items-center gap-4 group">
          <div className="bg-white rounded-[2.5rem] p-3 w-20 h-20 shadow-2xl group-hover:scale-105 transition-transform hover:rotate-2">
             <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">{t('appName')}</span>
        </Link>
      </motion.div>

      <main className="w-full max-w-4xl flex-1">
        <div className="max-w-3xl mx-auto space-y-16">
          <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-sm p-4 rounded-3xl border border-white/5">
            <button onClick={() => navigate('/select-role')} className="text-slate-500 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 font-sans uppercase">
               <ArrowRight className={cn("w-4 h-4", !isRTL && "rotate-180")} />
               {t('back_to_selection')}
            </button>
            <button onClick={toggleLanguage} className="px-6 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] hover:border-emerald-500 transition-all font-sans flex items-center gap-2">
               <Globe className="w-4 h-4 text-emerald-500" />
               {isRTL ? t('switchToEnglish') : t('switchToArabic')}
            </button>
          </div>

          <div className="flex items-center gap-8">
             <div className={cn("w-24 h-24 rounded-[2.5rem] flex items-center justify-center bg-gradient-to-br shadow-2xl transition-all", getRoleStyle())}>
                {selectedRole === 'pharma' && <Building2 className="w-10 h-10 text-white" />}
                {selectedRole === 'hospital' && <Activity className="w-10 h-10 text-white" />}
                {selectedRole === 'doctor' && <Stethoscope className="w-10 h-10 text-white" />}
                {selectedRole === 'rep' && <Briefcase className="w-10 h-10 text-white" />}
             </div>
             <div className="space-y-3">
                <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{t('createAccount')}</h1>
                <p className={cn("font-black tracking-[0.2em] text-[10px] uppercase px-4 py-1.5 rounded-full border w-fit", getRoleColor())}>
                   {selectedRole === 'pharma' ? 'Corporate' : selectedRole === 'hospital' ? 'Facility' : 'Professional'} Program
                </p>
             </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-16 pb-32">
             <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="rounded-[3.5rem] p-12 bg-slate-900/30 border border-white/5 backdrop-blur-xl shadow-3xl space-y-12"
             >
                {/* Profile Pic / Logo */}
                <div className="flex flex-col md:flex-row items-center gap-10">
                   <div className="relative group/pic cursor-pointer">
                     <div className="w-36 h-36 rounded-[3rem] border-2 border-dashed border-slate-700 group-hover/pic:border-emerald-500 transition-all flex items-center justify-center overflow-hidden bg-slate-950/80 shadow-2xl">
                        {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <Camera className="w-12 h-12 text-slate-700 opacity-40 group-hover/pic:text-emerald-500 transition-all" />}
                     </div>
                     <input type="file" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           const reader = new FileReader();
                           reader.onloadend = () => setPreviewImage(reader.result as string);
                           reader.readAsDataURL(file);
                        }
                     }} className="absolute inset-0 opacity-0 cursor-pointer" />
                     <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3 rounded-2xl shadow-xl border-4 border-[#050b14]">
                        <Upload className="w-5 h-5 text-white" />
                     </div>
                   </div>
                   <div className="flex-1 w-full space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] italic">
                        {(selectedRole === 'pharma' || selectedRole === 'hospital') ? t('orgIdentity') : t('professionalIdentity')}
                      </Label>
                      <p className="text-xs text-slate-400 font-medium">{(selectedRole === 'pharma' || selectedRole === 'hospital') ? t('uploadHintLogo') : t('uploadHintPhoto')}</p>
                   </div>
                </div>

                {/* Primary Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5">
                   {(selectedRole === 'pharma' || selectedRole === 'hospital') ? (
                     <div className="md:col-span-2 space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('orgName')}*</Label>
                        <Input name="organizationName" value={formData.organizationName} onChange={handleChange} required className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500" />
                     </div>
                   ) : (
                     <>
                        {selectedRole === 'doctor' && (
                          <div className="md:col-span-2 space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">Title</Label>
                            <select name="title" value={formData.title} onChange={handleChange} className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500">
                               <option value="">{t('selectTitle')}</option>
                               {DOCTOR_TITLES.map(tit => <option key={tit} value={tit}>{tit}</option>)}
                            </select>
                          </div>
                        )}
                                                 <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('firstName')}*</Label>
                           <Input name="firstName" value={formData.firstName} onChange={handleChange} required className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500" />
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('middleName')}</Label>
                           <Input name="middleName" value={formData.middleName} onChange={handleChange} className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500" />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                           <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('lastName')}*</Label>
                           <Input name="lastName" value={formData.lastName} onChange={handleChange} required className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500" />
                        </div>
                     </>
                   )}

                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('email')}*</Label>
                      <div className="relative group/input">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-emerald-500" />
                         <Input type="email" name="email" value={formData.email} onChange={handleChange} required className="h-14 pl-12 rounded-2xl bg-black/40 border-slate-800 focus:border-emerald-500 font-bold" />
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('phoneNumber')}</Label>
                      <div className="flex gap-2">
                        <div className="relative w-36 group/code">
                           <select 
                             name="phoneCode" 
                             value={formData.phoneCode} 
                             onChange={handleChange} 
                             className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 pl-10 pr-4 text-sm font-bold text-white outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                           >
                              {ARABIC_COUNTRY_CODES.map(c => (
                                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                              ))}
                           </select>
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within/code:text-emerald-500">
                              <Phone className="w-4 h-4" />
                           </div>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within/code:text-emerald-500">
                              <ChevronDown className="w-4 h-4" />
                           </div>
                        </div>
                        <Input 
                          type="tel" 
                          name="phone" 
                          value={formData.phone} 
                          onChange={handleChange} 
                          className="flex-1 h-14 rounded-2xl bg-black/40 border-slate-800 focus:border-emerald-500 font-bold text-sm" 
                          placeholder="5XXXXXXXX"
                        />
                      </div>
                   </div>

                   <div className="md:col-span-2 space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('securityKey')}*</Label>
                      <div className="relative group/input">
                         <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-emerald-500" />
                         <Input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required className="h-14 pl-12 rounded-2xl bg-black/40 border-slate-800 focus:border-emerald-500 tracking-widest font-bold" />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className={cn("absolute top-1/2 -translate-y-1/2 px-4", isRTL ? "left-0" : "right-0")}>
                            <Eye className="w-5 h-5 text-slate-500 hover:text-emerald-500 transition-colors" />
                         </button>
                      </div>
                   </div>
                </div>

                {/* Role Specific Fields */}
                <div className="pt-10 border-t border-white/5 space-y-8">
                   {selectedRole === 'doctor' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('specialty')}*</Label>
                           <select name="specialty" value={formData.specialty} onChange={handleChange} required className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500">
                              <option value="">{t('selectSpecialty')}</option>
                              {SPECIALTIES.map(s => <option key={s} value={s}>{t(`spec_${s.toLowerCase().slice(0, 5)}`) || s}</option>)}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('yearsExperience')}</Label>
                           <Input type="number" name="yearsExperience" value={formData.yearsExperience} onChange={handleChange} className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500" />
                        </div>
                     </div>
                   )}

                   {selectedRole === 'rep' && (
                     <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('roleTitle')}</Label>
                              <select name="roleTitle" value={formData.roleTitle} onChange={handleChange} className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500">
                                 <option value="">{t('selectRoleTitle')}</option>
                                 {REP_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                           </div>
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('pharmaCompany_select')}*</Label>
                              <select name="pharmaId" value={formData.pharmaId} onChange={handleChange} className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500">
                                 <option value="">{t('selectExistingCompany')}</option>
                                 {existingPharmaCompanies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                 <option value="other">{t('otherCreateNew')}</option>
                              </select>
                           </div>
                        </div>

                        {formData.pharmaId === 'other' && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                           <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('newCompanyName')}</Label>
                             <div className="relative group/input">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input name="newPharmaName" value={formData.newPharmaName} onChange={handleChange} required className="h-14 pl-12 rounded-2xl bg-brand/5 border-brand/20 font-bold placeholder:text-slate-600" placeholder={t('org_placeholder')} />
                             </div>
                          </div>
                        )}

                        <div className="space-y-6 pt-6 border-t border-white/5">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                                    <LayoutGrid className="w-4 h-4" />
                                 </div>
                                 <h3 className="text-xs font-black uppercase tracking-widest italic">{t('product_portfolio')}</h3>
                              </div>
                              <Button type="button" onClick={addProduct} variant="outline" className="h-10 rounded-xl border-dashed border-slate-700 text-[10px] font-black uppercase gap-2 hover:border-orange-500/50">
                                 <Plus className="w-3 h-3" /> {t('add_product')}
                              </Button>
                           </div>

                           <div className="space-y-4">
                              {formData.products.map((prod, idx) => (
                                <div key={prod.id} className="relative p-6 rounded-3xl bg-black/40 border border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
                                   <button type="button" onClick={() => removeProduct(idx)} className="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-1">
                                         <Label className="text-[8px] font-black uppercase text-slate-600 px-1 tracking-widest">{t('product_cat')}</Label>
                                         <select 
                                           value={prod.category} 
                                           onChange={(e) => handleProductChange(idx, 'category', e.target.value)}
                                           className="w-full h-11 rounded-xl bg-slate-900 border border-slate-800 px-3 text-xs font-bold text-white outline-none"
                                         >
                                            <option value="">Select Category</option>
                                            {PHARMA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                         </select>
                                      </div>
                                      <div className="space-y-1">
                                         <Label className="text-[8px] font-black uppercase text-slate-600 px-1 tracking-widest">{t('product_name')}*</Label>
                                         <Input 
                                           required 
                                           value={prod.name} 
                                           onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                                           className="h-11 rounded-xl bg-slate-900 border-slate-800 text-xs font-bold" 
                                           placeholder={t('medicineNamePlaceholder')}
                                         />
                                      </div>
                                      <div className="space-y-1">
                                         <Label className="text-[8px] font-black uppercase text-slate-600 px-1 tracking-widest">{t('product_form')}</Label>
                                         <Input 
                                           value={prod.form} 
                                           onChange={(e) => handleProductChange(idx, 'form', e.target.value)}
                                           className="h-11 rounded-xl bg-slate-900 border-slate-800 text-xs font-bold" 
                                           placeholder="Tablet, Syrup..."
                                         />
                                      </div>
                                      <div className="space-y-1">
                                         <Label className="text-[8px] font-black uppercase text-slate-600 px-1 tracking-widest">{t('doses')}</Label>
                                         <Input 
                                           value={prod.doses} 
                                           onChange={(e) => handleProductChange(idx, 'doses', e.target.value)}
                                           className="h-11 rounded-xl bg-slate-900 border-slate-800 text-xs font-bold" 
                                           placeholder="500mg, 10ml..."
                                         />
                                      </div>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                   )}
                </div>

                {/* Location Selection */}
                <div className="space-y-8 pt-10 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest italic">Regional Activation</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">Country*</Label>
                          <select name="country" value={formData.country} onChange={handleChange} required className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500">
                             {COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>

                       {selectedRole !== 'rep' ? (
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">City*</Label>
                            <select name="city" value={formData.city} onChange={handleChange} required className="w-full h-14 rounded-2xl bg-black/40 border border-slate-800 px-4 text-sm font-bold text-white outline-none focus:border-emerald-500">
                               <option value="">Select City</option>
                               {CITY_MAP[formData.country]?.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                         </div>
                       ) : (
                         <div className="md:col-span-2 space-y-4">
                            <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">Operating Cities* (Select Multiple)</Label>
                            <div className="flex flex-wrap gap-2">
                               {CITY_MAP[formData.country]?.map(city => {
                                 const isSelected = formData.cities.includes(city);
                                 return (
                                   <button
                                     key={city}
                                     type="button"
                                     onClick={() => toggleCity(city)}
                                     className={cn(
                                       "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                       isSelected ? "bg-orange-500 border-orange-500 text-white" : "bg-black/40 border-slate-800 text-slate-500 hover:border-slate-700"
                                     )}
                                   >
                                     {city}
                                   </button>
                                 );
                               })}
                            </div>
                         </div>
                       )}

                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('area')}</Label>
                          <Input name="area" value={formData.area} onChange={handleChange} className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500" placeholder={t('districtPlaceholder')} />
                       </div>

                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic uppercase">{t('address_label')}</Label>
                          <Input name="address" value={formData.address} onChange={handleChange} className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500" placeholder={t('streetPlaceholder')} />
                       </div>
                    </div>
                </div>

                {/* Documents for Pharma/Hospital */}
                {(selectedRole === 'pharma' || selectedRole === 'hospital') && (
                  <div className="pt-10 border-t border-white/5 space-y-8">
                     <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-brand" />
                        <h3 className="text-xs font-black uppercase tracking-widest italic">Verification Documents</h3>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { id: 'commCertificate', label: 'Commercial Certificate' },
                          { id: 'natAddress', label: 'National Address' },
                          { id: 'vatCertificate', label: 'VAT Certificate' }
                        ].map(doc => (
                          <div key={doc.id} className="relative group/doc p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col items-center gap-4 text-center">
                             <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover/doc:bg-brand/10 text-slate-600 group-hover/doc:text-brand flex items-center justify-center transition-colors">
                                {(formData as any)[doc.id] ? <Check className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                             </div>
                             <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{doc.label}</span>
                                <p className="text-[8px] text-slate-600 uppercase font-bold italic">{(formData as any)[doc.id] ? (formData as any)[doc.id].name : 'PDF/JPG/PNG'}</p>
                             </div>
                             <input type="file" onChange={(e) => handleFileChange(e, doc.id)} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                        ))}
                     </div>
                  </div>
                )}
             </motion.div>

             <Button type="submit" disabled={loading} className="w-full h-24 rounded-[3.5rem] bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-2xl shadow-[0_30px_80px_-15px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] border-t border-white/20 group/submit">
                {loading ? <Activity className="w-9 h-9 animate-spin text-white" /> : (
                  <div className="flex items-center gap-6">
                    <span className="tracking-[0.2em] italic uppercase">{t('initializeRegistration')}</span>
                    <ChevronRight className={cn("w-8 h-8 group-hover/submit:translate-x-3 transition-transform", isRTL && "-scale-x-100")} />
                  </div>
                )}
             </Button>
          </form>
        </div>
      </main>

      {/* Corporate Footer (Minimal) */}
      <footer className="w-full bg-[#050b14] border-t border-white/5 py-16 px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-20">
          <div className="space-y-8">
             <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl p-2 w-10 h-10 shadow-2xl">
                  <img src="/logo.png" alt="Lomixa" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-black italic tracking-tighter uppercase text-white leading-none">{t('appName')}</span>
             </div>
             <p className="text-sm text-slate-400 leading-relaxed font-medium">
               Connecting pharmaceutical companies and healthcare professionals through a secure, regional grid.
             </p>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Quick Links</h4>
            <ul className="space-y-4 font-medium text-sm">
              <li><Link to="/login" className="text-slate-400 hover:text-emerald-500 transition-colors">Login</Link></li>
              <li><Link to="/select-role" className="text-slate-400 hover:text-emerald-500 transition-colors">Sign up</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-emerald-500 transition-colors">About Us</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-emerald-500 transition-colors">Terms and Conditions</Link></li>
            </ul>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Contact Us</h4>
            <div className="space-y-5 text-sm font-medium text-slate-400">
               <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">Support</div>
                  <span className="text-white font-semibold italic">Info@lomixa.net</span>
               </div>
               <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">HQ</div>
                  <span className="text-white/80 italic leading-relaxed">5 Tahrir Street, Giza, Egypt</span>
               </div>
            </div>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Social Context</h4>
            <div className="flex gap-4">
               {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                 <a key={i} href="#" className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand/40 transition-all shadow-xl">
                    <Icon className="w-5 h-5" />
                 </a>
               ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 text-center">
          <p>© 2026 LOMIXA Healthcare Systems. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
