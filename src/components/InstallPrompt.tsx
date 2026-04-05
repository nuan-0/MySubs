import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const Icons = {
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  Share: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  )
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed/running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
      // Always show if not standalone, as requested by user
      if (!isStandaloneMode) {
        setIsVisible(true);
      }
    };

    checkStandalone();

    // Detect iOS
    const detectIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    setIsIOS(detectIOS());

    // Listen for the native install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (isStandalone || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96"
      >
        <div className="bg-zinc-900 border border-purple-500/30 p-5 rounded-3xl shadow-2xl shadow-purple-500/20 backdrop-blur-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20 overflow-hidden p-2">
                <img src="/icon.svg" alt="MySubs" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-white">Install MySubs</h3>
                <p className="text-xs text-white/40 leading-tight">Add to home screen for the best experience</p>
              </div>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 text-white/20 hover:text-white transition-all"
            >
              <Icons.X />
            </button>
          </div>

          {isIOS ? (
            <div className="space-y-3">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <p className="text-[10px] text-white/60 mb-2 uppercase font-bold tracking-widest">How to install on iOS:</p>
                <ol className="text-xs text-white/80 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">1</span>
                    Tap the <span className="text-purple-400 inline-flex"><Icons.Share /></span> share button below
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">2</span>
                    Scroll down and tap <span className="text-purple-400 font-bold">"Add to Home Screen"</span>
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-600/20"
            >
              <Icons.Plus /> Install Now
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
