import React, { useState, useEffect } from 'react';
import { getProfile, saveProfile } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Building2, Save, CheckCircle2, MapPin, Globe, Shield, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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

export function SettingsPage() {
  const { userId, user, role } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    organization: '',
    country: 'sa',
    city: '',
    bio: '',
    email: '',
    newPassword: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userId) {
      const profile = getProfile(userId);
      setForm({
        fullName: profile.fullName || user?.user_metadata?.full_name || '',
        phone: profile.phone || user?.user_metadata?.mobile || '',
        organization: profile.organization || user?.user_metadata?.organization || '',
        country: profile.country || user?.user_metadata?.country || 'sa',
        city: profile.city || user?.user_metadata?.city || '',
        bio: profile.bio || '',
        email: user?.email || '',
        newPassword: '',
      });
    }
  }, [userId, user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    saveProfile(userId, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const roleKeys: Record<string, string> = {
    pharma: 'pharmaCompanyFull',
    hospital: 'hospital',
    doctor: 'doctor',
    rep: 'salesRep',
  };

  const isInstitution = role === 'pharma' || role === 'hospital';
  const showOrgField = role === 'doctor' || role === 'rep';

  return (
    <div className="space-y-8 max-w-3xl pb-12">
      <div className="flex items-center justify-between border-b dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">{t('settingsTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('manageProfileDescription') || 'Update your personal and organizational profile'}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">{role ? t(roleKeys[role]) : 'User'}</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Core Identity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('identity_sec') || 'Identity'}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t('identity_desc') || 'Your basic account information and contact details.'}</p>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('fullNameLabel')}</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    className="pl-12 h-12 rounded-xl bg-white dark:bg-slate-900/50 dark:border-slate-800"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('phoneNumber')}</Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="pl-12 h-12 rounded-xl bg-white dark:bg-slate-900/50 dark:border-slate-800"
                  />
                </div>
              </div>
            </div>
            
            {showOrgField && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{role === 'doctor' ? t('hospital') : t('pharmaCompany')}</Label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className="pl-12 h-12 rounded-xl bg-white dark:bg-slate-900/50 dark:border-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location - Only for institutions as per request */}
        {isInstitution && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t dark:border-slate-800">
            <div className="lg:col-span-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('location_sec') || 'Location'}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t('location_desc_settings') || 'Regional presence settings for your organization.'}</p>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('country')} *</Label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <select
                      name="country"
                      value={form.country}
                      onChange={e => setForm(f => ({ ...f, country: e.target.value, city: '' }))}
                      className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-slate-900/50 border dark:border-slate-800 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                    >
                      <option value="sa">{t('country_sa') || 'Saudi Arabia'}</option>
                      <option value="uae">{t('country_uae') || 'UAE'}</option>
                      <option value="egypt">{t('country_egypt') || 'Egypt'}</option>
                      <option value="jordan">{t('country_jordan') || 'Jordan'}</option>
                      <option value="kuwait">{t('country_kuwait') || 'Kuwait'}</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('city')} ({t('optional')})</Label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <select
                      name="city"
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-slate-900/50 border dark:border-slate-800 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                    >
                      <option value="">{t('selectCity') || 'Select city...'}</option>
                      {CITY_MAP[form.country]?.map(c => (
                        <option key={c} value={c}>{t(`city_${c}`) || c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security / Account */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t dark:border-slate-800">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('security_sec') || 'Account & Security'}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t('security_desc') || 'Manage your email and update password.'}</p>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('emailLabel')}</Label>
              <div className="relative group opacity-60">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={form.email} disabled className="pl-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('newPassword') || 'New Password'}</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  type="password"
                  value={form.newPassword}
                  onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="pl-12 h-12 rounded-xl bg-white dark:bg-slate-900/50 dark:border-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t dark:border-slate-800 flex items-center justify-end gap-4">
          {saved && (
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 italic flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t('profileUpdated') || 'Changes Saved'}
            </span>
          )}
          <Button type="submit" disabled={saved} className="h-12 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest italic transition-all shadow-xl shadow-emerald-500/10">
            {saved ? t('saved') : t('save_changes') || 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
