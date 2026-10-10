'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Sparkles,
  Building2,
  ListOrdered,
  Heart,
  Crown,
  Zap,
  CheckCircle2,
  ArrowRight,
  Search,
  FileText,
  Phone,
  RefreshCw,
  Award,
  ChevronRight,
  Sliders,
  ExternalLink,
  Activity,
  Target,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  Layers,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useUserData } from '@/lib/store/useUserData';
import { getCollegeData } from '@/lib/engine/collegeData';
import { CollegeIndexEntry, CutoffRecord, MasterCollege } from '@/lib/engine/types';
import { STATE_BOND_DATA, STATE_STIPEND_DATA } from '@/lib/engine/collegeIntelligence';
import { initiateCheckout } from '@/lib/payment/paymentService';
import { PaymentCelebrationModal } from '@/components/payment/PaymentCelebrationModal';

interface ProCandidateDashboardProps {
  onSwitchToPublic?: () => void;
}

export const ProCandidateDashboard: React.FC<ProCandidateDashboardProps> = ({ onSwitchToPublic }) => {
  const router = useRouter();
  const { user, profile, tierCategory, updateProfileData, activateVerifiedTier } = useAuth();
  const { wishlist, choiceFill } = useUserData();

  // Profile edit states
  const [editingProfile, setEditingProfile] = useState(false);
  const [candidateRank, setCandidateRank] = useState<string>(
    profile?.rank || '12500'
  );
  const [candidateScore, setCandidateScore] = useState<string>(
    profile?.score || '645'
  );
  const [candidateCategory, setCandidateCategory] = useState<string>(
    profile?.category || 'Open'
  );
  const [candidateState, setCandidateState] = useState<string>(
    profile?.state || 'Delhi'
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick College Cutoff Radar states
  const [collegeData, setCollegeData] = useState<{
    records: CutoffRecord[];
    index: Map<string, CollegeIndexEntry>;
    masterColleges: MasterCollege[];
  } | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState('');

  // Upgrade Celebration state
  const [celebration, setCelebration] = useState<{ open: boolean; planKey: string; paymentId: string }>({
    open: false,
    planKey: 'season',
    paymentId: '',
  });

  // Sync profile values when profile loads
  useEffect(() => {
    if (profile?.rank) setCandidateRank(profile.rank);
    if (profile?.score) setCandidateScore(profile.score);
    if (profile?.category) setCandidateCategory(profile.category);
    if (profile?.state) setCandidateState(profile.state);
  }, [profile]);

  // Load college data for in-dashboard radar
  useEffect(() => {
    let isMounted = true;
    setLoadingData(true);
    getCollegeData()
      .then((data) => {
        if (isMounted) {
          setCollegeData(data);
          setLoadingData(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load in-dashboard cutoff records:', err);
        if (isMounted) setLoadingData(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfileData({
        rank: candidateRank,
        score: candidateScore,
        category: candidateCategory,
        state: candidateState,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingProfile(false);
      }, 1000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpgradeToSeason = async () => {
    if (!user) return;
    await initiateCheckout({
      planKey: 'upgrade',
      couponCode: '',
      user,
      onSuccess: async (paymentId) => {
        await activateVerifiedTier('pro_vip', paymentId);
        setCelebration({ open: true, planKey: 'upgrade', paymentId });
      },
    });
  };

  const isVip = tierCategory.type === 'pro_vip';
  const isProPlus = tierCategory.type === 'pro_plus';
  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Aspirant';

  // Compute Counselling Readiness
  const readinessChecks = [
    {
      id: 'credentials',
      label: 'NEET AIR & Category configured',
      completed: Boolean(profile?.rank || candidateRank),
      actionLabel: 'Edit',
      onClick: () => setEditingProfile(true)
    },
    {
      id: 'wishlist',
      label: `Colleges shortlisted in Wishlist (${wishlist.length} saved)`,
      completed: wishlist.length > 0,
      actionLabel: 'Wishlist',
      href: '/wishlist'
    },
    {
      id: 'choiceFill',
      label: `Choice filling sequence arranged (${choiceFill.length} added)`,
      completed: choiceFill.length > 0,
      actionLabel: 'Sequencer',
      href: '/choice-fill'
    },
    {
      id: 'bond',
      label: `State Bond & Stipend verified (${candidateState || 'Select State'})`,
      completed: Boolean(candidateState),
      actionLabel: 'Check Bonds',
      href: '/colleges'
    },
  ];

  const completedChecksCount = readinessChecks.filter((c) => c.completed).length;
  const readinessPercent = Math.round((completedChecksCount / readinessChecks.length) * 100);

  // Quick Radar Filtered Colleges
  const previewColleges = useMemo(() => {
    if (!collegeData?.index) return [];
    const entries = Array.from(collegeData.index.values());
    return entries
      .filter((col) => {
        const matchesQuery =
          !searchQuery ||
          col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          col.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          col.institute.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesState = !selectedStateFilter || col.state === selectedStateFilter;
        return matchesQuery && matchesState;
      })
      .slice(0, 6);
  }, [collegeData, searchQuery, selectedStateFilter]);

  const parsedAirNumber = parseInt((candidateRank || '0').replace(/,/g, ''), 10);
  const formattedAir = !isNaN(parsedAirNumber) && parsedAirNumber > 0
    ? `#${parsedAirNumber.toLocaleString('en-IN')}`
    : 'Not Configured';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#060a12] dark:text-white pb-24 transition-colors duration-200">
      {/* ─── TOP VIP HERO COCKPIT ─── */}
      <section className="relative overflow-hidden pt-8 pb-14 border-b border-slate-200/90 dark:border-white/10 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#0d1527] dark:via-[#090e1a] dark:to-[#060a12]">
        {/* Ambient luminous glow backdrops */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[360px] bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-[500px] h-[360px] bg-amber-500/10 dark:bg-amber-500/12 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[200px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="container-custom relative z-10">
          {/* Top Session Indicator & Public View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Live Candidate Session Active
              </span>
              <span className="text-xs text-slate-400 dark:text-white/40 hidden sm:inline">•</span>
              <span className="text-xs text-slate-600 dark:text-white/60 font-medium hidden sm:inline">
                MCC 2026 AIQ &amp; 36 States Dual-Year Intelligence Engine
              </span>
            </div>

            {onSwitchToPublic && (
              <button
                onClick={onSwitchToPublic}
                className="text-xs font-semibold text-slate-700 dark:text-white/80 hover:text-slate-950 dark:hover:text-white flex items-center gap-1.5 transition-all px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 shadow-sm"
              >
                <span>View Public Landing Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Candidate Greeting & Live Cockpit Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              {/* Doctor Avatar + Greeting + Tier Badge */}
              <div className="flex flex-wrap items-center gap-3.5 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500/20 via-cyan-500/15 to-emerald-500/20 border border-teal-500/40 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(20,184,166,0.3)] shrink-0">
                  🩺
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                      Welcome back,{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 dark:from-teal-300 dark:via-emerald-300 dark:to-cyan-400">
                        Dr. {displayName}
                      </span>
                    </h1>

                    {/* Premium Tier Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black border tracking-wide uppercase shadow-sm ${
                        isVip
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                      }`}
                    >
                      <span className="text-sm">{tierCategory.icon}</span>
                      <span>{tierCategory.label}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-white/70 max-w-2xl leading-relaxed mb-6 font-normal">
                Your medical admission command center is active. Access calibrated dual-year MCC cutoff models, 750+ verified medical colleges, intelligent choice sequence algorithms, and live cloud sync.
              </p>

              {/* ─── CANDIDATE CREDENTIALS COCKPIT ─── */}
              <div className="p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200/70 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/80">
                      Active NEET Counselling Profile
                    </span>
                  </div>

                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-300/80 dark:border-white/20 text-slate-900 dark:text-white flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Sliders className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{editingProfile ? 'Close Editor' : 'Edit Rank & Domicile'}</span>
                  </button>
                </div>

                {/* 4 Stat Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Stat 1: AIR */}
                  <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-500/10 border border-teal-200/80 dark:border-teal-500/25">
                    <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300/80 block uppercase tracking-wider mb-1">
                      Candidate AIR
                    </span>
                    <span className="font-black text-slate-950 dark:text-teal-300 text-lg sm:text-xl block tracking-tight">
                      {formattedAir}
                    </span>
                    <span className="text-[10px] text-teal-700 dark:text-teal-400/80 font-medium mt-0.5 block">
                      All India Rank
                    </span>
                  </div>

                  {/* Stat 2: Score */}
                  <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-500/10 border border-cyan-200/80 dark:border-cyan-500/25">
                    <span className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300/80 block uppercase tracking-wider mb-1">
                      NEET Score
                    </span>
                    <span className="font-black text-slate-950 dark:text-cyan-200 text-lg sm:text-xl block tracking-tight">
                      {candidateScore ? `${candidateScore} / 720` : 'Not Set'}
                    </span>
                    <span className="text-[10px] text-cyan-700 dark:text-cyan-400/80 font-medium mt-0.5 block">
                      Total Marks
                    </span>
                  </div>

                  {/* Stat 3: Category */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/25">
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300/80 block uppercase tracking-wider mb-1">
                      Category
                    </span>
                    <span className="font-black text-slate-950 dark:text-amber-300 text-lg sm:text-xl block tracking-tight line-clamp-1">
                      {candidateCategory}
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400/80 font-medium mt-0.5 block">
                      AIQ &amp; State Quota
                    </span>
                  </div>

                  {/* Stat 4: State Domicile */}
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-500/10 border border-purple-200/80 dark:border-purple-500/25">
                    <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300/80 block uppercase tracking-wider mb-1">
                      Home State
                    </span>
                    <span className="font-black text-slate-950 dark:text-purple-300 text-lg sm:text-xl block tracking-tight line-clamp-1">
                      {candidateState}
                    </span>
                    <span className="text-[10px] text-purple-700 dark:text-purple-400/80 font-medium mt-0.5 block">
                      85% State Quota
                    </span>
                  </div>
                </div>

                {/* Inline Quick Profile Editor */}
                {editingProfile && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        Configure Real NEET Credentials
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-white/50">
                        Updates cloud sync across all tools
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-slate-700 dark:text-white/70 font-semibold block mb-1">
                          NEET AIR Rank
                        </label>
                        <input
                          type="number"
                          value={candidateRank}
                          onChange={(e) => setCandidateRank(e.target.value)}
                          placeholder="e.g. 12500"
                          className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="text-slate-700 dark:text-white/70 font-semibold block mb-1">
                          NEET Score (/ 720)
                        </label>
                        <input
                          type="number"
                          value={candidateScore}
                          onChange={(e) => setCandidateScore(e.target.value)}
                          placeholder="e.g. 645"
                          className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="text-slate-700 dark:text-white/70 font-semibold block mb-1">
                          Reservation Category
                        </label>
                        <select
                          value={candidateCategory}
                          onChange={(e) => setCandidateCategory(e.target.value)}
                          className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-sm"
                        >
                          <option value="Open">Open (General)</option>
                          <option value="OBC">OBC</option>
                          <option value="EWS">EWS</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                          <option value="Open PwD">Open PwD</option>
                          <option value="OBC PwD">OBC PwD</option>
                          <option value="SC PwD">SC PwD</option>
                          <option value="ST PwD">ST PwD</option>
                          <option value="EWS PwD">EWS PwD</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-700 dark:text-white/70 font-semibold block mb-1">
                          Home State Domicile
                        </label>
                        <select
                          value={candidateState}
                          onChange={(e) => setCandidateState(e.target.value)}
                          className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-sm"
                        >
                          {Object.keys(STATE_BOND_DATA).sort().map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2.5">
                      {saveSuccess && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Saved to Cloud!
                        </span>
                      )}
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-white/60 hover:text-slate-950 dark:hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5"
                      >
                        {savingProfile && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{savingProfile ? 'Saving…' : 'Save Credentials'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── COUNSELLING READINESS & LAUNCH COCKPIT CARD ─── */}
            <div className="lg:col-span-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 shadow-xl dark:shadow-[0_15px_35px_rgba(0,0,0,0.4)] backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-white/70 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Counselling Readiness
                    </span>
                    <span className="text-sm font-black px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300">
                      {readinessPercent}% Ready
                    </span>
                  </div>

                  {/* Gradient Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-5">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 transition-all duration-700 rounded-full"
                      style={{ width: `${readinessPercent}%` }}
                    />
                  </div>

                  {/* Interactive Checklist */}
                  <div className="space-y-2.5 mb-6">
                    {readinessChecks.map((check) => (
                      <div
                        key={check.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {check.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-white/30 shrink-0" />
                          )}
                          <span className={check.completed ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-500 dark:text-white/50'}>
                            {check.label}
                          </span>
                        </div>

                        {check.href ? (
                          <Link
                            href={check.href}
                            className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                          >
                            {check.actionLabel} →
                          </Link>
                        ) : check.onClick ? (
                          <button
                            onClick={check.onClick}
                            className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                          >
                            {check.actionLabel} →
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/predict?rank=${candidateRank || '12500'}&cat=${encodeURIComponent(candidateCategory)}&inputMode=rank`}
                  className="w-full py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Compass className="w-4 h-4 text-slate-950" />
                  <span>Launch Unlimited AI Predictor</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4 CORE POWER MODULE TILES ─── */}
      <section className="container-custom py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Intelligence Suite</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              VIP Counselling Tools &amp; Command Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 mt-1">
              Calibrated with official MCC 2024 &amp; 2025 closing allotments across 750+ medical institutes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: AI Predictor */}
          <Link
            href={`/predict?rank=${candidateRank || '12500'}&cat=${encodeURIComponent(candidateCategory)}&inputMode=rank`}
            className="group relative p-7 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 hover:border-teal-500/50 dark:hover:border-teal-400/50 shadow-md hover:shadow-xl dark:hover:shadow-[0_20px_40px_rgba(20,184,166,0.2)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div>
              <div className="w-13 h-13 rounded-2xl bg-teal-500/15 border border-teal-500/35 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <Compass className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 mb-2.5">
                753 Colleges Indexed
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                AI College Predictor
              </h3>
              <p className="text-xs text-slate-600 dark:text-white/65 mt-2 leading-relaxed">
                Run unlimited cutoff forecasts across 15% All India Quota, 85% State Quota, AIIMS, and Deemed medical universities.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-400">
              <span>Run Cutoff Forecast</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Choice Filling Sequencer */}
          <Link
            href="/choice-fill"
            className="group relative p-7 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-amber-400/50 shadow-md hover:shadow-xl dark:hover:shadow-[0_20px_40px_rgba(245,158,11,0.2)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div>
              <div className="w-13 h-13 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <ListOrdered className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 mb-2.5">
                <span>{choiceFill.length}</span> Choices in Sequence
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                Choice Filling Sequencer
              </h3>
              <p className="text-xs text-slate-600 dark:text-white/65 mt-2 leading-relaxed">
                Empirical algorithm-driven choice list designed to maximize allotment chances while preventing rural bond traps.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
              <span>Open Sequencer Matrix</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Wishlist & Shortlist */}
          <Link
            href="/wishlist"
            className="group relative p-7 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 hover:border-pink-500/50 dark:hover:border-pink-400/50 shadow-md hover:shadow-xl dark:hover:shadow-[0_20px_40px_rgba(236,72,153,0.2)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div>
              <div className="w-13 h-13 rounded-2xl bg-pink-500/15 border border-pink-500/35 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <Heart className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/15 text-pink-800 dark:text-pink-300 border border-pink-500/30 mb-2.5">
                <span>{wishlist.length}</span> Saved Colleges
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
                Candidate Wishlist
              </h3>
              <p className="text-xs text-slate-600 dark:text-white/65 mt-2 leading-relaxed">
                Shortlisted dream, target, and safe medical colleges synchronized to cloud storage across all candidate devices.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs font-bold text-pink-700 dark:text-pink-400">
              <span>View Saved Colleges</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Colleges, Bonds & Fees Matrix */}
          <Link
            href="/colleges"
            className="group relative p-7 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 shadow-md hover:shadow-xl dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.2)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div>
              <div className="w-13 h-13 rounded-2xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 mb-2.5">
                36 States Intelligence
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                Colleges &amp; Fee Matrix
              </h3>
              <p className="text-xs text-slate-600 dark:text-white/65 mt-2 leading-relaxed">
                State-wise mandatory rural service bonds, penalty amounts, government vs private tuition, and intern stipends.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs font-bold text-cyan-700 dark:text-cyan-400">
              <span>Explore 750+ Colleges</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* ─── UPGRADE TO SEASON PASS BANNER (For Pro Plus / Basic Pass holders) ─── */}
      {!isVip && (
        <section className="container-custom py-4">
          <div className="relative overflow-hidden p-6 sm:p-9 rounded-3xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-teal-500/10 dark:from-[#2a1e0b] dark:via-[#19140b] dark:to-[#0a1815] border-2 border-amber-500/40 shadow-2xl dark:shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-amber-500/20">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Exclusive Upgrade Offer
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/35">
                    Save ₹150 · Pay Only Difference
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                  Upgrade from Basic Pass to Season Pass VIP
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-white/75 max-w-xl mt-1.5 leading-relaxed">
                  Pay only ₹150 to unlock 85% State Quota (36 States), Smart Choice Filling Sequencer, PDF Export, and all MCC counselling rounds.
                </p>
              </div>
            </div>

            <button
              onClick={handleUpgradeToSeason}
              className="px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shrink-0 shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-slate-950" />
              <span>Upgrade to VIP for ₹150</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ─── IN-DASHBOARD CUTOFF & BOND RADAR ─── */}
      <section className="container-custom py-8">
        <div className="p-7 sm:p-9 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-lg dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                  <Search className="w-4 h-4" />
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                  Direct College Cutoff Radar
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                Instantly check verified 2024 &amp; 2025 MCC closing ranks for any medical institute without navigating away.
              </p>
            </div>

            {/* Search Input & State Filter Dropdown */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search college (e.g. AIIMS, KGMU)..."
                  className="bg-slate-50 dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded-xl px-3.5 py-2 pl-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none w-56 sm:w-64 transition-all shadow-sm"
                />
                <Search className="w-4 h-4 text-slate-400 dark:text-white/40 absolute left-3 top-2.5" />
              </div>

              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="bg-slate-50 dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-sm"
              >
                <option value="">All 36 States</option>
                {Object.keys(STATE_BOND_DATA).sort().map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* College Cards Grid */}
          {loadingData ? (
            <div className="py-14 text-center text-slate-500 dark:text-white/50 flex items-center justify-center gap-2.5 text-xs font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
              <span>Indexing official MCC cutoff records…</span>
            </div>
          ) : previewColleges.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-white/50 text-xs">
              No matching medical colleges found. Try a different search query or state filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {previewColleges.map((col, idx) => {
                const bond = STATE_BOND_DATA[col.state];
                const stipend = STATE_STIPEND_DATA[col.state];

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.025] border border-slate-200/80 dark:border-white/10 hover:border-teal-500/40 dark:hover:border-teal-400/40 transition-all flex flex-col justify-between shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-white/90">
                          {col.state}
                        </span>
                        <span className="text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                          {col.masterInfo?.management || 'Government'}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-950 dark:text-white mt-2.5 line-clamp-1" title={col.name}>
                        {col.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-white/50 line-clamp-1 mt-0.5">
                        {col.institute}
                      </p>

                      {/* State Intelligence Mini-Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="text-slate-500 dark:text-white/40 block text-[10px] font-medium">Service Bond</span>
                          <span className="font-bold text-amber-700 dark:text-amber-400">
                            {bond ? `${bond.years} Yrs (${bond.penalty})` : 'No Bond'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-white/40 block text-[10px] font-medium">Intern Stipend</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {stipend ? stipend.display : 'Govt Norms'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                      <Link
                        href={`/predict?rank=${candidateRank || '12500'}&cat=${encodeURIComponent(candidateCategory)}&inputMode=rank`}
                        className="text-teal-700 dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 font-black flex items-center gap-1"
                      >
                        <span>Check Cutoff</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href="/colleges"
                        className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white text-[11px] font-semibold"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/colleges"
              className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300"
            >
              <span>Explore All 750+ Medical Colleges &amp; Complete Fee Matrices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── VIP CANDIDATE PERKS & OFFICIAL DOWNLOADS ─── */}
      <section className="container-custom py-8">
        <h3 className="text-lg font-black text-slate-950 dark:text-white mb-5 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Verified Candidate Resources &amp; Official Portals
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 flex items-start gap-4 shadow-sm">
            <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-950 dark:text-white">MCC Information Bulletin</h4>
              <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Official counselling rules, security deposit refund protocols, and eligibility norms.</p>
              <a
                href="https://mcc.nic.in"
                target="_blank"
                rel="noreferrer"
                className="mt-3.5 inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300"
              >
                <span>Visit MCC Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 flex items-start gap-4 shadow-sm">
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-950 dark:text-white">State DME Portals</h4>
              <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Direct official links for KEA Karnataka, DME Maharashtra, UPDGME, and WBMCC.</p>
              <Link
                href="/support"
                className="mt-3.5 inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
              >
                <span>View State Portals</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 flex items-start gap-4 shadow-sm">
            <div className="p-3 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-600 dark:text-pink-400 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-950 dark:text-white">Priority VIP Support</h4>
              <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Dedicated assistance with pass activation, device synchronization, and cutoff queries.</p>
              <Link
                href="/support"
                className="mt-3.5 inline-flex items-center gap-1 text-xs font-bold text-pink-700 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300"
              >
                <span>Contact VIP Desk</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Post-Purchase Celebration Modal */}
      {celebration.open && (
        <PaymentCelebrationModal
          planKey={celebration.planKey}
          paymentId={celebration.paymentId}
          onClose={() => setCelebration({ open: false, planKey: 'season', paymentId: '' })}
        />
      )}
    </div>
  );
};
