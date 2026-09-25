'use client';

// Official Firebase Web SDK Configuration
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAGxfLq86vA1ikWE3_NNyK7AVHaFQGkqKE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "neet-coounselling-web.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "neet-coounselling-web",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "neet-coounselling-web.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "880209862735",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:880209862735:web:0ef69f68c25ddd3733ca3a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-YZDMS240K5"
};

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
}

export interface UserTierCategory {
  code: 'PRO_VIP' | 'PRO_PLUS' | 'REGISTERED_FREE' | 'UNAUTHENTICATED_GUEST';
  type: 'pro_vip' | 'pro_plus' | 'free' | 'guest';
  label: string;
  tag: string;
  icon: string;
  cls: string;
  badgeColor: string;
  badgeBg: string;
  isGlowing: boolean;
  canAccessPredictor: boolean;
  canAccessWishlist: boolean;
  canAccessChoiceFiller: boolean;
  unlimited: boolean;
  freeLimit?: number;
}

export interface UserProfile {
  uid: string | null;
  displayName: string;
  email: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  rank: string;
  score?: string;
  category: string;
  state: string;
  tierType: string;
  isPremium: boolean;
  paymentStatus: string;
  paymentId: string;
  predictionsCount: number;
  categoryTier: UserTierCategory;
  createdAt?: string;
}

// Module Cache
let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let sdkModules: {
  app: any;
  auth: any;
  firestore: any;
} | null = null;

function nativeEsmImport(url: string) {
  try {
    return (new Function('u', 'return import(u)'))(url);
  } catch {
    return import(/* webpackIgnore: true */ url);
  }
}

export async function getFirebaseSDK() {
  if (typeof window === 'undefined') return null;

  // 1. Direct connection to window.Auth loaded via /js/firebase-config.js (from HTML version)
  const winAuth = (window as any).Auth;
  if (winAuth) {
    if (typeof winAuth.ready === 'function') {
      try {
        await winAuth.ready();
      } catch (e) {
        console.warn('winAuth.ready wait warning:', e);
      }
    }
    if (winAuth.app && winAuth.auth && winAuth.db) {
      return {
        app: winAuth.app,
        auth: winAuth.auth,
        db: winAuth.db,
        appMod: winAuth.appModule || winAuth.app,
        authMod: winAuth.authModule || winAuth.auth,
        firestoreMod: winAuth.firestoreModule || winAuth.db,
      };
    }
  }

  // 2. Wait up to 1.5s for window.Auth background async initialization
  if (winAuth) {
    for (let i = 0; i < 15; i++) {
      if (winAuth.app && winAuth.auth && winAuth.db) {
        return {
          app: winAuth.app,
          auth: winAuth.auth,
          db: winAuth.db,
          appMod: winAuth.appModule || winAuth.app,
          authMod: winAuth.authModule || winAuth.auth,
          firestoreMod: winAuth.firestoreModule || winAuth.db,
        };
      }
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // 3. Module Cache
  if (sdkModules && authInstance) {
    return { ...sdkModules, app: appInstance, auth: authInstance, db: dbInstance };
  }

  // 4. Dynamic import fallback
  try {
    const [appMod, authMod, firestoreMod] = await Promise.all([
      nativeEsmImport('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
      nativeEsmImport('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'),
      nativeEsmImport('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'),
    ]);

    const existing = (appMod.getApps && typeof appMod.getApps === 'function') ? appMod.getApps() : [];
    appInstance = existing.length > 0 ? existing[0] : appMod.initializeApp(firebaseConfig);
    authInstance = authMod.getAuth(appInstance);
    dbInstance = firestoreMod.getFirestore(appInstance);

    sdkModules = {
      app: appMod,
      auth: authMod,
      firestore: firestoreMod,
    };

    return {
      app: appInstance,
      auth: authInstance,
      db: dbInstance,
      appMod,
      authMod,
      firestoreMod,
    };
  } catch (err) {
    console.warn('Firebase SDK dynamic loader fallback:', err);
    return null;
  }
}
