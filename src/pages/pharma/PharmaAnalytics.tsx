import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getVisits, getSalesReps, getDoctors, getPharmaCompanies } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { TrendingUp, Users, MapPin, Activity } from 'lucide-react';

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function PharmaAnalytics() {
  const { userId } = useAuth();
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);
  const [reps, setReps] = useState<ReturnType<typeof getSalesReps>>([]);

  useEffect(() => {
    const companies = getPharmaCompanies();
    const myCompany = companies.find(c => c.userId === userId);
    const allVisits = getVisits();
    const myVisits = myCompany ? allVisits.filter(v => v.pharmaId === myCompany.id) : allVisits;
    setVisits(myVisits);
    const allReps = getSalesReps();
    const myReps = myCompany ? allReps.filter(r => r.pharmaId === myCompany.id) : allReps;
    setReps(myReps);
  }, [userId]);

  // Monthly visits data
  const monthlyData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((name, i) => ({
      name,
      visits: visits.filter(v => new Date(v.date).getMonth() === i).length,
    }));
  })();

  // Visit type distribution
  const typeData = ['In Person', 'Video', 'Call', 'Text'].map(type => ({
    name: type,
    value: visits.filter(v => v.visitType === type).length,
  })).filter(d => d.value > 0);

  // Status distribution
  const statusData = ['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(status => ({
    name: status,
    value: visits.filter(v => v.status === status).length,
  })).filter(d => d.value > 0);

  // Rep performance
  const repPerformance = reps.map(rep => ({
    name: rep.name.split(' ')[0],
    visits: visits.filter(v => v.repId === rep.id).length,
    target: rep.target,
  }));

  // Doctor engagement - top 5 most visited
  const doctorEngagement = (() => {
    const counts: Record<string, { name: string; count: number }> = {};
    visits.forEach(v => {
      counts[v.doctorId] = { name: v.doctorName, count: (counts[v.doctorId]?.count || 0) + 1 };
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5).map(d => ({ name: d.name.split(' ').slice(-1)[0], visits: d.count }));
  })();

  const totalVisits = visits.length;
  const completedVisits = visits.filter(v => v.status === 'Completed').length;
  const conversionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;
  const pendingVisits = visits.filter(v => v.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Performance insights & visit tracking</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Visits', value: totalVisits, icon: Activity, color: 'emerald' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp, color: 'blue' },
          { label: 'Active Reps', value: reps.length, icon: Users, color: 'amber' },
          { label: 'Pending Visits', value: pendingVisits, icon: MapPin, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4">
            <div className={`h-8 w-8 rounded-lg bg-${color}-100 dark:bg-${color}-500/20 flex items-center justify-center mb-3`}>
              <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Visits Chart */}
      <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Visit Trends</h2>
        {visits.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">No visit data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="visits" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visit Type Distribution */}
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visit Type Distribution</h2>
          {typeData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Rep Performance */}
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rep Performance</h2>
          {repPerformance.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">No rep data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={repPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="visits" fill="#059669" radius={[0, 4, 4, 0]} name="Visits" />
                <Bar dataKey="target" fill="#1e293b" radius={[0, 4, 4, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Doctor Engagement */}
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Engaged Doctors</h2>
          {doctorEngagement.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">No visit data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={doctorEngagement}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visit Status Overview</h2>
          {statusData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">No data yet</div>
          ) : (
            <div className="space-y-3">
              {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map((status, i) => {
                const count = visits.filter(v => v.status === status).length;
                const pct = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-slate-400">{status}</span>
                      <span className="text-gray-900 dark:text-white font-medium">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} />
                    </div>
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
