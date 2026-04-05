import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, Timestamp } from '../firebase';
import { Message, Config, PricingConfig } from '../types';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Icons = {
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  ),
  MessageSquare: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )
};

export default function AdminPanel() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'replied'>('all');
  const [activeTab, setActiveTab] = useState<'messages' | 'pricing'>('messages');
  const [pricingConfig, setPricingConfig] = useState<Config | null>(null);
  const [editingPricing, setEditingPricing] = useState<{
    currency: string;
    monthly: string;
    yearly: string;
    monthlyOld: string;
    yearlyOld: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile?.isAdmin) {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'messages'), orderBy('sentAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setLoading(false);
    });

    const unsubConfig = onSnapshot(doc(db, 'config', 'pricing'), (snap) => {
      if (snap.exists()) {
        setPricingConfig({ id: snap.id, ...snap.data() } as Config);
      }
    });

    return () => {
      unsub();
      unsubConfig();
    };
  }, [profile, navigate]);

  const handleUpdatePricing = async () => {
    if (!editingPricing) return;

    try {
      const currentPricing = pricingConfig?.pricing || {};
      const updatedPricing = {
        ...currentPricing,
        [editingPricing.currency]: {
          monthly: parseFloat(editingPricing.monthly) || 0,
          yearly: parseFloat(editingPricing.yearly) || 0,
          monthlyOld: editingPricing.monthlyOld ? parseFloat(editingPricing.monthlyOld) : undefined,
          yearlyOld: editingPricing.yearlyOld ? parseFloat(editingPricing.yearlyOld) : undefined,
        }
      };

      await setDoc(doc(db, 'config', 'pricing'), {
        pricing: updatedPricing
      }, { merge: true });

      toast.success(`Pricing updated for ${editingPricing.currency}!`);
      setEditingPricing(null);
    } catch (error) {
      console.error("Pricing update error:", error);
      toast.error("Failed to update pricing");
    }
  };

  const handleSendReply = async () => {
    if (!replyingTo || !replyContent.trim()) return;

    try {
      await updateDoc(doc(db, 'messages', replyingTo.id), {
        reply: replyContent,
        status: 'replied',
        repliedAt: Timestamp.now()
      });
      toast.success("Reply sent!");
      setReplyingTo(null);
      setReplyContent('');
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread') return m.status === 'unread';
    if (filter === 'replied') return m.status === 'replied';
    return true;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-bg text-white">Loading Admin Panel...</div>;

  return (
    <div className="min-h-screen bg-bg text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/5 rounded-full text-white/60 transition-all"
            >
              <Icons.ChevronLeft />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Panel</h1>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('messages')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'messages' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-white/40 hover:text-white"
              )}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'pricing' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-white/40 hover:text-white"
              )}
            >
              Pricing
            </button>
          </div>
        </header>

        {activeTab === 'messages' ? (
          <>
            <div className="flex justify-end mb-6">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                {(['all', 'unread', 'replied'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                      filter === f ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-white/40 hover:text-white"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {filteredMessages.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-white/5 border border-white/10 rounded-[32px]"
                  >
                    <p className="text-white/20 font-medium">No messages found</p>
                  </motion.div>
                ) : (
                  filteredMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "p-6 bg-white/5 border rounded-[32px] transition-all",
                        msg.status === 'unread' ? "border-purple-500/30 bg-purple-500/5" : "border-white/10"
                      )}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-bold text-white">{msg.email}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/10 rounded-full text-white/40">
                              {msg.sentAt.toDate().toLocaleDateString()}
                            </span>
                            {msg.status === 'unread' && (
                              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-white/80 leading-relaxed mb-4">{msg.content}</p>
                          
                          {msg.reply && (
                            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-1">Your Reply</p>
                              <p className="text-white/60 text-sm">{msg.reply}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-shrink-0 gap-2">
                          {msg.status !== 'replied' ? (
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-all active:scale-95"
                            >
                              <Icons.MessageSquare /> Reply
                            </button>
                          ) : (
                            <div className="px-6 py-3 bg-white/5 border border-white/10 text-white/40 text-xs font-bold rounded-2xl flex items-center gap-2">
                              <Icons.CheckCircle /> Replied
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {['INR', 'USD'].map((curr) => {
              const pricing = pricingConfig?.pricing?.[curr];
              return (
                <div key={curr} className="bg-zinc-900/50 border border-white/10 p-8 rounded-[40px] shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-500">
                        {curr === 'INR' ? '₹' : '$'}
                      </span>
                      {curr} Pricing
                    </h3>
                    <button 
                      onClick={() => setEditingPricing({
                        currency: curr,
                        monthly: pricing?.monthly?.toString() || '',
                        yearly: pricing?.yearly?.toString() || '',
                        monthlyOld: pricing?.monthlyOld?.toString() || '',
                        yearlyOld: pricing?.yearlyOld?.toString() || '',
                      })}
                      className="text-xs font-bold uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-white/40 text-sm">Monthly</span>
                      <span className="text-white font-bold">{curr === 'INR' ? '₹' : '$'}{pricing?.monthly || '-'}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-white/40 text-sm">Yearly</span>
                      <span className="text-white font-bold">{curr === 'INR' ? '₹' : '$'}{pricing?.yearly || '-'}</span>
                    </div>
                    {pricing?.monthlyOld && (
                      <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50">
                        <span className="text-white/40 text-sm">Old Monthly</span>
                        <span className="text-white font-bold line-through">{curr === 'INR' ? '₹' : '$'}{pricing.monthlyOld}</span>
                      </div>
                    )}
                    {pricing?.yearlyOld && (
                      <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50">
                        <span className="text-white/40 text-sm">Old Yearly</span>
                        <span className="text-white font-bold line-through">{curr === 'INR' ? '₹' : '$'}{pricing.yearlyOld}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pricing Edit Modal */}
      <AnimatePresence>
        {editingPricing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPricing(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-lg p-8 rounded-[40px] relative z-10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Edit {editingPricing.currency} Pricing</h2>
              <p className="text-white/40 text-sm mb-8">Update the subscription costs for this currency.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Monthly Price</label>
                  <input 
                    type="number"
                    value={editingPricing.monthly}
                    onChange={(e) => setEditingPricing({...editingPricing, monthly: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Yearly Price</label>
                  <input 
                    type="number"
                    value={editingPricing.yearly}
                    onChange={(e) => setEditingPricing({...editingPricing, yearly: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Old Monthly (Optional)</label>
                  <input 
                    type="number"
                    value={editingPricing.monthlyOld}
                    onChange={(e) => setEditingPricing({...editingPricing, monthlyOld: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Old Yearly (Optional)</label>
                  <input 
                    type="number"
                    value={editingPricing.yearlyOld}
                    onChange={(e) => setEditingPricing({...editingPricing, yearlyOld: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingPricing(null)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdatePricing}
                  className="flex-[2] bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reply Modal */}
      <AnimatePresence>
        {replyingTo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReplyingTo(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-lg p-8 rounded-[40px] relative z-10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Reply to Message</h2>
              <p className="text-white/40 text-sm mb-6">Replying to: {replyingTo.email}</p>
              
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-6">
                <p className="text-xs text-white/40 mb-1 uppercase font-bold tracking-widest">Original Message</p>
                <p className="text-white/80 text-sm italic">"{replyingTo.content}"</p>
              </div>

              <textarea
                autoFocus
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply here..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[150px] mb-6 resize-none"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendReply}
                  disabled={!replyContent.trim()}
                  className="flex-[2] bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Icons.Send /> Send Reply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
