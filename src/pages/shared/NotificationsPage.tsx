import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, Notification } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Bell, CheckCheck, Calendar, X, Info, AlertCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const TYPE_ICONS = {
  booking: Calendar,
  confirmation: CheckCheck,
  cancellation: X,
  info: Info,
  rating: Star,
};

const TYPE_COLORS = {
  booking: 'text-blue-500 bg-blue-100 dark:bg-blue-500/20',
  confirmation: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20',
  cancellation: 'text-red-500 bg-red-100 dark:bg-red-500/20',
  info: 'text-amber-500 bg-amber-100 dark:bg-amber-500/20',
  rating: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-500/20',
};

export function NotificationsPage() {
  const { userId } = useAuth();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refresh = () => {
    const all = getNotifications().filter(n => !n.userId || n.userId === userId);
    setNotifications(all);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleRead = (id: string) => {
    markNotificationRead(id);
    refresh();
  };

  const handleReadAll = () => {
    markAllNotificationsRead();
    refresh();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('notifications') || 'Notifications'}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {unreadCount > 0 ? t('nUnreadNotifications', { count: unreadCount }).replace('{{count}}', unreadCount.toString()) || `${unreadCount} unread notifications` : t('allCaughtUp') || 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleReadAll} className="gap-2 dark:border-slate-600 dark:text-slate-300">
            <CheckCheck className="h-4 w-4" /> {t('markAllRead') || 'Mark all read'}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 flex flex-col items-center text-center">
          <Bell className="h-12 w-12 text-gray-200 dark:text-slate-700 mb-4" />
          <h3 className="text-base font-semibold text-gray-600 dark:text-slate-300">{t('noNotificationsYet') || 'No notifications yet'}</h3>
          <p className="text-sm text-gray-400 dark:text-slate-500">{t('bookingUpdatesAlertsHere') || "You'll see booking updates and alerts here"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = TYPE_ICONS[n.type];
            return (
              <div
                key={n.id}
                onClick={() => handleRead(n.id)}
                className={cn(
                  'bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all',
                  !n.read && 'border-l-4 border-l-emerald-500'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', TYPE_COLORS[n.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={cn('text-sm font-semibold', n.read ? 'text-gray-700 dark:text-slate-300' : 'text-gray-900 dark:text-white')}>
                        {t(n.title.toLowerCase().replace(/\s+/g, '')) || n.title}
                      </h4>
                      {!n.read && <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                      {new Date(n.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
