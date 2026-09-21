'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Trash2, 
  ListOrdered, 
  MapPin, 
  Compass, 
  Search, 
  ArrowRight,
  Plus,
  Check,
  Building2,
  RotateCcw
} from 'lucide-react';
import { useUserData } from '@/lib/store/useUserData';
import { BrandIcon } from '@/components/common/BrandIcon';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToChoiceFill, choiceFill, isLoaded } = useUserData();
  const [search, setSearch] = useState('');

  if (!isLoaded) {
    return (
      <div className="py-20 text-center text-white/50">
        Loading saved colleges…
      </div>
    );
  }

  const filtered = wishlist.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.state || '').toLowerCase().includes(q);
  });

  const handleAddAllToChoiceFill = () => {
    for (const item of wishlist) {
      addToChoiceFill(item);
    }
  };

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-400 font-bold uppercase tracking-wider mb-2">
            <BrandIcon size={18} />
            <span>Personal College Shortlist</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Saved Colleges ({wishlist.length})
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Review your shortlisted colleges and transfer them directly into your Choice Filling Sequence.
          </p>
        </div>

        {wishlist.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddAllToChoiceFill}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span>Transfer All to Choice Fill</span>
            </button>
          </div>
        )}
      </div>

      {wishlist.length > 0 ? (
        <div>
          {/* Search Toolbar */}
          <div className="glass-panel p-3.5 mb-6 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search your saved colleges…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 text-xs py-2"
              />
            </div>

            <div className="text-xs text-white/50 mono-font shrink-0">
              {filtered.length} of {wishlist.length} saved
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item, idx) => {
              const inChoice = choiceFill.some(c => c.key === item.key);
              return (
                <div
                  key={item.key}
                  className="glass-panel p-5 flex flex-col justify-between hover:border-rose-400/30 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-400/15 text-rose-300 font-black text-[10px] mono-font">
                          #{idx + 1}
                        </span>
                        {item.collegeType && (
                          <span className="badge bg-white/5 text-white/70 border border-white/10 text-[10px]">
                            {item.collegeType}
                          </span>
                        )}
                        <span className="badge bg-teal-400/10 text-teal-300 border border-teal-400/20 text-[10px]">
                          {item.course}
                        </span>
                        <span className="badge bg-white/5 text-white/60 border border-white/5 text-[10px]">
                          {item.quota}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleWishlist(item)}
                        className="text-white/40 hover:text-rose-400 transition-colors p-1"
                        title="Remove from Wishlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-white text-base leading-snug line-clamp-2 mb-1 group-hover:text-teal-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-white/50 flex items-center gap-1 mb-4">
                      <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <span>{item.state}</span>
                      <span className="mx-1 text-white/20">·</span>
                      <span className="mono-font text-teal-300 font-semibold">
                        ~{item.closingRank.toLocaleString()} AIR
                      </span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <Link
                      href={`/predict?rank=${item.closingRank || 15000}`}
                      className="text-xs text-teal-300 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      <span>Predict Cutoff</span>
                    </Link>

                    <button
                      onClick={() => addToChoiceFill(item)}
                      disabled={inChoice}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                        inChoice
                          ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 cursor-default'
                          : 'bg-teal-400/10 text-teal-300 border border-teal-400/30 hover:bg-teal-400/20'
                      }`}
                    >
                      {inChoice ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>In Choices</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add to Choices</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-16 text-center">
          <Heart className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Saved Colleges Yet</h3>
          <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto mb-6">
            Explore colleges in the Predictor and click the heart icon on any card to save it to your personal shortlist.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/predict" className="btn-primary py-2.5 px-6 text-xs inline-flex items-center gap-2">
              <Compass className="h-4 w-4" />
              <span>Launch Predictor</span>
            </Link>
            <Link href="/colleges" className="btn-secondary py-2.5 px-6 text-xs inline-flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Explore Colleges</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
