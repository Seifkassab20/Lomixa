import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Building2, Hospital as HospitalIcon, Stethoscope, Users, ArrowRight, Shield, Sparkles, ChevronRight, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoleSelection() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [logoClicks, setLogoClicks] = React.useState(0);
  const [showAdmin, setShowAdmin] = React.useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    localStorage.setItem('lomixa_lang', newLang);
  };

  React.useEffect(() => {
    const timer = setTimeout(() => setLogoClicks(0), 3000);
    if (logoClicks >= 5) setShowAdmin(true);
    return () => clearTimeout(timer);
  }, [logoClicks]);

  const roles = [
    {
      id: 'hospital',
      title: t('roleSelection.hospital.title'),
      desc: t('roleSelection.hospital.desc'),
      icon: HospitalIcon,
      path: '/register/hospital',
      gradient: 'from-emerald-500 to-teal-600',
      badge: t('roleSelection.hospital.badge')
    },
    {
      id: 'doctor',
      title: t('roleSelection.doctor.title'),
      desc: t('roleSelection.doctor.desc'),
      icon: Stethoscope,
      path: '/register/doctor',
      gradient: 'from-sky-500 to-blue-600',
      badge: t('roleSelection.doctor.badge')
    },
    {
      id: 'pharma',
      title: t('roleSelection.pharma.title'),
      desc: t('roleSelection.pharma.desc'),
      icon: Building2,
      path: '/register/pharma',
      gradient: 'from-indigo-600 to-blue-700',
      badge: t('roleSelection.pharma.badge')
    },
    {
      id: 'rep',
      title: t('roleSelection.rep.title'),
      desc: t('roleSelection.rep.desc'),
      icon: Users,
      path: '/register/rep',
      gradient: 'from-orange-500 to-amber-600',
      badge: t('roleSelection.rep.badge')
    }
  ];

  if (showAdmin) {
    roles.push({
      id: 'admin',
      title: t('roleSelection.admin.title'),
      desc: t('roleSelection.admin.desc'),
      icon: Shield,
      path: '/register/admin',
      gradient: 'from-purple-600 to-pink-700',
      badge: t('roleSelection.admin.badge')
    });
  }

  return (
    <div 
      className="min-h-screen bg-[#050b14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Language Switcher */}
      <div className="fixed top-8 right-8 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLanguage}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2 transition-colors group"
        >
          <Globe className="w-4 h-4 text-emerald-500 group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-black tracking-tighter uppercase italic">
            {i18n.language === 'en' ? 'عربي' : 'EN'}
          </span>
        </motion.button>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10 translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10"></div>

      <div className="w-full max-w-2xl flex flex-col items-center space-y-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center space-y-8"
        >
          <div 
            onClick={() => setLogoClicks(p => p + 1)}
            className="w-20 h-20 bg-white rounded-[2rem] p-3 shadow-2xl transition-transform duration-500 cursor-pointer active:scale-95 group overflow-hidden"
          >
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain transition-transform group-hover:scale-110" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
              Join <span className="text-emerald-500">LOMIXA</span>
            </h1>
            <p className="text-slate-400 font-bold max-w-md mx-auto text-sm uppercase tracking-widest opacity-60">
              {t('roleSelection.subtitle')}
            </p>
          </div>
        </motion.div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role, i) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(role.path)}
              className="group p-6 rounded-[2.5rem] bg-slate-900/40 border border-white/5 hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all text-left relative overflow-hidden backdrop-blur-xl shadow-2xl shadow-black/50"
              style={{ textAlign: isRTL ? 'right' : 'left' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              
              <div className="flex flex-col h-full justify-between gap-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-xl transform group-hover:rotate-6 transition-transform",
                    role.gradient
                  )}>
                    <role.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    {role.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter group-hover:text-emerald-400 transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold opacity-60 group-hover:opacity-100 transition-opacity">
                    {role.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  <span>{t('roleSelection.initialize')}</span>
                  <ChevronRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-12 text-center border-t border-white/5 w-full max-w-sm"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center justify-center gap-4">
            <span>{t('alreadyHaveAccount')}</span>
            <Link to="/login" className="text-emerald-500 hover:text-white transition-all underline underline-offset-8 decoration-emerald-500/30">
              {t('signIn')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
