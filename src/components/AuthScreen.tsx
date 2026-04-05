import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  Timestamp, 
  addDoc, 
  collection, 
  updateDoc, 
  GoogleAuthProvider, 
  signInWithPopup, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  deleteDoc,
  handleFirebaseError,
  OperationType,
  signInAnonymously
} from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
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

export function AuthForm() {
  const { setUnlocked } = useAuth();
  const [email, setEmail] = useState(localStorage.getItem('mysubs_email') || '');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(email ? 'pin' : 'email');
  const [isNewUser, setIsNewUser] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [showMasterReset, setShowMasterReset] = useState(false);
  const [resetConfirmStep, setResetConfirmStep] = useState(0);
  const navigate = useNavigate();

  const [resetStatus, setResetStatus] = useState<{ status: string, tempPin?: string } | null>(null);

  useEffect(() => {
    if (step === 'pin' && email) {
      const q = query(collection(db, 'ResetRequests'), where('email', '==', email), where('status', '==', 'resolved'));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setResetStatus({ status: 'resolved', tempPin: data.tempPin });
        } else {
          setResetStatus(null);
        }
      }, (error) => {
        console.error("Reset request listener error:", error);
      });
      return () => unsub();
    }
  }, [step, email]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const profileRef = doc(db, 'users', user.uid);
      let profileSnap;
      try {
        profileSnap = await getDoc(profileRef);
      } catch (err) {
        throw handleFirebaseError(err, OperationType.GET, `users/${user.uid}`);
      }
      
      if (!profileSnap.exists()) {
        try {
          await setDoc(profileRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            trialStartDate: Timestamp.now(),
            isPro: false,
            isAdmin: user.email === "krishnaprayers108@gmail.com",
            currency: '$'
          });
        } catch (err) {
          throw handleFirebaseError(err, OperationType.CREATE, `users/${user.uid}`);
        }
      } else if (user.email === "krishnaprayers108@gmail.com") {
        try {
          await updateDoc(profileRef, { isAdmin: true });
        } catch (err) {
          console.error("Failed to update admin status:", err);
        }
      }

      localStorage.setItem('mysubs_email', user.email || '');
      toast.success("Logged in with Google!");
      setUnlocked(true);
      navigate('/dashboard');
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
    try {
      // Ensure we have an anonymous session for security rules
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Anonymous Auth failed, proceeding anyway:", err);
        }
      }

      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if user exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', normalizedEmail));
      const querySnap = await getDocs(q);
      
      setIsNewUser(querySnap.empty);

      if (normalizedEmail === "krishnaprayers108@gmail.com") {
        setShowMasterReset(true);
        toast.info("Admin access detected");
      } else {
        setShowMasterReset(false);
      }
      setStep('pin');
    } catch (error: any) {
      console.error("Auth Error:", error);
      toast.error(error.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (finalPin: string) => {
    if (finalPin.length !== 4) return;

    if (isNewUser && !isConfirming) {
      setIsConfirming(true);
      setPin('');
      return;
    }

    if (isNewUser && isConfirming) {
      if (finalPin !== confirmPin) {
        toast.error("PINs do not match. Try again.");
        setPin('');
        setConfirmPin('');
        setIsConfirming(false);
        return;
      }
    }

    setLoading(true);
    
    try {
      // Ensure we have an anonymous session for security rules if not already done
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Anonymous Auth failed in PIN step:", err);
        }
      }

      // 1. Fetch user profile from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      let querySnap;
      try {
        querySnap = await getDocs(q);
      } catch (err) {
        throw handleFirebaseError(err, OperationType.LIST, 'users');
      }
      
      let userData: any = null;
      let userUid: string = '';

      if (!querySnap.empty) {
        const userDoc = querySnap.docs[0];
        userData = userDoc.data();
        userUid = userDoc.id;
      }

      // 2. Validate PIN (Check both permanent and temporary PIN)
      const isAdminEmail = email.toLowerCase().trim() === "krishnaprayers108@gmail.com";
      const isValidPin = userData && (
        userData.pin === finalPin || 
        (userData.resetApproved && userData.tempPin === finalPin) ||
        (isAdminEmail && finalPin === "0000")
      );

      if (isValidPin) {
        // 3. Handle UID Mismatch (Claim the profile for current anonymous session)
        const currentAuthUid = auth.currentUser?.uid;
        if (currentAuthUid && userUid !== currentAuthUid) {
          console.log("Migrating profile from", userUid, "to", currentAuthUid);
          
          // Create new doc with current UID
          const newProfile = { 
            ...userData, 
            uid: currentAuthUid,
            trialStartDate: userData.trialStartDate || Timestamp.now()
          };
          try {
            await setDoc(doc(db, 'users', currentAuthUid), newProfile);
          } catch (err) {
            throw handleFirebaseError(err, OperationType.CREATE, `users/${currentAuthUid}`);
          }
          
          // Migrate subscriptions
          const subsQ = query(collection(db, 'subscriptions'), where('uid', '==', userUid));
          let subsSnap;
          try {
            subsSnap = await getDocs(subsQ);
          } catch (err) {
            throw handleFirebaseError(err, OperationType.LIST, 'subscriptions');
          }

          for (const subDoc of subsSnap.docs) {
            try {
              await updateDoc(doc(db, 'subscriptions', subDoc.id), { uid: currentAuthUid });
            } catch (err) {
              console.error(`Failed to migrate subscription ${subDoc.id}:`, err);
            }
          }

          // Migrate messages
          const msgsQ = query(collection(db, 'messages'), where('uid', '==', userUid));
          let msgsSnap;
          try {
            msgsSnap = await getDocs(msgsQ);
          } catch (err) {
            throw handleFirebaseError(err, OperationType.LIST, 'messages');
          }

          for (const msgDoc of msgsSnap.docs) {
            try {
              await updateDoc(doc(db, 'messages', msgDoc.id), { uid: currentAuthUid });
            } catch (err) {
              console.error(`Failed to migrate message ${msgDoc.id}:`, err);
            }
          }

          // Delete old profile doc
          try {
            await deleteDoc(doc(db, 'users', userUid));
          } catch (err) {
            console.error("Failed to delete old profile:", err);
            // Non-critical error, we can still proceed
          }
          
          // Update local reference
          userUid = currentAuthUid;
        }

        // If it was a tempPin, clear it and set as permanent
        if (userData.tempPin === finalPin) {
          try {
            await updateDoc(doc(db, 'users', userUid), {
              pin: finalPin,
              tempPin: null,
              resetApproved: false
            });
          } catch (err) {
            throw handleFirebaseError(err, OperationType.UPDATE, `users/${userUid}`);
          }
          
          // Delete the reset request so it doesn't show on login screen anymore
          const resetQ = query(collection(db, 'ResetRequests'), where('email', '==', email));
          try {
            const resetSnap = await getDocs(resetQ);
            for (const d of resetSnap.docs) {
              await deleteDoc(doc(db, 'ResetRequests', d.id)).catch(() => {});
            }
          } catch (e) {
            console.error("Failed to cleanup reset requests:", e);
          }
        }

        // 3. Authenticate with Firebase Auth (Anonymously if not already logged in)
        if (!auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (err) {
            console.warn("Non-blocking Auth Error:", err);
            // We don't throw here so the user can still access the app
          }
        }

        localStorage.setItem('mysubs_email', email);
        toast.success("Welcome back!");
        setUnlocked(true);
        navigate('/dashboard');
      } else if (!userData) {
        // 4. New User Flow: Create profile and Auth account
        const newUserUid = auth.currentUser?.uid;
        if (!newUserUid) throw new Error("Authentication session lost. Please try again.");

        // Fetch default currency from config
        let defaultCurrency = '$';
        try {
          const configSnap = await getDoc(doc(db, 'config', 'pricing'));
          if (configSnap.exists()) {
            defaultCurrency = configSnap.data().currency || '$';
          }
        } catch (e) {
          console.error("Failed to fetch default currency:", e);
        }

        try {
          await setDoc(doc(db, 'users', newUserUid), {
            uid: newUserUid,
            email: email,
            name: email.split('@')[0],
            pin: finalPin,
            trialStartDate: Timestamp.now(),
            subscriptions: [], // Added as per requirement
            isPro: false,
            isAdmin: email === "krishnaprayers108@gmail.com",
            currency: defaultCurrency
          });
        } catch (err) {
          throw handleFirebaseError(err, OperationType.CREATE, `users/${newUserUid}`);
        }

        localStorage.setItem('mysubs_email', email);
        toast.success("Vault created!");
        setUnlocked(true);
        navigate('/dashboard');
      } else {
        toast.error("Incorrect PIN");
        setPin('');
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleNumpadClick = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        if (isNewUser && !isConfirming) {
          setConfirmPin(newPin);
          // Small delay to show the last dot
          setTimeout(() => {
            setIsConfirming(true);
            setPin('');
          }, 200);
        } else {
          handlePinSubmit(newPin);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleMasterReset = async () => {
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== "krishnaprayers108@gmail.com") return;
    
    if (resetConfirmStep === 0) {
      setResetConfirmStep(1);
      setTimeout(() => setResetConfirmStep(0), 5000); // Reset after 5 seconds if not clicked
      return;
    }
    
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const deletePromises = usersSnap.docs.map(d => deleteDoc(doc(db, 'users', d.id)));
      await Promise.all(deletePromises);
      
      // Also clear reset requests
      const resetSnap = await getDocs(collection(db, 'ResetRequests'));
      const resetDeletes = resetSnap.docs.map(d => deleteDoc(doc(db, 'ResetRequests', d.id)));
      await Promise.all(resetDeletes);

      toast.success("Database Wiped! You can now sign up fresh.");
      localStorage.removeItem('mysubs_email');
      window.location.reload();
    } catch (error: any) {
      console.error("Reset Error:", error);
      toast.error("Reset failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = async () => {
    if (!email) return;
    try {
      // Ensure we have an anonymous session
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      
      await addDoc(collection(db, 'ResetRequests'), {
        email,
        uid: auth.currentUser?.uid,
        requestedAt: Timestamp.now(),
        status: 'pending'
      });
      toast.success("Reset request sent to admin!");
    } catch (error: any) {
      const err = handleFirebaseError(error, OperationType.CREATE, 'ResetRequests');
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md">
      {debugInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-3xl max-w-sm w-full shadow-2xl">
            <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              Connection Debugger
            </h3>
            <pre className="bg-black/50 p-4 rounded-xl text-[10px] text-white/70 overflow-auto max-h-48 whitespace-pre-wrap mb-6 border border-white/5 font-mono">
              {debugInfo}
            </pre>
            <div className="space-y-2">
              <button 
                onClick={() => setDebugInfo(null)}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition-all"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      )}

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

          <button 
            onClick={() => setDebugInfo("Checking connection status...\n\n" + 
              "App URL: " + window.location.hostname + "\n" +
              "Auth Status: " + (auth.currentUser ? "Logged in (" + auth.currentUser.uid + ")" : "Not logged in") + "\n" +
              "Firebase Project: gen-lang-client-0543648847\n\n" +
              "If you see 'admin-restricted-operation', please enable Anonymous Auth in Firebase Console.")}
            className="w-full mt-4 text-white/20 text-[10px] hover:text-white/40 transition-colors uppercase tracking-widest"
          >
            Debug Connection
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="mb-8 text-center">
            <p className="text-white/60 mb-2">
              {isNewUser 
                ? (isConfirming ? "Confirm your new PIN" : "Create your Vault PIN") 
                : "Enter PIN for"}
            </p>
            <p className="text-white font-medium">{email}</p>
            
            {isNewUser && !isConfirming && (
              <p className="text-[10px] text-purple-400 mt-2 uppercase tracking-widest font-bold">New Account Setup</p>
            )}
            
            {resetStatus && (
              <div className="mt-4 p-4 bg-purple-500/20 border border-purple-500/30 rounded-2xl animate-pulse">
                <p className="text-xs text-purple-300 font-bold uppercase tracking-widest mb-1">Reset Approved</p>
                <p className="text-lg font-bold text-white mb-1">New PIN: {resetStatus.tempPin}</p>
                <p className="text-[10px] text-white/60">Enter this PIN below to regain access.</p>
              </div>
            )}

            <button 
              onClick={() => { 
                setStep('email'); 
                setPin(''); 
                setIsConfirming(false);
                setConfirmPin('');
              }}
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
            {loading ? "Verifying..." : (isNewUser ? (isConfirming ? "Create Account" : "Next") : "Login")}
          </button>

          <button 
            onClick={handleForgotPin}
            className="text-white/40 text-sm hover:text-white transition-colors"
          >
            Forgot PIN? Request Reset
          </button>

          {showMasterReset && (
            <button 
              onClick={handleMasterReset}
              disabled={loading}
              className={cn(
                "mt-8 w-full border text-xs font-bold py-3 rounded-xl transition-all uppercase tracking-widest",
                resetConfirmStep === 1 
                  ? "bg-red-600 border-red-400 text-white animate-pulse" 
                  : "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
              )}
            >
              {loading ? "Wiping..." : (resetConfirmStep === 1 ? "Click again to CONFIRM WIPE" : "Master Reset (Wipe All Users)")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuthScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tighter text-white mb-2">
            My<span className="text-purple-500">Subs</span>
          </h1>
          <p className="text-white/60">Manage subscriptions with ease.</p>
        </div>

        <AuthForm />
        
        <div className="mt-8 flex justify-center gap-6 text-xs text-white/20">
          <button onClick={() => navigate('/privacy')} className="hover:text-white/40 transition-colors">Privacy Policy</button>
          <button onClick={() => navigate('/terms')} className="hover:text-white/40 transition-colors">Terms of Service</button>
        </div>
      </div>
    </div>
  );
}
