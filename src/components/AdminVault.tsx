import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, query, onSnapshot, doc, deleteDoc, Timestamp, auth } from '../firebase';
import { useAuth } from './AuthProvider';
import { UserProfile, ResetRequest } from '../types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { formatCurrency, cn } from '../lib/utils';

const Icons = {
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  DollarSign: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  TrendingUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  ),
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  ),
  ShieldAlert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  ),
  Key: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3L15.5 7.5z"/></svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  )
};

export default function AdminVault() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [newPin, setNewPin] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (error) => {
      console.error("Admin Users Fetch Error:", error);
      toast.error("Access Denied to User Data");
    });
    const unsubRequests = onSnapshot(collection(db, 'ResetRequests'), (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResetRequest)));
    }, (error) => {
      console.error("Admin Requests Fetch Error:", error);
      toast.error("Access Denied to Reset Requests");
    });
    return () => {
      unsubUsers();
      unsubRequests();
    };
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const pro = users.filter(u => u.isPro).length;
    const conversion = total > 0 ? (pro / total) * 100 : 0;
    const revenue = pro * 17; // Simplified: $17 per pro user
    return { total, conversion, revenue };
  }, [users]);

  useEffect(() => {
    const milestones = [1000, 10000, 100000];
    if (milestones.includes(users.length)) {
      confetti({
        particleCount: 500,
        spread: 160,
        origin: { y: 0.5 },
        colors: ['#7C3AED', '#8B5CF6', '#FFFFFF']
      });
      toast.success(`MILESTONE REACHED: ${users.length} USERS!`, {
        duration: 10000,
        description: "The MySubs community is exploding!"
      });
    }
  }, [users.length]);

  const handleResetPin = async () => {
    if (!selectedEmail || newPin.length !== 4) {
      toast.error("Select email and enter 4-digit PIN");
      return;
    }
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/reset-pin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          email: selectedEmail,
          newPin
        })
      });
      
      if (response.ok) {
        const req = requests.find(r => r.email === selectedEmail);
        if (req) await deleteDoc(doc(db, 'ResetRequests', req.id));
        
        toast.success(`PIN reset for ${selectedEmail}`);
        setNewPin('');
        setSelectedEmail('');
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to reset PIN");
      }
    } catch (error) {
      toast.error("Server error. Ensure Firebase Admin is configured.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-12">
      <header className="flex items-center gap-3 md:gap-4 mb-6 md:mb-12">
        <button 
          onClick={() => navigate('/')}
          className="p-2 md:p-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white"
        >
          <Icons.ChevronLeft />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3 text-white">
          <div className="text-purple-500"><Icons.ShieldAlert /></div> Admin Vault
        </h1>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="bg-zinc-900/50 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl">
          <div className="flex items-center gap-2 md:gap-3 text-white/40 mb-1 md:mb-2">
            <Icons.Users /> <span className="text-[10px] uppercase font-bold">Total Users</span>
          </div>
          <p className="text-2xl md:text-4xl font-bold text-white">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl">
          <div className="flex items-center gap-2 md:gap-3 text-white/40 mb-1 md:mb-2">
            <Icons.TrendingUp /> <span className="text-[10px] uppercase font-bold">Conversion</span>
          </div>
          <p className="text-2xl md:text-4xl font-bold text-white">{stats.conversion.toFixed(1)}%</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl">
          <div className="flex items-center gap-2 md:gap-3 text-white/40 mb-1 md:mb-2">
            <Icons.DollarSign /> <span className="text-[10px] uppercase font-bold">Est. Revenue</span>
          </div>
          <p className="text-2xl md:text-4xl font-bold text-white">{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      {/* Reset Requests */}
      <section className="bg-zinc-900/50 border border-white/10 p-8 rounded-[40px] shadow-2xl">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-white">
          <div className="text-purple-500"><Icons.Key /></div> PIN Reset Requests
        </h2>

        {requests.length === 0 ? (
          <div className="text-center py-12 text-white/20">
            No pending requests.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div 
                key={req.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex items-center justify-between",
                  selectedEmail === req.email ? "bg-purple-500/10 border-purple-500" : "bg-white/5 border-white/5"
                )}
              >
                <div>
                  <p className="font-bold text-white">{req.email}</p>
                  <p className="text-xs text-white/40">{req.requestedAt.toDate().toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedEmail(req.email)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                    selectedEmail === req.email ? "bg-purple-600 text-white" : "bg-white/5 hover:bg-white/10 text-white/60"
                  )}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedEmail && (
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-sm text-white/60 mb-4">Set New PIN for <span className="text-white font-bold">{selectedEmail}</span></p>
            <div className="flex gap-4">
              <input 
                type="text"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-Digit PIN"
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-2xl tracking-[1em] text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <button 
                onClick={handleResetPin}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-500 text-white px-8 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Updating..." : <><Icons.Check /> Set New PIN</>}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
