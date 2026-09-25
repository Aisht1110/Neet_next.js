'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PredictionResult } from '../engine/types';
import { useAuth } from '../firebase/AuthContext';
import { getFirebaseSDK } from '../firebase/firebase';

export interface SavedCollegeItem {
  key: string;
  name: string;
  institute: string;
  state: string;
  course: string;
  quota: string;
  category: string;
  closingRank: number;
  strategyKey?: string;
  collegeType?: string;
  savedAt: string;
}

export function useUserData() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<SavedCollegeItem[]>([]);
  const [choiceFill, setChoiceFill] = useState<SavedCollegeItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('offline');
  const userRef = useRef(user);
  userRef.current = user;

  // 1. Initial Synchronous 0ms Cache Load
  useEffect(() => {
    try {
      const storedW = localStorage.getItem('neet_wishlist');
      if (storedW) setWishlist(JSON.parse(storedW));
      const storedC = localStorage.getItem('neet_choicefill');
      if (storedC) setChoiceFill(JSON.parse(storedC));
    } catch {
      // ignore
    }
    setIsLoaded(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'neet_wishlist') {
        try { setWishlist(e.newValue ? JSON.parse(e.newValue) : []); } catch {}
      }
      if (e.key === 'neet_choicefill') {
        try { setChoiceFill(e.newValue ? JSON.parse(e.newValue) : []); } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 2. Background Firestore Sync on Auth Change
  useEffect(() => {
    if (!user?.uid) {
      setSyncStatus('offline');
      return;
    }

    let isSubscribed = true;

    async function syncFromFirestore() {
      try {
        setSyncStatus('syncing');
        const sdk = await getFirebaseSDK();
        if (!sdk || !sdk.db || !sdk.firestoreMod || !isSubscribed) {
          setSyncStatus('offline');
          return;
        }

        const { doc, getDoc, setDoc, serverTimestamp } = sdk.firestoreMod;

        // Sync Wishlist from Firestore
        const wDocRef = doc(sdk.db, 'wishlists', user!.uid);
        const wSnap = await getDoc(wDocRef);

        let finalWishlist = wishlist;
        if (wSnap.exists()) {
          const cloudData = wSnap.data();
          if (Array.isArray(cloudData.items)) {
            finalWishlist = cloudData.items;
            setWishlist(cloudData.items);
            localStorage.setItem('neet_wishlist', JSON.stringify(cloudData.items));
          }
        } else if (wishlist.length > 0) {
          // Push local items up to cloud for the newly signed-in user
          await setDoc(wDocRef, {
            items: wishlist,
            uid: user!.uid,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }

        // Sync Choice Filling from Firestore
        const cDocRef = doc(sdk.db, 'choices', user!.uid);
        const cSnap = await getDoc(cDocRef);

        if (cSnap.exists()) {
          const cloudData = cSnap.data();
          if (Array.isArray(cloudData.items)) {
            setChoiceFill(cloudData.items);
            localStorage.setItem('neet_choicefill', JSON.stringify(cloudData.items));
          }
        } else if (choiceFill.length > 0) {
          await setDoc(cDocRef, {
            items: choiceFill,
            uid: user!.uid,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }

        if (isSubscribed) {
          setSyncStatus('synced');
        }
      } catch (err) {
        console.warn('Firestore wishlist/choices sync error:', err);
        if (isSubscribed) setSyncStatus('offline');
      }
    }

    syncFromFirestore();

    return () => {
      isSubscribed = false;
    };
  }, [user?.uid]);

  // 3. Save Wishlist to LocalStorage and Firestore
  const saveWishlist = useCallback((newList: SavedCollegeItem[]) => {
    setWishlist(newList);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('neet_wishlist', JSON.stringify(newList));
      }
    } catch (e) {
      console.warn('Could not persist wishlist to localStorage:', e);
    }

    const currentUser = userRef.current;
    if (currentUser?.uid) {
      setSyncStatus('syncing');
      getFirebaseSDK().then((sdk) => {
        if (!sdk?.db || !sdk?.firestoreMod) {
          setSyncStatus('offline');
          return;
        }
        const { doc, setDoc, serverTimestamp } = sdk.firestoreMod;
        const wDocRef = doc(sdk.db, 'wishlists', currentUser.uid);
        setDoc(wDocRef, {
          items: newList,
          uid: currentUser.uid,
          updatedAt: serverTimestamp(),
        }, { merge: true })
          .then(() => setSyncStatus('synced'))
          .catch((err) => {
            console.warn('Firestore save wishlist error:', err);
            setSyncStatus('offline');
          });
      });
    }
  }, []);

  // 4. Save Choice Filling to LocalStorage and Firestore
  const saveChoiceFill = useCallback((newList: SavedCollegeItem[]) => {
    setChoiceFill(newList);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('neet_choicefill', JSON.stringify(newList));
      }
    } catch (e) {
      console.warn('Could not persist choiceFill to localStorage:', e);
    }

    const currentUser = userRef.current;
    if (currentUser?.uid) {
      setSyncStatus('syncing');
      getFirebaseSDK().then((sdk) => {
        if (!sdk?.db || !sdk?.firestoreMod) {
          setSyncStatus('offline');
          return;
        }
        const { doc, setDoc, serverTimestamp } = sdk.firestoreMod;
        const cDocRef = doc(sdk.db, 'choices', currentUser.uid);
        setDoc(cDocRef, {
          items: newList,
          uid: currentUser.uid,
          updatedAt: serverTimestamp(),
        }, { merge: true })
          .then(() => setSyncStatus('synced'))
          .catch((err) => {
            console.warn('Firestore save choices error:', err);
            setSyncStatus('offline');
          });
      });
    }
  }, []);

  const toggleWishlist = useCallback((item: PredictionResult | SavedCollegeItem) => {
    const key = item.key;
    const exists = wishlist.some(w => w.key === key);
    if (exists) {
      const filtered = wishlist.filter(w => w.key !== key);
      saveWishlist(filtered);
      return false;
    } else {
      const newItem: SavedCollegeItem = {
        key: item.key,
        name: item.name,
        institute: item.institute,
        state: item.state,
        course: item.course,
        quota: item.quota,
        category: item.category,
        closingRank: item.closingRank,
        strategyKey: 'strategy' in item ? item.strategy.key : item.strategyKey,
        collegeType: 'collegeType' in item && item.collegeType && typeof item.collegeType === 'object' 
          ? item.collegeType.label 
          : (typeof item.collegeType === 'string' ? item.collegeType : undefined),
        savedAt: new Date().toISOString()
      };
      saveWishlist([...wishlist, newItem]);
      return true;
    }
  }, [wishlist, saveWishlist]);

  const isInWishlist = useCallback((key: string) => {
    return wishlist.some(w => w.key === key);
  }, [wishlist]);

  const addToChoiceFill = useCallback((item: SavedCollegeItem) => {
    if (!choiceFill.some(c => c.key === item.key)) {
      saveChoiceFill([...choiceFill, item]);
    }
  }, [choiceFill, saveChoiceFill]);

  const removeFromChoiceFill = useCallback((key: string) => {
    saveChoiceFill(choiceFill.filter(c => c.key !== key));
  }, [choiceFill, saveChoiceFill]);

  const reorderChoices = useCallback((fromIndex: number, toIndex: number) => {
    const copy = [...choiceFill];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    saveChoiceFill(copy);
  }, [choiceFill, saveChoiceFill]);

  const smartSortChoices = useCallback(() => {
    const copy = [...choiceFill];
    copy.sort((a, b) => a.closingRank - b.closingRank);
    saveChoiceFill(copy);
  }, [choiceFill, saveChoiceFill]);

  return {
    wishlist,
    choiceFill,
    isLoaded,
    syncStatus,
    toggleWishlist,
    isInWishlist,
    addToChoiceFill,
    removeFromChoiceFill,
    reorderChoices,
    smartSortChoices,
    clearChoiceFill: () => saveChoiceFill([])
  };
}
