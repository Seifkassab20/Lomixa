import React, { useState, useEffect } from 'react';
import { getDoctorAvailability, saveDoctorAvailability, getDoctors, generateId, AvailabilitySlot } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar, Clock, Video, Phone, MapPin, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const APPOINTMENT_TYPES = [
  { value: 'In Person', label: 'In-Person', icon: MapPin },
  { value: 'Video', label: 'Video', icon: Video },
  { value: 'Call', label: 'Voice', icon: Phone },
  { value: 'Text', label: 'Text', icon: MessageSquare },
];

export function DoctorSchedule() {
  const { userId } = useAuth();
  const { t, i18n } = useTranslation();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [doctorId, setDoctorId] = useState<string>('');
  
  const [form, setForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    duration: 15,
    appointmentType: 'In Person' as AvailabilitySlot['appointmentType'],
  });

  useEffect(() => {
    const doctors = getDoctors();
    const myDoc = doctors.find(d => d.userId === userId);
    if (myDoc) {
      setDoctorId(myDoc.id);
      setSlots(getDoctorAvailability(myDoc.id));
    }
  }, [userId]);

  const startAsDate = new Date(`1970-01-01T${form.startTime}:00`);
  const endAsDate = new Date(`1970-01-01T${form.endTime}:00`);
  const diffInMinutes = (endAsDate.getTime() - startAsDate.getTime()) / 60000;
  const numberOfSlots = diffInMinutes > 0 ? Math.floor(diffInMinutes / form.duration) : 0;

  const handleAdd = () => {
    if (numberOfSlots <= 0 || !form.date) return;
    
    const timeToMins = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    
    const newStartMins = timeToMins(form.startTime);
    const newEndMins = newStartMins + form.duration;
    
    const overlaps = slots.some(s => {
      if (s.date !== form.date) return false;
      const exStartMins = timeToMins(s.time);
      const exEndMins = exStartMins + s.duration;
      return Math.max(newStartMins, exStartMins) < Math.min(newEndMins, exEndMins);
    });

    if (overlaps) {
      alert(t('slotOverlapError') || 'Cannot create slot: It overlaps with an existing slot.');
      return;
    }

    const newSlot: AvailabilitySlot = {
      id: generateId(),
      date: form.date,
      time: form.startTime,
      appointmentType: form.appointmentType,
      duration: form.duration,
      isBooked: false,
    };
    
    // Auto increment start time for sequential rapid adding
    const currentAsDate = new Date(`1970-01-01T${form.startTime}:00`);
    const nextAsDate = new Date(currentAsDate.getTime() + form.duration * 60000);
    const nextTimeString = nextAsDate.toTimeString().substring(0, 5);
    
    const updated = [...slots, newSlot].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    saveDoctorAvailability(doctorId, updated);
    setSlots(updated);
    setForm(prev => ({ ...prev, startTime: nextTimeString }));
  };

  const handleDelete = (id: string) => {
    const updated = slots.filter(s => s.id !== id);
    saveDoctorAvailability(doctorId, updated);
    setSlots(updated);
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = slots.filter(s => s.date >= today);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">{t('myScheduleTitle') || 'My Schedule'}</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('manageAvailability') || 'Manage your availability and booking slots'}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ADD AVAILABILITY TAB / SECTION */}
        <div className="lg:col-span-2">
          <div className="bg-[#131b26] dark:bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Plus className="w-5 h-5 text-[#39b596]" />
              <h2 className="text-lg font-bold text-white tracking-wide">Add Availability</h2>
            </div>
            
            <div className="space-y-6">
              {/* DATE */}
              <div>
                <Label className="text-slate-300 mb-2 block font-medium">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    type="date" 
                    value={form.date} 
                    min={today}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} 
                    className="w-full bg-[#1c2636] border-slate-800 border focus:border-emerald-500 text-white pl-12 h-14 rounded-xl cursor-text [color-scheme:dark]"
                  />
                  {!form.date && (
                    <div className="absolute left-11 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-sm">
                      Pick a date
                    </div>
                  )}
                </div>
              </div>
              
              {/* TIMES */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 mb-2 block font-medium">Start Time</Label>
                  <Input 
                    type="time" 
                    value={form.startTime} 
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} 
                    className="w-full bg-[#1c2636] border-slate-800 border focus:border-emerald-500 text-white h-14 rounded-xl px-4 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 mb-2 block font-medium">End Time</Label>
                  <Input 
                    type="time" 
                    value={form.endTime} 
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} 
                    className="w-full bg-[#1c2636] border-slate-800 border focus:border-emerald-500 text-white h-14 rounded-xl px-4 [color-scheme:dark]"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{numberOfSlots} slots remaining in this block ({form.duration} min each)</span>
                </div>
              </div>

              {/* DURATION */}
              <div>
                <Label className="text-slate-300 mb-2 block font-medium">Slot Duration</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[5, 10, 15].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, duration: dur }))}
                      className={cn(
                        "py-3.5 rounded-xl border text-sm font-semibold transition-all",
                        form.duration === dur 
                          ? "bg-[#143229] border-emerald-500 text-[#39b596]" 
                          : "bg-[#1c2636] border-transparent text-slate-300 hover:bg-slate-800"
                      )}
                    >
                      {dur} min
                    </button>
                  ))}
                </div>
              </div>

              {/* VISIT TYPE */}
              <div>
                <Label className="text-slate-300 mb-2 block font-medium">Visit Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {APPOINTMENT_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, appointmentType: value as AvailabilitySlot['appointmentType'] }))}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-semibold transition-all",
                        form.appointmentType === value
                          ? "bg-[#143229] border-emerald-500 text-emerald-400"
                          : "bg-[#1c2636] border-transparent text-slate-300 hover:bg-slate-800"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", form.appointmentType === value ? "text-[#d17ca3]" : "text-slate-400")} />
                      <span className={form.appointmentType === value ? "text-[#39b596]" : "text-slate-400"}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* SUBMIT */}
              <Button 
                type="button" 
                onClick={handleAdd}
                disabled={numberOfSlots <= 0 || !form.date}
                className="w-full h-14 bg-[#39b596] hover:bg-emerald-500 text-white font-bold rounded-xl text-base mt-2 transition-all disabled:opacity-50"
              >
                Add Slot
              </Button>

            </div>
          </div>
        </div>

        {/* UPCOMING SLOTS COLUMN */}
        <div>
          <h2 className="text-base font-semibold dark:text-white mb-4">{t('upcomingSlots') || 'Upcoming Slots'}</h2>
          {upcoming.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-8 text-center">
              <Calendar className="h-10 w-10 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('noUpcomingSlots') || 'No upcoming slots. Add your availability to start receiving visits.'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {upcoming.map(slot => {
                const TypeIcon = APPOINTMENT_TYPES.find(t => t.value === slot.appointmentType)?.icon || MapPin;
                return (
                  <div key={slot.id} className="bg-[#1c2636] dark:bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-slate-600 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner', slot.isBooked ? 'bg-[#322315] text-[#dca54c] border border-[#dca54c]/20' : 'bg-[#143229] text-[#39b596] border border-[#39b596]/20')}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                             {APPOINTMENT_TYPES.find(t => t.value === slot.appointmentType)?.label || slot.appointmentType}
                          </span>
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider',
                            slot.isBooked
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : 'bg-emerald-500/10 text-[#39b596] border-[#39b596]/30'
                          )}>
                            {slot.isBooked ? (t('booked') || 'Booked') : (t('available') || 'Available')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-500" />{new Date(slot.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric' })}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-500" />{slot.time}</span>
                          <span className="opacity-70 px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">{slot.duration} {t('minutesLabel') || 'min'}</span>
                        </div>
                      </div>
                    </div>
                    {!slot.isBooked && (
                      <button onClick={() => handleDelete(slot.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors group">
                        <Trash2 className="h-4 w-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
