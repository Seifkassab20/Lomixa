import React, { useState, useEffect } from 'react';
import { getProfile, saveProfile } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Building2, Save, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SettingsPage() {
  const { userId, user, role } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    organization: '',
    location: '',
    bio: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userId) {
      const profile = getProfile(userId);
      setForm({
        fullName: profile.fullName || user?.user_metadata?.full_name || '',
        phone: profile.phone || user?.user_metadata?.mobile || '',
        organization: profile.organization || '',
        location: profile.location || '',
        bio: profile.bio || '',
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settingsTitle')}</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('manageProfile')}</p>
      </div>

      {/* Avatar + Role badge */}
      <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{form.fullName || user?.email?.split('@')[0] || 'User'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-medium">
                {role ? t(roleKeys[role]) : 'User'}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{t('profileInformation')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm dark:text-slate-300">{t('fullNameLabel')}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder={t('fullName')}
                className="pl-9 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm dark:text-slate-300">{t('phoneNumber')}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+966 5X XXX XXXX"
                className="pl-9 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm dark:text-slate-300">{t('organizationLabel')}</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={form.organization}
                onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                placeholder={t('organization')}
                className="pl-9 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm dark:text-slate-300">{t('locationCity')}</Label>
            <Input
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Riyadh, Jeddah..."
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm dark:text-slate-300">{t('bioDesc')}</Label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder={t('bioPlaceholder')}
            rows={3}
            className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white px-3 py-2.5 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? t('saved') : t('save')}
          </Button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">{t('profileUpdated')}</span>}
        </div>
      </form>

      {/* Account Info */}
      <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('accountDetails')}</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b dark:border-slate-700">
            <span className="text-sm text-gray-500 dark:text-slate-400">{t('emailLabel')}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b dark:border-slate-700">
            <span className="text-sm text-gray-500 dark:text-slate-400">{t('accountType')}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{role ? t(roleKeys[role]) : 'User'}</span>
          </div>
          <div className="flex justify-between py-2 border-b dark:border-slate-700">
            <span className="text-sm text-gray-500 dark:text-slate-400">{t('timezone')}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{t('timezoneValue')}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500 dark:text-slate-400">{t('currency')}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{t('currencyValue')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
