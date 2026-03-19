import React from 'react';
import { useAuth } from '@/lib/auth';
import { Bell, Globe, LogOut, User, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';

export function Topbar() {
  const { user, signOut, role } = useAuth();
  const { i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 transition-colors">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100 capitalize">
          {role ? role.replace('-', ' ') : ''} Portal
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={toggleTheme} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleLanguage} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Globe className="h-4 w-4" />
          {i18n.language === 'en' ? 'عربي' : 'English'}
        </Button>
        <Button variant="ghost" size="sm" className="relative text-slate-600 dark:text-slate-300">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4 ml-2">
          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{user?.email || 'demo@user.com'}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="ml-2 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
