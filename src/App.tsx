/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import AuthScreen from './components/AuthScreen';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import AdminVault from './components/AdminVault';
import TrialLock from './components/TrialLock';
import { PrivacyPolicy, TermsOfService } from './components/Legal';
import { Toaster } from 'sonner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, isUnlocked } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-bg text-white">Loading MySubs...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (!isUnlocked) return <Navigate to="/" />;

  // Wait for profile to load if user exists
  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-white gap-4">
      <p>Setting up your vault...</p>
      <button 
        onClick={() => {
          import('./firebase').then(({ auth, signOut }) => signOut(auth));
        }}
        className="text-primary text-sm hover:underline"
      >
        Stuck? Logout and try again
      </button>
    </div>
  );

  // Trial Lock Logic
  if (!profile.trialStartDate) {
    return <>{children}</>; // Fallback if no trial date yet
  }

  try {
    const trialStart = typeof profile.trialStartDate.toDate === 'function' 
      ? profile.trialStartDate.toDate() 
      : new Date(profile.trialStartDate.seconds * 1000);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 3 && !profile.isPro) {
      return <TrialLock />;
    }
  } catch (e) {
    console.error("Trial date calculation error:", e);
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (!profile?.isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
};

const HomeRoute = () => {
  const { user, loading, isUnlocked } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-bg text-white">Loading...</div>;
  if (user && isUnlocked) return <Navigate to="/dashboard" />;
  if (user) return <AuthScreen />;
  return <LandingPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-bg text-white font-sans selection:bg-primary/30">
          <Routes>
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/" element={<HomeRoute />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin-vault" element={<ProtectedRoute><AdminRoute><AdminVault /></AdminRoute></ProtectedRoute>} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster position="top-center" richColors theme="dark" />
        </div>
      </Router>
    </AuthProvider>
  );
}

