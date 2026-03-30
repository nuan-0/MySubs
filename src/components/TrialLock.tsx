import React from 'react';
import { auth, signOut } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Icons = {
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  CreditCard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
  ),
  LogOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  )
};

export default function TrialLock() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="bg-zinc-900/50 border border-red-500/20 w-full max-w-md p-12 rounded-[48px] text-center shadow-2xl z-10">
        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-8">
          <Icons.Lock />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-4 text-white">Trial Expired</h1>
        <p className="text-white/60 mb-12 leading-relaxed">
          Your 3-day free trial has ended. Upgrade to Pro to continue managing your subscriptions.
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => navigate('/profile')}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <Icons.CreditCard /> Upgrade Now
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-white/40 font-bold py-4 hover:text-white transition-all"
          >
            <Icons.LogOut /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
