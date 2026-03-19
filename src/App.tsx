import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';

// Placeholder components for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 shadow-sm h-full flex items-center justify-center">
    <h2 className="text-2xl font-semibold text-gray-500 dark:text-gray-400">{title} Page Coming Soon</h2>
  </div>
);

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="medvisit-theme">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="subordinates" element={<Placeholder title="Subordinates" />} />
              <Route path="doctors" element={<Placeholder title="Manage Doctors" />} />
              <Route path="analytics" element={<Placeholder title="Analytics" />} />
              <Route path="bundles" element={<Placeholder title="Buy Bundle" />} />
              <Route path="bookings" element={<Placeholder title="Bookings" />} />
              <Route path="schedule" element={<Placeholder title="My Schedule" />} />
              <Route path="book" element={<Placeholder title="Book Visit" />} />
              <Route path="visits" element={<Placeholder title="My Visits" />} />
              <Route path="settings" element={<Placeholder title="Settings" />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
