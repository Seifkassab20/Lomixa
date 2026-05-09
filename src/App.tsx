// Lomixa App - v1.0.1 - Deploy Trigger
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/ui/Toast';
import { initializeRates } from './lib/currency';
import { isUserAuthorized, syncCloudData } from './lib/store';

import logo from '@/assets/logo.svg';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const RegisterPhase1 = lazy(() => import('./pages/RegisterPhase1').then(m => ({ default: m.RegisterPhase1 })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const RoleSelection = lazy(() => import('./pages/RoleSelection').then(m => ({ default: m.RoleSelection })));
const AboutUs = lazy(() => import('./pages/AboutUs').then(m => ({ default: m.AboutUs })));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions').then(m => ({ default: m.TermsAndConditions })));

// Auth specific
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Portal specific
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const PharmaSubordinates = lazy(() => import('./pages/pharma/PharmaSubordinates').then(m => ({ default: m.PharmaSubordinates })));
const PharmaAnalytics = lazy(() => import('./pages/pharma/PharmaAnalytics').then(m => ({ default: m.PharmaAnalytics })));
const PharmaBundles = lazy(() => import('./pages/pharma/PharmaBundles').then(m => ({ default: m.PharmaBundles })));
const ManageDoctors = lazy(() => import('./pages/hospital/ManageDoctors').then(m => ({ default: m.ManageDoctors })));
const HospitalAnalytics = lazy(() => import('./pages/hospital/HospitalAnalytics').then(m => ({ default: m.HospitalAnalytics })));
const DoctorSchedule = lazy(() => import('./pages/doctor/DoctorSchedule').then(m => ({ default: m.DoctorSchedule })));
const DoctorBookings = lazy(() => import('./pages/doctor/DoctorBookings').then(m => ({ default: m.DoctorBookings })));
const RepBookVisit = lazy(() => import('./pages/rep/RepBookVisit').then(m => ({ default: m.RepBookVisit })));
const RepMyVisits = lazy(() => import('./pages/rep/RepMyVisits').then(m => ({ default: m.RepMyVisits })));
const RepSubscription = lazy(() => import('./pages/rep/Subscription').then(m => ({ default: m.RepSubscription })));

// Shared
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('./pages/shared/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BookingsPage = lazy(() => import('./pages/shared/BookingsPage').then(m => ({ default: m.BookingsPage })));

function OnboardingWrapper() {
  const navigate = useNavigate();
  const handleComplete = () => {
    localStorage.setItem('lomixa_onboarding_seen', 'true');
    navigate('/register');
  };
  return <Onboarding onComplete={handleComplete} />;
}

function InitialCheck() {
  const { user, loading: authLoading } = useAuth();
  const [authorized, setAuthorized] = React.useState<boolean | null>(null);
  const onboardingSeen = localStorage.getItem('lomixa_onboarding_seen') === 'true';

  React.useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role;
      console.log("[InitialCheck] User detected, role:", role);
      isUserAuthorized(user.id, role).then((auth) => {
        console.log("[InitialCheck] Auth result:", auth);
        setAuthorized(auth);
      });
    } else {
      setAuthorized(false);
    }
  }, [user]);

  if (authLoading || (user && authorized === null)) return null;

  if (user) {
    if (!user.user_metadata?.role) {
      console.log("[InitialCheck] Missing role, redirecting to select-role");
      return <Navigate to="/select-role" replace />;
    }
    if (authorized === false) return <Navigate to="/login" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if (!onboardingSeen) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  React.useEffect(() => {
    initializeRates();
    // Enable background synchronization for cloud-powered features
    syncCloudData();
    const syncId = setInterval(syncCloudData, 25000); // 25s cycle
    return () => clearInterval(syncId);
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="lomixa-theme">
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={
              <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#050b14]">
                <div className="flex flex-col items-center gap-6">
                  <div className="h-16 w-16 rounded-[2rem] bg-white flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 p-2.5 animate-pulse transition-transform">
                     <img src={logo} alt="Lomixa" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-sm font-black text-gray-900 dark:text-white tracking-[0.3em] uppercase italic">Initializing...</div>
                    <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-1/2 animate-[shimmer_2s_infinite_linear]" />
                    </div>
                  </div>
                </div>
              </div>
            }>
              <Routes>
                <Route path="/onboarding" element={<OnboardingWrapper />} />
                <Route path="/select-role" element={<RoleSelection />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<RegisterPhase1 />} />
                <Route path="/register/:role" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
                  <Route path="rep-subscription" element={<RepSubscription />} />

                  {/* Shared */}
                  <Route path="bookings" element={<BookingsPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  
                  {/* Admin */}
                  <Route path="admin-control" element={<AdminDashboard />} />
                  <Route path="admin-control/:tab" element={<AdminDashboard />} />

                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
