import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, FileText, ChevronRight, Facebook, Instagram, Linkedin, Mail, Globe as GlobeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function TermsAndConditions() {
  const { t, i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    localStorage.setItem('lomixa_lang', newLang);
  };

  const sections = [
    { id: "1", title: t('terms_1_title'), content: t('terms_1_content') },
    { id: "2", title: t('terms_2_title'), content: t('terms_2_content') },
    { id: "3", title: t('terms_3_title'), content: t('terms_3_content') },
    { id: "4", title: t('terms_4_title'), content: t('terms_4_content') },
    { id: "5", title: t('terms_5_title'), content: t('terms_5_content') },
    { id: "6", title: t('terms_6_title'), content: t('terms_6_content') },
    { id: "7", title: t('terms_7_title'), content: t('terms_7_content') },
    { id: "8", title: t('terms_8_title'), content: t('terms_8_content') },
    { id: "9", title: t('terms_9_title'), content: t('terms_9_content') },
    { id: "10", title: t('terms_10_title'), content: t('terms_10_content') },
    { id: "11", title: t('terms_11_title'), content: t('terms_11_content') },
    { id: "12", title: t('terms_12_title'), content: t('terms_12_content') },
    { id: "13", title: t('terms_13_title'), content: t('terms_13_content') },
    { id: "14", title: t('terms_14_title'), content: t('terms_14_content') },
    { id: "15", title: t('terms_15_title'), content: t('terms_15_content') },
    { id: "16", title: t('terms_16_title'), content: t('terms_16_content') },
  ];

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
        <section className="max-w-4xl mx-auto px-4 mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8 animate-fade-in">
            <FileText className="w-4 h-4" />
            <span>{t('terms_last_updated')}</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 tracking-tight">{t('terms_title')}</h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {t('terms_agreed')} {t('terms_disagree')}
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Table of Contents - Hidden on mobile */}
            <div className="hidden lg:block space-y-2 sticky top-28 h-fit">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 pl-4">Table of Contents</h2>
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-1">
                  {sections.map(section => (
                    <a key={section.id} href={`#section-${section.id}`} className="flex items-center gap-2 group p-3 rounded-xl hover:bg-slate-800 transition-all text-sm text-slate-400 hover:text-white">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-500 transition-colors"></div>
                      {section.title.split('.')[1]?.trim() || section.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Content sections */}
            <div className="lg:col-span-2 space-y-16">
              {sections.map(section => (
                <div key={section.id} id={`section-${section.id}`} className="scroll-mt-32 border-b border-slate-800 pb-16 last:border-0 group">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="text-emerald-500/20 group-hover:text-emerald-500 transition-colors">#</span>
                    {section.title}
                  </h3>
                  <div className="text-lg text-slate-400 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer Support section */}
        <section className="max-w-4xl mx-auto px-4 mt-32 text-center">
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>
            
            <h2 className="text-2xl font-bold mb-4 relative z-10">Have Questions?</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto relative z-10">
              {t('terms_16_content')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <a href="mailto:Info@lomixa.net">
                <Button className="bg-[#0d7a5b] text-white hover:bg-[#0a6148] rounded-full px-10 py-7 font-bold shadow-xl shadow-emerald-900/20 transform hover:scale-105 transition-all flex items-center gap-3 text-lg">
                  <Mail className="w-5 h-5" />
                  Contact Support
                </Button>
              </a>
              <Link to="/about">
                <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800 rounded-full px-10 py-7 font-bold text-lg transform hover:scale-105 transition-all">
                  View About Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Standard Footer */}
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
                Transforming healthcare interactions through secure professional digital systems.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-slate-300 uppercase tracking-widest text-[10px]">Quick Links</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link to="/login" className="hover:text-emerald-500 transition-colors">{t('signIn')}</Link></li>
                <li><Link to="/register" className="hover:text-emerald-500 transition-colors">{t('initiateRegistration')}</Link></li>
                <li><Link to="/about" className="hover:text-emerald-500 transition-colors">{t('about')}</Link></li>
                <li><Link to="/terms" className="hover:text-emerald-500 transition-colors">{t('terms')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-slate-300 uppercase tracking-widest text-[10px]">Contact Us</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="mailto:Info@lomixa.net" className="hover:text-white transition-colors">Info@lomixa.net</a></li>
                <li className="flex items-center gap-2"><GlobeIcon className="w-4 h-4" /> www.lomixa.net</li>
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
              <Link to="/terms" className="hover:text-white transition-colors">{t('terms')}</Link>
              <Link to="/terms" className="hover:text-white transition-colors">{t('privacy')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
