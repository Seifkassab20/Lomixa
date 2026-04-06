import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Settings,
  Activity,
  Stethoscope,
  Clock,
  BookOpen,
  Bell,
  Plus,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  TrendingUp,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import {
  getNotifications,
  getHospitals,
  getPharmaCompanies,
  getBundleRequests,
  getSubscriptionRemainingDays,
} from "@/lib/store";

export function Sidebar() {
  const { role, userId } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [notifCount, setNotifCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [facilityType, setFacilityType] = useState<
    "hospital" | "clinic" | null
  >(null);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    const refresh = () => {
      const n = getNotifications().filter(
        (n) => !n.read && (!n.userId || n.userId === userId),
      ).length;
      setNotifCount(n);
      if (role === "hospital" && userId) {
        const h = getHospitals().find((h) => h.userId === userId);
        if (h) setFacilityType(h.type);
      }
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [userId, role]);

  const getLinks = () => {
    const base = [
      {
        key: "dashboard",
        name: t("dashboard"),
        href: "/",
        icon: LayoutDashboard,
      },
    ];

    switch (role) {
      case "admin":
        return [
          {
            key: "dashboard",
            name: t("dashboard"),
            href: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            key: "verification",
            name: t("facilityVerificationDesk"),
            href: "/admin-control/verification",
            icon: ShieldCheck,
            badge:
              (getHospitals() || []).filter((h) => h && !h.isVerified).length +
              (getPharmaCompanies() || []).filter((p) => p && !p.isVerified).length,
          },
          {
            key: "bundles",
            name: t("pendingApprovalDesk"),
            href: "/admin-control/bundles",
            icon: CreditCard,
            badge: getBundleRequests().filter((r) => r.status === "pending")
              .length,
          },
          {
            key: "pharma",
            name: t("pharmaEcosystemManagement"),
            href: "/admin-control/pharma",
            icon: Building2,
          },
          {
            key: "income",
            name: "Income History",
            href: "/admin-control/income",
            icon: TrendingUp,
          },
          {
            key: "activity",
            name: "Ecosystem Activity",
            href: "/admin-control/activity",
            icon: Activity,
          },
          {
            key: "notifications",
            name: t("notifications"),
            href: "/notifications",
            icon: Bell,
            badge: notifCount,
          },
          {
            key: "settings",
            name: t("settings"),
            href: "/settings",
            icon: Settings,
          },
        ];

      case "pharma":
        return [
          ...base,
          {
            key: "subordinates",
            name: t("manageRepresentatives") || "Manage Representatives",
            href: "/subordinates",
            icon: Users,
          },
          {
            key: "buyBundle",
            name: t("buyBundle"),
            href: "/bundles",
            icon: CreditCard,
          },
          {
            key: "allBookings",
            name: t("allBookings"),
            href: "/bookings",
            icon: Calendar,
          },
          {
            key: "notifications",
            name: t("notifications"),
            href: "/notifications",
            icon: Bell,
            badge: notifCount,
          },
          {
            key: "settings",
            name: t("settings"),
            href: "/settings",
            icon: Settings,
          },
        ];
      case "hospital":
        return [
          ...base,
          {
            key: "manageDoctors",
            name: t("manageDoctors"),
            href: "/doctors",
            icon: Stethoscope,
          },
          {
            key: "allBookings",
            name: t("allBookings"),
            href: "/bookings",
            icon: Calendar,
          },
          {
            key: "notifications",
            name: t("notifications"),
            href: "/notifications",
            icon: Bell,
            badge: notifCount,
          },
          {
            key: "settings",
            name: t("settings"),
            href: "/settings",
            icon: Settings,
          },
        ];
      case "doctor":
        return [
          ...base,
          {
            key: "myBookings",
            name: t("myBookings"),
            href: "/my-bookings",
            icon: BookOpen,
          },
          {
            key: "mySchedule",
            name: t("mySchedule"),
            href: "/schedule",
            icon: Clock,
          },
          {
            key: "notifications",
            name: t("notifications"),
            href: "/notifications",
            icon: Bell,
            badge: notifCount,
          },
          {
            key: "settings",
            name: t("settings"),
            href: "/settings",
            icon: Settings,
          },
        ];
      case "rep":
        return [
          ...base,
          { key: "bookVisit", name: t("bookVisit"), href: "/book", icon: Plus },
          {
            key: "myVisits",
            name: t("myVisits"),
            href: "/visits",
            icon: Calendar,
          },
          {
            key: "notifications",
            name: t("notifications"),
            href: "/notifications",
            icon: Bell,
            badge: notifCount,
          },
          {
            key: "settings",
            name: t("settings"),
            href: "/settings",
            icon: Settings,
          },
        ];
      default:
        return base;
    }
  };

  const links = getLinks();
  const displayRole = role === "hospital" && facilityType ? facilityType : role;
  const [remainingDays, setRemainingDays] = useState<number | null>(null);

  useEffect(() => {
    if (role === 'rep' && userId) {
      const { getSubscriptionRemainingDays, addNotification, getNotifications, generateId } = require('@/lib/store');
      const days = getSubscriptionRemainingDays(userId);
      setRemainingDays(days);

      if (days !== null && days <= 7) {
        // Trigger notification if not already sent today
        const notifs = getNotifications();
        const todayStr = new Date().toISOString().split('T')[0];
        const existing = notifs.find(n => n.userId === userId && n.type === 'subscription' && n.date.startsWith(todayStr));
        
        if (!existing) {
          addNotification({
            id: generateId(),
            userId: userId,
            title: 'Critical Renewal Required',
            message: `Your professional bundle will expire in ${days} days. Please top up your balance and renew soon.`,
            type: 'subscription',
            read: false,
            date: new Date().toISOString()
          });
        }
      }
    }
  }, [role, userId]);

  const roleSubtitleKey: Record<string, string> = {
    admin: "systemAdmin",
    pharma: "pharma",
    hospital: "hospital",
    doctor: "doctor",
    rep: "salesRepShort",
    clinic: "clinic",
  };

  return (
    <div
      className={cn(
        "relative bg-app-bg-sidebar border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-gray-200 dark:border-slate-800",
          collapsed ? "px-4 justify-center" : "px-5 gap-3",
        )}
      >
        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-sm overflow-hidden">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-full w-full object-cover"
          />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap tracking-widest uppercase italic underline decoration-emerald-500/50 decoration-2 underline-offset-4">
              {t("appName")}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-slate-500 whitespace-nowrap">
              {displayRole
                ? t(roleSubtitleKey[displayRole] || "dashboard")
                : "Portal"}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <ul className={cn("space-y-0.5", collapsed ? "px-2" : "px-3")}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.href ||
              (link.href !== "/" && location.pathname.startsWith(link.href));
            const badge = (link as any).badge;
            return (
              <li key={link.key}>
                <Link
                  to={link.href}
                  title={collapsed ? link.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group",
                    collapsed ? "justify-center" : "",
                    isActive
                      ? "bg-brand-muted text-brand shadow-sm font-bold italic"
                      : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-slate-200",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-brand" : "",
                    )}
                  />
                  {!collapsed && <span className="truncate uppercase tracking-tighter italic">{link.name}</span>}
                  {badge > 0 && (
                    <span
                      className={cn(
                        "bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0",
                        collapsed
                          ? "absolute top-1 right-1 h-4 w-4"
                          : "ml-auto h-5 px-1.5 min-w-5",
                      )}
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                  {collapsed && (
                    <div
                      className={cn(
                        "absolute px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none",
                        isRTL ? "right-full mr-2" : "left-full ml-2",
                      )}
                    >
                      {link.name}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Subscription Footer for Rep */}
      {!collapsed && role === 'rep' && remainingDays !== null && remainingDays <= 7 && (
        <div className="p-4 mt-auto">
          <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 space-y-3 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600/60 font-bold">Bundle Expiring soon</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                   <Clock className="w-4 h-4" />
                </div>
                <div>
                   <div className="text-sm font-black italic text-amber-600 leading-none mb-1 uppercase tracking-tighter">
                     {remainingDays} Days Left
                   </div>
                   <div className="text-[8px] font-black text-amber-600/50 uppercase tracking-widest font-bold">Critical Renewal</div>
                </div>
             </div>
             <Link 
               to="/rep-subscription"
               className="flex items-center justify-center h-10 w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest italic transition-all shadow-lg shadow-amber-500/20"
             >
                Renew Bundle
             </Link>
          </div>
        </div>
      )}

      {/* Default persistent info card if not expiring (Optional, but let's keep the dashboard cleanup by only showing when needed as requested) */}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute top-20 h-6 w-6 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors shadow-sm z-10",
          isRTL ? "-left-3" : "-right-3",
        )}
      >
        {isRTL ? (
          collapsed ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )
        ) : collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
