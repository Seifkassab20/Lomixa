import React from 'react';
import { useAuth } from '@/lib/auth';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Settings, 
  Activity,
  Stethoscope,
  Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Sidebar() {
  const { role } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const getLinks = () => {
    switch (role) {
      case 'pharma':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Subordinates', href: '/subordinates', icon: Users },
          { name: 'Manage Doctors', href: '/doctors', icon: Stethoscope },
          { name: 'Analytics', href: '/analytics', icon: Activity },
          { name: 'Buy Bundle', href: '/bundles', icon: CreditCard },
          { name: 'Settings', href: '/settings', icon: Settings },
        ];
      case 'hospital':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Manage Doctors', href: '/doctors', icon: Stethoscope },
          { name: 'Analytics', href: '/analytics', icon: Activity },
          { name: 'All Bookings', href: '/bookings', icon: Calendar },
          { name: 'Settings', href: '/settings', icon: Settings },
        ];
      case 'doctor':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'My Bookings', href: '/bookings', icon: Calendar },
          { name: 'My Schedule', href: '/schedule', icon: Clock },
          { name: 'Settings', href: '/settings', icon: Settings },
        ];
      case 'rep':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Book Visit', href: '/book', icon: Calendar },
          { name: 'My Visits', href: '/visits', icon: Clock },
          { name: 'Settings', href: '/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="w-64 bg-white dark:bg-[#0f172a] border-r border-gray-200 dark:border-slate-800 flex flex-col transition-colors">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xl">
          <Activity className="h-6 w-6" />
          <span>MedVisit Connect</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <li key={link.name}>
                <Link
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-500/20" 
                      : "text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {t(link.name)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
