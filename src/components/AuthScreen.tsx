import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  Timestamp, 
  addDoc, 
  collection, 
  updateDoc, 
  GoogleAuthProvider, 
  signInWithPopup, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  deleteDoc,
  handleFirebaseError,
  OperationType,
  signInAnonymously
} from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const SECRET_SUFFIX = "MySubs_PIN";

// Simple SVG Icons to avoid Lucide constructor issues
const Icons = {
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
  ),
  Chrome: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" x2="12" y1="8" y2="8"/><line x1="3.95" x2="8.54" y1="6.06" y2="14"/><line x1="10.88" x2="15.46" y1="21.94" y2="14"/></svg>
  ),
  Delete: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><line x1="18" x2="12" y1="9" y2="15"/><line x1="12" x2="18" y1="15" y2="9"/></svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  )
};

export function AuthForm() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const profileRef = doc(db, 'users', user.uid);
      let profileSnap;
      try {
        profileSnap = await getDoc(profileRef);
      } catch (err) {
        throw handleFirebaseError(err, OperationType.GET, `users/${user.uid}`);
      }
      
      if (!profileSnap.exists()) {
        try {
          await setDoc(profileRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            trialStartDate: Timestamp.now(),
            isPro: false,
            isAdmin: user.email === "krishnaprayers108@gmail.com",
            currency: '$'
          });
        } catch (err) {
          throw handleFirebaseError(err, OperationType.CREATE, `users/${user.uid}`);
        }
      } else if (user.email === "krishnaprayers108@gmail.com") {
        try {
          await updateDoc(profileRef, { isAdmin: true });
        } catch (err) {
          console.error("Failed to update admin status:", err);
        }
      }

      localStorage.setItem('mysubs_email', user.email || '');
      toast.success("Logged in with Google!");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || "Google Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md">
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Welcome to MySubs</h2>
          <p className="text-white/40 text-sm">Sign in to manage your subscriptions securely.</p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black hover:bg-white/90 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
        >
          <Icons.Chrome />
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-[10px] text-white/20 text-center mt-4 uppercase tracking-widest">
          Secure Google Authentication
        </p>
      </div>
    </div>
  );
}

export default function AuthScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tighter text-white mb-2">
            My<span className="text-purple-500">Subs</span>
          </h1>
          <p className="text-white/60">Manage subscriptions with ease.</p>
        </div>

        <AuthForm />
        
        <div className="mt-8 flex justify-center gap-6 text-xs text-white/20">
          <button onClick={() => navigate('/privacy')} className="hover:text-white/40 transition-colors">Privacy Policy</button>
          <button onClick={() => navigate('/terms')} className="hover:text-white/40 transition-colors">Terms of Service</button>
        </div>
      </div>
    </div>
  );
}
