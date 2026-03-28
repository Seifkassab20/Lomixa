import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Bell, Globe, LogOut, User, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeProvider";
import { useNavigate } from "react-router-dom";
import { getNotifications, getProfile } from "@/lib/store";
import { useLayoutEffect } from "react";

export function Topbar() {
  const { user, signOut, role, userId } = useAuth();
  const { i18n, t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      const n = getNotifications().filter(
        (n) => !n.read && (!n.userId || n.userId === userId),
      ).length;
      setNotifCount(n);
      if (userId) {
        const p = getProfile(userId);
        setAvatar(p.avatar || null);
      }
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
    localStorage.setItem("lomixa_lang", newLang);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const rolePortalKey: Record<string, string> = {
    pharma: "pharmaPortal",
    hospital: "hospitalPortal",
    doctor: "doctorPortal",
    rep: "repPortal",
  };

  return (
    <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 transition-colors shrink-0">
      <div className="flex items-center gap-4"></div>
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-9 w-9 p-0 text-slate-600 dark:text-slate-300"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Language toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="h-9 px-2 gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-medium"
        >
          <Globe className="h-4 w-4" />
          {i18n.language === "en" ? t("switchToArabic") : t("switchToEnglish")}
        </Button>

        {/* Notifications */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title={t("notifications")}
        >
          <Bell className="h-5 w-5" />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3 ml-1">
          <button
            onClick={() => navigate("/settings")}
            className="h-8 w-8 rounded-full bg-brand-muted flex items-center justify-center text-brand hover:ring-2 hover:ring-brand/40 transition-all overflow-hidden border dark:border-slate-800"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </button>
          <span className="text-sm text-gray-600 dark:text-slate-300 hidden sm:block max-w-[120px] truncate">
            {user?.user_metadata?.full_name ||
              user?.email?.split("@")[0] ||
              "User"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="h-8 w-8 p-0 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"
            title={t("signOut")}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
