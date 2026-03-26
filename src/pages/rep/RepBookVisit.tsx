import React, { useState, useEffect } from 'react';
import {
  getDoctors, saveVisit, saveDoctor, getSalesReps, getPharmaCompanies, savePharmaCompany,
  generateId, Visit, VisitType, pushNotification, Doctor, saveSalesRep, saveDoctorAvailability
} from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { JitsiMeeting } from '@/components/JitsiMeeting';
import { Search, Video, Phone, MapPin, MessageSquare, Calendar, Clock, CheckCircle2, CreditCard, X, FileText, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/currency';

const SPECIALTIES = [
  'All', 'Cardiology', 'Neurology', 'Pediatrics', 'Oncology',
  'Orthopedics', 'Dermatology', 'Psychiatry', 'General Practice',
];

export function RepBookVisit() {
  const { userId, user } = useAuth();
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<VisitType>('In Person');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [meetingRoom, setMeetingRoom] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);

  const reps = getSalesReps();
  const currentRep = reps.find(r => r.userId === userId);
  const country = currentRep?.location?.country || 'sa';
  const [repData, setRepData] = useState({ id: '', pharmaId: '', pharmaName: '', name: '' });
  const [visitNotes, setVisitNotes] = useState('');
  const [bookedCount, setBookedCount] = useState(1);

  const VISIT_TYPES: { value: VisitType; icon: React.ElementType; labelKey: string }[] = [
    { value: 'In Person', icon: MapPin, labelKey: 'inPerson' },
    { value: 'Video', icon: Video, labelKey: 'videoCall' },
    { value: 'Call', icon: Phone, labelKey: 'phoneCall' },
    { value: 'Text', icon: MessageSquare, labelKey: 'textChat' },
  ];

  const refreshData = () => {
    setDoctors(getDoctors());
    const reps = getSalesReps();
    const myRep = reps.find(r => r.userId === userId);
    if (myRep) {
      setRepData({ id: myRep.id, pharmaId: myRep.pharmaId, pharmaName: myRep.pharmaName, name: myRep.name });
      setBalance(myRep.balance || 0);
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

  const availableSlots = selectedDoctor?.availability.filter(s => !s.isBooked && s.appointmentType === selectedType) || [];

  // Lomixa Smart Matchmaker (AI Recommendation Engine)
  const aiRecommendations = React.useMemo(() => {
    if (search !== '' || specialtyFilter !== 'All') return [];
    return [...filtered]
      .filter(d => d.availability.some(s => !s.isBooked))
      .sort((a, b) => {
        const aSlots = a.availability.filter(s => !s.isBooked).length;
        const bSlots = b.availability.filter(s => !s.isBooked).length;
        return bSlots - aSlots; // Recommend doctors with the most open availability
      })
      .slice(0, 2);
  }, [filtered, search, specialtyFilter]);

  const handleBook = (mode: 'single' | 'all') => {
    if (!selectedDoctor) return;
    
    const slotsToBook = mode === 'single' 
      ? availableSlots.filter(s => s.id === selectedSlot)
      : availableSlots;

    const totalPrice = slotsToBook.reduce((sum, s) => sum + (s.price || 150), 0);

    if (slotsToBook.length === 0 || balance < totalPrice) return;

    setBookedCount(slotsToBook.length);

    slotsToBook.forEach(slot => {
      const visit: Visit = {
        id: generateId(),
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        repId: repData.id,
        repName: repData.name || user?.user_metadata?.full_name || 'Sales Rep',
        repUserId: userId || undefined,
        pharmaId: repData.pharmaId,
        pharmaName: repData.pharmaName,
        hospitalId: selectedDoctor.hospitalId,
        hospitalName: selectedDoctor.hospitalName,
        date: slot.date,
        time: slot.time,
        visitType: selectedType,
        status: 'Pending',
        durationMinutes: slot.duration,
        price: slot.price,
        notes: visitNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      saveVisit(visit);
    });

    const bookedIds = slotsToBook.map(s => s.id);
    const updatedAvail = selectedDoctor.availability.map(s =>
      bookedIds.includes(s.id) ? { ...s, isBooked: true } : s
    );
    saveDoctor({ ...selectedDoctor, availability: updatedAvail });
    saveDoctorAvailability(selectedDoctor.id, updatedAvail);

    const reps = getSalesReps();
    const myRep = reps.find(r => r.id === repData.id);
    if (myRep) {
      const totalPrice = slotsToBook.reduce((sum, s) => sum + (s.price || 150), 0);
      saveSalesRep({ ...myRep, balance: Math.max((myRep.balance || 0) - totalPrice, 0) });
      setBalance(b => Math.max(b - totalPrice, 0));
    }

    if (userId) {
      pushNotification({
        userId,
        title: 'Visit(s) Booked!',
        message: mode === 'single' 
          ? `Meeting with ${selectedDoctor.name} on ${new Date(slotsToBook[0].date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric' })} at ${slotsToBook[0].time} (${selectedType}). Awaiting doctor confirmation.`
          : `Bulk booking confirmed: ${slotsToBook.length} sessions scheduled with ${selectedDoctor.name}. Awaiting doctor confirmation.`,
        type: 'booking',
      });
    }

    setBookingSuccess(true);
    setVisitNotes('');
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      refreshData();
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {meetingRoom && <JitsiMeeting roomName={meetingRoom} displayName={t('salesRep')} onClose={() => setMeetingRoom(null)} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{t('bookVisit')}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('findScheduleMeetings') || 'Find and schedule meetings with doctors'}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2">
          <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{balance} {t('sarCurrency')}</span>
        </div>
      </div>

      {bookingSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-emerald-700 dark:text-emerald-400">{t('visitBookedSuccess') || 'Visit Booked Successfully!'}</div>
            <div className="text-sm text-emerald-600/80 dark:text-emerald-400/80">{t('balanceDeductedMsg') || 'The visit price has been deducted from your balance. Awaiting doctor confirmation.'}</div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchDoctorHospital') || "Search doctor or hospital..."}
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
              {t(sp.toLowerCase().replace(' ', '')) || sp}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          
          {/* AI RECOMMENDATIONS ENGINE */}
          {aiRecommendations.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 mb-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
                  AI Smart Matchmaker
                </h3>
                <span className="ml-auto text-xs font-medium text-amber-700/70 dark:text-amber-400/70 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Recommended for you
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                {aiRecommendations.map(doc => {
                  const openSlots = doc.availability.filter(s => !s.isBooked).length;
                  return (
                    <div 
                      key={`ai-${doc.id}`} 
                      className={cn(
                        'bg-white dark:bg-slate-800/80 border rounded-xl p-4 text-left transition-all hover:shadow-md cursor-pointer',
                        selectedDoctor?.id === doc.id
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'border-amber-100 dark:border-amber-700/30 hover:border-amber-300 dark:hover:border-amber-600/50'
                      )}
                      onClick={() => { setSelectedDoctor(doc); setSelectedSlot(null); }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                          {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{doc.name}</h3>
                          <p className="text-xs text-amber-600/80 dark:text-amber-400/80">{doc.specialty}</p>
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            {openSlots} {t('slotsOpen', { count: openSlots }) || 'slots open'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Background decoration */}
              <Sparkles className="absolute -right-4 -top-4 w-32 h-32 text-amber-500/10 dark:text-amber-400/5 pointer-events-none" />
            </div>
          )}

          {/* NORMAL DOCTOR LIST */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 text-center">
              <Search className="h-10 w-10 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('noDoctorsFound') || 'No doctors found matching your criteria.'}</p>
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
                          <Badge variant="outline" className="text-xs border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">{t(doc.specialty.toLowerCase().replace(' ', '')) || doc.specialty}</Badge>
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
                      {freeSlots > 0 ? t('slotsOpen', { count: freeSlots }).replace('{{count}}', freeSlots.toString()) || `${freeSlots} slots open` : t('noSlots')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div>
          {selectedDoctor ? (
            <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold dark:text-white">{t('bookVisit')}</h3>
                <button onClick={() => setSelectedDoctor(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                <div className="font-medium text-sm dark:text-white">{selectedDoctor.name}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">{t(selectedDoctor.specialty.toLowerCase().replace(' ', '')) || selectedDoctor.specialty} • {selectedDoctor.hospitalName}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">{t('visitType')}</div>
                <div className="grid grid-cols-2 gap-2">
                  {VISIT_TYPES.map(({ value, icon: Icon, labelKey }) => (
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
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">{t('availableSlots')}</div>
                {availableSlots.length === 0 ? (
                  <div className="py-4 text-center text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    {t('noAvailableSlots') || "No available slots. Doctor hasn't set availability yet."}
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
                          <span>{new Date(slot.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>{slot.time}</span>
                          <span className="text-gray-400">{slot.duration}m</span>
                          <span className="text-emerald-400 font-bold ml-1">{formatCurrency(slot.price || 150, country)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> {t('preVisitNotes') || 'Pre-Visit Notes'} <span className="font-normal normal-case opacity-60">({t('optional')})</span>
                </div>
                <textarea
                  value={visitNotes}
                  onChange={e => setVisitNotes(e.target.value)}
                  placeholder={t('addContextAgenda') || "Add context or agenda for this visit..."}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white px-3 py-2 text-xs placeholder:text-gray-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleBook('single')}
                  disabled={!selectedSlot || balance < (availableSlots.find(s => s.id === selectedSlot)?.price || 150)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  {!selectedSlot ? t('selectASlot') : balance < (availableSlots.find(s => s.id === selectedSlot)?.price || 150) ? t('noBalanceAvailable') || 'Insufficient Balance' : t('bookSelectedSlot')}
                </Button>

                {availableSlots.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => handleBook('all')}
                    disabled={balance < availableSlots.reduce((sum, s) => sum + (s.price || 150), 0)}
                    className="w-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 h-12 rounded-xl text-xs font-bold gap-2"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    {t('bookAllSlotsCount', { count: availableSlots.length })}
                    <span className="opacity-60 ml-1">({formatCurrency(availableSlots.reduce((sum, s) => sum + (s.price || 150), 0), country)})</span>
                  </Button>
                )}
              </div>

              {balance < 100 && (
                <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                  {t('outOfPersonalCreditsMsg')}
                </p>
              )}
              {balance > 0 && balance <= 500 && (
                <p className="text-xs text-center text-orange-600 dark:text-orange-400">
                  {t('lowCreditsWarning', { amount: formatCurrency(balance, country) })}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-8 text-center">
              <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6 text-gray-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('selectDoctorPrompt') || 'Select a doctor from the list to start booking'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
