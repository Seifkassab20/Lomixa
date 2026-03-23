import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Globe, Shield, Users, Video, Facebook, Instagram, Linkedin, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function AboutUs() {
  const { t, i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    localStorage.setItem('lomixa_lang', newLang);
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-white font-sans selection:bg-emerald-500/30">
      {/* Header/Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#050b14]/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/login" className="flex items-center gap-3 group">
              <div className="bg-white rounded-full p-1.5 w-10 h-10 transition-transform group-hover:scale-105">
                <img src="/logo.png" alt="Lomixa Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">{t('appName')}</span>
            </Link>
            <div className="flex items-center gap-6">
              <button 
                onClick={toggleLanguage}
                className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-slate-800 rounded-full transition-all"
              >
                {i18n.language === 'en' ? 'عربي' : 'English'}
              </button>
              <Link to="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">{t('signIn')}</Link>
              <Link to="/register">
                <Button className="bg-[#0d7a5b] hover:bg-[#0a6148] text-white rounded-full px-6 shadow-lg shadow-emerald-900/20">
                  {t('initiateRegistration')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-4 text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8 animate-fade-in">
            <Globe className="w-4 h-4" />
            <span>{t('about_hero_tagline')}</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold mb-8 tracking-tight leading-[1.1]">
            {t('about')} <span className="text-[#0d7a5b]">{t('appName')}</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {t('about_desc')}
          </p>
        </section>

        {/* Mission Section */}
        <section className="max-w-6xl mx-auto px-4 mb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white tracking-tight">{t('about_mission')}</h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                {t('about_mission_p1')}
              </p>
              <p className="text-lg text-slate-400 leading-relaxed">
                {t('about_mission_p2')}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] -z-10 rounded-full"></div>
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Shield className="text-emerald-500" />
                  {t('about_for_pharma')}
                </h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  {t('about_pharma_p1')}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div className="text-2xl font-bold text-white mb-1">Efficient</div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Engagement</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div className="text-2xl font-bold text-white mb-1">Secure</div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Platform</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <h2 className="text-3xl font-bold text-center mb-16">{t('about_feature_grid_title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: t('about_feature_1_title'), desc: t('about_feature_1_desc'), icon: Video },
              { title: t('about_feature_2_title'), desc: t('about_feature_2_desc'), icon: CheckCircle2 },
              { title: t('about_feature_3_title'), desc: t('about_feature_3_desc'), icon: Shield },
              { title: t('about_feature_4_title'), desc: t('about_feature_4_desc'), icon: Users },
              { title: t('about_feature_5_title'), desc: t('about_feature_5_desc'), icon: Globe },
              { title: t('about_feature_6_title'), desc: t('about_feature_6_desc'), icon: CheckCircle2 },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing Thought */}
        <section className="max-w-4xl mx-auto px-4 text-center">
          <div className="p-12 rounded-[3rem] bg-gradient-to-br from-[#0d7a5b] to-[#0a6148] relative overflow-hidden shadow-2xl group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-white/10 transition-colors"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-6">{t('about_closing_title')}</h2>
              <p className="text-lg text-emerald-50/90 leading-relaxed mb-10 max-w-2xl mx-auto">
                {t('about_closing_desc')}
              </p>
              <Link to="/register">
                <Button className="bg-white text-[#0d7a5b] hover:bg-emerald-50 rounded-full px-10 py-7 text-lg font-bold transform hover:scale-105 transition-all shadow-xl shadow-black/20">
                  {t('about_get_started')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#050b14] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="bg-white rounded-full p-1 w-8 h-8">
                  <img src="/logo.png" alt="Lomixa Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-bold tracking-tight">{t('appName')}</span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('about_desc')}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-slate-300 uppercase tracking-widest text-[10px]">Quick Links</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link to="/login" className="hover:text-emerald-500 transition-colors">{t('signIn')}</Link></li>
                <li><Link to="/register" className="hover:text-emerald-500 transition-colors">{t('initiateRegistration')}</Link></li>
                <li><Link to="/about" className="hover:text-emerald-500 transition-colors">{t('about')}</Link></li>
                <li><Link to="/terms" className="hover:text-emerald-500 transition-colors">{t('terms_title')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-slate-300 uppercase tracking-widest text-[10px]">Contact Us</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li>Email: Info@lomixa.net</li>
                <li>Phone: +20 115 059 0602</li>
                <li>Address: 5 Tahrir Street, Giza, Egypt</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-slate-300 uppercase tracking-widest text-[10px]">Follow Us</h4>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/share/1CnvDsiXyq/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500 transition-all text-slate-400 hover:text-white">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://www.instagram.com/lomixahealthcare?igsh=N2lnZWx4OWdpeXN2" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500 transition-all text-slate-400 hover:text-white">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/company/lomixa-health-care/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500 transition-all text-slate-400 hover:text-white">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-xs uppercase tracking-widest font-bold">
            <p>© 2026 Lomixa Healthcare Solutions. All rights reserved.</p>
            <div className="flex gap-8">
              <Link to="/terms" className="hover:text-white transition-colors">{t('terms_title')}</Link>
              <Link to="/terms" className="hover:text-white transition-colors">{t('privacy')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
