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
} from "@/lib/store";

import logo from "@/assets/logo.svg";

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
      const n = getNotifications().filter((notif) => {
        if (!notif || notif.read) return false;
        if (!notif.userId) return true;
        if (userId && notif.userId === userId) return true;
        if (notif.userId === 'admin' && role === 'admin') return true;
        if (role === 'admin' && typeof notif.userId === 'string' && notif.userId.toLowerCase().includes('admin')) return true;
        return false;
      }).length;
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
              (getHospitals() || []).filter((h) => h && !h.isVerified && !h.rejectionReason).length +
              (getPharmaCompanies() || []).filter((p) => p && !p.isVerified && !p.rejectionReason)
                .length,
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
            key: "ecosystem",
            name: t("ecosystemManagement") || "Ecosystem Management",
            href: "/admin-control/ecosystem",
            icon: Building2,
          },
          {
            key: "income",
            name: "Income History",
            href: "/admin-control/income",
            icon: TrendingUp,
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
        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 p-1.5 transition-transform hover:scale-105">
          <img
            src={logo}
            alt="Logo"
            className="h-full w-full object-contain"
          />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-black italic tracking-tighter uppercase text-gray-900 dark:text-white leading-tight">
              {t("appName")}
            </div>
            <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 whitespace-nowrap uppercase tracking-[0.2em] italic">
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
                  {!collapsed && (
                    <span className="truncate uppercase tracking-[0.1em] font-black text-[11px] italic">
                      {link.name}
                    </span>
                  )}
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
