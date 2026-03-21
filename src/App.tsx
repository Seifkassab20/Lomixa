import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { RoleSelection } from './pages/RoleSelection';

// Shared pages
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { SettingsPage } from './pages/shared/SettingsPage';
import { BookingsPage } from './pages/shared/BookingsPage';

// Pharma pages
import { PharmaSubordinates } from './pages/pharma/PharmaSubordinates';
import { PharmaAnalytics } from './pages/pharma/PharmaAnalytics';
import { PharmaBundles } from './pages/pharma/PharmaBundles';

// Hospital pages
import { ManageDoctors } from './pages/hospital/ManageDoctors';
import { HospitalAnalytics } from './pages/hospital/HospitalAnalytics';

// Doctor pages
import { DoctorSchedule } from './pages/doctor/DoctorSchedule';
import { DoctorBookings } from './pages/doctor/DoctorBookings';

// Rep pages
import { RepBookVisit } from './pages/rep/RepBookVisit';
import { RepMyVisits } from './pages/rep/RepMyVisits';

import { ToastProvider } from './components/ui/Toast';
import { AboutUs } from './pages/AboutUs';
import { TermsAndConditions } from './pages/TermsAndConditions';

function OnboardingWrapper() {
  const navigate = useNavigate();
  const handleComplete = () => {
    localStorage.setItem('lomixa_onboarding_seen', 'true');
    navigate('/select-role');
  };
  return <Onboarding onComplete={handleComplete} />;
}

function InitialCheck() {
  const { user } = useAuth();
  const onboardingSeen = localStorage.getItem('lomixa_onboarding_seen') === 'true';

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!onboardingSeen) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/select-role" replace />;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="lomixa-theme">
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/onboarding" element={<OnboardingWrapper />} />
              <Route path="/select-role" element={<RoleSelection />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/:role" element={<Register />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/terms" element={<TermsAndConditions />} />

              <Route path="/" element={<InitialCheck />} />
              
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Pharma */}
                <Route path="subordinates" element={<PharmaSubordinates />} />
                <Route path="analytics" element={<PharmaAnalytics />} />
                <Route path="bundles" element={<PharmaBundles />} />

                {/* Hospital */}
                <Route path="doctors" element={<ManageDoctors />} />
                <Route path="hospital-analytics" element={<HospitalAnalytics />} />

                {/* Doctor */}
                <Route path="schedule" element={<DoctorSchedule />} />
                <Route path="my-bookings" element={<DoctorBookings />} />

                {/* Rep */}
                <Route path="book" element={<RepBookVisit />} />
                <Route path="visits" element={<RepMyVisits />} />

                {/* Shared */}
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
