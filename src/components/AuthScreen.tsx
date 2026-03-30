import React, { useState, useEffect } from 'react';
import { auth, db, doc, setDoc, getDoc, Timestamp, addDoc, collection, updateDoc, GoogleAuthProvider, signInWithPopup } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
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

export default function AuthScreen() {
  const [email, setEmail] = useState(localStorage.getItem('mysubs_email') || '');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(email ? 'pin' : 'email');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          trialStartDate: Timestamp.now(),
          isPro: false,
          isAdmin: user.email === "krishnaprayers108@gmail.com",
          currency: '$'
        });
      } else if (user.email === "krishnaprayers108@gmail.com") {
        await updateDoc(profileRef, { isAdmin: true }).catch(() => {});
      }

      localStorage.setItem('mysubs_email', user.email || '');
      toast.success("Logged in with Google!");
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Google Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailNext = async () => {
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    setStep('pin');
    setLoading(false);
  };

  const handlePinSubmit = async (finalPin: string) => {
    if (finalPin.length !== 4) return;
    setLoading(true);
    const password = finalPin + SECRET_SUFFIX;
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (email === "krishnaprayers108@gmail.com") {
        const profileRef = doc(db, 'users', user.uid);
        try {
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            if (!data.isAdmin) {
              await updateDoc(profileRef, { isAdmin: true }).catch(() => {});
            }
          } else {
            await setDoc(profileRef, {
              uid: user.uid,
              email: email,
              name: email.split('@')[0],
              trialStartDate: Timestamp.now(),
              isPro: false,
              isAdmin: true,
              currency: '$'
            });
          }
        } catch (err) {
          console.warn("Admin check failed:", err);
        }
      }

      localStorage.setItem('mysubs_email', email);
      toast.success("Welcome back!");
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: email,
            name: email.split('@')[0],
            trialStartDate: Timestamp.now(),
            isPro: false,
            isAdmin: email === "krishnaprayers108@gmail.com",
            currency: '$'
          });
          
          localStorage.setItem('mysubs_email', email);
          toast.success("Account created!");
          navigate('/');
        } catch (createError: any) {
          if (createError.code === 'auth/email-already-in-use') {
            toast.error("Incorrect PIN");
            setPin('');
          } else {
            toast.error(createError.message);
          }
        }
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNumpadClick = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        handlePinSubmit(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleForgotPin = async () => {
    if (!email) return;
    try {
      await addDoc(collection(db, 'ResetRequests'), {
        email,
        requestedAt: Timestamp.now()
      });
      toast.success("Reset request sent to admin!");
    } catch (error: any) {
      toast.error("Failed to send request");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tighter text-white mb-2">
            My<span className="text-purple-500">Subs</span>
          </h1>
          <p className="text-white/60">Manage subscriptions with ease.</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl shadow-2xl">
          {step === 'email' ? (
            <div className="space-y-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/60 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <Icons.Mail />
                  </div>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={handleEmailNext}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Checking..." : "Continue"}
                <Icons.ChevronRight />
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900 px-4 text-white/40">Or continue with</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/10 active:scale-95 disabled:opacity-50"
              >
                <Icons.Chrome />
                Google Login
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="mb-8 text-center">
                <p className="text-white/60 mb-2">Enter PIN for</p>
                <p className="text-white font-medium">{email}</p>
                <button 
                  onClick={() => { setStep('email'); setPin(''); }}
                  className="text-purple-500 text-xs mt-2 hover:underline"
                >
                  Change Email
                </button>
              </div>

              <div className="flex gap-4 mb-12">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 border-purple-500/50 transition-all duration-300",
                      pin.length > i ? "bg-purple-500 scale-125 shadow-[0_0_10px_rgba(168,85,247,0.8)]" : "bg-transparent"
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 md:gap-6 mb-8">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button 
                    key={num}
                    disabled={loading}
                    onClick={() => handleNumpadClick(num)}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xl md:text-2xl font-bold transition-all active:scale-90 disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button 
                  key="0"
                  disabled={loading}
                  onClick={() => handleNumpadClick('0')}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xl md:text-2xl font-bold transition-all active:scale-90 disabled:opacity-50"
                >
                  0
                </button>
                <button 
                  onClick={handleBackspace}
                  disabled={loading}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-transparent hover:bg-white/5 flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                >
                  <Icons.Delete />
                </button>
              </div>

              <button 
                onClick={() => handlePinSubmit(pin)}
                disabled={loading || pin.length !== 4}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl mb-8 shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                {loading ? "Verifying..." : "Login"}
              </button>

              <button 
                onClick={handleForgotPin}
                className="text-white/40 text-sm hover:text-white transition-colors"
              >
                Forgot PIN? Request Reset
              </button>
            </div>
          )}
        </div>
        <div className="mt-8 flex justify-center gap-6 text-xs text-white/20">
          <button onClick={() => navigate('/privacy')} className="hover:text-white/40 transition-colors">Privacy Policy</button>
          <button onClick={() => navigate('/terms')} className="hover:text-white/40 transition-colors">Terms of Service</button>
        </div>
      </div>
    </div>
  );
}
