import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Building2, Hospital as HospitalIcon, Stethoscope, Users, ArrowRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoleSelection() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [logoClicks, setLogoClicks] = React.useState(0);
  const [showAdmin, setShowAdmin] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setLogoClicks(0), 3000);
    if (logoClicks >= 5) setShowAdmin(true);
    return () => clearTimeout(timer);
  }, [logoClicks]);

  const roles = [
    {
      id: 'pharma',
      title: t('roleSelection.pharma.title'),
      desc: t('roleSelection.pharma.desc'),
      icon: Building2,
      path: '/register/pharma',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'hospital',
      title: t('roleSelection.hospital.title'),
      desc: t('roleSelection.hospital.desc'),
      icon: HospitalIcon,
      path: '/register/hospital',
      gradient: 'from-blue-500/80 to-indigo-600/80'
    },
    {
      id: 'doctor',
      title: t('roleSelection.doctor.title'),
      desc: t('roleSelection.doctor.desc'),
      icon: Stethoscope,
      path: '/register/doctor',
      gradient: 'from-[#0d7a5b] to-emerald-600'
    },
    {
      id: 'rep',
      title: t('salesRep'),
      desc: t('salesRepDesc'),
      icon: Users,
      path: '/register/rep',
      gradient: 'from-orange-500 to-amber-600'
    }
  ];

  if (showAdmin) {
    roles.unshift({
      id: 'admin',
      title: 'LOMIXA Nexus Admin',
      desc: 'System Overlord Registration - Root Access',
      icon: Shield,
      path: '/register/admin',
      gradient: 'from-purple-600 to-pink-700'
    });
  }

  return (
    <div className="min-h-screen bg-[#050b14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -z-10 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] -z-10 translate-y-1/2 -translate-x-1/2"></div>

      <div className="w-full max-w-xl flex flex-col items-center space-y-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center space-y-6"
        >
          <div 
            onClick={() => setLogoClicks(p => p + 1)}
            className="w-16 h-16 bg-white rounded-2xl p-2.5 shadow-2xl shadow-emerald-500/20 transform hover:rotate-3 transition-transform duration-500 cursor-pointer active:scale-95"
          >
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-black text-white">{t('roleSelection.title')}</h1>
            <p className="text-slate-400 font-medium">{t('roleSelection.subtitle')}</p>
          </div>
        </motion.div>

        {/* Role Cards */}
        <div className="w-full space-y-4">
          {roles.map((role, i) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(role.path)}
              className="w-full group p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all flex items-center gap-6 text-left relative overflow-hidden"
              style={{ textAlign: isRTL ? 'right' : 'left' }}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg",
                role.gradient
              )}>
                <role.icon className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 space-y-1 pr-6">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {role.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal group-hover:text-slate-400">
                  {role.desc}
                </p>
              </div>

              <ArrowRight className={cn(
                "w-5 h-5 text-slate-700 group-hover:text-emerald-500 transition-all",
                isRTL ? "rotate-180 ml-4" : "mr-4"
              )} />
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-6 text-center border-t border-slate-800/50 w-full"
        >
          <p className="text-sm text-slate-500">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors hover:underline underline-offset-4 decoration-emerald-500/30">
              {t('signIn')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
