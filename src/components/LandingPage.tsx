import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { motion } from 'motion/react';
import { AuthForm } from './AuthScreen';

const Icons = {
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  Bell: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  )
};

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden selection:bg-purple-500/30">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full -z-10" />

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between relative z-10">
        <div className="text-2xl font-bold tracking-tighter">
          My<span className="text-purple-500">Subs</span>
        </div>
        <div className="flex items-center gap-6">
          {user ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all active:scale-95"
            >
              Go to Dashboard
            </button>
          ) : (
            <button 
              onClick={() => navigate('/auth')}
              className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all active:scale-95"
            >
              Get Started
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-8">
                The Ultimate Subscription Manager
              </span>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                Stop losing money on <span className="text-purple-500">forgotten</span> bills.
              </h1>
              <p className="text-xl md:text-2xl text-white/40 mb-12 max-w-2xl leading-relaxed">
                Track anything you want, we will remind you to save you. Take control of your digital life in seconds.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={() => {
                    const el = document.getElementById('auth-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-purple-500/20 active:scale-95"
                >
                  Start Saving Now <Icons.ChevronRight />
                </button>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            id="auth-section"
            className="relative flex justify-center"
          >
            <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full" />
            <div className="relative w-full max-w-md">
              <AuthForm />
            </div>
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-32 relative group"
        >
          <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full group-hover:bg-purple-500/30 transition-all duration-700" />
          <div className="relative bg-zinc-900 border border-white/10 rounded-[40px] p-4 md:p-8 shadow-2xl overflow-hidden aspect-video md:aspect-[21/9]">
            <div className="w-full h-full bg-black/40 rounded-[24px] border border-white/5 flex items-center justify-center">
               <div className="text-center">
                  <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                    <Icons.Zap />
                  </div>
                  <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Interactive Dashboard Preview</p>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <div id="features" className="mt-48 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 border border-white/10 p-10 rounded-[40px] hover:border-purple-500/50 transition-all group">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-8 group-hover:scale-110 transition-transform">
              <Icons.Shield />
            </div>
            <h3 className="text-2xl font-bold mb-4">Secure Vault</h3>
            <p className="text-white/40 leading-relaxed">
              Your subscriptions are locked behind a secure 4-digit PIN. Only you have access to your financial data.
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-white/10 p-10 rounded-[40px] hover:border-purple-500/50 transition-all group">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform">
              <Icons.Bell />
            </div>
            <h3 className="text-2xl font-bold mb-4">Smart Reminders</h3>
            <p className="text-white/40 leading-relaxed">
              Never miss a renewal again. We'll alert you 7 days before any subscription hits your bank account.
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-white/10 p-10 rounded-[40px] hover:border-purple-500/50 transition-all group">
            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-8 group-hover:scale-110 transition-transform">
              <Icons.Zap />
            </div>
            <h3 className="text-2xl font-bold mb-4">Instant Savings</h3>
            <p className="text-white/40 leading-relaxed">
              Identify unused services and cancel them instantly. Our users save an average of ₹1,200/month.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-white/20 text-sm">
        <p>© 2026 MySubs. Built for those who value their money.</p>
      </footer>
    </div>
  );
}
