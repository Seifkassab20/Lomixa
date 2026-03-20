import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stethoscope, Building2, Activity, Briefcase, Eye, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!selectedRole) {
        throw new Error('Please select a role to continue.');
      }

      // Demo mode — no Supabase configured
      if (!isSupabaseConfigured) {
        localStorage.setItem('demo_role', selectedRole);
        localStorage.setItem('demo_email', email);
        localStorage.setItem('demo_name', email.split('@')[0]);
        window.location.href = '/';
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Network / config errors → fall back to demo
        if (
          error.message.includes('fetch') ||
          error.message.includes('FetchError') ||
          error.message.includes('API key') ||
          error.message.includes('Invalid URL')
        ) {
          localStorage.setItem('demo_role', selectedRole);
          localStorage.setItem('demo_email', email);
          localStorage.setItem('demo_name', email.split('@')[0]);
          window.location.href = '/';
          return;
        }
        throw error;
      }
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'pharma', title: t('pharmaCompanyFull'), desc: t('pharmaDesc'), icon: Building2 },
    { id: 'hospital', title: t('hospital'), desc: t('hospitalDesc'), icon: Activity },
    { id: 'doctor', title: t('doctor'), desc: t('doctorDesc'), icon: Stethoscope },
    { id: 'rep', title: t('salesRep'), desc: t('salesRepDesc'), icon: Briefcase },
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    localStorage.setItem('lomixa_lang', newLang);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans">
      {/* Left Panel - Branding */}
      <div className="w-full lg:w-1/2 bg-[#0d7a5b] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

        <div className="relative z-10">
          <div className="mb-16">
            <div className="bg-white rounded-full p-2 w-32 h-32 flex items-center justify-center shadow-xl border-4 border-white/20">
              <img src="/logo.png" alt="Lomixa Logo" className="w-full h-full object-contain rounded-full" />
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
              {t('bridgingPharma')} <br />
              <span className="relative inline-block">
                {t('healthcare')}
                <div className="absolute bottom-2 left-0 w-full h-2 bg-emerald-400/50 -z-10"></div>
              </span>
            </h2>
            <p className="text-lg text-emerald-50/90 leading-relaxed mb-12">
              {t('platformDesc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="text-4xl font-bold mb-1">500+</div>
            <div className="text-xs font-bold tracking-wider uppercase text-emerald-100">{t('activeDoctors')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="text-4xl font-bold mb-1">48</div>
            <div className="text-xs font-bold tracking-wider uppercase text-emerald-100">{t('pharmaCompanies')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="text-4xl font-bold mb-1">12K+</div>
            <div className="text-xs font-bold tracking-wider uppercase text-emerald-100">{t('visitsScheduled')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="text-4xl font-bold mb-1">98%</div>
            <div className="text-xs font-bold tracking-wider uppercase text-emerald-100">{t('satisfactionRate')}</div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-[#050b14] flex flex-col items-center justify-center p-8 lg:p-16 relative">
        <button 
          onClick={toggleLanguage}
          className="absolute top-8 right-8 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          {i18n.language === 'en' ? t('switchToArabic') : t('switchToEnglish')}
        </button>

        <div className="w-full max-w-md bg-[#0f172a] rounded-[2rem] p-8 lg:p-10 border border-slate-800 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              {t('welcomeBack')}
            </h2>
            <p className="text-slate-400 text-sm">
              {t('secureAccess')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-xs font-bold tracking-widest uppercase text-slate-500">{t('identifyRole')}</Label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={cn(
                        "flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200",
                        isSelected 
                          ? "bg-slate-800 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                          : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg mb-3",
                        isSelected ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700/50 text-slate-400"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className={cn("text-sm font-semibold mb-1", isSelected ? "text-white" : "text-slate-200")}>
                        {r.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {r.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-300">{t('emailWorkspace')}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospital.com.sa"
                  className="bg-[#0a0f1c] border-slate-800 text-white placeholder:text-slate-600 h-12 rounded-xl focus-visible:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-300">{t('securityKey')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[#0a0f1c] border-slate-800 text-white placeholder:text-slate-600 h-12 rounded-xl pr-10 focus-visible:ring-emerald-500/50"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-[#0d7a5b] hover:bg-[#0a6148] text-white font-medium flex items-center justify-center gap-2 transition-all"
              disabled={loading}
            >
              {loading ? t('connecting') : t('establishConnection')}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              {t('newToPlatform')}{' '}
              <Link to="/register" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                {t('initiateRegistration')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
