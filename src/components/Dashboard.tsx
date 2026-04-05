import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, Timestamp, updateDoc } from '../firebase';
import { useAuth } from './AuthProvider';
import { Subscription } from '../types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import InstallPrompt from './InstallPrompt';

const POPULAR_SUBS = [
  { 
    name: 'Netflix', icon: '🎬', color: '#E50914',
    tiers: {
      '$': [
        { name: 'Standard with Ads', price: 7.99 },
        { name: 'Standard', price: 16.99 },
        { name: 'Premium', price: 24.99 }
      ],
      '₹': [
        { name: 'Mobile', price: 149 },
        { name: 'Basic', price: 199 },
        { name: 'Standard', price: 499 },
        { name: 'Premium', price: 649 }
      ]
    }
  },
  { 
    name: 'Spotify', icon: '🎵', color: '#1DB954',
    tiers: {
      '$': [
        { name: 'Individual', price: 11.99 },
        { name: 'Duo', price: 15.99 },
        { name: 'Family', price: 18.99 },
        { name: 'Student', price: 6.99 }
      ],
      '₹': [
        { name: 'Individual', price: 119 },
        { name: 'Duo', price: 149 },
        { name: 'Family', price: 179 },
        { name: 'Student', price: 59 }
      ]
    }
  },
  { 
    name: 'YouTube Premium', icon: '📺', color: '#FF0000',
    tiers: {
      '$': [
        { name: 'Individual', price: 14.99 },
        { name: 'Family', price: 24.99 },
        { name: 'Student', price: 8.99 }
      ],
      '₹': [
        { name: 'Individual', price: 129 },
        { name: 'Family', price: 189 },
        { name: 'Student', price: 79 }
      ]
    }
  },
  { 
    name: 'Amazon Prime', icon: '📦', color: '#00A8E1',
    tiers: {
      '$': [
        { name: 'Monthly', price: 15.99 },
        { name: 'Yearly', price: 149, billingCycle: 'yearly' }
      ],
      '₹': [
        { name: 'Monthly', price: 299 },
        { name: 'Yearly', price: 1499, billingCycle: 'yearly' }
      ]
    }
  },
  { 
    name: 'Disney+', icon: '🏰', color: '#113CCF',
    tiers: {
      '$': [
        { name: 'Basic (Ads)', price: 8.99 },
        { name: 'Premium', price: 15.99 },
        { name: 'Premium Yearly', price: 159.99, billingCycle: 'yearly' }
      ],
      '₹': [
        { name: 'Premium Monthly', price: 299 },
        { name: 'Super Yearly', price: 899, billingCycle: 'yearly' },
        { name: 'Premium Yearly', price: 1499, billingCycle: 'yearly' }
      ]
    }
  },
  { 
    name: 'ChatGPT Plus', icon: '🤖', color: '#10A37F',
    tiers: {
      '$': [
        { name: 'Plus', price: 22.00 }
      ],
      '₹': [
        { name: 'Plus', price: 1650 }
      ]
    }
  },
  { 
    name: 'Canva', icon: '🎨', color: '#00C4CC',
    tiers: {
      '$': [
        { name: 'Pro', price: 14.99 },
        { name: 'Teams', price: 16.99 }
      ],
      '₹': [
        { name: 'Pro', price: 499 },
        { name: 'Teams', price: 650 }
      ]
    }
  },
  { 
    name: 'Apple Music', icon: '🍎', color: '#FA243C',
    tiers: {
      '$': [
        { name: 'Individual', price: 11.99 },
        { name: 'Family', price: 18.99 },
        { name: 'Student', price: 6.99 }
      ],
      '₹': [
        { name: 'Individual', price: 99 },
        { name: 'Family', price: 149 },
        { name: 'Student', price: 59 }
      ]
    }
  },
];

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const CATEGORIES = ['Entertainment', 'Productivity', 'Utilities', 'Food', 'Health', 'Other'];
const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: '#A855F7', // Lilac
  Productivity: '#8B5CF6',
  Utilities: '#7C3AED',
  Food: '#6D28D9',
  Health: '#5B21B6',
  Other: '#4C1D95'
};

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
  MessageSquare: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
  ),
  Pause: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
  ),
  Play: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  PieChart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  Trophy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Refresh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
  )
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isReachUsOpen, setIsReachUsOpen] = useState(false);
  const [reachUsMessage, setReachUsMessage] = useState('');
  const [userMessages, setUserMessages] = useState<any[]>([]);
  const [newSub, setNewSub] = useState({ 
    name: '', 
    price: '', 
    billingCycle: 'monthly', 
    icon: '📦',
    category: 'Other' as any
  });
  const [activeTab, setActiveTab] = useState<'subs' | 'analytics' | 'timeline'>('subs');
  const [selectedPopular, setSelectedPopular] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'subscriptions'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      setSubs(subData);
    }, (error) => {
      console.error("Subscriptions listener error:", error);
      toast.error("Failed to load subscriptions");
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'messages'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Messages listener error:", error);
    });

    // Pro expiration check
    if (profile?.isPro && profile.proExpiryDate) {
      const expiry = profile.proExpiryDate.toDate();
      if (expiry < new Date()) {
        updateDoc(doc(db, 'users', user.uid), {
          isPro: false
        }).catch(err => console.error("Failed to expire Pro:", err));
      }
    }
    return () => unsubscribe();
  }, [user, profile]);

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
    
    if (!profile?.isPro && subs.length >= 2) {
      toast.error("Whoa there, high roller! 💸", {
        description: "You've hit the free limit of 2 subs. Upgrade to Pro to track your entire digital empire!"
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
        createdAt: Timestamp.now(),
        category: newSub.category,
        status: 'active',
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
      
      // Only count as savings and celebrate if the user kept the subscription for at least 3 days
      const createdAt = sub.createdAt?.toDate() || new Date(0); // Fallback for old subs
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 3) {
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
      } else {
        toast.success("Subscription removed.", {
          description: "No savings recorded for instant deletes! Keep it longer to see the magic. ✨"
        });
      }
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
    
    // Pro expiration notification
    if (profile?.isPro && profile.proExpiryDate) {
      const expiry = profile.proExpiryDate.toDate();
      const now = new Date();
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3 && diffDays > 0) {
        list.push({
          id: 'pro-expiring',
          title: 'Pro Expiring Soon',
          message: `Your Pro status expires in ${diffDays} day(s). Renew now to keep your benefits!`,
          type: 'warning'
        });
      }
    }

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

    // Admin replies
    userMessages.forEach(msg => {
      if (msg.status === 'replied' && msg.reply) {
        list.push({
          id: `reply-${msg.id}`,
          messageId: msg.id, // Store original message ID
          title: 'Admin Response',
          message: `Re: ${msg.content.substring(0, 20)}... - ${msg.reply}`,
          type: 'success'
        });
      }
    });

    return list;
  }, [subs, profile, userMessages]);

  // Sync App Icon Badge with notification count
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (notifications.length > 0) {
        navigator.setAppBadge(notifications.length).catch((error) => {
          console.error('Failed to set app badge:', error);
        });
      } else {
        navigator.clearAppBadge().catch((error) => {
          console.error('Failed to clear app badge:', error);
        });
      }
    }
  }, [notifications.length]);

  const handleReachUs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reachUsMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        uid: user.uid,
        email: user.email,
        content: reachUsMessage,
        sentAt: Timestamp.now(),
        status: 'unread'
      });
      setReachUsMessage('');
      setIsReachUsOpen(false);
      toast.success("Message sent to admin!");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        status: 'read'
      });
      toast.success("Marked as read");
    } catch (error) {
      toast.error("Failed to update message status");
    }
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset your savings stats? This will not affect your subscriptions.")) {
      localStorage.removeItem('mysubs_total_saved');
      setTotalSaved(0);
      toast.success("Stats reset to zero!");
    }
  };

  const handleTogglePause = async (sub: Subscription) => {
    try {
      const newStatus = sub.status === 'active' ? 'paused' : 'active';
      await updateDoc(doc(db, 'subscriptions', sub.id), {
        status: newStatus
      });
      toast.success(`Subscription ${newStatus === 'active' ? 'resumed' : 'paused'}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Price', 'Cycle', 'Category', 'Status', 'Next Renewal'];
    const rows = subs.map(s => [
      s.name,
      s.price,
      s.billingCycle,
      s.category,
      s.status,
      s.nextRenewal.toDate().toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "mysubs_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to CSV!");
  };

  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    subs.forEach(sub => {
      if (sub.status === 'paused') return;
      const monthlyPrice = sub.billingCycle === 'monthly' ? sub.price : sub.price / 12;
      data[sub.category] = (data[sub.category] || 0) + monthlyPrice;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [subs]);

  const timelineData = useMemo(() => {
    return [...subs]
      .filter(s => s.status === 'active')
      .sort((a, b) => a.nextRenewal.toMillis() - b.nextRenewal.toMillis());
  }, [subs]);

  const savingsGoal = 5000; // Example goal
  const savingsProgress = Math.min((totalSaved / savingsGoal) * 100, 100);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedPopular(null);
    setNewSub({ name: '', price: '', billingCycle: 'monthly', icon: '📦', category: 'Other' });
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
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
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
                          {n.messageId && (
                            <button 
                              onClick={() => handleMarkAsRead(n.messageId!)}
                              className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                              title="Mark as read"
                            >
                              <Icons.Check />
                            </button>
                          )}
                        </div>
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
              onClick={() => navigate('/admin')}
              className="p-2 md:p-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-purple-500"
              title="Admin Panel"
            >
              <Icons.MessageSquare />
            </button>
          )}
          <button 
            onClick={() => setIsReachUsOpen(true)}
            className="p-2 md:p-3 bg-purple-600/20 border border-purple-500/30 rounded-xl md:rounded-2xl hover:bg-purple-600/30 transition-all text-purple-400 flex items-center gap-2"
          >
            <Icons.MessageSquare />
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">Reach Us</span>
          </button>
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
          <button 
            onClick={handleResetData}
            className="absolute bottom-2 right-2 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/20 hover:text-white/60 transition-all"
            title="Reset Stats"
          >
            <Icons.Refresh />
          </button>
        </div>
      </div>

      {/* Savings Milestone */}
      <div className="mb-6 flex-shrink-0">
        <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="text-purple-400"><Icons.Trophy /></div>
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Savings Milestone</span>
            </div>
            <span className="text-xs font-bold text-purple-400">{Math.round(savingsProgress)}%</span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${savingsProgress}%` }}
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
            />
          </div>
          <p className="text-[10px] text-white/40 mt-2">
            Goal: {formatCurrency(savingsGoal, profile?.currency)} • Keep saving to unlock new badges!
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-shrink-0">
        {[
          { id: 'subs', label: 'Vault', icon: <Icons.Lock /> },
          { id: 'analytics', label: 'Insights', icon: <Icons.PieChart /> },
          { id: 'timeline', label: 'Timeline', icon: <Icons.Calendar /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all border",
              activeTab === tab.id 
                ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Subscription List Header */}
      <div className="mb-3 md:mb-4 flex items-center justify-between flex-shrink-0">
        <h3 className="text-base md:text-xl font-bold text-white">
          {activeTab === 'subs' ? 'Your Vault' : activeTab === 'analytics' ? 'Spending Insights' : 'Renewal Timeline'}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="p-2 md:p-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white/60"
            title="Export CSV"
          >
            <Icons.Download />
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white px-3 md:px-6 py-1.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <Icons.Plus /> <span className="hidden sm:inline">Add New</span>
          </button>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
        {activeTab === 'subs' && (
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
                    isRenewalSoon(sub.nextRenewal.toDate()) && sub.status === 'active' && "border-red-500/30 ring-1 ring-red-500/20",
                    sub.status === 'paused' && "opacity-50 grayscale"
                  )}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5 flex items-center justify-center text-xl md:text-2xl">
                      {sub.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs md:text-base font-bold text-white truncate max-w-[100px] sm:max-w-none">{sub.name}</h4>
                        {sub.status === 'paused' && (
                          <span className="text-[8px] font-bold uppercase bg-white/10 text-white/40 px-1.5 py-0.5 rounded">Paused</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-white/40 text-[9px] md:text-xs">
                          {sub.nextRenewal.toDate().toLocaleDateString()}
                        </p>
                        <span className="text-[8px] text-purple-400 font-bold uppercase tracking-widest">{sub.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="text-right mr-2">
                      <p className="text-sm md:text-lg font-bold text-white">{formatCurrency(sub.price, profile?.currency)}</p>
                      <p className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-widest">{sub.billingCycle}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleTogglePause(sub)}
                        className="p-1.5 md:p-2 text-white/20 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all"
                        title={sub.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {sub.status === 'active' ? <Icons.Pause /> : <Icons.Play />}
                      </button>
                      <button 
                        onClick={() => handleDeleteSub(sub)}
                        className="p-1.5 md:p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Icons.Trash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl h-[300px]">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Category Breakdown</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#7C3AED'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl h-[300px]">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Monthly Impact</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="value" fill="#A855F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {timelineData.length === 0 ? (
              <div className="text-center py-12 text-white/20">No active renewals found.</div>
            ) : (
              timelineData.map((sub, index) => {
                const now = new Date();
                const diffTime = sub.nextRenewal.toDate().getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={sub.id} className="relative pl-8 pb-4 border-l border-white/10 last:border-0">
                    <div className={cn(
                      "absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full",
                      diffDays <= 3 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : 
                      diffDays <= 7 ? "bg-yellow-500" : "bg-purple-500"
                    )} />
                    <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                          {diffDays === 0 ? 'Renewing Today' : diffDays === 1 ? 'Renewing Tomorrow' : `In ${diffDays} days`}
                        </p>
                        <h4 className="text-sm font-bold text-white">{sub.name}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{formatCurrency(sub.price, profile?.currency)}</p>
                        <p className="text-[10px] text-white/40">{sub.nextRenewal.toDate().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Reach Us Modal */}
      {isReachUsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div 
            onClick={() => setIsReachUsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md p-8 rounded-[40px] relative z-10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Reach Us</h2>
              <button onClick={() => setIsReachUsOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60">
                <Icons.X />
              </button>
            </div>
            <p className="text-white/40 text-sm mb-6">Have a question or request? Send us a message and we'll get back to you.</p>
            <form onSubmit={handleReachUs}>
              <textarea 
                required
                value={reachUsMessage}
                onChange={(e) => setReachUsMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[150px] mb-6 resize-none"
              />
              <button 
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Icons.Send /> Send Message
              </button>
            </form>
          </div>
        </div>
      )}

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
                        const currency = profile?.currency || '$';
                        const tiers = (s.tiers as any)[currency] || (s.tiers as any)['$'];
                        setSelectedPopular(s);
                        setNewSub({ 
                          ...newSub, 
                          name: s.name, 
                          icon: s.icon,
                          price: tiers[0].price.toString(),
                          billingCycle: tiers[0].billingCycle || 'monthly'
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
                    {((selectedPopular.tiers as any)[profile?.currency || '$'] || (selectedPopular.tiers as any)['$']).map((tier: any) => (
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

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Category</label>
                  <select
                    value={newSub.category}
                    onChange={(e) => setNewSub({ ...newSub, category: e.target.value as any })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Billing Cycle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['monthly', 'yearly'].map((cycle) => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setNewSub({ ...newSub, billingCycle: cycle })}
                        className={cn(
                          "py-3 rounded-xl font-bold capitalize transition-all text-xs",
                          newSub.billingCycle === cycle ? "bg-purple-600 text-white" : "bg-white/5 text-white/40 border border-white/10"
                        )}
                      >
                        {cycle}
                      </button>
                    ))}
                  </div>
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

      <InstallPrompt />
    </div>
  );
}
