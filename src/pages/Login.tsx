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
  Shield 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';

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

  React.useEffect(() => {
    const checkRedirect = async () => {
      // Only redirect if authenticated AND fully verified/authorized
      if (user && !loading) {
        const { isUserAuthorized, checkUserExistence } = await import('@/lib/store');
        const authorized = await isUserAuthorized(user.id, user.user_metadata?.role);
        if (authorized) {
           navigate('/dashboard', { replace: true });
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

      // Demo mode — no Supabase configured
      if (!isSupabaseConfigured) {
        localStorage.setItem('demo_role', selectedRole);
        localStorage.setItem('demo_email', email);
        localStorage.setItem('demo_name', email.split('@')[0]);
        window.location.href = '/';
        return;
      }

      // Signal the intended role for the AuthProvider to enforce
      localStorage.setItem('lomixa_target_role', selectedRole);

      // Pre-check existence for better AX (as requested)
      // EXCEPTION: Admins are not stored in the public role tables, they are in auth.users directly.
      if (selectedRole !== 'admin') {
        const { checkUserExistence } = await import('@/lib/store');
        const emailExists = await checkUserExistence('email', email);
        if (!emailExists) {
          throw new Error(`The workspace identity '${email}' does not exist in our grid. Please check your spelling or register a new identity.`);
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

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

      // Force-fetch the latest user data to ensure metadata is sync'd
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      
      const userId = freshUser?.id;
      const actualRole = freshUser?.user_metadata?.role;
      if (actualRole && actualRole !== selectedRole) {
        await supabase.auth.signOut();
        throw new Error(`Invalid role. This account is registered as a ${actualRole}. Please select the ${actualRole} role to sign in.`);
      }

      // Robust Verification Gate: Check local grid, then fallback to direct cloud query
      if (userId) {
        const { isUserAuthorized, checkUserExistence } = await import('@/lib/store');
        const authorized = await isUserAuthorized(userId, selectedRole);

        if (!authorized) {
          await supabase.auth.signOut();
          throw new Error('Access Pending: Your registration is currently being reviewed by the System Administrator. You will be notified once your organization is verified.');
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
      // checkUserExistence is only needed for phone reset, not email
      // as email reset should allow admin accounts not in role tables.
      if (resetMethod === 'email') {
        if (!email) throw new Error('Please enter your workspace email.');
        if (isSupabaseConfigured) {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login?type=recovery`,
          });
          if (error) throw error;
        }
        toast('Verification link sent to your workspace email.', 'success');
      } else { // resetMethod === 'phone'
        if (!resetPhone) throw new Error('Please enter your registered mobile number.');
        if (isSupabaseConfigured) {
          const { checkUserExistence } = await import('@/lib/store');
          const exists = await checkUserExistence('phone', resetPhone);
          if (!exists) throw new Error('This mobile identity does not exist in our grid.');

          const { error } = await supabase.auth.updateUser({ phone: resetPhone });
          if (error) throw error;
        }
        toast('Verification code sent to your mobile.', 'success');
      }
      setResetSent(true);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'hospital', title: t('hospital'), desc: t('hospitalDesc'), icon: Activity },
    { id: 'doctor', title: t('doctor'), desc: t('doctorDesc'), icon: Stethoscope },
    { id: 'pharma', title: t('pharmaCompanyFull'), desc: t('pharmaDesc'), icon: Building2 },
    { id: 'rep', title: t('salesRep'), desc: t('salesRepDesc'), icon: Briefcase },
  ];

  if (showAdmin) {
    roles.splice(0, 0, { id: 'admin', title: t('adminRole'), desc: t('adminDesc'), icon: Shield });
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    localStorage.setItem('lomixa_lang', newLang);
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#050b14] items-center py-20 px-6">
      {/* Centered Logo Section */}
      <div className="w-full max-w-xl flex flex-col items-center mb-16">
        <button onClick={handleLogoClick} className="bg-white rounded-[2.5rem] p-3 w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center shadow-2xl border-4 border-white/5 shadow-emerald-500/10 transition-transform active:scale-95 group overflow-hidden hover:rotate-2">
          <img src="/logo.png" alt="Lomixa Logo" className="w-full h-full object-contain rounded-full transition-transform group-hover:scale-110" />
        </button>
        <div className="mt-8 text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase">{t('appName')}</h1>
          <p className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">{t('platformDesc')}</p>
        </div>
      </div>

      <div className="w-full max-w-2xl px-6 pb-24 relative">
        <div className="absolute top-0 right-0 flex items-center gap-4 bg-slate-900/50 backdrop-blur-sm p-1 rounded-full border border-slate-800 -translate-y-12">
            <Link to="/about" className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-slate-800 rounded-full transition-all">About</Link>
            <button 
              onClick={toggleLanguage}
              className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-slate-800 rounded-full transition-all border-l border-slate-800"
            >
              {i18n.language === 'en' ? 'عربي' : 'English'}
            </button>
        </div>

        <div className="w-full max-w-md mx-auto bg-[#0f172a] rounded-[2.5rem] p-8 lg:p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
            
            <div className="mb-8 relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                {t('welcomeBack')}
              </h2>
              <p className="text-slate-400 text-sm">
                {t('secureAccess')}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm animate-shake">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-[10px] font-black tracking-widest uppercase text-slate-500 ml-1 italic">{t('identifyRole')}</Label>
                <div className={cn(
                  "grid gap-3 transition-all duration-500",
                  showAdmin ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" : "grid-cols-2"
                )}>
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = selectedRole === r.id;
                    const isAdmin = r.id === 'admin';
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id)}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-[1.25rem] border text-left transition-all duration-300 relative overflow-hidden group/btn",
                          isSelected 
                            ? (isAdmin ? "bg-purple-900/30 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]" : "bg-emerald-500/5 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]")
                            : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700",
                          isAdmin && "animate-pulse-slow"
                        )}
                      >
                        <div className={cn(
                          "p-2.5 rounded-xl mb-3 transition-colors duration-300",
                          isSelected 
                            ? (isAdmin ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400") 
                            : (isAdmin ? "bg-purple-500/10 text-purple-500" : "bg-slate-700/50 text-slate-400")
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className={cn("text-[11px] font-bold mb-1 transition-colors", isSelected ? "text-white" : "text-slate-300 group-hover/btn:text-white")}>
                          {r.title}
                        </h3>
                        {isSelected && (
                          <div className={cn("absolute bottom-0 left-0 w-full h-1", isAdmin ? "bg-purple-500" : "bg-emerald-500")}></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-400 ml-1 tracking-wide uppercase">{t('emailWorkspace')}</Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@work.com"
                      className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 h-12 rounded-2xl pl-12 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-400 ml-1 tracking-wide uppercase">{t('securityKey')}</Label>
                    <button 
                      type="button" 
                      onClick={() => setIsResetMode(true)}
                      className="text-[10px] font-black uppercase tracking-widest text-[#0d7a5b] hover:text-emerald-400 italic transition-colors"
                    >
                      {t('forgotKey') || 'Restore Key?'}
                    </button>
                  </div>
                  <div className="relative group/input">
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 h-12 rounded-2xl pr-12 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all shadow-inner"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-[#0d7a5b] hover:bg-[#0a6148] text-white font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] mt-6 group"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('connecting')}
                  </div>
                ) : (
                  <>
                    <span>{t('establishConnection')}</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {isResetMode && (
              <div className="absolute inset-0 z-50 bg-[#0f172a] p-8 lg:p-10 flex flex-col justify-center animate-in fade-in zoom-in duration-300">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{t('restoreAccess') || 'Restore Access'}</h3>
                  <p className="text-slate-400 text-sm">
                    {resetSent 
                      ? (t('verificationSent') || 'Check your communications for the reset link/code.')
                      : (t('enterDetailsRescue') || 'Select your restoration method and enter details.')}
                  </p>
                </div>

                {!resetSent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="flex gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
                      <button 
                        type="button" 
                        onClick={() => setResetMethod('email')}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          resetMethod === 'email' ? "bg-emerald-500 text-white" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        Email
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setResetMethod('phone')}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          resetMethod === 'phone' ? "bg-emerald-500 text-white" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        Phone
                      </button>
                    </div>

                    {resetMethod === 'email' ? (
                      <div className="space-y-2">
                        <Label htmlFor="resetEmail" className="text-xs font-bold text-slate-400 ml-1 tracking-wide uppercase">{t('emailWorkspace')}</Label>
                        <div className="relative group/input">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                          <Input
                            id="resetEmail"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@work.com"
                            className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 h-12 rounded-2xl pl-12 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="resetPhone" className="text-xs font-bold text-slate-400 ml-1 tracking-wide uppercase">{t('mobile')}</Label>
                        <div className="relative group/input">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                          <Input
                            id="resetPhone"
                            type="tel"
                            required
                            value={resetPhone}
                            onChange={(e) => setResetPhone(e.target.value)}
                            placeholder="+20 XXX XXX XXXX"
                            className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 h-12 rounded-2xl pl-12 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    )}

                    <Button 
                      disabled={loading}
                      className="w-full h-12 rounded-xl bg-[#0d7a5b] hover:bg-[#0a6148] text-white font-bold"
                    >
                      {loading ? t('sending') || 'Sending...' : t('sendLink') || 'Send Restoration Link'}
                    </Button>
                    <button 
                      type="button" 
                      onClick={() => setIsResetMode(false)}
                      className="w-full text-xs font-bold text-slate-400 hover:text-white transition-colors py-2"
                    >
                      {t('backToLogin') || 'Return to Login'}
                    </button>
                  </form>
                ) : (
                  <Button 
                    onClick={() => { setIsResetMode(false); setResetSent(false); }}
                    className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    {t('gotIt') || 'Got it'}
                  </Button>
                )}
              </div>
            )}

            <div className="mt-8 text-center border-t border-slate-800/30 pt-8">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                {t('noAccount')} <Link to="/select-role" className="text-emerald-500 hover:text-emerald-400 underline decoration-emerald-500/20 underline-offset-4">{t('signUp')}</Link>
              </p>
            </div>
          </div>
        </div>

      {/* Footer Section */}
      <footer className="w-full bg-[#050b14] border-t border-slate-800/80 px-8 py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16">
          {/* Contact Info */}
          <div className="space-y-8 flex-1">
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] bg-emerald-500/10 w-fit px-4 py-2 rounded-lg border border-emerald-500/20 shadow-sm shadow-emerald-500/5">Contact Lomixa</h4>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="flex items-start gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all shadow-xl">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-widest">Email Support</div>
                  <a href="mailto:Info@lomixa.net" className="text-white hover:text-emerald-400 transition-colors font-semibold text-base">Info@lomixa.net</a>
                </div>
              </div>
              <div className="flex items-start gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all shadow-xl">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-widest">Phone Hot-line</div>
                  <a href="tel:+201150590602" className="text-white hover:text-emerald-400 transition-colors font-semibold text-base">+20 115 059 0602</a>
                </div>
              </div>
              <div className="flex items-start gap-5 group sm:col-span-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all shadow-xl">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-widest">Corporate Address</div>
                  <p className="text-white font-semibold text-base">5 Tahrir Street, Giza, Egypt</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-8 min-w-[200px]">
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] md:text-right">Global Connect</h4>
            <div className="flex md:justify-end gap-5">
              {[
                { icon: Facebook, href: "https://www.facebook.com/share/1CnvDsiXyq/?mibextid=wwXIfr", color: "hover:bg-blue-600" },
                { icon: Instagram, href: "https://www.instagram.com/lomixahealthcare?igsh=N2lnZWx4OWdpeXN2", color: "hover:bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" },
                { icon: Linkedin, href: "https://www.linkedin.com/company/lomixa-health-care/", color: "hover:bg-[#0077b5]" },
              ].map((social, i) => (
                <a 
                  key={i}
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={cn(
                    "w-14 h-14 rounded-[1.25rem] bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl hover:scale-110",
                    social.color
                  )}
                >
                  <social.icon className="w-6 h-6" />
                </a>
              ))}
            </div>
            <div className="md:text-right">
              <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest leading-loose">
                Follow our official channels for<br />latest healthcare updates.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            <span className="opacity-50">© 2026 Lomixa Solutions</span>
            <Link to="/about" className="hover:text-emerald-500 transition-colors">{t('about')}</Link>
            <Link to="/terms" className="hover:text-emerald-500 transition-colors">{t('terms')}</Link>
            <Link to="/terms" className="hover:text-emerald-500 transition-colors">{t('privacy')}</Link>
          </div>
          <p className="max-w-xs text-center md:text-right leading-loose opacity-40">
            Encrypted HIPAA-compliant data routing and professional visualization systems.
          </p>
        </div>
      </footer>
    </div>
  );
}
