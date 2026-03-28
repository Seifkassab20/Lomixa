import React, { useState, useEffect } from 'react';
import { Calendar, Video, Phone, MapPin, MessageSquare, Clock, History, XCircle, FileText, CheckCircle2, Star, Plus, Trash2, Send } from 'lucide-react';
import { getVisits, saveVisit, saveDoctor, getDoctors, getSalesReps, Visit, VisitStatus, pushNotification, saveRating, generateId, Rating } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { JitsiMeeting } from '@/components/JitsiMeeting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const STATUS_COLORS: Record<VisitStatus, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30',
};

const TYPE_ICONS = { 'In Person': MapPin, Video, Call: Phone, Text: MessageSquare };

export function RepMyVisits() {
  const { userId } = useAuth();
  const { t, i18n } = useTranslation();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filter, setFilter] = useState('All');
  const [meetingRoom, setMeetingRoom] = useState<string | null>(null);
  const [repId, setRepId] = useState('');
  
  // Report Modal State
  const [reportModal, setReportModal] = useState<Visit | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reportData, setReportData] = useState({
    samples: [] as string[],
    newSample: '',
    interestLevel: 'Medium' as 'Low' | 'Medium' | 'High',
    followUpDate: '',
    outcomeNotes: ''
  });

  const loadVisits = () => {
    const reps = getSalesReps();
    const myRep = reps.find(r => r.userId === userId);
    setRepId(myRep?.id || '');
    if (myRep) {
      const allVisits = getVisits().filter(v => v.repId === myRep.id);
      setVisits(allVisits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }
  };

  useEffect(() => {
    loadVisits();
    const interval = setInterval(loadVisits, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleCancel = (visit: Visit) => {
    if (!confirm(t('cancelVisitConfirm') || 'Cancel this visit booking?')) return;
    const updated = { ...visit, status: 'Cancelled' as VisitStatus, cancelledByRep: true };
    saveVisit(updated);
    setVisits(prev => prev.map(v => v.id === visit.id ? updated : v));

    const doctors = getDoctors();
    const doc = doctors.find(d => d.id === visit.doctorId);
    if (doc) {
      const updatedSlots = doc.availability.map(s =>
        s.date === visit.date && s.time === visit.time ? { ...s, isBooked: false } : s
      );
      saveDoctor({ ...doc, availability: updatedSlots });
    }

    if (userId) {
      pushNotification({
        userId,
        title: t('visitCancelled') || 'Visit Cancelled',
        message: `Your visit with ${visit.doctorName} on ${new Date(visit.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric' })} has been cancelled.`,
        type: 'cancellation',
      });
    }
  };

  const handleAddSample = () => {
    if (!reportData.newSample.trim()) return;
    setReportData(prev => ({
      ...prev,
      samples: [...prev.samples, prev.newSample.trim()],
      newSample: ''
    }));
  };

  const handleRemoveSample = (idx: number) => {
    setReportData(prev => ({
      ...prev,
      samples: prev.samples.filter((_, i) => i !== idx)
    }));
  };

  const submitReport = () => {
    if (!reportModal) return;
    
    const updatedVisit: Visit = {
      ...reportModal,
      outcomeNotes: reportData.outcomeNotes || reportModal.outcomeNotes,
      samplesDelivered: reportData.samples,
      interestLevel: reportData.interestLevel,
      followUpDate: reportData.followUpDate,
      doctorRating: rating
    };
    
    saveVisit(updatedVisit);
    
    if (rating > 0) {
      const newRating: Rating = {
        id: generateId(),
        visitId: reportModal.id,
        doctorId: reportModal.doctorId,
        repId: repId,
        rating: rating,
        comment: reportData.outcomeNotes,
        type: 'rep_to_doctor',
        createdAt: new Date().toISOString()
      };
      saveRating(newRating);
      
      // Notify doctor about the rating
      const doctors = getDoctors();
      const doc = doctors.find(d => d.id === reportModal.doctorId);
      if (doc && doc.userId) {
        pushNotification({
          userId: doc.userId,
          title: t('newRatingReceived') || 'New Rating Received',
          message: `${updatedVisit.repName} has rated your interaction.`,
          type: 'rating'
        });
      }
    }
    
    setReportModal(null);
    setRating(0);
    setReportData({ samples: [], newSample: '', interestLevel: 'Medium', followUpDate: '', outcomeNotes: '' });
    loadVisits();
  };

  const tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
  const filtered = visits.filter(v => filter === 'All' || v.status === filter);

  return (
    <div className="space-y-6">
      {meetingRoom && <JitsiMeeting roomName={meetingRoom} displayName={t('salesRep')} onClose={() => setMeetingRoom(null)} />}

      <div>
        <h1 className="text-2xl font-bold dark:text-white">{t('myVisits')}</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('allYourVisits') || 'All your scheduled and past visits — updates every 10s'}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('all') || 'All', value: visits.length, color: 'slate' },
          { label: t('pending') || 'Pending', value: visits.filter(v => v.status === 'Pending').length, color: 'amber' },
          { label: t('confirmed') || 'Confirmed', value: visits.filter(v => v.status === 'Confirmed').length, color: 'emerald' },
          { label: t('completed') || 'Completed', value: visits.filter(v => v.status === 'Completed').length, color: 'blue' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4">
            <div className="text-2xl font-bold dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

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

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 text-center">
          <History className="h-10 w-10 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('noVisitsCategory') || 'No visits found in this category'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(visit => {
            const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
            return (
              <div key={visit.id} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold dark:text-white">{visit.doctorName}</h4>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{visit.hospitalName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(visit.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{visit.time}</span>
                        <span>{t(visit.visitType.toLowerCase().replace(' ', '')) || visit.visitType}</span>
                      </div>
                      {visit.notes && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5 border dark:border-slate-700">
                          <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="italic">{visit.notes}</span>
                        </div>
                      )}
                      {visit.outcomeNotes && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-lg px-2.5 py-1.5 flex flex-col gap-1 border border-blue-200 dark:border-blue-500/20">
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{visit.outcomeNotes}</span>
                          </div>
                          {visit.doctorRating && (
                            <div className="flex items-center gap-1 mt-1 border-t dark:border-slate-800 pt-1">
                              <span className="text-[10px] uppercase font-bold opacity-60">Your Rating:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} className={cn("h-2.5 w-2.5", s <= (visit.doctorRating || 0) ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-700")} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-3 sm:mt-0">
                    {visit.status === 'Completed' && !visit.doctorRating && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setReportModal(visit);
                          setReportData(prev => ({ ...prev, outcomeNotes: visit.outcomeNotes || '' }));
                        }} 
                        className="gap-1 bg-amber-500 hover:bg-amber-600 text-white h-8 text-xs shadow-lg shadow-amber-500/20"
                      >
                        <Star className="h-3.5 w-3.5" /> Submit Report
                      </Button>
                    )}
                    {visit.status === 'Confirmed' && visit.visitType === 'Video' && (
                      <Button size="sm" onClick={() => setMeetingRoom(`lomixa_${visit.id}`)} className="gap-1 bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                        <Video className="h-3.5 w-3.5" /> {t('join') || 'Join'}
                      </Button>
                    )}
                    {visit.status === 'Pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(visit)}
                        className="gap-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 h-8 text-xs"
                      >
                        <XCircle className="h-3.5 w-3.5" /> {t('cancelVisit') || 'Cancel'}
                      </Button>
                    )}
                    <span className={cn('px-3 py-1 text-xs rounded-full border font-medium uppercase', STATUS_COLORS[visit.status])}>
                      {t(visit.status.toLowerCase()) || visit.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-8 w-full max-w-2xl border dark:border-slate-800 shadow-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                   <Star className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-black dark:text-white uppercase italic tracking-tighter">{t('postVisitReport') || 'Post-Visit Report'}</h2>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{t('summarizeAndRate') || 'Summarize interaction and rate the doctor'}</p>
                </div>
              </div>
              <button onClick={() => setReportModal(null)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <XCircle className="h-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
               {/* Star Rating */}
               <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border dark:border-slate-800 text-center space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">{t('rateYourInteraction') || 'Rate your interaction with Dr.'} {reportModal.doctorName}</Label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="transition-all hover:scale-110 active:scale-95"
                      >
                        <Star 
                           className={cn(
                             "w-10 h-10 transition-colors",
                             s <= (hoverRating || rating) ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-700"
                           )} 
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-amber-500">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Excellent'}
                    {rating === 5 && 'Outstanding!'}
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Interest Level</Label>
                     <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setReportData(prev => ({ ...prev, interestLevel: level as any }))}
                            className={cn(
                              "h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                              reportData.interestLevel === level 
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                : "bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700"
                            )}
                          >
                             {level}
                          </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Follow-up Date</Label>
                     <Input 
                        type="date" 
                        value={reportData.followUpDate}
                        onChange={e => setReportData(prev => ({ ...prev, followUpDate: e.target.value }))}
                        className="h-10 bg-black/20 border-slate-800 rounded-xl text-xs font-bold" 
                     />
                  </div>
               </div>

               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Delivered Samples/Materials</Label>
                  <div className="flex gap-2">
                     <Input 
                        value={reportData.newSample}
                        onChange={e => setReportData(prev => ({ ...prev, newSample: e.target.value }))}
                        placeholder="Add sample name..."
                        className="h-10 flex-1 bg-black/20 border-slate-800 rounded-xl text-xs font-bold" 
                        onKeyDown={e => e.key === 'Enter' && handleAddSample()}
                     />
                     <Button type="button" onClick={handleAddSample} className="h-10 w-10 bg-slate-800 hover:bg-slate-700 rounded-xl">
                        <Plus className="w-4 h-4" />
                     </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                     {reportData.samples.map((s, i) => (
                       <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                          {s}
                          <button onClick={() => handleRemoveSample(i)} className="hover:text-red-500 transition-colors">
                             <Trash2 className="w-3 h-3" />
                          </button>
                       </span>
                     ))}
                  </div>
               </div>

               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">{t('interactionDetails') || 'Interaction Details / Key Discussion Points'}</Label>
                  <textarea
                    value={reportData.outcomeNotes}
                    onChange={e => setReportData(prev => ({ ...prev, outcomeNotes: e.target.value }))}
                    placeholder="Briefly describe what was discussed..."
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/20 text-gray-900 dark:text-white px-4 py-3 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
               </div>

               <div className="pt-4 flex gap-4">
                  <Button variant="outline" onClick={() => setReportModal(null)} className="h-14 flex-1 rounded-2xl border-slate-800 text-slate-500 font-black uppercase italic tracking-widest text-xs">
                     {t('discard')}
                  </Button>
                  <Button onClick={submitReport} disabled={rating === 0} className="h-14 flex-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase italic tracking-widest text-xs gap-3 shadow-xl shadow-amber-500/20 disabled:opacity-50">
                     <Send className="w-4 h-4" /> {t('submitFinalReport') || 'Submit Final Report'}
                  </Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
