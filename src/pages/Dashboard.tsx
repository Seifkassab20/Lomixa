import React from 'react';
import { useAuth } from '@/lib/auth';
import { PharmaDashboard } from './PharmaDashboard';
import { HospitalDashboard } from './HospitalDashboard';
import { DoctorDashboard } from './DoctorDashboard';
import { RepDashboard } from './RepDashboard';
import { AdminDashboard } from './admin/AdminDashboard';

export function Dashboard() {
  const { role } = useAuth();

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
      return <div>Loading dashboard...</div>;
  }
}
