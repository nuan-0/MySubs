import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, Timestamp, updateDoc } from '../firebase';
import { useAuth } from './AuthProvider';
import { Subscription } from '../types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const POPULAR_SUBS = [
  { 
    name: 'Netflix', icon: '🎬', color: '#E50914',
    tiers: [
      { name: 'Standard with Ads', price: 6.99 },
      { name: 'Standard', price: 15.49 },
      { name: 'Premium', price: 22.99 }
    ]
  },
  { 
    name: 'Spotify', icon: '🎵', color: '#1DB954',
    tiers: [
      { name: 'Individual', price: 10.99 },
      { name: 'Duo', price: 14.99 },
      { name: 'Family', price: 16.99 },
      { name: 'Student', price: 5.99 }
    ]
  },
  { 
    name: 'YouTube Premium', icon: '📺', color: '#FF0000',
    tiers: [
      { name: 'Individual', price: 13.99 },
      { name: 'Family', price: 22.99 },
      { name: 'Student', price: 7.99 }
    ]
  },
  { 
    name: 'Amazon Prime', icon: '📦', color: '#00A8E1',
    tiers: [
      { name: 'Monthly', price: 14.99 },
      { name: 'Yearly', price: 139, billingCycle: 'yearly' }
    ]
  },
  { 
    name: 'Disney+', icon: '🏰', color: '#113CCF',
    tiers: [
      { name: 'Basic (Ads)', price: 7.99 },
      { name: 'Premium', price: 13.99 },
      { name: 'Premium Yearly', price: 139.99, billingCycle: 'yearly' }
    ]
  },
  { 
    name: 'ChatGPT Plus', icon: '🤖', color: '#10A37F',
    tiers: [
      { name: 'Plus', price: 20.00 }
    ]
  },
  { 
    name: 'Canva', icon: '🎨', color: '#00C4CC',
    tiers: [
      { name: 'Pro', price: 12.99 },
      { name: 'Teams', price: 14.99 }
    ]
  },
  { 
    name: 'Apple Music', icon: '🍎', color: '#FA243C',
    tiers: [
      { name: 'Individual', price: 10.99 },
      { name: 'Family', price: 16.99 },
      { name: 'Student', price: 5.99 }
    ]
  },
];

const Icons = {
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  Trash2: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
  ),
  Bell: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  TrendingUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  ),
  PiggyBank: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1 .5-1.5 1-2V5z"/><path d="M7 11h.01"/><path d="M11 7h.01"/></svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  )
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', price: '', billingCycle: 'monthly', icon: '📦' });
  const [selectedPopular, setSelectedPopular] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'subscriptions'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      setSubs(subData);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('mysubs_total_saved') || '0';
    setTotalSaved(parseFloat(saved));
  }, []);

  const monthlySpend = useMemo(() => {
    return subs.reduce((acc, sub) => {
      const price = sub.price;
      return acc + (sub.billingCycle === 'monthly' ? price : price / 12);
    }, 0);
  }, [subs]);

  const handleAddSub = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.isPro && subs.length >= 5) {
      toast.error("Free limit reached!", {
        description: "Upgrade to Pro to add unlimited subscriptions."
      });
      closeAddModal();
      return;
    }

    try {
      const nextRenewal = new Date();
      if (newSub.billingCycle === 'monthly') {
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      } else {
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
      }

      await addDoc(collection(db, 'subscriptions'), {
        uid: user.uid,
        name: newSub.name,
        price: parseFloat(newSub.price),
        billingCycle: newSub.billingCycle,
        nextRenewal: Timestamp.fromDate(nextRenewal),
        icon: newSub.icon
      });

      closeAddModal();
      toast.success(`${newSub.name} added!`);
    } catch (error: any) {
      toast.error("Failed to add subscription");
    }
  };

  const handleDeleteSub = async (sub: Subscription) => {
    try {
      await deleteDoc(doc(db, 'subscriptions', sub.id));
      
      const currentSaved = parseFloat(localStorage.getItem('mysubs_total_saved') || '0');
      const newSaved = currentSaved + sub.price;
      localStorage.setItem('mysubs_total_saved', newSaved.toString());
      setTotalSaved(newSaved);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7C3AED', '#8B5CF6', '#FFFFFF']
      });
      
      toast.success("Cha-ching! Subscription removed.", {
        description: `You just saved ${formatCurrency(sub.price, profile?.currency)}!`
      });
    } catch (error: any) {
      toast.error("Failed to delete");
    }
  };

  const isRenewalSoon = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const notifications = useMemo(() => {
    const list = [];
    
    // Trial notification
    if (profile?.trialStartDate && !profile.isPro) {
      const trialStart = profile.trialStartDate.toDate();
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 2 && diffDays <= 3) {
        list.push({
          id: 'trial-expiring',
          title: 'Trial Expiring Soon',
          message: `Your 3-day trial ends in ${3 - diffDays} day(s). Upgrade to Pro!`,
          type: 'warning'
        });
      }
    }

    // Renewal notifications
    subs.forEach(sub => {
      if (isRenewalSoon(sub.nextRenewal.toDate())) {
        list.push({
          id: `renewal-${sub.id}`,
          title: 'Renewal Alert',
          message: `${sub.name} is renewing on ${sub.nextRenewal.toDate().toLocaleDateString()}.`,
          type: 'info'
        });
      }
    });

    // Pro suggestion
    if (!profile?.isPro && subs.length >= 3) {
      list.push({
        id: 'pro-suggestion',
        title: 'Upgrade to Pro',
        message: 'You are using 3+ subscriptions. Pro gives you unlimited slots!',
        type: 'success'
      });
    }

    return list;
  }, [subs, profile]);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedPopular(null);
    setNewSub({ name: '', price: '', billingCycle: 'monthly', icon: '📦' });
  };

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6 h-[100dvh] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 md:mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-white/40 text-xs md:text-sm truncate max-w-[150px] sm:max-w-none">Welcome back, {profile?.name || 'User'}</p>
        </div>
        <div className="flex gap-2 md:gap-4 relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={cn(
              "p-2 md:p-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all relative",
              isNotificationsOpen && "bg-white/10 border-purple-500/50"
            )}
          >
            <Icons.Bell />
            {notifications.length > 0 && (
              <div className="absolute top-2 right-2 md:top-3 md:right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Notifications Panel */}
          {isNotificationsOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsNotificationsOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-zinc-900 border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl z-50 p-4 md:p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-white text-sm md:text-base">Notifications</h4>
                  <span className="text-[9px] md:text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-bold uppercase tracking-widest">
                    {notifications.length} New
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-white/20 text-xs">
                      All caught up!
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 bg-white/5 border border-white/5 rounded-xl">
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest mb-1",
                          n.type === 'warning' ? "text-yellow-500" : 
                          n.type === 'success' ? "text-green-500" : "text-purple-500"
                        )}>
                          {n.title}
                        </p>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          <button 
            onClick={() => navigate('/profile')}
            className="p-1 md:p-1.5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 pr-3 md:pr-4"
          >
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500 overflow-hidden border border-purple-500/30"
            >
              {user?.uid ? (
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Icons.Settings />
              )}
            </motion.div>
            <span className="hidden sm:inline text-xs font-bold text-white/60">Settings</span>
          </button>
          {profile?.isAdmin && (
            <button 
              onClick={() => navigate('/admin-vault')}
              className="p-2 md:p-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-purple-500"
            >
              <Icons.Lock />
            </button>
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6 flex-shrink-0">
        <div className="bg-zinc-900/50 border border-white/10 p-3 md:p-6 rounded-2xl md:rounded-[32px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 md:p-4 opacity-10 group-hover:scale-110 transition-transform text-purple-500">
            <Icons.TrendingUp />
          </div>
          <p className="text-white/60 text-[9px] md:text-xs font-medium mb-0.5 uppercase tracking-widest">Monthly Spend</p>
          <h2 className="text-xl md:text-4xl font-bold tracking-tighter text-white">
            {formatCurrency(monthlySpend, profile?.currency)}
          </h2>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 p-3 md:p-6 rounded-2xl md:rounded-[32px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 md:p-4 opacity-10 group-hover:scale-110 transition-transform text-green-500">
            <Icons.PiggyBank />
          </div>
          <p className="text-white/60 text-[9px] md:text-xs font-medium mb-0.5 uppercase tracking-widest">Total Saved</p>
          <h2 className="text-xl md:text-4xl font-bold tracking-tighter text-green-400">
            {formatCurrency(totalSaved, profile?.currency)}
          </h2>
        </div>
      </div>

      {/* Subscription List Header */}
      <div className="mb-3 md:mb-4 flex items-center justify-between flex-shrink-0">
        <h3 className="text-base md:text-xl font-bold text-white">Subscriptions</h3>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-3 md:px-6 py-1.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
        >
          <Icons.Plus /> <span className="hidden sm:inline">Add New</span>
        </button>
      </div>

      {/* Subscription List - Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
        <div className="grid grid-cols-1 gap-3">
          {subs.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 border border-dashed border-white/10 rounded-2xl">
              <p className="text-white/40 text-sm">No subscriptions yet.</p>
            </div>
          ) : (
            subs.map((sub) => (
              <div
                key={sub.id}
                className={cn(
                  "bg-zinc-900/50 border border-white/10 p-3 md:p-5 rounded-2xl flex items-center justify-between group transition-all",
                  isRenewalSoon(sub.nextRenewal.toDate()) && "border-red-500/30 ring-1 ring-red-500/20"
                )}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5 flex items-center justify-center text-xl md:text-2xl">
                    {sub.icon}
                  </div>
                  <div>
                    <h4 className="text-xs md:text-base font-bold text-white truncate max-w-[100px] sm:max-w-none">{sub.name}</h4>
                    <p className="text-white/40 text-[9px] md:text-xs">
                      {sub.nextRenewal.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-8">
                  <div className="text-right">
                    <p className="text-sm md:text-lg font-bold text-white">{formatCurrency(sub.price, profile?.currency)}</p>
                    <p className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-widest">{sub.billingCycle}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteSub(sub)}
                    className="p-1.5 md:p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Icons.Trash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div 
            onClick={closeAddModal}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="bg-zinc-900 border border-white/10 w-full max-w-lg p-8 rounded-[40px] relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Add Subscription</h2>
              <button onClick={closeAddModal} className="p-2 hover:bg-white/10 rounded-full text-white/60">
                <Icons.X />
              </button>
            </div>

            <form onSubmit={handleAddSub}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/60 mb-2">Popular Services</label>
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                  {POPULAR_SUBS.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => {
                        setSelectedPopular(s);
                        setNewSub({ 
                          ...newSub, 
                          name: s.name, 
                          icon: s.icon,
                          price: s.tiers[0].price.toString(),
                          billingCycle: s.tiers[0].billingCycle || 'monthly'
                        });
                      }}
                      className={cn(
                        "flex-shrink-0 w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1 transition-all",
                        selectedPopular?.name === s.name ? "bg-purple-500/20 border-purple-500" : "hover:bg-white/10"
                      )}
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-[10px] font-bold uppercase truncate w-full px-1 text-center text-white">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPopular && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white/60 mb-2">Select Tier</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedPopular.tiers.map((tier: any) => (
                      <button
                        key={tier.name}
                        type="button"
                        onClick={() => setNewSub({ 
                          ...newSub, 
                          name: `${selectedPopular.name} ${tier.name}`,
                          price: tier.price.toString(),
                          billingCycle: tier.billingCycle || 'monthly'
                        })}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          newSub.name.includes(tier.name) && parseFloat(newSub.price) === tier.price
                            ? "bg-purple-500 border-purple-500 text-white" 
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                        )}
                      >
                        {tier.name} ({formatCurrency(tier.price, profile?.currency)})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Name</label>
                  <input 
                    type="text"
                    required
                    value={newSub.name}
                    onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Price ({profile?.currency || '$'})</label>
                  <input 
                    type="number"
                    required
                    step="0.01"
                    value={newSub.price}
                    onChange={(e) => setNewSub({ ...newSub, price: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-white/60 mb-2">Billing Cycle</label>
                <div className="grid grid-cols-2 gap-4">
                  {['monthly', 'yearly'].map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setNewSub({ ...newSub, billingCycle: cycle })}
                      className={cn(
                        "py-4 rounded-2xl font-bold capitalize transition-all",
                        newSub.billingCycle === cycle ? "bg-purple-600 text-white" : "bg-white/5 text-white/40 border border-white/10"
                      )}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-purple-500/20 transition-all active:scale-95"
              >
                Add Subscription
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
