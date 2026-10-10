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
  Crown, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  Mail
} from 'lucide-react';
import { useUserData } from '@/lib/store/useUserData';
import { useAuth } from '@/lib/firebase/AuthContext';
import { BrandIcon } from '@/components/common/BrandIcon';
import { UpgradeModal } from '@/components/common/UpgradeModal';
import { AuthModal } from '@/components/common/AuthModal';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToChoiceFill, choiceFill, isLoaded, syncStatus } = useUserData();
  const { user, profile, tierCategory, signInWithGoogle, signInAsDemoCandidate } = useAuth();
  const [search, setSearch] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [authError, setAuthError] = useState('');
  const isProPlus = tierCategory.type === 'pro_plus' || profile?.tierType === 'pro_plus';

  if (!isLoaded) {
    return (
      <div className="py-20 text-center text-white/50">
        Loading saved colleges…
      </div>
    );
  }

  // ── 1. UNAUTHENTICATED CANDIDATE GATE ──
  if (!user) {
    return (
      <div className="container-custom py-10 max-w-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-teal-500/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          ❤️
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider mb-3">
          <Lock className="h-3.5 w-3.5" />
          <span>Candidate Login Required</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight mb-2">
          Sign In to Access Your Wishlist
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 max-w-md mx-auto mb-6 leading-relaxed">
          Candidate login is necessary to bookmark dream colleges, sync across devices via Firebase, and claim your <strong className="text-teal-600 dark:text-teal-400">5 Free AI Predictions</strong>.
        </p>

        {/* Auth Action Card */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg text-left mb-6">
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
              {authError}
            </div>
          )}

          <div className="space-y-2.5 mb-5 text-xs text-slate-700 dark:text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Claim 5 Free AI Predictions instantly upon logging in</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Secure real-time Firebase Cloud synchronization for your saved colleges</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Batch-export saved colleges to MCC Choice Filling order</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={async () => {
                setAuthError('');
                setIsGoogleLoading(true);
                try {
                  await signInWithGoogle();
                } catch (e: any) {
                  setAuthError(e?.message || 'Google Sign-In failed.');
                } finally {
                  setIsGoogleLoading(false);
                }
              }}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.05] hover:bg-slate-50 dark:hover:bg-white/[0.1] text-slate-800 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>{isGoogleLoading ? 'Connecting Google Account…' : 'Continue with Google (Instant Free Trial)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              <span>Sign In / Register with Email</span>
            </button>
          </div>

          {/* Quick Demo Testing */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => signInAsDemoCandidate('free')}
              className="flex-1 py-1.5 text-[11px] font-bold rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white transition-all cursor-pointer text-center"
            >
              Test Free (5)
            </button>
            <button
              type="button"
              onClick={() => signInAsDemoCandidate('pro_plus')}
              className="flex-1 py-1.5 text-[11px] font-bold rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-800 dark:text-teal-300 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Zap className="h-3 w-3 text-teal-500" />
              <span>Test Basic (₹149)</span>
            </button>
            <button
              type="button"
              onClick={() => signInAsDemoCandidate('pro_vip')}
              className="flex-1 py-1.5 text-[11px] font-bold rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Crown className="h-3 w-3 text-amber-500" />
              <span>Test VIP (₹299)</span>
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          title="Sign In to Access Wishlist"
          subtitle="Login or create a candidate account to access your saved college wishlist and claim 5 Free AI Predictions."
        />
      </div>
    );
  }

  // ── 2. GATED PREMIUM LOCK STATE (Season Pass VIP Required) ──
  if (!tierCategory.canAccessWishlist) {
    return (
      <div className="container-custom py-10 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
            <Crown className="h-3.5 w-3.5" />
            <span>VIP Counselling Feature</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            Personal College Shortlist &amp; Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 max-w-xl mx-auto mt-2 leading-relaxed">
            The Personal Shortlist allows candidates to bookmark dream colleges, categorize state vs AIQ quotas, and batch-transfer them directly into the MCC Choice Filling Sequencer.
          </p>
        </div>

        {/* Upgrade Hero Card */}
        <div className="glass-panel p-6 sm:p-8 border-2 border-amber-500/40 bg-amber-500/[0.04] dark:bg-amber-400/[0.03] rounded-3xl relative overflow-hidden shadow-[0_10px_40px_rgba(245,158,11,0.14)] mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  <Lock className="h-5 w-5" />
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                  Included in Season Pass VIP
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Unlimited College Shortlisting</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Smart Choice Filling Sequencer</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>1-Click Batch Transfer to Choices</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Firebase Cloud Real-Time Sync</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs sm:text-sm shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="h-4 w-4" />
                <span>{isProPlus ? 'Upgrade to Season Pass VIP (₹150)' : 'Unlock Season Pass VIP'}</span>
              </button>
              <span className="text-[11px] text-slate-500 dark:text-white/50">
                {isProPlus ? (
                  <span>Basic Pass credited · <strong>Pay ₹150 Difference Only</strong></span>
                ) : (
                  <span>Use code <strong>NEETPRO</strong> for ₹50 off</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Frosted Mockup Preview */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 opacity-70 pointer-events-none select-none">
          <div className="p-4 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-white/40">Shortlist Preview (3 Demo Colleges)</span>
            <span className="badge bg-slate-200 dark:bg-white/10 text-slate-500 text-[10px]">Preview Only</span>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 filter blur-[1px]">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
              <span className="badge bg-teal-500/10 text-teal-800 dark:text-teal-300 text-[10px] mb-2 inline-block">AIIMS</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">AIIMS New Delhi</h4>
              <p className="text-[11px] text-slate-500 mt-1">Closing: ~55 AIR</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
              <span className="badge bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 text-[10px] mb-2 inline-block">GOVT</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">VMMC New Delhi</h4>
              <p className="text-[11px] text-slate-500 mt-1">Closing: ~140 AIR</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
              <span className="badge bg-purple-500/10 text-purple-800 dark:text-purple-300 text-[10px] mb-2 inline-block">GOVT</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Seth GS Medical Mumbai</h4>
              <p className="text-[11px] text-slate-500 mt-1">Closing: ~950 AIR</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA to explore basic features */}
        <div className="mt-8 text-center flex flex-wrap items-center justify-center gap-3">
          <Link href="/predict" className="btn-secondary py-2 px-5 text-xs inline-flex items-center gap-2">
            <Compass className="h-3.5 w-3.5" />
            <span>Explore Basic Predictor</span>
          </Link>
          <Link href="/colleges" className="btn-secondary py-2 px-5 text-xs inline-flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>Colleges &amp; Fee Directory</span>
          </Link>
        </div>

        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          feature="wishlist"
        />
      </div>
    );
  }

  // ── UNLOCKED PREMIUM WISH LIST VIEW ──
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
          <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider mb-2">
            <BrandIcon size={18} />
            <span>Personal College Shortlist (VIP Unlocked)</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              Saved Colleges ({wishlist.length})
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300">
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
              {syncStatus === 'syncing' ? 'Syncing to Firebase…' : '✓ Synced with Firebase Cloud'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 mt-1">
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Search your saved colleges…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 text-xs py-2"
              />
            </div>

            <div className="text-xs text-slate-600 dark:text-white/50 mono-font shrink-0">
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
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 font-black text-[10px] mono-font">
                          #{idx + 1}
                        </span>
                        {item.collegeType && (
                          <span className="badge bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 border border-slate-200 dark:border-white/10 text-[10px]">
                            {item.collegeType}
                          </span>
                        )}
                        <span className="badge bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/20 text-[10px]">
                          {item.course}
                        </span>
                        <span className="badge bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 border border-slate-200 dark:border-white/5 text-[10px]">
                          {item.quota}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleWishlist(item)}
                        className="text-slate-400 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-400 transition-colors p-1"
                        title="Remove from Wishlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-950 dark:text-white text-base leading-snug line-clamp-2 mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-white/50 flex items-center gap-1 mb-4">
                      <MapPin className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400 shrink-0" />
                      <span>{item.state}</span>
                      <span className="mx-1 text-slate-300 dark:text-white/20">·</span>
                      <span className="mono-font text-teal-700 dark:text-teal-300 font-semibold">
                        ~{item.closingRank.toLocaleString()} AIR
                      </span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                    <Link
                      href={`/predict?rank=${item.closingRank || 15000}`}
                      className="text-xs text-teal-700 hover:text-slate-950 dark:text-teal-300 dark:hover:text-white flex items-center gap-1 font-semibold transition-colors"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      <span>Predict Cutoff</span>
                    </Link>

                    <button
                      onClick={() => addToChoiceFill(item)}
                      disabled={inChoice}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                        inChoice
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 cursor-default'
                          : 'bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/30 hover:bg-teal-500/20'
                      }`}
                    >
                      {inChoice ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
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
          <Heart className="h-12 w-12 text-slate-300 dark:text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">No Saved Colleges Yet</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 max-w-md mx-auto mb-6">
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
