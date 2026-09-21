'use client';

import { useState, useEffect } from 'react';
import { PredictionResult } from '../engine/types';

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
  const [wishlist, setWishlist] = useState<SavedCollegeItem[]>([]);
  const [choiceFill, setChoiceFill] = useState<SavedCollegeItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedWishlist = localStorage.getItem('neet_wishlist');
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

      const storedChoices = localStorage.getItem('neet_choicefill');
      if (storedChoices) setChoiceFill(JSON.parse(storedChoices));
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  const saveWishlist = (newList: SavedCollegeItem[]) => {
    setWishlist(newList);
    localStorage.setItem('neet_wishlist', JSON.stringify(newList));
  };

  const saveChoiceFill = (newList: SavedCollegeItem[]) => {
    setChoiceFill(newList);
    localStorage.setItem('neet_choicefill', JSON.stringify(newList));
  };

  const toggleWishlist = (item: PredictionResult | SavedCollegeItem) => {
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
  };

  const isInWishlist = (key: string) => {
    return wishlist.some(w => w.key === key);
  };

  const addToChoiceFill = (item: SavedCollegeItem) => {
    if (!choiceFill.some(c => c.key === item.key)) {
      saveChoiceFill([...choiceFill, item]);
    }
  };

  const removeFromChoiceFill = (key: string) => {
    saveChoiceFill(choiceFill.filter(c => c.key !== key));
  };

  const reorderChoices = (fromIndex: number, toIndex: number) => {
    const copy = [...choiceFill];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    saveChoiceFill(copy);
  };

  const smartSortChoices = () => {
    const copy = [...choiceFill];
    copy.sort((a, b) => a.closingRank - b.closingRank);
    saveChoiceFill(copy);
  };

  return {
    wishlist,
    choiceFill,
    isLoaded,
    toggleWishlist,
    isInWishlist,
    addToChoiceFill,
    removeFromChoiceFill,
    reorderChoices,
    smartSortChoices,
    clearChoiceFill: () => saveChoiceFill([])
  };
}
