import React, { useState, useEffect } from 'react';
import { getVisits, saveVisit, getDoctors, Visit, VisitStatus, pushNotification } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Video, Phone, MapPin, MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JitsiMeeting } from '@/components/JitsiMeeting';

const STATUS_COLORS: Record<VisitStatus, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30',
};

const TYPE_ICONS = { 'In Person': MapPin, Video, Call: Phone, Text: MessageSquare };

export function DoctorBookings() {
  const { userId } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filter, setFilter] = useState('All');
  const [doctorId, setDoctorId] = useState('');
  const [meetingRoom, setMeetingRoom] = useState<string | null>(null);

  useEffect(() => {
    const doctors = getDoctors();
    const myDoc = doctors.find(d => d.userId === userId);
    setDoctorId(myDoc?.id || '');
    if (myDoc) {
      const allVisits = getVisits().filter(v => v.doctorId === myDoc.id);
      setVisits(allVisits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }
  }, [userId]);

  const handleAction = (visit: Visit, action: 'Confirmed' | 'Cancelled' | 'Completed') => {
    const updated = { ...visit, status: action };
    saveVisit(updated);
    setVisits(prev => prev.map(v => v.id === visit.id ? updated : v));
    pushNotification({
      userId: userId || '',
      title: `Visit ${action}`,
      message: `Your visit with ${visit.repName} has been ${action.toLowerCase()}.`,
      type: action === 'Confirmed' ? 'confirmation' : action === 'Cancelled' ? 'cancellation' : 'info',
    });
  };

  const tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
  const filtered = visits.filter(v => filter === 'All' || v.status === filter);

  return (
    <div className="space-y-6">
      {meetingRoom && (
        <JitsiMeeting roomName={meetingRoom} displayName="Doctor" onClose={() => setMeetingRoom(null)} />
      )}

      <div>
        <h1 className="text-2xl font-bold dark:text-white">My Bookings</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Review and manage visit requests from sales reps</p>
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
            {tab} ({tab === 'All' ? visits.length : visits.filter(v => v.status === tab).length})
          </button>
        ))}
      </div>

      {/* Visits */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 text-center">
          <Calendar className="h-10 w-10 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-slate-400">No visits in this category</p>
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
                      <p className="text-sm text-gray-500 dark:text-slate-400">Rep: {visit.repName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(visit.date).toLocaleDateString('en-SA', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{visit.time}</span>
                        <span>{visit.durationMinutes} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={cn('px-3 py-1 text-xs rounded-full border font-medium', STATUS_COLORS[visit.status])}>
                      {visit.status}
                    </span>
                    {visit.status === 'Pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleAction(visit, 'Cancelled')} className="gap-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 h-8 text-xs">
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                        <Button size="sm" onClick={() => handleAction(visit, 'Confirmed')} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                        </Button>
                      </div>
                    )}
                    {visit.status === 'Confirmed' && (
                      <div className="flex gap-2">
                        {visit.visitType === 'Video' && (
                          <Button size="sm" onClick={() => setMeetingRoom(`lomixa_${visit.id}`)} className="gap-1 bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                            <Video className="h-3.5 w-3.5" /> Join Call
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleAction(visit, 'Completed')} className="gap-1 h-8 text-xs dark:border-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Done
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
