import React, { useState, useEffect } from 'react';
import {
  getDoctors, getVisits, saveVisit, saveDoctor, getSalesReps, getPharmaCompanies, savePharmaCompany,
  generateId, Visit, VisitType, pushNotification, Doctor
} from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { JitsiMeeting } from '@/components/JitsiMeeting';
import { Search, Video, Phone, MapPin, MessageSquare, Calendar, Clock, CheckCircle2, CreditCard, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPECIALTIES = [
  'All', 'Cardiology', 'Neurology', 'Pediatrics', 'Oncology',
  'Orthopedics', 'Dermatology', 'Psychiatry', 'General Practice',
];

const VISIT_TYPES: { value: VisitType; icon: React.ElementType; label: string }[] = [
  { value: 'In Person', icon: MapPin, label: 'In Person' },
  { value: 'Video', icon: Video, label: 'Video Call' },
  { value: 'Call', icon: Phone, label: 'Phone Call' },
  { value: 'Text', icon: MessageSquare, label: 'Text/Chat' },
];

export function RepBookVisit() {
  const { userId, user } = useAuth();
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<VisitType>('In Person');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [meetingRoom, setMeetingRoom] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [repData, setRepData] = useState({ id: '', pharmaId: '', pharmaName: '', name: '' });

  const refreshData = () => {
    setDoctors(getDoctors());
    const reps = getSalesReps();
    const myRep = reps.find(r => r.userId === userId);
    if (myRep) {
      setRepData({ id: myRep.id, pharmaId: myRep.pharmaId, pharmaName: myRep.pharmaName, name: myRep.name });
      const companies = getPharmaCompanies();
      const company = companies.find(c => c.id === myRep.pharmaId);
      setCredits(company?.credits || 0);
    }
  };

  useEffect(() => {
    refreshData();
  }, [userId]);

  const filtered = doctors.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.hospitalName.toLowerCase().includes(search.toLowerCase());
    const matchSpecialty = specialtyFilter === 'All' || d.specialty === specialtyFilter;
    return matchSearch && matchSpecialty;
  });

  const availableSlots = selectedDoctor?.availability.filter(s => !s.isBooked) || [];

  const handleBook = () => {
    if (!selectedDoctor || !selectedSlot) return;
    const slot = availableSlots.find(s => s.id === selectedSlot);
    if (!slot || credits < 1) return;

    const visit: Visit = {
      id: generateId(),
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      repId: repData.id,
      repName: repData.name || user?.user_metadata?.full_name || 'Sales Rep',
      pharmaId: repData.pharmaId,
      pharmaName: repData.pharmaName,
      hospitalId: selectedDoctor.hospitalId,
      hospitalName: selectedDoctor.hospitalName,
      date: slot.date,
      time: slot.time,
      visitType: selectedType,
      status: 'Pending',
      durationMinutes: slot.duration,
      createdAt: new Date().toISOString(),
    };

    saveVisit(visit);

    // Mark slot as booked
    const updatedAvail = selectedDoctor.availability.map(s =>
      s.id === selectedSlot ? { ...s, isBooked: true } : s
    );
    saveDoctor({ ...selectedDoctor, availability: updatedAvail });

    // Deduct credit
    const companies = getPharmaCompanies();
    const mine = companies.find(c => c.id === repData.pharmaId);
    if (mine) {
      savePharmaCompany({ ...mine, credits: mine.credits - 1 });
      setCredits(c => c - 1);
    }

    if (userId) {
      pushNotification({
        userId,
        title: 'Visit Booked!',
        message: `Meeting with ${selectedDoctor.name} on ${new Date(slot.date).toLocaleDateString('en-SA', { month: 'short', day: 'numeric' })} at ${slot.time} (${selectedType}). Awaiting doctor confirmation.`,
        type: 'booking',
      });
    }

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      refreshData();
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {meetingRoom && <JitsiMeeting roomName={meetingRoom} displayName="Sales Rep" onClose={() => setMeetingRoom(null)} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Book a Visit</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Find and schedule meetings with doctors</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2">
          <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{credits} credits available</span>
        </div>
      </div>

      {/* Success banner */}
      {bookingSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-emerald-700 dark:text-emerald-400">Visit Booked Successfully!</div>
            <div className="text-sm text-emerald-600/80 dark:text-emerald-400/80">1 credit used. Waiting for doctor confirmation.</div>
          </div>
        </div>
      )}

      {/* Search + Specialty filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search doctor or hospital..."
            className="pl-9 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SPECIALTIES.map(sp => (
            <button
              key={sp}
              onClick={() => setSpecialtyFilter(sp)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg font-medium transition-colors whitespace-nowrap',
                specialtyFilter === sp
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              )}
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 text-center">
              <Search className="h-10 w-10 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-slate-400">No doctors found matching your criteria.</p>
            </div>
          ) : (
            filtered.map(doc => {
              const freeSlots = doc.availability.filter(s => !s.isBooked).length;
              return (
                <div
                  key={doc.id}
                  onClick={() => { setSelectedDoctor(doc); setSelectedSlot(null); }}
                  className={cn(
                    'bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all',
                    selectedDoctor?.id === doc.id && 'border-emerald-500 ring-1 ring-emerald-500/30 shadow-md'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                        {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold dark:text-white">{doc.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">{doc.specialty}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          📍 {doc.hospitalName} &nbsp;•&nbsp; {doc.experienceYears}y exp
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      'text-xs font-medium px-2 py-1 rounded-lg',
                      freeSlots > 0
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                    )}>
                      {freeSlots > 0 ? `${freeSlots} slots open` : 'No slots'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Booking Panel */}
        <div>
          {selectedDoctor ? (
            <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold dark:text-white">Book Visit</h3>
                <button onClick={() => setSelectedDoctor(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                <div className="font-medium text-sm dark:text-white">{selectedDoctor.name}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">{selectedDoctor.specialty} • {selectedDoctor.hospitalName}</div>
              </div>

              {/* Visit Type */}
              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">Visit Type</div>
                <div className="grid grid-cols-2 gap-2">
                  {VISIT_TYPES.map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedType(value)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors',
                        selectedType === value
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Slots */}
              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">Available Slots</div>
                {availableSlots.length === 0 ? (
                  <div className="py-4 text-center text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    No available slots. Doctor hasn't set availability yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs transition-colors',
                          selectedSlot === slot.id
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 dark:border-emerald-500'
                            : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-300'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>{new Date(slot.date).toLocaleDateString('en-SA', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>{slot.time}</span>
                          <span className="text-gray-400">{slot.duration}m</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleBook}
                disabled={!selectedSlot || credits < 1}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                {credits < 1 ? 'No Credits Available' : selectedSlot ? 'Confirm Booking (−1 credit)' : 'Select a Slot'}
              </Button>

              {credits < 1 && (
                <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                  Your company is out of visit credits. Ask your manager to purchase a bundle.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-8 text-center">
              <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6 text-gray-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Select a doctor from the list to start booking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
