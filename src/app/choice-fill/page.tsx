'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ListOrdered, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Sparkles, 
  Printer, 
  Compass, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Wand2,
  AlertTriangle,
  RotateCcw,
  Crown,
  Lock,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { useUserData } from '@/lib/store/useUserData';
import { useAuth } from '@/lib/firebase/AuthContext';
import { STATE_BOND_DATA, getEstimatedFee, getInternalPgQuota } from '@/lib/engine/collegeIntelligence';
import { BrandIcon } from '@/components/common/BrandIcon';
import { UpgradeModal } from '@/components/common/UpgradeModal';
import { AuthModal } from '@/components/common/AuthModal';

export default function ChoiceFillPage() {
  const { 
    choiceFill, 
    removeFromChoiceFill, 
    reorderChoices, 
    smartSortChoices, 
    clearChoiceFill,
    isLoaded,
    syncStatus
  } = useUserData();
  const { user, tierCategory, signInWithGoogle, signInAsDemoCandidate } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [authError, setAuthError] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const safetyCount = choiceFill.filter(c => c.strategyKey === 'safety').length;
  const targetCount = choiceFill.filter(c => c.strategyKey === 'target').length;
  const reachCount = choiceFill.filter(c => c.strategyKey === 'reach').length;
  const longshotCount = choiceFill.filter(c => c.strategyKey === 'longshot').length;

  if (!isLoaded) {
    return (
      <div className="py-20 text-center text-white/50">
        Loading choice order builder…
      </div>
    );
  }

  // ── 1. UNAUTHENTICATED CANDIDATE GATE ──
  if (!user) {
    return (
      <div className="container-custom py-10 max-w-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          📋
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
          <Lock className="h-3.5 w-3.5" />
          <span>Candidate Login Required</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight mb-2">
          Sign In to Access Choice Filling Sequencer
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 max-w-md mx-auto mb-6 leading-relaxed">
          Candidate login is necessary to sequence your MCC preference list, eliminate seat forfeiture mistakes, sync to Firebase, and claim your <strong className="text-teal-600 dark:text-teal-400">5 Free AI Predictions</strong>.
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
              <span>Auto-sort choices by historical closing cutoffs to avoid seat forfeiture</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Real-time Firebase Cloud persistence across phone, tablet &amp; laptop</span>
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
              Test Basic Free (5 Runs)
            </button>
            <button
              type="button"
              onClick={() => signInAsDemoCandidate('pro_vip')}
              className="flex-1 py-1.5 text-[11px] font-bold rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Crown className="h-3 w-3 text-amber-500" />
              <span>Test VIP Pass (Unlocked)</span>
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          title="Sign In to Access Choice Filling"
          subtitle="Login or create a candidate account to build your choice filling order and claim 5 Free AI Predictions."
        />
      </div>
    );
  }

  // ── 2. GATED PREMIUM LOCK STATE (Season Pass VIP Required) ──
  if (!tierCategory.canAccessChoiceFiller) {
    return (
      <div className="container-custom py-10 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
            <Crown className="h-3.5 w-3.5" />
            <span>VIP Counselling Feature</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            MCC Smart Choice Filling Sequencer
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 max-w-xl mx-auto mt-2 leading-relaxed">
            Eliminate choice submission mistakes. Auto-sort colleges by historical closing cutoffs, balance safety nets, and generate official MCC-formatted printouts.
          </p>
        </div>

        {/* Fatal Blunder Alert Banner */}
        <div className="p-4 sm:p-5 rounded-2xl border-l-4 border-l-rose-500 bg-rose-500/[0.08] dark:bg-rose-500/[0.06] border border-rose-500/20 mb-8 flex items-start gap-3.5 text-left">
          <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <strong className="font-bold text-rose-950 dark:text-rose-200 block text-sm">
              The #1 Choice Filling Fatal Mistake:
            </strong>
            <p className="text-slate-700 dark:text-white/80 leading-relaxed">
              In MCC counselling, once a seat is allotted from your list, <strong>all choices below it are permanently discarded</strong>. If you place a lower-tier safety college above an ambitious target college, you lose your dream seat forever — even if your NEET rank was completely eligible for it!
            </p>
            <p className="text-rose-700 dark:text-rose-300 font-semibold pt-0.5">
              💡 Our AI Auto-Sort automatically orders colleges by cutoff competitiveness to protect you from seat forfeiture.
            </p>
          </div>
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
                  <span>AI Smart Auto-Sort by Cutoff AIR</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Choice Order Blunder Sentinel</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Official MCC Print &amp; PDF Export</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Choice Balance Gauge (Safety vs Target)</span>
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
                <span>Unlock Season Pass VIP</span>
              </button>
              <span className="text-[11px] text-slate-500 dark:text-white/50">
                Use code <strong>NEETPRO</strong> for ₹50 off
              </span>
            </div>
          </div>
        </div>

        {/* Frosted Mockup Preview */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 opacity-70 pointer-events-none select-none">
          <div className="p-4 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-white/40">MCC Sequence Preview (Auto-Sorted Order)</span>
            <span className="badge bg-slate-200 dark:bg-white/10 text-slate-500 text-[10px]">VIP Demonstration</span>
          </div>

          <div className="p-5 space-y-2.5 filter blur-[1px]">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-700">#1</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">AIIMS, New Delhi (AIQ)</span>
              <span className="text-[11px] font-mono text-slate-500">Cutoff: ~55 AIR</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-700">#2</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Maulana Azad Medical College, New Delhi (AIQ)</span>
              <span className="text-[11px] font-mono text-slate-500">Cutoff: ~105 AIR</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-700">#3</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">VMMC &amp; Safdarjung Hospital, New Delhi (AIQ)</span>
              <span className="text-[11px] font-mono text-slate-500">Cutoff: ~140 AIR</span>
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
          feature="choice_fill"
        />
      </div>
    );
  }

  // ── UNLOCKED PREMIUM CHOICE FILLING VIEW ──
  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider mb-2">
            <BrandIcon size={18} />
            <span>MCC Choice Submission Sequencer (VIP Unlocked)</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              Choice Filling Order ({choiceFill.length} choices)
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300">
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
              {syncStatus === 'syncing' ? 'Syncing to Firebase…' : '✓ Synced with Firebase Cloud'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 mt-1">
            Order your choices strategically from dream targets to safety nets before locking on the MCC portal.
          </p>
        </div>

        {/* Action Buttons */}
        {choiceFill.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={smartSortChoices}
              className="btn-secondary py-2 px-3.5 text-xs flex items-center gap-1.5 cursor-pointer"
              title="Auto-sort choices by historical closing rank competitiveness"
            >
              <Wand2 className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span>AI Smart Sort</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Export / Print PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Choice List */}
      {choiceFill.length > 0 ? (
        <div className="space-y-4">
          {/* Strategy Distribution Bar */}
          <div className="glass-panel p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-700 dark:text-white/70">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-white/40 uppercase font-bold text-[10px]">Pillars:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">🟢 Safety: {safetyCount}</span>
              <span className="text-slate-300 dark:text-white/20">·</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">🟡 Target: {targetCount}</span>
              <span className="text-slate-300 dark:text-white/20">·</span>
              <span className="font-bold text-orange-700 dark:text-orange-300">🟠 Reach: {reachCount}</span>
              <span className="text-slate-300 dark:text-white/20">·</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">🔴 Longshot: {longshotCount}</span>
            </div>

            <div className="text-slate-500 dark:text-white/40 text-[11px]">
              Tip: Drag or use arrow keys to adjust sequence before locking
            </div>
          </div>

          <div className="space-y-2.5">
            {choiceFill.map((item, index) => {
              const bond = STATE_BOND_DATA[item.state];
              const fee = getEstimatedFee(item.name, item.quota);
              const pg = getInternalPgQuota(item.name);

              return (
                <div 
                  key={item.key}
                  className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-teal-500/30 transition-all group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Position Number */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/30 dark:border-teal-400/30 text-teal-700 dark:text-teal-300 font-black text-sm mono-font">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`badge strat-${item.strategyKey || 'target'}`}>
                          {(item.strategyKey || 'TARGET').toUpperCase()}
                        </span>
                        {item.collegeType && (
                          <span className="badge bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 border border-slate-200 dark:border-white/10 text-[10px]">
                            {item.collegeType}
                          </span>
                        )}
                        <span className="badge bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border border-indigo-500/20 text-[10px]">
                          {item.course}
                        </span>
                        <span className="badge bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 border border-slate-200 dark:border-white/5 text-[10px]">
                          {item.quota}
                        </span>
                        {pg && (
                          <span className="badge bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 text-[10px]">
                            50% Internal PG
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-950 dark:text-white text-sm leading-snug line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                        {item.name}
                      </h3>

                      <div className="text-[11px] text-slate-500 dark:text-white/50 flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                          <span>{item.state}</span>
                        </span>
                        <span>·</span>
                        <span className="mono-font text-teal-700 dark:text-teal-300 font-semibold">
                          ~{item.closingRank.toLocaleString()} AIR
                        </span>
                        <span>·</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {fee.annualFee}
                        </span>
                        <span>·</span>
                        <span className="text-amber-700 dark:text-amber-300">
                          {bond ? (bond.years === 0 ? 'No Bond' : `${bond.years} Yr Bond`) : 'No Bond'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ordering Arrows & Delete */}
                  <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                    <button
                      disabled={index === 0}
                      onClick={() => reorderChoices(index, index - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>

                    <button
                      disabled={index === choiceFill.length - 1}
                      onClick={() => reorderChoices(index, index + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => removeFromChoiceFill(item.key)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/15 hover:text-rose-700 dark:hover:text-rose-300 transition-all ml-1 cursor-pointer"
                      title="Remove Choice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-white/40">
            <span>Ready for MCC Locking: {choiceFill.length} colleges sequence</span>
            <button
              onClick={() => {
                if (confirm('Clear all choices in this list?')) {
                  clearChoiceFill();
                }
              }}
              className="text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset List</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-16 text-center">
          <ListOrdered className="h-12 w-12 text-slate-300 dark:text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Your Choice List is Empty</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 max-w-md mx-auto mb-6">
            Run the College Predictor and click the plus (+) button on colleges to add them to your personalized choice filling sequence.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/predict" className="btn-primary py-2.5 px-6 text-xs inline-flex items-center gap-2">
              <Compass className="h-4 w-4" />
              <span>Launch College Predictor</span>
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
