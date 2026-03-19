import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getVisits, getSalesReps, getPharmaCompanies, saveSalesRep, generateId } from '@/lib/store';
import { Calendar, CreditCard, Clock, Target, Video, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { JitsiMeeting } from '@/components/JitsiMeeting';
import { cn } from '@/lib/utils';

export function RepDashboard() {
  const { userId, user } = useAuth();
  const navigate = useNavigate();
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);
  const [credits, setCredits] = useState(0);
  const [meetingRoom, setMeetingRoom] = useState<string | null>(null);
  const [repInfo, setRepInfo] = useState({ name: '', pharmaId: '', pharmaName: '', target: 25 });

  useEffect(() => {
    const reps = getSalesReps();
    let myRep = reps.find(r => r.userId === userId);
    if (!myRep && userId) {
      // Find if the user's pharma company exists
      const companies = getPharmaCompanies();
      const myCompany = companies.find(c => c.userId === userId) || companies[0];
      myRep = {
        id: generateId(),
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Sales Rep',
        email: user?.email || '',
        phone: user?.user_metadata?.mobile || '',
        pharmaId: myCompany?.id || 'default',
        pharmaName: myCompany?.name || 'Pharma Company',
        visitsThisMonth: 0,
        target: 25,
        userId,
      };
      saveSalesRep(myRep);
    }
    if (myRep) {
      setRepInfo({ name: myRep.name, pharmaId: myRep.pharmaId, pharmaName: myRep.pharmaName, target: myRep.target });
      const myVisits = getVisits().filter(v => v.repId === myRep!.id);
      setVisits(myVisits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      const companies = getPharmaCompanies();
      const company = companies.find(c => c.id === myRep!.pharmaId);
      setCredits(company?.credits || 0);
    }
  }, [userId]);

  const TYPE_ICONS = { 'In Person': MapPin, Video, Call: Phone, Text: Clock };
  const thisMonth = new Date().getMonth();
  const monthVisits = visits.filter(v => new Date(v.date).getMonth() === thisMonth).length;
  const pendingVisits = visits.filter(v => v.status === 'Pending');
  const confirmedVisits = visits.filter(v => v.status === 'Confirmed');
  const recentVisits = visits.slice(0, 5);

  return (
    <div className="space-y-6">
      {meetingRoom && <JitsiMeeting roomName={meetingRoom} displayName={repInfo.name} onClose={() => setMeetingRoom(null)} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "My Visits (Month)", value: monthVisits, sub: `Target: ${repInfo.target}`, icon: Calendar, color: 'emerald' },
          { label: "Company Credits", value: credits.toLocaleString(), sub: "Available to use", icon: CreditCard, color: 'blue' },
          { label: "Pending Approvals", value: pendingVisits.length, sub: "Awaiting response", icon: Clock, color: 'amber' },
          { label: "Confirmed Visits", value: confirmedVisits.length, sub: "Ready to attend", icon: Target, color: 'purple' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</span>
              <div className={`h-8 w-8 rounded-lg bg-${color}-100 dark:bg-${color}-500/20 flex items-center justify-center`}>
                <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold dark:text-white">Monthly Target Progress</h3>
          <span className="text-sm text-gray-500 dark:text-slate-400">{monthVisits} / {repInfo.target} visits</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.round((monthVisits / repInfo.target) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400 dark:text-slate-500">0</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{Math.round((monthVisits / repInfo.target) * 100)}% completed</span>
          <span className="text-xs text-gray-400 dark:text-slate-500">{repInfo.target}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Visits */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold dark:text-white">Upcoming Visits</h3>
            <button onClick={() => navigate('/visits')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View All</button>
          </div>
          {recentVisits.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-slate-500 mb-3">No visits yet. Book your first visit with a doctor!</p>
              <Button onClick={() => navigate('/book')} className="bg-emerald-600 hover:bg-emerald-700 text-white">Book a Visit</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVisits.map(visit => {
                const TypeIcon = TYPE_ICONS[visit.visitType as keyof typeof TYPE_ICONS] || MapPin;
                const statusColors: Record<string, string> = {
                  Pending: 'text-amber-600 dark:text-amber-400',
                  Confirmed: 'text-emerald-600 dark:text-emerald-400',
                  Completed: 'text-blue-600 dark:text-blue-400',
                  Cancelled: 'text-red-600 dark:text-red-400',
                };
                return (
                  <div key={visit.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium dark:text-white">{visit.doctorName}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{visit.date} at {visit.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {visit.status === 'Confirmed' && visit.visitType === 'Video' && (
                        <Button size="sm" onClick={() => setMeetingRoom(`lomixa_${visit.id}`)} className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                          <Video className="h-3 w-3" /> Join
                        </Button>
                      )}
                      <span className={cn('text-xs font-medium', statusColors[visit.status])}>
                        {visit.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
            <h3 className="font-semibold dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Book New Visit', href: '/book', icon: Calendar, primary: true },
                { label: 'My Visits', href: '/visits', icon: Clock, primary: false },
              ].map(({ label, href, icon: Icon, primary }) => (
                <Button key={label} onClick={() => navigate(href)} className={cn('w-full justify-start gap-2', primary ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white bg-gray-100 hover:bg-gray-200 text-gray-900')} variant="ghost">
                  <Icon className="h-4 w-4" />{label}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-5">
            <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Company Credits</div>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{credits}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Available for bookings</div>
          </div>
        </div>
      </div>
    </div>
  );
}
