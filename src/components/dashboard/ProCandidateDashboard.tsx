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
  Activity
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
    await updateProfileData({
      rank: candidateRank,
      score: candidateScore,
      category: candidateCategory,
      state: candidateState,
    });
    setEditingProfile(false);
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
  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Aspirant';

  // Compute Counselling Readiness
  const readinessChecks = [
    { label: 'NEET AIR & Category configured', completed: Boolean(profile?.rank || candidateRank) },
    { label: 'Colleges shortlisted in Wishlist', completed: wishlist.length > 0 },
    { label: 'Choice filling order organized', completed: choiceFill.length > 0 },
    { label: 'State Bond & Penalty policy verified', completed: Boolean(candidateState) },
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
          col.state.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesState = !selectedStateFilter || col.state === selectedStateFilter;
        return matchesQuery && matchesState;
      })
      .slice(0, 6);
  }, [collegeData, searchQuery, selectedStateFilter]);

  return (
    <div className="min-h-screen bg-[#070710] text-white pb-20">
      {/* ─── TOP VIP HERO BANNER ─── */}
      <section className="relative overflow-hidden pt-8 pb-12 border-b border-white/10 bg-gradient-to-b from-[#0f172a]/60 via-[#0b0f19] to-[#070710]">
        {/* Ambient glow backdrop */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-[400px] h-[300px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="container-custom relative z-10">
          {/* Top Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Candidate Session Active
              </span>
              <span className="text-xs text-white/40 hidden sm:inline">•</span>
              <span className="text-xs text-white/50 hidden sm:inline">
                MCC 2024 &amp; 2025 Allotment Intelligence Engine
              </span>
            </div>

            {onSwitchToPublic && (
              <button
                onClick={onSwitchToPublic}
                className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5"
              >
                <span>View Public Landing Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Candidate Greeting & VIP Membership Badge */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400">Dr. {displayName}</span>
                </h1>
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                  style={{
                    backgroundColor: tierCategory.badgeBg || 'rgba(245, 158, 11, 0.15)',
                    borderColor: tierCategory.badgeColor || '#fbbf24',
                    color: tierCategory.badgeColor || '#fbbf24',
                  }}
                >
                  <span>{tierCategory.icon}</span>
                  <span>{tierCategory.label}</span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-white/70 max-w-2xl leading-relaxed">
                Your medical admission command center is fully unlocked with dual-year MCC cutoff algorithms, 750+ verified medical colleges, smart choice sequencing, and live cloud sync.
              </p>

              {/* Candidate Info Quick Bar */}
              <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                  <div>
                    <span className="text-xs text-white/40 block">Candidate AIR</span>
                    <span className="font-bold text-teal-400 text-base">
                      {candidateRank ? `#${parseInt(candidateRank.replace(/,/g, '') || '0').toLocaleString('en-IN')}` : 'Not set'}
                    </span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
                  <div>
                    <span className="text-xs text-white/40 block">NEET Score</span>
                    <span className="font-bold text-white text-base">
                      {candidateScore ? `${candidateScore} / 720` : 'Not set'}
                    </span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
                  <div>
                    <span className="text-xs text-white/40 block">Category</span>
                    <span className="font-semibold text-amber-400">{candidateCategory}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
                  <div>
                    <span className="text-xs text-white/40 block">Home Domicile</span>
                    <span className="font-semibold text-white/90">{candidateState}</span>
                  </div>
                </div>

                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/20 text-white flex items-center gap-1.5 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5 text-teal-400" />
                  <span>{editingProfile ? 'Close Editor' : 'Update Rank & Score'}</span>
                </button>
              </div>

              {/* Inline Quick Profile Editor */}
              {editingProfile && (
                <div className="mt-3 p-4 rounded-2xl bg-white/[0.06] border border-teal-500/30 backdrop-blur-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Configure Your Real NEET Credentials
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-white/60 block mb-1">NEET AIR Rank</label>
                      <input
                        type="number"
                        value={candidateRank}
                        onChange={(e) => setCandidateRank(e.target.value)}
                        placeholder="e.g. 12500"
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white font-mono focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 block mb-1">NEET Score (out of 720)</label>
                      <input
                        type="number"
                        value={candidateScore}
                        onChange={(e) => setCandidateScore(e.target.value)}
                        placeholder="e.g. 645"
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white font-mono focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 block mb-1">Category</label>
                      <select
                        value={candidateCategory}
                        onChange={(e) => setCandidateCategory(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
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
                      <label className="text-white/60 block mb-1">Home State</label>
                      <select
                        value={candidateState}
                        onChange={(e) => setCandidateState(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                      >
                        {Object.keys(STATE_BOND_DATA).sort().map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="px-3 py-1.5 text-xs text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-black transition-colors"
                    >
                      Save Credentials
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Counselling Readiness & Fast Launch Card */}
            <div className="lg:col-span-4">
              <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    Counselling Readiness
                  </span>
                  <span className="text-sm font-extrabold text-teal-400">{readinessPercent}%</span>
                </div>

                {/* Progress track */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${readinessPercent}%` }}
                  />
                </div>

                <div className="space-y-2 mb-4">
                  {readinessChecks.map((check, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {check.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-white/30 shrink-0" />
                      )}
                      <span className={check.completed ? 'text-white/90' : 'text-white/40'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/predict?rank=${candidateRank || '12500'}&cat=${encodeURIComponent(candidateCategory)}&inputMode=rank`}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 text-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,170,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Compass className="w-4 h-4" />
                  <span>Launch Unlimited AI Predictor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4 CORE POWER MODULE TILES ─── */}
      <section className="container-custom py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              VIP Counselling Tools &amp; Intelligence Modules
            </h2>
            <p className="text-xs sm:text-sm text-white/50">
              One-click access to all licensed features calibrated with official MCC allotment records.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: AI Predictor */}
          <Link
            href={`/predict?rank=${candidateRank || '12500'}&cat=${encodeURIComponent(candidateCategory)}&inputMode=rank`}
            className="group relative p-6 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-teal-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,229,170,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-2">
                753 Colleges Indexed
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                AI College Predictor
              </h3>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                Run unlimited cutoff forecasts across All India Quota, State Quota, AIIMS, and Deemed medical colleges.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-teal-400">
              <span>Predict Chances</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Smart Choice Filling Sequencer */}
          <Link
            href="/choice-fill"
            className="group relative p-6 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(245,158,11,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <ListOrdered className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                <span>{choiceFill.length}</span> Choices in Sequence
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                Choice Filling Sequencer
              </h3>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                Algorithm-sorted preference list designed to maximize allotment chances while avoiding bond penalty traps.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Open Sequencer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Wishlist & Shortlist */}
          <Link
            href="/wishlist"
            className="group relative p-6 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-pink-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(236,72,153,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 mb-2">
                <span>{wishlist.length}</span> Saved Colleges
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
                Candidate Wishlist
              </h3>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                Shortlisted dream, target, and safe medical colleges safely synchronized across all candidate devices.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-pink-400">
              <span>View Saved Colleges</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Colleges, Bonds & Fees Directory */}
          <Link
            href="/colleges"
            className="group relative p-6 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(56,189,248,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-2">
                Fees &amp; Bonds Radar
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Colleges &amp; Fee Matrix
              </h3>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                State-wise mandatory rural service bonds, penalty amounts, hostel charges, and monthly intern stipends.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span>Explore 750+ Colleges</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* ─── UPGRADE TO SEASON PASS BANNER (For Pro Plus / Basic Pass holders) ─── */}
      {!isVip && (
        <section className="container-custom py-4">
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-teal-500/10 border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.15)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Special Upgrade Offer</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Save ₹150</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  Upgrade from Pro Plus to Season Pass 2026 (VIP)
                </h3>
                <p className="text-xs sm:text-sm text-white/70 max-w-xl mt-1">
                  Pay only the difference (₹150) to unlock State Quota (85%), Smart Choice Filling Sequencer, Wishlist sync, and all MCC counselling rounds.
                </p>
              </div>
            </div>

            <button
              onClick={handleUpgradeToSeason}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black shrink-0 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Crown className="w-4 h-4 text-black" />
              <span>Upgrade to VIP for ₹150</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ─── IN-DASHBOARD CUTOFF & BOND RADAR ─── */}
      <section className="container-custom py-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-teal-500/20 text-teal-400">
                  <Search className="w-4 h-4" />
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Direct College Cutoff Radar
                </h3>
              </div>
              <p className="text-xs text-white/50 mt-1">
                Instantly check verified 2024 &amp; 2025 MCC closing ranks for any medical institute without navigating away.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search college (e.g. AIIMS, KGMU)..."
                  className="bg-black/40 border border-white/20 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-white/40 focus:border-teal-400 focus:outline-none w-56 sm:w-64"
                />
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
              </div>

              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none"
              >
                <option value="">All States</option>
                {Object.keys(STATE_BOND_DATA).sort().map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* College Cards Grid */}
          {loadingData ? (
            <div className="py-12 text-center text-white/40 flex items-center justify-center gap-2 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              <span>Indexing cutoff records…</span>
            </div>
          ) : previewColleges.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-xs">
              No matching colleges found. Try a different search query or state filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewColleges.map((col, idx) => {
                const bond = STATE_BOND_DATA[col.state];
                const stipend = STATE_STIPEND_DATA[col.state];

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white/80">
                          {col.state}
                        </span>
                        <span className="text-[10px] font-bold text-teal-400">
                          {col.masterInfo?.management || 'Government'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-2 line-clamp-1" title={col.name}>
                        {col.name}
                      </h4>
                      <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5">
                        {col.institute}
                      </p>

                      {/* State Intelligence Mini-Bar */}
                      <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-white/40 block text-[10px]">Service Bond</span>
                          <span className="font-semibold text-amber-400">
                            {bond ? `${bond.years} Yrs (${bond.penalty})` : 'No Bond'}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[10px]">Intern Stipend</span>
                          <span className="font-semibold text-emerald-400">
                            {stipend ? stipend.display : 'Govt Norms'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <Link
                        href={`/predict?rank=${candidateRank || '12500'}&cat=${encodeURIComponent(candidateCategory)}`}
                        className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
                      >
                        <span>Check Cutoff</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <Link
                        href="/colleges"
                        className="text-white/50 hover:text-white text-[11px]"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/colleges"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300"
            >
              <span>Explore All 750+ Medical Colleges &amp; Fee Matrices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── VIP CANDIDATE PERKS & DOWNLOADS ─── */}
      <section className="container-custom py-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-400" />
          Candidate Perks &amp; Verified Official Downloads
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">MCC Information Bulletin</h4>
              <p className="text-xs text-white/50 mt-1">Official counselling rules, security deposit refunds, and eligibility criteria.</p>
              <a
                href="https://mcc.nic.in"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-400 hover:text-teal-300"
              >
                <span>Visit MCC Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">State DME Counselling List</h4>
              <p className="text-xs text-white/50 mt-1">Direct links for KEA Karnataka, DME Maharashtra, UPDGME, and WBMCC portals.</p>
              <Link
                href="/support"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                <span>View State Portals</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Priority VIP Support</h4>
              <p className="text-xs text-white/50 mt-1">Assistance with pass activation, device synchronization, and cutoff questions.</p>
              <Link
                href="/support"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-pink-400 hover:text-pink-300"
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
