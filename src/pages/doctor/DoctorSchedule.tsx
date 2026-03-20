import React, { useState, useEffect } from 'react';
import { getDoctorAvailability, saveDoctorAvailability, getDoctors, generateId, AvailabilitySlot } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X, Calendar, Clock, Video, Phone, MapPin, MessageSquare, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const APPOINTMENT_TYPES = [
  { value: 'In Person', icon: MapPin },
  { value: 'Video', icon: Video },
  { value: 'Call', icon: Phone },
  { value: 'Text', icon: MessageSquare },
];

export function DoctorSchedule() {
  const { userId } = useAuth();
  const { t, i18n } = useTranslation();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [doctorId, setDoctorId] = useState<string>('');
  const [form, setForm] = useState({
    date: '',
    time: '',
    appointmentType: 'In Person' as AvailabilitySlot['appointmentType'],
    duration: 30,
  });

  useEffect(() => {
    const doctors = getDoctors();
    const myDoc = doctors.find(d => d.userId === userId);
    if (myDoc) {
      setDoctorId(myDoc.id);
      setSlots(getDoctorAvailability(myDoc.id));
    }
  }, [userId]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const slot: AvailabilitySlot = {
      id: generateId(),
      date: form.date,
      time: form.time,
      appointmentType: form.appointmentType,
      duration: form.duration,
      isBooked: false,
    };
    const updated = [...slots, slot].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    saveDoctorAvailability(doctorId, updated);
    setSlots(updated);
    setShowForm(false);
    setForm({ date: '', time: '', appointmentType: 'In Person', duration: 30 });
  };

  const handleDelete = (id: string) => {
    const updated = slots.filter(s => s.id !== id);
    saveDoctorAvailability(doctorId, updated);
    setSlots(updated);
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = slots.filter(s => s.date >= today);
  const past = slots.filter(s => s.date < today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{t('myScheduleTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('manageAvailability')}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" /> {t('addSlot')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('totalSlots') || 'Total Slots', value: slots.length },
          { label: t('available') || 'Available', value: slots.filter(s => !s.isBooked).length },
          { label: t('booked') || 'Booked', value: slots.filter(s => s.isBooked).length },
          { label: t('upcoming') || 'Upcoming', value: upcoming.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4">
            <div className="text-2xl font-bold dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Add Slot Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">{t('addAvailabilitySlot') || 'Add Availability Slot'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label className="dark:text-slate-300">{t('date') || 'Date'}</Label>
                <Input type="date" value={form.date} min={today} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-slate-300">{t('time') || 'Time'}</Label>
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-slate-300 mb-2 block">{t('appointmentType') || 'Appointment Type'}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {APPOINTMENT_TYPES.map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, appointmentType: value as AvailabilitySlot['appointmentType'] }))}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                        form.appointmentType === value
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t(value.toLowerCase().replace(' ', '')) || value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="dark:text-slate-300">{t('duration') || 'Duration (minutes)'}</Label>
                <select
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))}
                  className="mt-1 w-full rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {[15, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} {t('minutesLabel') || 'minutes'}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 dark:border-slate-600 dark:text-slate-300">{t('cancel') || 'Cancel'}</Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">{t('addSlot') || 'Add Slot'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Slots */}
      <div>
        <h2 className="text-base font-semibold dark:text-white mb-3">{t('upcomingSlots') || 'Upcoming Slots'}</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-10 text-center">
            <Calendar className="h-10 w-10 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('noUpcomingSlots') || 'No upcoming slots. Add your availability to start receiving visits.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(slot => {
              const TypeIcon = APPOINTMENT_TYPES.find(t => t.value === slot.appointmentType)?.icon || MapPin;
              return (
                <div key={slot.id} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', slot.isBooked ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400')}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium dark:text-white">{t(slot.appointmentType.toLowerCase().replace(' ', '')) || slot.appointmentType}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium',
                          slot.isBooked
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                        )}>
                          {slot.isBooked ? (t('booked') || 'Booked') : (t('available') || 'Available')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(slot.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{slot.time}</span>
                        <span>{slot.duration} {t('minutesLabel') || 'min'}</span>
                      </div>
                    </div>
                  </div>
                  {!slot.isBooked && (
                    <button onClick={() => handleDelete(slot.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
