import React, { useState, useEffect, useCallback } from 'react';
import { getVisits, saveVisit, getPharmaCompanies, getSalesReps, getDoctors, getHospitals, Visit, VisitStatus } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, Phone, MapPin, MessageSquare, Filter, Search, FileText, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const STATUS_COLORS: Record<VisitStatus, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30',
};

const TYPE_ICONS = {
  'In Person': MapPin,
  Video: Video,
  Call: Phone,
  Text: MessageSquare,
};

function VisitTypeIcon({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || MapPin;
  return <Icon className="h-5 w-5" />;
}

export function BookingsPage() {
  const { userId, role } = useAuth();
  const { t, i18n } = useTranslation();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  const loadVisits = useCallback(() => {
    const allVisits = getVisits();
    let filtered: Visit[] = [];

    if (role === 'pharma') {
      const companies = getPharmaCompanies();
      const mine = companies.find(c => c.userId === userId);
      filtered = mine ? allVisits.filter(v => v.pharmaId === mine.id) : [];
    } else if (role === 'rep') {
      const reps = getSalesReps();
      const myRep = reps.find(r => r.userId === userId);
      filtered = myRep ? allVisits.filter(v => v.repId === myRep.id) : [];
    } else if (role === 'doctor') {
      const doctors = getDoctors();
      const myDoc = doctors.find(d => d.userId === userId);
      filtered = myDoc ? allVisits.filter(v => v.doctorId === myDoc.id) : [];
    } else if (role === 'hospital') {
      const hospitals = getHospitals();
      const mine = hospitals.find(h => h.userId === userId);
      filtered = mine ? allVisits.filter(v => v.hospitalId === mine.id) : [];
    } else {
      filtered = allVisits;
    }

    setVisits(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, [userId, role]);

  useEffect(() => {
    loadVisits();
    const interval = setInterval(loadVisits, 10000);
    return () => clearInterval(interval);
  }, [loadVisits]);

  const tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'] as const;

  const filtered = visits.filter(v => {
    const matchFilter = filter === 'All' || v.status === filter;
    const matchSearch = !search ||
      v.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      v.repName.toLowerCase().includes(search.toLowerCase()) ||
      v.pharmaName.toLowerCase().includes(search.toLowerCase()) ||
      v.hospitalName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('allBookings')}</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('trackBookings')}</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="pl-9 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <div className="flex gap-1 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg font-medium transition-colors',
                  filter === tab
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                )}
              >
                {t(tab.toLowerCase())}
                <span className="ml-1 text-[10px] opacity-70">
                  ({tab === 'All' ? visits.length : visits.filter(v => v.status === tab).length})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visit List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <Calendar className="h-10 w-10 text-gray-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-gray-600 dark:text-slate-300">{t('noResults')}</h3>
          <p className="text-sm text-gray-400 dark:text-slate-500">{t('noBookingsMatch')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(visit => (
            <div key={visit.id} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <VisitTypeIcon type={visit.visitType} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{visit.doctorName}</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Rep: {visit.repName} &bull; {visit.pharmaName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(visit.date + 'T' + visit.time).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-SA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {visit.time}</span>
                      <span>&bull;</span>
                      <span>{t(visit.visitType.toLowerCase().replace(' ', ''))}</span>
                      <span>&bull;</span>
                      <span>{visit.durationMinutes} min</span>
                    </div>
                    {visit.notes && (
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1 flex items-center gap-1.5 border dark:border-slate-700">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="italic">{visit.notes}</span>
                      </div>
                    )}
                    {visit.outcomeNotes && (
                      <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-lg px-2.5 py-1 flex items-center gap-1.5 border border-blue-200 dark:border-blue-500/20">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span className="italic">{visit.outcomeNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <Badge variant="outline" className={cn('uppercase font-bold tracking-wider', STATUS_COLORS[visit.status])}>
                    {t(visit.status.toLowerCase())}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
