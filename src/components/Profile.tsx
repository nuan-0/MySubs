import React, { useState, useEffect } from 'react';
import { db, auth, doc, updateDoc, signOut, onSnapshot, deleteDoc, query, collection, where, getDocs } from '../firebase';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { Config } from '../types';

const COUNTRIES = [
  { name: 'India', code: 'IN', currency: '₹' },
  { name: 'United States', code: 'US', currency: '$' },
  { name: 'United Kingdom', code: 'UK', currency: '$' },
  { name: 'Canada', code: 'CA', currency: '$' },
  { name: 'Australia', code: 'AU', currency: '$' },
];

const Icons = {
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  ),
  CreditCard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
  ),
  LogOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  ),
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  ),
  ShieldCheck: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14.5 2 14.5 7 20 7"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
  ),
  AlertCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  )
};

export default function Profile() {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [country, setCountry] = useState(profile?.country || 'United States');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCountry(profile.country || 'United States');
    }
  }, [profile]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'pricing'), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as Config);
      }
    }, (error) => {
      console.error("Config fetch error:", error);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const selectedCountry = COUNTRIES.find(c => c.name === country);
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        country,
        currency: selectedCountry?.currency || '$'
      });
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This will permanently wipe all your data, including subscriptions and settings. This action cannot be undone.");
    
    if (!confirmDelete) return;
    
    setLoading(true);
    try {
      // 1. Delete user profile
      await deleteDoc(doc(db, 'users', user.uid));
      
      // 2. Delete subscriptions
      const subsQ = query(collection(db, 'subscriptions'), where('uid', '==', user.uid));
      const subsSnap = await getDocs(subsQ);
      const deleteSubs = subsSnap.docs.map(d => deleteDoc(doc(db, 'subscriptions', d.id)));
      await Promise.all(deleteSubs);
      
      // 3. Delete messages
      const msgsQ = query(collection(db, 'messages'), where('uid', '==', user.uid));
      const msgsSnap = await getDocs(msgsQ);
      const deleteMsgs = msgsSnap.docs.map(d => deleteDoc(doc(db, 'messages', d.id)));
      await Promise.all(deleteMsgs);
      
      // 4. Delete Auth account
      await auth.currentUser?.delete();
      
      toast.success("Account deleted successfully");
      navigate('/auth');
    } catch (error: any) {
      console.error("Delete Account Error:", error);
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    if (!config) return;

    const amount = plan === 'monthly' ? config.proPriceMonthly : config.proPriceYearly;
    const currency = profile?.currency === '₹' ? 'INR' : 'USD';

    toast.loading("Creating order...");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ amount, currency })
      });
      
      if (!response.ok) throw new Error("Failed to create order");
      const order = await response.json();
      
      toast.dismiss();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: order.amount,
        currency: order.currency,
        name: "MySubs Pro",
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
        order_id: order.id,
        handler: async function (razorpayResponse: any) {
          toast.success("Payment successful! Upgrading your account...");
          await fetch('/api/upgrade', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_signature: razorpayResponse.razorpay_signature
            })
          });
          window.location.reload();
        },
        prefill: {
          name: profile?.name || '',
          email: profile?.email || '',
        },
        theme: {
          color: "#7C3AED",
        },
      };
      
      if (!(window as any).Razorpay) {
        throw new Error("Razorpay SDK not loaded. Please check your internet connection.");
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.dismiss();
      toast.error("Payment failed to initialize");
    }
  };

  const handleSimulatePayment = async () => {
    toast.loading("Simulating payment...");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/simulate-payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) throw new Error("Simulation failed");
      
      toast.dismiss();
      toast.success("Simulation successful! Account upgraded.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.dismiss();
      toast.error("Simulation failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 pb-12">
      <header className="flex items-center gap-3 md:gap-4 mb-6 md:mb-12">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-2 md:p-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white"
        >
          <Icons.ChevronLeft />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Profile</h1>
      </header>

      {/* Profile Section */}
      <section className="bg-zinc-900/50 border border-white/10 p-5 md:p-8 rounded-2xl md:rounded-[32px] mb-6 md:mb-8 shadow-2xl">
        <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 overflow-hidden border-2 border-purple-500/30"
          >
            {user?.uid ? (
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Icons.User />
            )}
          </motion.div>
          <div className="overflow-hidden">
            <h2 className="text-lg md:text-xl font-bold text-white truncate">{profile?.name || profile?.email}</h2>
            <p className="text-white/40 text-xs md:text-sm">
              {profile?.isPro ? 'Pro Account' : 'Free Account'}
              {profile?.proExpiryDate && (
                <span className="block text-[10px] opacity-60">
                  Valid until: {profile.proExpiryDate.toDate().toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"><Icons.User /></div>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Country</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"><Icons.Globe /></div>
              <select 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name} className="bg-zinc-900">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </section>

      {/* Upgrade Section */}
      {!profile?.isPro && (
        <section className="mb-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <div className="text-purple-500"><Icons.CreditCard /></div> Upgrade to Pro
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">Monthly</h4>
                <div className="mt-2">
                  {config?.proPriceMonthlyOld && (
                    <span className="text-sm text-white/20 line-through mr-2">
                      {profile?.currency}{config.proPriceMonthlyOld}
                    </span>
                  )}
                  <p className="text-3xl font-bold text-white inline-block">
                    {profile?.currency || config?.currency || '$'}{config?.proPriceMonthly || (profile?.currency === '₹' ? '99' : '17')}
                    <span className="text-sm text-white/40 font-normal">/mo</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleUpgrade('monthly')}
                className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
              >
                Choose Plan
              </button>
            </div>
            <div className="bg-zinc-900/50 border border-purple-500 p-6 rounded-3xl shadow-lg shadow-purple-500/10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest text-white">Best Value</div>
              <div>
                <h4 className="text-lg font-bold text-white">Yearly</h4>
                <div className="mt-2">
                  {config?.proPriceYearlyOld && (
                    <span className="text-sm text-white/20 line-through mr-2">
                      {profile?.currency || config?.currency || '$'}{config.proPriceYearlyOld}
                    </span>
                  )}
                  <p className="text-3xl font-bold text-white inline-block">
                    {profile?.currency || config?.currency || '$'}{config?.proPriceYearly || (profile?.currency === '₹' ? '999' : '123')}
                    <span className="text-sm text-white/40 font-normal">/yr</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleUpgrade('yearly')}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all"
              >
                Upgrade Now
              </button>
            </div>
          </div>

          {/* Admin Simulation Button */}
          {profile?.isAdmin && (
            <div className="mt-6">
              <button 
                onClick={handleSimulatePayment}
                className="w-full bg-zinc-800 border border-dashed border-purple-500/50 hover:bg-zinc-700 text-purple-400 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Icons.ShieldCheck /> Simulate Payment (Admin Only)
              </button>
              <p className="text-[10px] text-white/20 text-center mt-2 uppercase tracking-widest">Temporary Simulation Mode</p>
            </div>
          )}
        </section>
      )}

      {/* Legal & Logout */}
      <section className="space-y-4">
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/privacy')}
            className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white transition-all"
          >
            <Icons.ShieldCheck /> Privacy
          </button>
          <button 
            onClick={() => navigate('/terms')}
            className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white transition-all"
          >
            <Icons.FileText /> Terms
          </button>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 text-xs text-white/40">
          <div className="flex-shrink-0"><Icons.AlertCircle /></div>
          <p>Strict No-Refund Policy except for verified double-charges.</p>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-4 hover:bg-red-500/10 rounded-2xl transition-all"
        >
          <Icons.LogOut /> Logout
        </button>

        <div className="pt-4 border-t border-white/5">
          <button 
            onClick={handleDeleteAccount}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-red-500/50 hover:text-red-500 text-xs font-bold py-4 hover:bg-red-500/5 rounded-2xl transition-all uppercase tracking-widest"
          >
            <Icons.AlertCircle /> Delete My Account
          </button>
        </div>
      </section>

      <footer className="mt-12 text-center text-white/20 text-xs">
        <p>© 2026 MySubs. All rights reserved.</p>
      </footer>
    </div>
  );
}
