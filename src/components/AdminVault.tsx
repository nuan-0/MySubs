import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, query, onSnapshot, doc, deleteDoc, Timestamp, auth, updateDoc, setDoc } from '../firebase';
import { useAuth } from './AuthProvider';
import { UserProfile, ResetRequest, Message, Config } from '../types';
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
  MessageSquare: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  Tag: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
  ),
  Trophy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
  )
};

export default function AdminVault() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [newPin, setNewPin] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [proSearchEmail, setProSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [proDuration, setProDuration] = useState<'month' | 'year' | 'custom'>('month');
  const [customDate, setCustomDate] = useState('');
  const [pricingForm, setPricingForm] = useState({
    monthly: '',
    yearly: '',
    monthlyOld: '',
    yearlyOld: '',
    currency: '$'
  });
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
    const unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (error) => {
      console.error("Admin Messages Fetch Error:", error);
      toast.error("Access Denied to Messages");
    });
    const unsubConfig = onSnapshot(doc(db, 'config', 'pricing'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Config;
        setConfig(data);
        setPricingForm({
          monthly: data.proPriceMonthly.toString(),
          yearly: data.proPriceYearly.toString(),
          monthlyOld: data.proPriceMonthlyOld?.toString() || '',
          yearlyOld: data.proPriceYearlyOld?.toString() || '',
          currency: data.currency || '$'
        });
      }
    }, (error) => {
      console.error("Admin Config Fetch Error:", error);
    });
    return () => {
      unsubUsers();
      unsubRequests();
      unsubMessages();
      unsubConfig();
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
      // Find user by email
      const userToUpdate = users.find(u => u.email === selectedEmail);
      if (!userToUpdate) {
        toast.error("User not found in database");
        return;
      }

      // Update user document with temporary PIN and reset flag
      await updateDoc(doc(db, 'users', userToUpdate.uid), {
        tempPin: newPin,
        resetApproved: true
      });

      // Resolve the request
      const request = requests.find(r => r.email === selectedEmail);
      if (request) {
        await updateDoc(doc(db, 'ResetRequests', request.id), {
          status: 'resolved',
          tempPin: newPin, // Store tempPin so user can see it on login screen
          resolvedAt: Timestamp.now()
        });
      }

      toast.success(`PIN Reset Approved! Temporary PIN: ${newPin}`);
      setNewPin('');
      setSelectedEmail('');
    } catch (error) {
      console.error("Reset PIN Error:", error);
      toast.error("Failed to reset PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleReplyMessage = async () => {
    if (!selectedMessage || !adminReply.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'messages', selectedMessage.id), {
        reply: adminReply,
        status: 'replied'
      });
      toast.success("Reply sent!");
      setAdminReply('');
      setSelectedMessage(null);
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePricing = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'config', 'pricing'), {
        proPriceMonthly: parseFloat(pricingForm.monthly),
        proPriceYearly: parseFloat(pricingForm.yearly),
        proPriceMonthlyOld: pricingForm.monthlyOld ? parseFloat(pricingForm.monthlyOld) : null,
        proPriceYearlyOld: pricingForm.yearlyOld ? parseFloat(pricingForm.yearlyOld) : null,
        currency: pricingForm.currency
      }, { merge: true });
      toast.success("Pricing updated!");
    } catch (error) {
      toast.error("Failed to update pricing");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = () => {
    const user = users.find(u => u.email.toLowerCase() === proSearchEmail.toLowerCase());
    if (user) {
      setFoundUser(user);
    } else {
      toast.error("User not found");
      setFoundUser(null);
    }
  };

  const handleGrantPro = async () => {
    if (!foundUser) return;
    setLoading(true);
    try {
      let expiryDate = new Date();
      if (proDuration === 'month') {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (proDuration === 'year') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else if (customDate) {
        expiryDate = new Date(customDate);
      }

      await updateDoc(doc(db, 'users', foundUser.uid), {
        isPro: true,
        proExpiryDate: Timestamp.fromDate(expiryDate)
      });
      toast.success(`Pro status granted to ${foundUser.email} until ${expiryDate.toLocaleDateString()}`);
      setFoundUser(null);
      setProSearchEmail('');
    } catch (error) {
      toast.error("Failed to grant Pro status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-12">
      <header className="flex items-center gap-3 md:gap-4 mb-6 md:mb-12">
        <button 
          onClick={() => navigate('/dashboard')}
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
          <p className="text-2xl md:text-4xl font-bold text-white">{formatCurrency(stats.revenue, config?.currency)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Pricing Management */}
        <section className="bg-zinc-900/50 border border-white/10 p-6 md:p-8 rounded-[40px] shadow-2xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <div className="text-purple-500"><Icons.Tag /></div> Pricing Management
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 mb-1 block">Monthly Price</label>
                <input 
                  type="number"
                  value={pricingForm.monthly}
                  onChange={(e) => setPricingForm({...pricingForm, monthly: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 mb-1 block">Monthly Old</label>
                <input 
                  type="number"
                  value={pricingForm.monthlyOld}
                  onChange={(e) => setPricingForm({...pricingForm, monthlyOld: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 mb-1 block">Yearly Price</label>
                <input 
                  type="number"
                  value={pricingForm.yearly}
                  onChange={(e) => setPricingForm({...pricingForm, yearly: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 mb-1 block">Yearly Old</label>
                <input 
                  type="number"
                  value={pricingForm.yearlyOld}
                  onChange={(e) => setPricingForm({...pricingForm, yearlyOld: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 mb-1 block">Currency Sign</label>
              <select 
                value={pricingForm.currency}
                onChange={(e) => setPricingForm({...pricingForm, currency: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none"
              >
                <option value="$">$ (USD)</option>
                <option value="₹">₹ (INR)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
              </select>
            </div>
            <button 
              onClick={handleUpdatePricing}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Pricing"}
            </button>
          </div>
        </section>

        {/* Grant Pro Access */}
        <section className="bg-zinc-900/50 border border-white/10 p-6 md:p-8 rounded-[40px] shadow-2xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <div className="text-purple-500"><Icons.Trophy /></div> Grant Pro Access
          </h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="email"
                placeholder="User Email"
                value={proSearchEmail}
                onChange={(e) => setProSearchEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button 
                onClick={handleSearchUser}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
              >
                <Icons.Search />
              </button>
            </div>

            {foundUser && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <p className="text-sm font-bold text-white mb-3">User: {foundUser.email}</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['month', 'year', 'custom'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setProDuration(d)}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                        proDuration === d ? "bg-purple-600 border-purple-500 text-white" : "bg-white/5 border-white/10 text-white/40"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                {proDuration === 'custom' && (
                  <input 
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mb-4 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                )}
                <button 
                  onClick={handleGrantPro}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {loading ? "Granting..." : "Confirm Pro Status"}
                </button>
              </div>
            )}
          </div>
        </section>
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

      {/* User Messages */}
      <section className="bg-zinc-900/50 border border-white/10 p-8 rounded-[40px] shadow-2xl mt-8">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-white">
          <div className="text-purple-500"><Icons.MessageSquare /></div> User Messages
        </h2>

        {messages.length === 0 ? (
          <div className="text-center py-12 text-white/20">
            No messages yet.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.sort((a, b) => b.sentAt.toMillis() - a.sentAt.toMillis()).map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex flex-col gap-3",
                  selectedMessage?.id === msg.id ? "bg-purple-500/10 border-purple-500" : "bg-white/5 border-white/5",
                  msg.status === 'replied' && "opacity-60"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{msg.email}</p>
                    <p className="text-xs text-white/40">{msg.sentAt.toDate().toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest",
                      msg.status === 'unread' ? "bg-red-500/20 text-red-500" : 
                      msg.status === 'replied' ? "bg-green-500/20 text-green-500" : "bg-blue-500/20 text-blue-500"
                    )}>
                      {msg.status}
                    </span>
                    <button 
                      onClick={() => setSelectedMessage(msg)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        selectedMessage?.id === msg.id ? "bg-purple-600 text-white" : "bg-white/5 hover:bg-white/10 text-white/60"
                      )}
                    >
                      {msg.status === 'replied' ? 'View' : 'Reply'}
                    </button>
                  </div>
                </div>
                <div className="bg-black/20 p-3 rounded-xl text-sm text-white/80 italic">
                  "{msg.content}"
                </div>
                {msg.reply && (
                  <div className="bg-purple-500/10 p-3 rounded-xl text-sm text-purple-300 border border-purple-500/20">
                    <p className="text-[10px] font-bold uppercase mb-1">Admin Reply:</p>
                    {msg.reply}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedMessage && selectedMessage.status !== 'replied' && (
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-sm text-white/60 mb-4">Reply to <span className="text-white font-bold">{selectedMessage.email}</span></p>
            <div className="flex flex-col gap-4">
              <textarea 
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                placeholder="Type your reply here..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[100px] resize-none"
              />
              <button 
                onClick={handleReplyMessage}
                disabled={loading || !adminReply.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Sending..." : <><Icons.Send /> Send Reply</>}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
