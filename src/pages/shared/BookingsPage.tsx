import React, { useState, useEffect } from 'react';
import { getVisits, saveVisit, getPharmaCompanies, Visit, VisitStatus } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, Phone, MapPin, MessageSquare, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

export function BookingsPage({ role }: { role?: string }) {
  const { userId } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let allVisits = getVisits();
    // Filter by role
    if (role === 'pharma') {
      const companies = getPharmaCompanies();
      // show all for now since we're just demoing
    }
    setVisits(allVisits);
  }, [userId, role]);

  const tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

  const filtered = visits.filter(v => {
    const matchFilter = filter === 'All' || v.status === filter;
    const matchSearch = !search || v.doctorName.toLowerCase().includes(search.toLowerCase()) || v.repName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Track all visit appointments</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by doctor or rep..." className="pl-9 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <div className="flex gap-1">
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
                {tab}
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
          <h3 className="text-base font-semibold text-gray-600 dark:text-slate-300">No visits found</h3>
          <p className="text-sm text-gray-400 dark:text-slate-500">No bookings match your current filter</p>
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
                    <p className="text-sm text-gray-500 dark:text-slate-400">Rep: {visit.repName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(visit.date + 'T' + visit.time).toLocaleDateString('en-SA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {visit.time}</span>
                      <span>•</span>
                      <span>{visit.visitType}</span>
                      <span>•</span>
                      <span>{visit.durationMinutes} min</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={cn('px-3 py-1 text-xs rounded-full border font-medium', STATUS_COLORS[visit.status])}>
                    {visit.status}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{visit.hospitalName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
