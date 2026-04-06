import React from 'react';
import { useAuth } from '@/lib/auth';
import { getProfile } from '@/lib/store';
import { PharmaDashboard } from './PharmaDashboard';
import { HospitalDashboard } from './HospitalDashboard';
import { DoctorDashboard } from './DoctorDashboard';
import { RepDashboard } from './RepDashboard';
import { AdminDashboard } from './admin/AdminDashboard';

export function Dashboard() {
  const { role: sessionRole, user, userId } = useAuth();
  
  // Try to resolve role: Session -> Profile store -> Admin email fallback
  const getResolvedRole = () => {
    if (sessionRole) return sessionRole;
    if (userId) {
      const profile = getProfile(userId);
      if (profile?.role) return profile.role;
    }
    if (user?.email === 'admin@gmail.com') return 'admin';
    return null;
  };

  const role = getResolvedRole();

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'pharma':
      return <PharmaDashboard />;
    case 'hospital':
      return <HospitalDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'rep':
      return <RepDashboard />;
    default:
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#050b14]">
          <div className="text-sm font-bold text-gray-500 dark:text-slate-400 animate-pulse tracking-widest uppercase">
            Preparing your dashboard...
          </div>
        </div>
      );
  }
}
