import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Stethoscope, 
  Building2, 
  Activity, 
  Briefcase, 
  Eye, 
  ArrowRight, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin, 
  Shield,
  Sparkles,
  Lock,
  Globe,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'motion/react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [resetPhone, setResetPhone] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  React.useEffect(() => {
    const checkRedirect = async () => {
      if (user && !loading) {
        const { getAuthorizationDetails } = await import('@/lib/store');
        const { authorized } = await getAuthorizationDetails(user.id, user.user_metadata?.role);
        if (authorized) {
           navigate('/dashboard', { replace: true });
        } else {
           const { supabase } = await import('@/lib/supabase');
           await supabase.auth.signOut();
        }
      }
    };
    checkRedirect();
  }, [user, loading, navigate]);

  const handleLogoClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount === 5) {
      setShowAdmin(true);
      toast('Developer mode activated', 'success');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!selectedRole) {
        toast('Please identify your role first.', 'error');
        throw new Error('Please select a role to continue.');
      }
      if (!email.trim() || !password.trim()) {
        toast('Please enter both your email and security key.', 'error');
        throw new Error('Credential mismatch check failed.');
      }

      if (!isSupabaseConfigured) {
        localStorage.setItem('demo_role', selectedRole);
        localStorage.setItem('demo_email', email);
        localStorage.setItem('demo_name', email.split('@')[0]);
        window.location.href = '/';
        return;
      }

      localStorage.setItem('lomixa_target_role', selectedRole);

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user: freshUser } } = await supabase.auth.getUser();
      const actualRole = freshUser?.user_metadata?.role;
      
      if (actualRole && actualRole !== selectedRole) {
        await supabase.auth.signOut();
        throw new Error(`Invalid role. This account is registered as a ${actualRole}.`);
      }

      if (freshUser && actualRole && actualRole !== 'admin') {
        const { getAuthorizationDetails, ensureUserEntityExists } = await import('@/lib/store');
        
        // This is necessary to self-heal doctors created by hospitals whose insertions
        // might have been blocked by RLS policies so they can be available locally.
        await ensureUserEntityExists(freshUser);

        const { authorized, reason } = await getAuthorizationDetails(freshUser.id, actualRole);
        if (!authorized) {
          await supabase.auth.signOut();
          throw new Error(reason || 'Account access suspended by administration.');
        }
      }

      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Failed to login';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
           redirectTo: `${window.location.origin}/login?type=recovery`,
        });
        if (error) throw error;
      }
      toast('Recovery link sent.', 'success');
      setResetSent(true);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'hospital', title: t('hospital'), icon: Activity, color: 'bg-emerald-500', light: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { id: 'doctor', title: t('doctor'), icon: Stethoscope, color: 'bg-sky-500', light: 'bg-sky-500/10', border: 'border-sky-500/30' },
    { id: 'pharma', title: t('pharmaCompanyFull'), icon: Building2, color: 'bg-indigo-500', light: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
    { id: 'rep', title: t('salesRep'), icon: Briefcase, color: 'bg-orange-500', light: 'bg-orange-500/10', border: 'border-orange-500/30' },
  ];

  if (showAdmin) {
    roles.push({ id: 'admin', title: t('adminRole'), icon: Shield, color: 'bg-purple-500', light: 'bg-purple-500/10', border: 'border-purple-500/30' });
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    localStorage.setItem('lomixa_lang', newLang);
  };

  return (
    <div className="min-h-screen w-full bg-[#050b14] text-white font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] -z-10"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10"></div>

      {/* Header Navigation */}
      <header className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center backdrop-blur-sm">
        <div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer group">
          <div className="bg-white rounded-2xl p-2 w-10 h-10 shadow-2xl shadow-emerald-500/10 transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="Lomixa" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-black italic tracking-tighter uppercase text-white">{t('appName')}</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleLanguage}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all font-sans"
          >
            {i18n.language === 'en' ? 'عربي' : 'English'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-40 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[1000px] flex flex-col lg:grid lg:grid-cols-2 gap-16 items-center"
        >
          {/* Brand Presentation */}
          <div className="space-y-10 lg:pr-12">
            <div className="space-y-6">
              <h1 className="text-6xl lg:text-7xl font-black leading-[1.05] tracking-tighter text-white uppercase italic">
                {t('welcomeBack')}<br/>
                <span className="text-emerald-500">LOMIXA</span>
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-md">
                {t('platformDesc')}
              </p>
            </div>
          </div>

          {/* Authentication Card */}
          <div className="w-full max-w-md">
            <div className="bg-[#0a111c]/80 backdrop-blur-xl rounded-[3rem] p-8 lg:p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                    <Lock className="w-5 h-5 text-emerald-500" />
                    Secure Access
                  </h2>
                </div>

                <AnimatePresence mode="wait">
                  {!isResetMode ? (
                    <motion.form 
                      key="login"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleLogin} 
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black tracking-widest uppercase text-slate-500 ml-1 italic">Identify Workspace</Label>
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
                                  "group/role flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300",
                                  isSelected 
                                    ? cn(r.light, r.border, "shadow-lg shadow-black/20") 
                                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                                )}
                              >
                                <div className={cn(
                                  "p-2 rounded-xl transition-colors shrink-0",
                                  isSelected ? cn(r.color, "text-white") : "bg-slate-800 text-slate-500"
                                )}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", isSelected ? "text-white" : "text-slate-400")}>
                                  {r.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black tracking-widest uppercase text-slate-500 ml-1">{t('emailWorkspace')}</Label>
                          <div className="relative group/input">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="h-14 pl-12 rounded-2xl bg-black/40 border-slate-800 focus:border-emerald-500 font-bold transition-all text-sm"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <div className="flex justify-between items-center ml-1">
                            <Label className="text-[10px] font-black tracking-widest uppercase text-slate-500">{t('securityKey')}</Label>
                            <button type="button" onClick={() => setIsResetMode(true)} className="text-[10px] font-bold text-slate-500 hover:text-emerald-400 uppercase tracking-widest transition-colors font-sans">{t('forgotPassword')}</button>
                          </div>
                          <div className="relative group/input">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="h-14 pl-12 rounded-2xl bg-black/40 border-slate-800 focus:border-emerald-500 tracking-widest font-bold transition-all text-sm"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {error && (
                        <p className="text-xs font-bold text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center uppercase tracking-widest italic">{error}</p>
                      )}

                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {loading ? 'Authenticating...' : (
                          <div className="flex items-center gap-3">
                            {t('establishConnection')}
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        )}
                      </Button>
                    </motion.form>
                  ) : (
                    <motion.div 
                      key="reset"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <h3 className="text-lg font-black uppercase italic text-white tracking-tighter">Connection Recovery</h3>
                      <form onSubmit={handleForgotPassword} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Workspace Identity</Label>
                          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl bg-black/40 border-slate-800 font-bold" placeholder="user@organization.com" />
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-2xl bg-emerald-600 font-black uppercase tracking-widest">Request Reset</Button>
                        <button type="button" onClick={() => setIsResetMode(false)} className="w-full text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Return to Entry</button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-black italic">
                    {t('newToPlatform')} <Link to="/select-role" className="text-emerald-500 hover:text-white transition-colors">{t('initiateRegistration')}</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Corporate LOMIXA Footer (Exact Restore from User Image) */}
      <footer className="w-full bg-[#050b14] border-t border-white/5 py-16 px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24">
          
          {/* Identity Column */}
          <div className="space-y-8 col-span-1 md:col-span-1">
             <div className="flex items-center gap-3 group">
                <div className="bg-white rounded-xl p-2 w-10 h-10 shadow-2xl transition-transform group-hover:scale-105">
                  <img src="/logo.png" alt="Lomixa" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-black italic tracking-tighter uppercase text-white leading-none">{t('appName')}</span>
             </div>
             <p className="text-sm text-slate-400 leading-relaxed font-medium">
               {t('platformDesc')}
             </p>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/login" className="text-sm text-slate-400 hover:text-emerald-500 transition-colors font-medium">Login</Link></li>
              <li><Link to="/select-role" className="text-sm text-slate-400 hover:text-emerald-500 transition-colors font-medium">Sign up</Link></li>
              <li><Link to="/about" className="text-sm text-slate-400 hover:text-emerald-500 transition-colors font-medium">About Us</Link></li>
              <li><Link to="/about" className="text-sm text-slate-400 hover:text-emerald-500 transition-colors font-medium">Terms and Conditions</Link></li>
            </ul>
          </div>

          {/* Contact Us Column */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Contact Us</h4>
            <ul className="space-y-4 font-medium text-sm text-slate-400">
               <li className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest">Email Support</span>
                  <a href="mailto:Info@lomixa.net" className="text-white hover:text-emerald-500 transition-all font-semibold">Info@lomixa.net</a>
               </li>
               <li className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest">Phone Direct</span>
                  <span className="text-white font-semibold">+20 115 059 0602</span>
               </li>
               <li className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest">HQ Address</span>
                  <span className="text-white/80 leading-relaxed">5 Tahrir Street, Giza, Egypt</span>
               </li>
            </ul>
          </div>

          {/* Social Presence Column */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Follow Us</h4>
            <div className="flex gap-4">
               {[
                 { icon: Facebook, href: "https://www.facebook.com/share/1CnvDsiXyq/?mibextid=wwXIfr" },
                 { icon: Instagram, href: "https://www.instagram.com/lomixahealthcare?igsh=N2lnZWx4OWdpeXN2" },
                 { icon: Linkedin, href: "https://www.linkedin.com/company/lomixa-health-care/" }
               ].map((social, i) => (
                 <a 
                   key={i}
                   href={social.href} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all shadow-xl"
                 >
                   <social.icon className="w-5 h-5" />
                 </a>
               ))}
            </div>
          </div>
        </div>

        {/* Closing Legal Bar */}
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
          <p>© 2026 LOMIXA Healthcare Systems. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
