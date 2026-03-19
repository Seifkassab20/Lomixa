import React, { useEffect, useState } from 'react';
import { getVisits, getDoctors, getHospitals } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function HospitalAnalytics() {
  const { userId } = useAuth();
  const [visits, setVisits] = useState<ReturnType<typeof getVisits>>([]);
  const [doctors, setDoctors] = useState<ReturnType<typeof getDoctors>>([]);

  useEffect(() => {
    const hospitals = getHospitals();
    const mine = hospitals.find(h => h.userId === userId);
    const d = getDoctors().filter(doc => doc.hospitalId === mine?.id);
    setDoctors(d);
    const v = getVisits().filter(v => v.hospitalId === mine?.id);
    setVisits(v);
  }, [userId]);

  const monthlyData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((name, i) => ({
    name, visits: visits.filter(v => new Date(v.date).getMonth() === i).length,
  }));

  const specialtyData = [...new Set(doctors.map(d => d.specialty))].map(specialty => ({
    name: specialty,
    value: doctors.filter(d => d.specialty === specialty).length,
  }));

  const statusData = ['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => ({
    name: s, value: visits.filter(v => v.status === s).length,
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Hospital Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Doctor activity & visit statistics</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Doctors', value: doctors.length },
          { label: 'Total Visits', value: visits.length },
          { label: 'Active Pharma', value: [...new Set(visits.map(v => v.pharmaId))].length },
          { label: 'Completion Rate', value: visits.length > 0 ? `${Math.round((visits.filter(v => v.status === 'Completed').length / visits.length) * 100)}%` : '0%' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4">
            <div className="text-2xl font-bold dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <h2 className="text-base font-semibold dark:text-white mb-4">Monthly Visit Frequency</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="visits" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <h2 className="text-base font-semibold dark:text-white mb-4">Doctors by Specialty</h2>
          {specialtyData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-slate-500">No doctors added yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={specialtyData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {specialtyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <h2 className="text-base font-semibold dark:text-white mb-4">Visit Status Breakdown</h2>
          {statusData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-slate-500">No visits yet</div>
          ) : (
            <div className="space-y-3">
              {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map((s, i) => {
                const count = visits.filter(v => v.status === s).length;
                const pct = visits.length > 0 ? Math.round((count / visits.length) * 100) : 0;
                return (
                  <div key={s}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-slate-400">{s}</span>
                      <span className="font-medium dark:text-white">{count} ({pct}%)</span>
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

        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5">
          <h2 className="text-base font-semibold dark:text-white mb-4">Top Active Doctors</h2>
          {doctors.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-slate-500">No doctors yet</div>
          ) : (
            <div className="space-y-3">
              {doctors.map(doc => {
                const docVisits = visits.filter(v => v.doctorId === doc.id).length;
                return (
                  <div key={doc.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-medium dark:text-white">{doc.name}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{doc.specialty}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{docVisits} visits</div>
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
