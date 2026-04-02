import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, FirebaseUser, onAuthStateChanged, doc, onSnapshot, updateDoc, Timestamp } from '../firebase';
import { UserProfile } from '../types';

const ADMIN_EMAIL = "krishnaprayers108@gmail.com";

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isUnlocked: boolean;
  setUnlocked: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  isUnlocked: false,
  setUnlocked: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setUnlocked(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);

        // Auto-upgrade admin account to Pro until 2099
        if (user.email === ADMIN_EMAIL && (!data.isPro || !data.proExpiryDate)) {
          const proExpiryDate = new Date(2099, 11, 31); // Dec 31, 2099
          updateDoc(profileRef, {
            isPro: true,
            isAdmin: true,
            proExpiryDate: Timestamp.fromDate(proExpiryDate)
          }).catch(err => console.error("Admin auto-upgrade failed:", err));
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Profile subscription error:", error);
      setLoading(false);
    });

    return () => unsubProfile();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isUnlocked, setUnlocked }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
