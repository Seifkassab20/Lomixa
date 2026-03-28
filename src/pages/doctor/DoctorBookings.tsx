import React, { useState, useEffect } from 'react';
import { 
  getVisits, saveVisit, getDoctors, Visit, VisitStatus, pushNotification,
  processVisitPayment, getSalesReps, saveSalesRep, saveDoctorAvailability, getDoctorAvailability,
  refundVisitPayment
} from '@/lib/store';


import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Video, Phone, MapPin, MessageSquare, CheckCircle2, XCircle, Clock, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JitsiMeeting } from '@/components/JitsiMeeting';
import { useTranslation } from 'react-i18next';

const STATUS_COLORS: Record<VisitStatus, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30',
};

const TYPE_ICONS = { 'In Person': MapPin, Video, Call: Phone, Text: MessageSquare };

export function DoctorBookings() {
  const { userId } = useAuth();
  const { t, i18n } = useTranslation();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filter, setFilter] = useState('All');
  const [doctorId, setDoctorId] = useState('');
  const [meetingRoom, setMeetingRoom] = useState<string | null>(null);
  const [outcomeModal, setOutcomeModal] = useState<Visit | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const loadVisits = () => {
    const doctors = getDoctors();
    const myDoc = doctors.find(d => d.userId === userId);
    setDoctorId(myDoc?.id || '');
    if (myDoc) {
      const allVisits = getVisits().filter(v => v.doctorId === myDoc.id);
      setVisits(allVisits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }
  };

  useEffect(() => {
    loadVisits();
    // Poll for live updates every 10 seconds
    const interval = setInterval(loadVisits, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleAction = (visit: Visit, action: 'Confirmed' | 'Cancelled') => {
    const isConfirming = action === 'Confirmed';
    const isRejectingPending = action === 'Cancelled' && visit.status === 'Pending';

    // 1. Process Financials ONLY on Confirmation
    if (isConfirming && visit.status === 'Pending') {
      if (visit.price) {
        processVisitPayment(visit.price, visit.doctorId);
      }
    } else if (isRejectingPending) {
      // Rejecting a pending visit: Refund the REP's locked budget
      const reps = getSalesReps();
      const repObj = reps.find(r => r.id === visit.repId);
      if (repObj && visit.price) {
        saveSalesRep({ ...repObj, balance: (repObj.balance || 0) + visit.price });
        // NOTE: No refundVisitPayment needed here since we haven't paid out yet. 
      }

      // AND Free the slot!
      const avail = getDoctorAvailability(visit.doctorId);
      const updatedAvail = avail.map(s => {
        // Precise matching using slotId, falling back to date/time for legacy support
        const isMatch = visit.slotId ? s.id === visit.slotId : (s.date === visit.date && s.time === visit.time);
        if (isMatch) {
          return { ...s, isBooked: false };
        }
        return s;
      });
      saveDoctorAvailability(visit.doctorId, updatedAvail);
    }



    const updated = { ...visit, status: action };
    saveVisit(updated);
    setVisits(prev => prev.map(v => v.id === visit.id ? updated : v));

    // Notify the REP
    if (visit.repUserId) {
      pushNotification({
        userId: visit.repUserId,
        title: isConfirming ? `Visit Confirmed!` : `Visit Rejected`,
        message: isConfirming 
          ? `Dr. ${visit.doctorName} has accepted your visit on ${new Date(visit.date).toLocaleDateString('en-SA', { month: 'short', day: 'numeric' })}. The funds have been released.`
          : `Dr. ${visit.doctorName} was unable to accept your visit on ${new Date(visit.date).toLocaleDateString('en-SA', { month: 'short', day: 'numeric' })}. The budget has been refunded to your account.`,
        type: isConfirming ? 'confirmation' : 'cancellation',
      });
    }
    // Also notify ourselves
    pushNotification({
      userId: userId || '',
      title: `Visit ${action}`,
      message: `Your visit with ${visit.repName} (${visit.pharmaName}) has been ${action.toLowerCase()}.`,
      type: action === 'Confirmed' ? 'confirmation' : 'cancellation',
    });
  };

  const handleComplete = () => {
    if (!outcomeModal) return;
    const updated = { ...outcomeModal, status: 'Completed' as VisitStatus, outcomeNotes: outcomeNotes.trim() || undefined };
    saveVisit(updated);
    setVisits(prev => prev.map(v => v.id === outcomeModal.id ? updated : v));

    // Notify the rep
    if (outcomeModal.repUserId) {
      pushNotification({
        userId: outcomeModal.repUserId,
        title: t('visitCompleted') || 'Visit Completed',
        message: `Dr. ${outcomeModal.doctorName} has marked your visit on ${new Date(outcomeModal.date).toLocaleDateString('en-SA', { month: 'short', day: 'numeric' })} as completed.`,
        type: 'info',
      });

      // Update the sales rep's visit counter since it's now officially completed
      const reps = getSalesReps();
      const rep = reps.find(r => r.id === outcomeModal.repId);
      if (rep) {
        saveSalesRep({
          ...rep,
          visitsThisMonth: (rep.visitsThisMonth || 0) + 1
        });
      }
    }
    setOutcomeModal(null);
    setOutcomeNotes('');
  };

  const tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
  const filtered = visits.filter(v => filter === 'All' || v.status === filter);

  return (
    <div className="space-y-6">
      {meetingRoom && (
        <JitsiMeeting roomName={meetingRoom} displayName="Doctor" onClose={() => setMeetingRoom(null)} />
      )}

      {/* Outcome Notes Modal */}
      {outcomeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> {t('markVisitComplete')}
              </h2>
              <button onClick={() => { setOutcomeModal(null); setOutcomeNotes(''); }} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              {t('visitWith')} <span className="font-medium text-gray-900 dark:text-white">{outcomeModal.repName}</span> ({outcomeModal.pharmaName})
            </p>
            <div className="mb-4">
              <label className="text-sm font-medium dark:text-slate-300 flex items-center gap-1.5 mb-2">
                <FileText className="h-4 w-4" /> {t('outcomeNotes')} <span className="font-normal text-xs opacity-60">({t('optional')})</span>
              </label>
              <textarea
                value={outcomeNotes}
                onChange={e => setOutcomeNotes(e.target.value)}
                placeholder={t('summarize')}
                rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white px-3 py-2.5 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setOutcomeModal(null); setOutcomeNotes(''); }} className="flex-1 dark:border-slate-600 dark:text-slate-300">{t('cancel')}</Button>
              <Button onClick={handleComplete} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="h-4 w-4 mr-1" /> {t('markCompleted')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold dark:text-white">{t('myBookings')}</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('reviewManage')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-lg font-medium transition-colors',
              filter === tab ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
            )}
          >
            {t(tab.toLowerCase())} ({tab === 'All' ? visits.length : visits.filter(v => v.status === tab).length})
          </button>
        ))}
      </div>

      {/* Visits */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 text-center">
          <Calendar className="h-10 w-10 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('noVisitsCategory')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(visit => {
            const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
            return (
              <div key={visit.id} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold dark:text-white">{visit.pharmaName}</h4>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{t('rep')}: {visit.repName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(visit.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{visit.time}</span>
                        <span>{visit.durationMinutes} min</span>
                      </div>
                      {visit.notes && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                          <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="italic">{visit.notes}</span>
                        </div>
                      )}
                      {visit.outcomeNotes && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5 border border-blue-200 dark:border-blue-500/20">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{visit.outcomeNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={cn('px-3 py-1 text-xs rounded-full border font-medium uppercase', STATUS_COLORS[visit.status])}>
                      {t(visit.status.toLowerCase())}
                    </span>
                    {visit.status === 'Pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleAction(visit, 'Cancelled')} className="gap-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 h-8 text-xs">
                          <XCircle className="h-3.5 w-3.5" /> {t('reject')}
                        </Button>
                        <Button size="sm" onClick={() => handleAction(visit, 'Confirmed')} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {t('accept')}
                        </Button>
                      </div>
                    )}
                    {visit.status === 'Confirmed' && (
                      <div className="flex gap-2">
                        {visit.visitType === 'Video' && (
                          <Button size="sm" onClick={() => setMeetingRoom(`lomixa_${visit.id}`)} className="gap-1 bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                            <Video className="h-3.5 w-3.5" /> {t('joinCall')}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { setOutcomeModal(visit); setOutcomeNotes(''); }} className="gap-1 h-8 text-xs dark:border-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {t('markDone')}
                        </Button>
                      </div>
                    )}
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
