import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BellRing, Clock, Video, MapPin, Phone, MessageSquare, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getVisits, getDoctors, getSalesReps, getServerTime, Visit, pushNotification } from '@/lib/store';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS = { 'In Person': MapPin, Video, Call: Phone, Text: MessageSquare };

export function MeetingReminderPopup() {
  const { user, role, userId } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [, setServerTime] = useState<Date>(new Date());

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem('lomixa_reminded_visits');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dismiss = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem('lomixa_reminded_visits', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    setActiveVisit(null);
  };

  useEffect(() => {
    if (!userId || !role) return;

    const checkReminders = async () => {
      const nowTime = await getServerTime();
      setServerTime(nowTime);
      const nowMs = nowTime.getTime();

      const visits = getVisits();
      const doctors = getDoctors();
      const reps = getSalesReps();

      // Ensure robust profile mapping to find current doctor/rep identifiers
      const cleanEmail = user?.email?.toLowerCase();
      const cleanMetaName = user?.user_metadata?.full_name?.trim().toLowerCase();

      let myDocIds: string[] = [];
      let myRepIds: string[] = [];

      if (role === 'doctor') {
        const matchingDocs = doctors.filter(d => 
          d.userId === userId || 
          d.id === userId ||
          (cleanEmail && d.email?.toLowerCase() === cleanEmail) ||
          (cleanMetaName && d.name?.trim().toLowerCase() === cleanMetaName)
        );
        myDocIds = matchingDocs.map(d => d.id);
        if (userId && !myDocIds.includes(userId)) myDocIds.push(userId);
      } else if (role === 'rep') {
        const matchingReps = reps.filter(r => 
          r.userId === userId || 
          r.id === userId ||
          (cleanEmail && r.email?.toLowerCase() === cleanEmail) ||
          (cleanMetaName && r.name?.trim().toLowerCase() === cleanMetaName)
        );
        myRepIds = matchingReps.map(r => r.id);
        if (userId && !myRepIds.includes(userId)) myRepIds.push(userId);
      }

      // Filter confirmed visits targeted at the current authenticated user
      const relevantVisits = visits.filter(v => {
        if (v.status !== 'Confirmed') return false;

        if (role === 'doctor') {
          return myDocIds.includes(v.doctorId) || v.doctorId === userId || (cleanMetaName && v.doctorName?.trim().toLowerCase() === cleanMetaName);
        } else if (role === 'rep') {
          return myRepIds.includes(v.repId) || v.repUserId === userId || v.repId === userId;
        }
        return false;
      });

      // Scan for upcoming visits starting within exactly 1 hour
      const oneHourMs = 60 * 60 * 1000;
      let upcomingVisit: Visit | null = null;
      let minDiffMs = Infinity;

      for (const v of relevantVisits) {
        const startTimeMs = new Date(`${v.date}T${v.time}:00`).getTime();
        const diffMs = startTimeMs - nowMs;

        // Trigger reminder if starting within 60 minutes, or if meeting is in progress
        const durationMs = (v.durationMinutes || 30) * 60 * 1000;
        const isStartingSoonOrInProgress = diffMs <= oneHourMs && diffMs >= -durationMs;

        if (isStartingSoonOrInProgress) {
          // Deliver push notification to the standard notifications hub once
          const notifKey = `notified_bell_1hr_${v.id}_${userId}`;
          if (!localStorage.getItem(notifKey)) {
            localStorage.setItem(notifKey, 'true');
            const otherParty = role === 'doctor' ? `${v.repName} (${v.pharmaName})` : `Dr. ${v.doctorName}`;
            pushNotification({
              userId: userId,
              title: t('meetingReminderTitle', 'Meeting Reminder: 1 Hour Left'),
              message: t('meetingReminderMsg', {
                defaultValue: `Your meeting with {{party}} is scheduled to start at {{time}}.`,
                party: otherParty,
                time: v.time
              }),
              type: 'info',
              relatedId: v.id
            });
          }

          // Screen popup modal presentation condition
          if (!dismissedIds.has(v.id)) {
            if (diffMs < minDiffMs) {
              minDiffMs = diffMs;
              upcomingVisit = v;
            }
          }
        }
      }

      if (upcomingVisit) {
        setActiveVisit(upcomingVisit);
        if (minDiffMs > 0) {
          const mins = Math.ceil(minDiffMs / 60000);
          setTimeRemaining(t('startsInMins', { defaultValue: `Starts in {{count}} minutes`, count: mins }));
        } else {
          setTimeRemaining(t('meetingInProgress', 'Meeting is currently in progress'));
        }
      } else {
        setActiveVisit(null);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 5000);
    return () => clearInterval(interval);
  }, [userId, role, dismissedIds, t, user]);

  if (!activeVisit) return null;

  const TypeIcon = TYPE_ICONS[activeVisit.visitType as keyof typeof TYPE_ICONS] || MapPin;
  const otherPartyName = role === 'doctor' ? activeVisit.repName : `Dr. ${activeVisit.doctorName}`;
  const otherPartyContext = role === 'doctor' ? activeVisit.pharmaName : activeVisit.hospitalName;

  return (
    <AnimatePresence>
      <div 
        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[9999] sm:max-w-sm w-auto pointer-events-none" 
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 350 }}
          className="pointer-events-auto relative overflow-hidden rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 p-5 sm:p-6 shadow-2xl shadow-emerald-500/10 text-white"
        >
          {/* Ambient header line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 animate-pulse" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-start gap-3 sm:gap-4">
            <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
              <BellRing className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {t('reminder', 'Reminder')}
                </span>
                <button
                  onClick={() => dismiss(activeVisit.id)}
                  className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                  title={t('dismiss', 'Dismiss')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h3 className="mt-2 text-sm sm:text-base font-black leading-tight tracking-tight text-white truncate">
                {otherPartyName}
              </h3>
              <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate mt-0.5">
                {otherPartyContext}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-black/40 p-2 border border-white/5 text-[11px] sm:text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 shrink-0" />
                  <span className="font-bold text-white">{activeVisit.time}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <TypeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-teal-400 shrink-0" />
                  <span className="font-medium text-slate-300">{activeVisit.visitType}</span>
                </div>
              </div>

              <div className="mt-3.5 flex items-center justify-between gap-2">
                <span className="text-[11px] sm:text-xs font-bold text-amber-400 animate-pulse truncate">
                  {timeRemaining}
                </span>

                <div className="flex gap-1.5 shrink-0">
                  {activeVisit.visitType === 'Video' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        dismiss(activeVisit.id);
                        navigate(role === 'doctor' ? '/my-bookings' : '/visits');
                      }}
                      className="h-7 sm:h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] sm:text-[11px] px-2.5 sm:px-3 shadow-lg shadow-emerald-500/20 gap-1"
                    >
                      <Video className="h-3 w-3" /> {t('join', 'Join')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismiss(activeVisit.id)}
                    className="h-7 sm:h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[10px] sm:text-[11px] px-2.5 sm:px-3"
                  >
                    {t('gotIt', 'Got it')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
