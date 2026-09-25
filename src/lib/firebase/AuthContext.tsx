'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  getFirebaseSDK, 
  FirebaseUser, 
  UserProfile, 
  UserTierCategory 
} from './firebase';

interface PredictionCheckResult {
  allowed: boolean;
  reason?: 'REGISTER_REQUIRED' | 'UPGRADE_REQUIRED';
  remaining: number;
  limit: number;
  current: number;
  message?: string;
  tier: UserTierCategory;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile;
  tierCategory: UserTierCategory;
  isInitialized: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<FirebaseUser>;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser>;
  signUpWithEmail: (email: string, pass: string, name: string, extra?: Record<string, any>) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  canPredict: () => PredictionCheckResult;
  recordPrediction: () => Promise<number>;
  activateVerifiedTier: (tierType: 'pro_vip' | 'pro_plus', paymentId: string) => Promise<void>;
  signInAsDemoCandidate: (tier?: 'free' | 'pro_plus' | 'pro_vip') => Promise<FirebaseUser>;
}

export function computeUserCategory(
  user: FirebaseUser | null,
  isPremium: boolean,
  tierType: string = 'free'
): UserTierCategory {
  const normTier = (tierType || 'free').toLowerCase();

  if (isPremium) {
    if (normTier === 'pro_vip' || normTier === 'season' || normTier === 'vip') {
      return {
        code: 'PRO_VIP',
        type: 'pro_vip',
        label: '👑 PRO VIP Member',
        tag: 'VIP 👑',
        icon: '👑',
        cls: 'tier-pro-vip',
        badgeColor: '#fbbf24',
        badgeBg: 'rgba(245, 158, 11, 0.18)',
        isGlowing: true,
        canAccessPredictor: true,
        canAccessWishlist: true,
        canAccessChoiceFiller: true,
        unlimited: true,
      };
    }

    if (normTier === 'pro_plus' || normTier === 'basic' || normTier === 'plus') {
      return {
        code: 'PRO_PLUS',
        type: 'pro_plus',
        label: '⚡ PRO Plus Member',
        tag: 'PRO ⚡',
        icon: '⚡',
        cls: 'tier-pro-plus',
        badgeColor: '#38bdf8',
        badgeBg: 'rgba(6, 182, 212, 0.18)',
        isGlowing: true,
        canAccessPredictor: true,
        canAccessWishlist: false,
        canAccessChoiceFiller: false,
        unlimited: true,
      };
    }
  }

  if (user) {
    return {
      code: 'REGISTERED_FREE',
      type: 'free',
      label: '👤 Free Member',
      tag: 'FREE',
      icon: '✓',
      cls: 'tier-free',
      badgeColor: '#059669',
      badgeBg: 'rgba(5, 150, 105, 0.1)',
      isGlowing: false,
      canAccessPredictor: true,
      canAccessWishlist: false,
      canAccessChoiceFiller: false,
      unlimited: false,
      freeLimit: 5,
    };
  }

  return {
    code: 'UNAUTHENTICATED_GUEST',
    type: 'guest',
    label: '👤 Guest Trial User',
    tag: 'GUEST',
    icon: '',
    cls: 'tier-free',
    badgeColor: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.08)',
    isGlowing: false,
    canAccessPredictor: false,
    canAccessWishlist: false,
    canAccessChoiceFiller: false,
    unlimited: false,
    freeLimit: 0,
  };
}

const defaultCategory = computeUserCategory(null, false, 'free');

const defaultProfile: UserProfile = {
  uid: null,
  displayName: 'Guest Student',
  email: null,
  emailVerified: false,
  photoURL: null,
  rank: '',
  score: '',
  category: 'Open',
  state: '',
  tierType: 'free',
  isPremium: false,
  paymentStatus: 'none',
  paymentId: '',
  predictionsCount: 0,
  categoryTier: defaultCategory,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: defaultProfile,
  tierCategory: defaultCategory,
  isInitialized: false,
  isLoading: false,
  signInWithGoogle: async () => { throw new Error('Not implemented'); },
  signInWithEmail: async () => { throw new Error('Not implemented'); },
  signUpWithEmail: async () => { throw new Error('Not implemented'); },
  signOut: async () => {},
  resetPassword: async () => {},
  updateProfileData: async () => {},
  canPredict: () => ({ allowed: true, remaining: 3, limit: 3, current: 0, tier: defaultCategory }),
  recordPrediction: async () => 0,
  activateVerifiedTier: async () => {},
  signInAsDemoCandidate: async () => { throw new Error('Not implemented'); },
});

// Human-friendly Firebase error message mapper
export function formatAuthError(err: any): string {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
    return 'Domain (neetcounsellor.online) is pending authorization in Firebase Console. Go to Firebase Console > Authentication > Settings > Authorized domains and add "neetcounsellor.online", or use the ⚡ Instant Demo Account button.';
  }
  if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
    return 'Google Sign-In popup was blocked by your browser. Please allow popups for neetcounsellor.online and retry.';
  }
  if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
    return 'Google Sign-In was cancelled (popup window closed).';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Incorrect email or password. Please verify your credentials or click "Forgot password?".';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email address is already registered. Please switch to the Sign In tab.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid candidate email address.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many unsuccessful login attempts. Please wait a few moments or reset your password.';
  }
  return msg || 'Authentication error. Please try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Instant 0ms Synchronous Boot from Cache
  const bootstrapFromCache = useCallback(() => {
    try {
      const cachedUserRaw = localStorage.getItem('neet_auth_user');
      const cachedProfRaw = localStorage.getItem('neet_auth_profile');
      const isPremRaw = localStorage.getItem('neet_user_is_premium') === 'true';
      const tierRaw = localStorage.getItem('neet_user_tier_type') || 'free';
      const countRaw = parseInt(localStorage.getItem('neet_predictions_count') || '0', 10);

      let cachedUser: FirebaseUser | null = null;
      let cachedProf: any = {};

      if (cachedUserRaw) {
        try { cachedUser = JSON.parse(cachedUserRaw); } catch(e){}
      }
      if (cachedProfRaw) {
        try { cachedProf = JSON.parse(cachedProfRaw); } catch(e){}
      }

      const isPremium = Boolean(isPremRaw || cachedProf.isPremium);
      const tierType = isPremium ? (tierRaw || cachedProf.tierType || 'pro_vip') : 'free';
      const cat = computeUserCategory(cachedUser, isPremium, tierType);

      if (cachedUser) {
        setUser(cachedUser);
        setProfile({
          uid: cachedUser.uid,
          displayName: cachedProf.displayName || cachedUser.displayName || (cachedUser.email ? cachedUser.email.split('@')[0] : 'Student'),
          email: cachedUser.email,
          emailVerified: cachedUser.emailVerified ?? false,
          photoURL: cachedUser.photoURL || null,
          rank: cachedProf.rank || localStorage.getItem('neet_user_rank') || '',
          score: cachedProf.score || localStorage.getItem('neet_user_score') || '',
          category: cachedProf.category || localStorage.getItem('neet_user_category') || 'Open',
          state: cachedProf.state || localStorage.getItem('neet_user_state') || '',
          tierType: tierType,
          isPremium: isPremium,
          paymentStatus: isPremium ? 'completed' : 'none',
          paymentId: cachedProf.paymentId || localStorage.getItem('neet_user_payment_id') || '',
          predictionsCount: countRaw,
          categoryTier: cat,
          createdAt: cachedProf.createdAt,
        });
      } else {
        setUser(null);
        setProfile({
          ...defaultProfile,
          predictionsCount: countRaw,
          categoryTier: cat,
        });
      }
    } catch (err) {
      console.warn('Error during auth cache bootstrap:', err);
    }
  }, []);

  // Sync profile document with Firestore
  const syncProfileFromFirestore = useCallback(async (firebaseUser: any, sdk: any) => {
    if (!firebaseUser || !sdk?.db || !sdk?.firestoreMod) return;

    try {
      const docRef = sdk.firestoreMod.doc(sdk.db, "users", firebaseUser.uid);
      const docSnap = await sdk.firestoreMod.getDoc(docRef);

      let data: any = {};
      if (docSnap.exists()) {
        data = docSnap.data();
      } else {
        const localProf = localStorage.getItem('neet_auth_profile');
        const p = localProf ? JSON.parse(localProf) : {};
        data = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || p.displayName || firebaseUser.email?.split('@')[0],
          email: firebaseUser.email,
          rank: p.rank || localStorage.getItem('neet_user_rank') || '',
          category: p.category || localStorage.getItem('neet_user_category') || 'Open',
          state: p.state || localStorage.getItem('neet_user_state') || '',
          isPremium: false,
          tierType: 'free',
          paymentStatus: 'none',
          predictionsCount: parseInt(localStorage.getItem('neet_predictions_count') || '0', 10),
          createdAt: sdk.firestoreMod.serverTimestamp(),
          lastLoginAt: sdk.firestoreMod.serverTimestamp(),
        };
        await sdk.firestoreMod.setDoc(docRef, data, { merge: true });
      }

      const hasVerifiedPayment = (data.isPremium === true) && (data.paymentStatus === 'completed' || data.paymentId);
      const tierType = hasVerifiedPayment ? (data.tierType || data.premiumTier || 'pro_vip') : 'free';
      const isPremium = Boolean(hasVerifiedPayment);

      const serverCount = parseInt(data.predictionsCount || '0', 10);
      const localCount = parseInt(localStorage.getItem('neet_predictions_count') || '0', 10);
      const finalCount = Math.max(serverCount, localCount);

      const minUser: FirebaseUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: data.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        photoURL: firebaseUser.photoURL || null,
        emailVerified: firebaseUser.emailVerified,
      };

      const tierCat = computeUserCategory(minUser, isPremium, tierType);

      const updatedProfile: UserProfile = {
        uid: minUser.uid,
        displayName: minUser.displayName || 'Candidate',
        email: minUser.email,
        emailVerified: minUser.emailVerified ?? false,
        photoURL: minUser.photoURL,
        rank: data.rank || localStorage.getItem('neet_user_rank') || '',
        score: data.score || localStorage.getItem('neet_user_score') || '',
        category: data.category || localStorage.getItem('neet_user_category') || 'Open',
        state: data.state || localStorage.getItem('neet_user_state') || '',
        tierType: tierType,
        isPremium: isPremium,
        paymentStatus: isPremium ? 'completed' : 'none',
        paymentId: data.paymentId || '',
        predictionsCount: finalCount,
        categoryTier: tierCat,
        createdAt: data.createdAt ? String(data.createdAt) : undefined,
      };

      setUser(minUser);
      setProfile(updatedProfile);

      localStorage.setItem('neet_auth_user', JSON.stringify(minUser));
      localStorage.setItem('neet_auth_profile', JSON.stringify(updatedProfile));
      localStorage.setItem('neet_user_is_premium', isPremium ? 'true' : 'false');
      localStorage.setItem('neet_user_tier_type', tierType);
      localStorage.setItem('neet_predictions_count', finalCount.toString());
    } catch (e) {
      console.warn('Firestore profile sync error:', e);
    }
  }, []);

  // Initialize Firebase Auth listener in background
  useEffect(() => {
    bootstrapFromCache();
    setIsInitialized(true);

    let unsubscribe: any = null;

    // 1. Directly bind to window.Auth from /js/firebase-config.js
    const winAuth = typeof window !== 'undefined' ? (window as any).Auth : null;
    if (winAuth && typeof winAuth.onStateChange === 'function') {
      try {
        winAuth.onStateChange((u: any, p: any) => {
          if (u) {
            const minUser: FirebaseUser = {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName || (u.email ? u.email.split('@')[0] : 'Candidate'),
              photoURL: u.photoURL || null,
              emailVerified: u.emailVerified,
            };
            setUser(minUser);
            if (p) {
              const isPrem = Boolean(p.isPremium || p.tierType?.startsWith('pro'));
              const tierType = p.tierType || (isPrem ? 'pro_vip' : 'free');
              const cat = computeUserCategory(minUser, isPrem, tierType);
              setProfile({
                ...p,
                uid: u.uid,
                displayName: p.displayName || minUser.displayName,
                email: u.email,
                tierType: tierType,
                isPremium: isPrem,
                categoryTier: cat,
                predictionsCount: p.predictionsCount ?? parseInt(localStorage.getItem('neet_predictions_count') || '0', 10),
              });
            }
          } else {
            if (!localStorage.getItem('neet_auth_user')) {
              setUser(null);
              setProfile(defaultProfile);
            }
          }
        });
      } catch (err) {
        console.warn('window.Auth onStateChange listener warning:', err);
      }
    }

    // 2. Dual layer: Also connect directly to Firebase SDK Auth state
    getFirebaseSDK().then(sdk => {
      if (!sdk || !sdk.auth || !sdk.authMod) return;

      try {
        sdk.authMod.setPersistence(sdk.auth, sdk.authMod.browserLocalPersistence);

        unsubscribe = sdk.authMod.onAuthStateChanged(sdk.auth, (fbUser: any) => {
          if (fbUser) {
            const minUser: FirebaseUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email?.split('@')[0],
              photoURL: fbUser.photoURL || null,
              emailVerified: fbUser.emailVerified,
            };
            setUser(minUser);
            localStorage.setItem('neet_auth_user', JSON.stringify(minUser));
            syncProfileFromFirestore(fbUser, sdk);
          } else {
            // Only clear if no cached user exists
            if (!localStorage.getItem('neet_auth_user')) {
              setUser(null);
              setProfile(defaultProfile);
            }
          }
        });
      } catch (err) {
        console.warn('Firebase onAuthStateChanged setup error:', err);
      }
    });

    // Listen to local storage updates across windows/tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'neet_auth_user' || e.key === 'neet_auth_profile' || e.key === 'neet_user_is_premium' || e.key === 'neet_user_tier_type') {
        bootstrapFromCache();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, [bootstrapFromCache, syncProfileFromFirestore]);

  // Google Sign-In
  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    setIsLoading(true);
    try {
      // 1. Try window.Auth first (identical to HTML implementation)
      const winAuth = typeof window !== 'undefined' ? (window as any).Auth : null;
      if (winAuth && typeof winAuth.loginWithGoogle === 'function') {
        try {
          const u = await winAuth.loginWithGoogle();
          const minUser: FirebaseUser = {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName || (u.email ? u.email.split('@')[0] : 'Candidate'),
            photoURL: u.photoURL || null,
            emailVerified: u.emailVerified,
          };
          setUser(minUser);
          if (winAuth.profile) setProfile(winAuth.profile);
          return minUser;
        } catch (winErr: any) {
          // If window.Auth threw a real auth error (cancelled/popup-blocked), throw formatted message
          if (winErr?.message && !winErr.message.includes('initializing') && !winErr.message.includes('readying')) {
            throw new Error(formatAuthError(winErr));
          }
        }
      }

      // 2. Fallback to Firebase SDK
      const sdk = await getFirebaseSDK();
      if (!sdk) throw new Error('Firebase Authentication is initializing. Please check your internet connection and try again.');

      const provider = new sdk.authMod.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      let res;
      try {
        res = await sdk.authMod.signInWithPopup(sdk.auth, provider);
      } catch (popupErr: any) {
        throw new Error(formatAuthError(popupErr));
      }

      const fbUser = res.user;

      const minUser: FirebaseUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0],
        photoURL: fbUser.photoURL || null,
        emailVerified: fbUser.emailVerified,
      };

      setUser(minUser);
      localStorage.setItem('neet_auth_user', JSON.stringify(minUser));
      await syncProfileFromFirestore(fbUser, sdk);
      return minUser;
    } catch (err: any) {
      throw new Error(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Email Sign-In
  const signInWithEmail = async (email: string, pass: string): Promise<FirebaseUser> => {
    setIsLoading(true);
    try {
      // 1. Try window.Auth first
      const winAuth = typeof window !== 'undefined' ? (window as any).Auth : null;
      if (winAuth && typeof winAuth.login === 'function') {
        try {
          const u = await winAuth.login(email, pass);
          const minUser: FirebaseUser = {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName || (u.email ? u.email.split('@')[0] : 'Candidate'),
            photoURL: u.photoURL || null,
            emailVerified: u.emailVerified,
          };
          setUser(minUser);
          if (winAuth.profile) setProfile(winAuth.profile);
          return minUser;
        } catch (winErr: any) {
          if (winErr?.message && !winErr.message.includes('initializing') && !winErr.message.includes('readying')) {
            throw new Error(formatAuthError(winErr));
          }
        }
      }

      // 2. Fallback to SDK
      const sdk = await getFirebaseSDK();
      if (!sdk) throw new Error('Firebase Authentication is initializing. Please try again.');

      const res = await sdk.authMod.signInWithEmailAndPassword(sdk.auth, email, pass);
      const fbUser = res.user;

      const minUser: FirebaseUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0],
        photoURL: fbUser.photoURL || null,
        emailVerified: fbUser.emailVerified,
      };

      setUser(minUser);
      localStorage.setItem('neet_auth_user', JSON.stringify(minUser));
      await syncProfileFromFirestore(fbUser, sdk);
      return minUser;
    } catch (err: any) {
      throw new Error(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Email Sign-Up
  const signUpWithEmail = async (
    email: string, 
    pass: string, 
    displayName: string, 
    extra: Record<string, any> = {}
  ): Promise<FirebaseUser> => {
    setIsLoading(true);
    try {
      // 1. Try window.Auth first
      const winAuth = typeof window !== 'undefined' ? (window as any).Auth : null;
      if (winAuth && typeof winAuth.register === 'function') {
        try {
          const u = await winAuth.register(email, pass, displayName, extra);
          const minUser: FirebaseUser = {
            uid: u.uid,
            email: u.email,
            displayName: displayName || (u.email ? u.email.split('@')[0] : 'Candidate'),
            photoURL: null,
            emailVerified: u.emailVerified,
          };
          setUser(minUser);
          if (winAuth.profile) setProfile(winAuth.profile);
          return minUser;
        } catch (winErr: any) {
          if (winErr?.message && !winErr.message.includes('initializing') && !winErr.message.includes('readying')) {
            throw new Error(formatAuthError(winErr));
          }
        }
      }

      // 2. Fallback to SDK
      const sdk = await getFirebaseSDK();
      if (!sdk) throw new Error('Firebase Authentication is initializing. Please try again.');

      const res = await sdk.authMod.createUserWithEmailAndPassword(sdk.auth, email, pass);
      const fbUser = res.user;

      if (displayName && sdk.authMod.updateProfile) {
        try { await sdk.authMod.updateProfile(fbUser, { displayName }); } catch(e){}
      }

      const minUser: FirebaseUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: displayName || fbUser.email?.split('@')[0],
        photoURL: null,
        emailVerified: fbUser.emailVerified,
      };

      setUser(minUser);
      localStorage.setItem('neet_auth_user', JSON.stringify(minUser));

      if (sdk.db && sdk.firestoreMod) {
        const docRef = sdk.firestoreMod.doc(sdk.db, "users", fbUser.uid);
        await sdk.firestoreMod.setDoc(docRef, {
          uid: fbUser.uid,
          displayName: minUser.displayName,
          email: minUser.email,
          rank: extra.rank || '',
          score: extra.score || '',
          category: extra.category || 'Open',
          state: extra.state || '',
          isPremium: false,
          tierType: 'free',
          paymentStatus: 'none',
          predictionsCount: 0,
          createdAt: sdk.firestoreMod.serverTimestamp(),
          lastLoginAt: sdk.firestoreMod.serverTimestamp(),
        }, { merge: true });
      }

      await syncProfileFromFirestore(fbUser, sdk);
      return minUser;
    } catch (err: any) {
      throw new Error(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    setIsLoading(true);
    try {
      const uid = user ? user.uid : null;
      setUser(null);
      setProfile(defaultProfile);

      localStorage.removeItem('neet_auth_user');
      localStorage.removeItem('neet_auth_profile');
      localStorage.removeItem('neet_user_is_premium');
      localStorage.removeItem('neet_user_tier_type');
      localStorage.removeItem('neet_user_payment_status');
      localStorage.removeItem('neet_user_payment_id');
      localStorage.removeItem('neet_user_plan');
      if (uid) localStorage.removeItem(`neet_user_profile_${uid}`);

      const winAuth = typeof window !== 'undefined' ? (window as any).Auth : null;
      if (winAuth && typeof winAuth.logout === 'function') {
        try { await winAuth.logout(); } catch(e){}
      }

      const sdk = await getFirebaseSDK();
      if (sdk?.auth && sdk.authMod) {
        try { await sdk.authMod.signOut(sdk.auth); } catch(e){}
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    const winAuth = typeof window !== 'undefined' ? (window as any).Auth : null;
    if (winAuth && typeof winAuth.resetPassword === 'function') {
      try {
        await winAuth.resetPassword(email);
        return;
      } catch (err: any) {
        throw new Error(formatAuthError(err));
      }
    }

    const sdk = await getFirebaseSDK();
    if (!sdk?.auth || !sdk.authMod) {
      throw new Error('Authentication service readying. Please retry in a few seconds.');
    }
    try {
      await sdk.authMod.sendPasswordResetEmail(sdk.auth, email);
    } catch (err: any) {
      throw new Error(formatAuthError(err));
    }
  };

  // Update Profile Data
  const updateProfileData = async (data: Partial<UserProfile>) => {
    const updated = { ...profile, ...data };
    setProfile(updated);
    localStorage.setItem('neet_auth_profile', JSON.stringify(updated));
    if (data.rank) localStorage.setItem('neet_user_rank', data.rank);
    if (data.score) localStorage.setItem('neet_user_score', data.score);
    if (data.category) localStorage.setItem('neet_user_category', data.category);
    if (data.state) localStorage.setItem('neet_user_state', data.state);

    const winAuth = typeof window !== 'undefined' ? (window as any).Auth : null;
    if (winAuth && typeof winAuth.updateProfileData === 'function') {
      try { await winAuth.updateProfileData(data); } catch(e){}
    }

    if (user) {
      const sdk = await getFirebaseSDK();
      if (sdk?.db && sdk.firestoreMod) {
        try {
          const docRef = sdk.firestoreMod.doc(sdk.db, "users", user.uid);
          await sdk.firestoreMod.setDoc(docRef, {
            ...data,
            updatedAt: sdk.firestoreMod.serverTimestamp(),
          }, { merge: true });
        } catch(e){}
      }
    }
  };

  // Entitlement verification
  const canPredict = (): PredictionCheckResult => {
    const cat = profile.categoryTier;
    const current = profile.predictionsCount;

    if (!user) {
      return {
        allowed: false,
        reason: 'REGISTER_REQUIRED',
        remaining: 0,
        limit: 5,
        current: 0,
        message: 'Candidate login is required to claim your 5 Free AI Predictions! Sign in or register in seconds to begin.',
        tier: cat,
      };
    }

    if (cat.unlimited) {
      return { allowed: true, remaining: Infinity, limit: Infinity, current, tier: cat };
    }

    const limit = cat.freeLimit || 5;
    if (current < limit) {
      return { allowed: true, remaining: limit - current, limit, current, tier: cat };
    }

    return {
      allowed: false,
      reason: 'UPGRADE_REQUIRED',
      remaining: 0,
      limit,
      current,
      message: 'You have completed all 5 free trial predictions. Unlock unlimited AI predictions and full cutoff forecasts with a Basic Pass (₹149) or Season Pass (₹299)!',
      tier: cat,
    };
  };

  // Record prediction
  const recordPrediction = async (): Promise<number> => {
    const nextCount = profile.predictionsCount + 1;
    localStorage.setItem('neet_predictions_count', nextCount.toString());
    setProfile(prev => ({ ...prev, predictionsCount: nextCount }));

    if (user) {
      const sdk = await getFirebaseSDK();
      if (sdk?.db && sdk.firestoreMod) {
        try {
          const docRef = sdk.firestoreMod.doc(sdk.db, "users", user.uid);
          await sdk.firestoreMod.setDoc(docRef, { predictionsCount: nextCount }, { merge: true });
        } catch(e){}
      }
    }
    return nextCount;
  };

  // Instant Verified Tier Upgrade
  const activateVerifiedTier = async (tierType: 'pro_vip' | 'pro_plus', paymentId: string) => {
    if (!paymentId) return;
    const isPrem = true;
    const cat = computeUserCategory(user, isPrem, tierType);

    const updated: UserProfile = {
      ...profile,
      isPremium: true,
      tierType,
      paymentStatus: 'completed',
      paymentId,
      categoryTier: cat,
    };

    setProfile(updated);
    localStorage.setItem('neet_user_tier_type', tierType);
    localStorage.setItem('neet_user_is_premium', 'true');
    localStorage.setItem('neet_user_payment_status', 'completed');
    localStorage.setItem('neet_user_payment_id', paymentId);
    localStorage.setItem('neet_auth_profile', JSON.stringify(updated));

    if (user) {
      const sdk = await getFirebaseSDK();
      if (sdk?.db && sdk.firestoreMod) {
        try {
          const docRef = sdk.firestoreMod.doc(sdk.db, "users", user.uid);
          await sdk.firestoreMod.setDoc(docRef, {
            isPremium: true,
            tierType,
            paymentStatus: 'completed',
            paymentId,
            upgradedAt: sdk.firestoreMod.serverTimestamp(),
          }, { merge: true });
        } catch(e){}
      }
    }
  };

  // Instant Demo Candidate Login (for local testing & verification)
  const signInAsDemoCandidate = async (tier: 'free' | 'pro_plus' | 'pro_vip' = 'pro_vip'): Promise<FirebaseUser> => {
    const isPremium = tier.startsWith('pro');
    const demoUid = 'demo_user_' + Math.random().toString(36).substring(2, 7);
    const minUser: FirebaseUser = {
      uid: demoUid,
      email: 'dr.rahul@neet-candidate.in',
      displayName: 'Dr. Rahul Sharma',
      photoURL: null,
      emailVerified: true,
    };
    const cat = computeUserCategory(minUser, isPremium, tier);
    const demoProfile: UserProfile = {
      uid: demoUid,
      displayName: 'Dr. Rahul Sharma',
      email: minUser.email,
      emailVerified: true,
      photoURL: null,
      rank: '4820',
      score: '668',
      category: 'OBC',
      state: 'Uttar Pradesh',
      tierType: tier,
      isPremium,
      paymentStatus: isPremium ? 'completed' : 'none',
      paymentId: isPremium ? 'rzp_demo_verified' : '',
      predictionsCount: tier === 'free' ? 1 : 0,
      categoryTier: cat,
      createdAt: new Date().toISOString(),
    };

    setUser(minUser);
    setProfile(demoProfile);
    localStorage.setItem('neet_auth_user', JSON.stringify(minUser));
    localStorage.setItem('neet_auth_profile', JSON.stringify(demoProfile));
    localStorage.setItem('neet_user_tier_type', tier);
    localStorage.setItem('neet_user_is_premium', isPremium ? 'true' : 'false');
    localStorage.setItem('neet_user_rank', '4820');
    localStorage.setItem('neet_user_score', '668');
    localStorage.setItem('neet_user_category', 'OBC');
    localStorage.setItem('neet_user_state', 'Uttar Pradesh');
    localStorage.setItem('neet_predictions_count', tier === 'free' ? '1' : '0');

    const winAuth = typeof window !== 'undefined' ? (window as any).Auth : null;
    if (winAuth) {
      winAuth.user = minUser;
      winAuth.profile = demoProfile;
      if (typeof winAuth._syncNavbarUI === 'function') winAuth._syncNavbarUI(minUser);
      if (typeof winAuth._notifyListeners === 'function') winAuth._notifyListeners(minUser);
    }

    return minUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        tierCategory: profile.categoryTier,
        isInitialized,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        updateProfileData,
        canPredict,
        recordPrediction,
        activateVerifiedTier,
        signInAsDemoCandidate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
