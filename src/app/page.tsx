'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Target,
  Flame,
  ArrowRight,
  Send,
  Crown,
  Check,
  HelpCircle,
  Building2,
  Lock,
  ChevronDown,
  ChevronUp,
  Gift,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { scoreToRank } from '@/lib/engine/scoreToRank';
import { BrandIcon } from '@/components/common/BrandIcon';
import { useAuth } from '@/lib/firebase/AuthContext';
import { initiateCheckout, validateCoupon } from '@/lib/payment/paymentService';
import { PaymentCelebrationModal } from '@/components/payment/PaymentCelebrationModal';
import { ProCandidateDashboard } from '@/components/dashboard/ProCandidateDashboard';
import { STATS } from '@/lib/constants';

export default function HomePage() {
  const router = useRouter();
  const { user, profile, tierCategory, activateVerifiedTier } = useAuth();
  const [showPublicView, setShowPublicView] = useState(false);
  const [inputMode, setInputMode] = useState<'rank' | 'score'>('rank');
  const [rankValue, setRankValue] = useState<string>('12500');
  const [scoreValue, setScoreValue] = useState<string>('645');
  const [category, setCategory] = useState<string>('Open');
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountApplied, setDiscountApplied] = useState<boolean>(false);
  const [couponDiscountRupees, setCouponDiscountRupees] = useState<number>(0);
  const [couponFinalAmount, setCouponFinalAmount] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string>('');
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<{ open: boolean; planKey: string; paymentId: string }>({
    open: false,
    planKey: 'season',
    paymentId: '',
  });

  const isPro = tierCategory.type === 'pro_vip' || tierCategory.type === 'pro_plus' || Boolean(profile?.isPremium);

  if (isPro && !showPublicView) {
    return (
      <ProCandidateDashboard onSwitchToPublic={() => setShowPublicView(true)} />
    );
  }

  const handleCheckoutPlan = async (planKey: 'basic' | 'season') => {
    if (!user) {
      router.push(`/account?plan=${planKey}`);
      return;
    }

    setCheckoutError('');
    setCheckoutLoading(true);
    try {
      await initiateCheckout({
        planKey,
        couponCode: discountApplied ? couponCode : '',
        user,
        onSuccess: async ({ paymentId, tier }) => {
          await activateVerifiedTier(tier, paymentId);
          setCelebration({ open: true, planKey, paymentId });
        },
        onDismiss: () => setCheckoutLoading(false),
        onError: (err) => setCheckoutError(err.message || 'Could not start checkout. Please try again.'),
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleUpgradeToSeason = async () => {
    if (!user) {
      router.push('/account?plan=upgrade');
      return;
    }
    setCheckoutError('');
    setCheckoutLoading(true);
    try {
      await initiateCheckout({
        planKey: 'upgrade',
        couponCode: '',
        user,
        onSuccess: async ({ paymentId, tier }) => {
          await activateVerifiedTier(tier, paymentId);
          setCelebration({ open: true, planKey: 'upgrade', paymentId });
        },
        onDismiss: () => setCheckoutLoading(false),
        onError: (err) => setCheckoutError(err.message || 'Could not start checkout. Please try again.'),
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleQuickPredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'rank') {
      const parsedRank = parseInt(rankValue.replace(/,/g, ''), 10) || 12500;
      router.push(`/predict?rank=${parsedRank}&cat=${encodeURIComponent(category)}&inputMode=rank&claimed=true`);
    } else {
      const parsedScore = parseInt(scoreValue, 10) || 645;

      router.push(`/predict?score=${parsedScore}&cat=${encodeURIComponent(category)}&inputMode=score&claimed=true`);
    }
  };

  const parsedScore = parseInt(scoreValue, 10);
  const estimatedAir = !isNaN(parsedScore) && parsedScore >= 100 && parsedScore <= 720
    ? scoreToRank(parsedScore)
    : null;

  const currentRank = inputMode === 'rank'
    ? (parseInt(rankValue.replace(/,/g, ''), 10) || 12500)
    : (estimatedAir || 12500);

  const getTeaserColleges = (r: number) => {
    if (r <= 60) return [
      { chip: 'AIIMS', chipClass: 'chip-AIIMS', name: 'AIIMS, New Delhi', pct: '99%', status: 'Target R1', cutoff: '47 AIR' },
      { chip: 'GMC', chipClass: 'chip-GMC', name: 'Maulana Azad Medical College (MAMC)', pct: '98%', status: 'Very Safe', cutoff: '145 AIR' },
      { chip: 'JIPMER', chipClass: 'chip-Govt', name: 'JIPMER, Puducherry', pct: '97%', status: 'Very Safe', cutoff: '277 AIR' },
    ];
    if (r <= 500) return [
      { chip: 'GMC', chipClass: 'chip-GMC', name: 'Maulana Azad Medical College (MAMC)', pct: '91%', status: 'Target R1', cutoff: '145 AIR' },
      { chip: 'JIPMER', chipClass: 'chip-Govt', name: 'JIPMER, Puducherry', pct: '85%', status: 'Competitive', cutoff: '277 AIR' },
      { chip: 'AIIMS', chipClass: 'chip-AIIMS', name: 'AIIMS, Bhopal', pct: '88%', status: 'Target R1', cutoff: '578 AIR' },
    ];
    if (r <= 2500) return [
      { chip: 'AIIMS', chipClass: 'chip-AIIMS', name: 'AIIMS, Bhubaneswar', pct: '94%', status: 'Very Safe', cutoff: '1,420 AIR' },
      { chip: 'GMC', chipClass: 'chip-GMC', name: 'VMMC & Safdarjung Hospital, New Delhi', pct: '88%', status: 'Target R1', cutoff: '1,890 AIR' },
      { chip: 'GMC', chipClass: 'chip-GMC', name: 'Seth G.S. Medical College (KEM), Mumbai', pct: '79%', status: 'Competitive', cutoff: '1,980 AIR' },
    ];
    if (r <= 15000) return [
      { chip: 'GMC', chipClass: 'chip-Govt', name: "King George's Medical University (KGMU)", pct: '92%', status: 'Very Safe', cutoff: '10,800 AIR' },
      { chip: 'GMC', chipClass: 'chip-GMC', name: 'SMS Medical College, Jaipur', pct: '84%', status: 'Target R2', cutoff: '11,500 AIR' },
      { chip: 'DEEMED', chipClass: 'chip-Deemed', name: 'Kasturba Medical College (KMC), Manipal', pct: '96%', status: 'Safe Pick', cutoff: '13,200 AIR' },
    ];
    if (r <= 45000) return [
      { chip: 'GMC', chipClass: 'chip-Govt', name: 'GMC Amritsar / GMC Patiala', pct: '89%', status: 'Target R2', cutoff: '28,500 AIR' },
      { chip: 'GMC', chipClass: 'chip-GMC', name: 'ESIC Medical College, Faridabad', pct: '81%', status: 'Competitive', cutoff: '32,000 AIR' },
      { chip: 'DEEMED', chipClass: 'chip-Deemed', name: 'Kasturba Medical College (KMC), Mangalore', pct: '93%', status: 'Very Safe', cutoff: '36,500 AIR' },
    ];
    return [
      { chip: 'DEEMED', chipClass: 'chip-Deemed', name: 'JSS Medical College, Mysore', pct: '87%', status: 'Target R2', cutoff: '85,000 AIR' },
      { chip: 'DEEMED', chipClass: 'chip-Deemed', name: 'Hamdard Institute (HIMSR), New Delhi', pct: '78%', status: 'Competitive', cutoff: '68,000 AIR' },
      { chip: 'DEEMED', chipClass: 'chip-Deemed', name: 'K.S. Hegde Medical Academy, Mangalore', pct: '95%', status: 'Very Safe', cutoff: '1,20,000 AIR' },
    ];
  };

  const teaserColleges = getTeaserColleges(currentRank);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    // Coupon validity and discount are authoritative on the payment Worker only.
    const res = await validateCoupon(code, 'season');
    if (res.valid && res.discountRupees) {
      setDiscountApplied(true);
      setCouponDiscountRupees(res.discountRupees);
      setCouponFinalAmount(res.finalAmountRupees ?? null);
      setCouponError('');
    } else {
      setDiscountApplied(false);
      setCouponDiscountRupees(0);
      setCouponFinalAmount(null);
      setCouponError(res.message || 'Invalid or expired coupon code.');
    }
  };

  const features = [
    { icon: '🎯', title: 'Smart Empirical Algorithm', desc: 'Exact match → buffer zone → historical trend analysis across 2024 & 2025 rounds. Zero synthetic guesswork.' },
    { icon: '📊', title: 'AIQ + 36 State Quotas', desc: 'Seamlessly switch between 15% AIQ and your 85% State Quota counselling cutoffs. All categories covered.' },
    { icon: '❤️', title: 'Wishlist & Choice Fill', desc: 'Save medical colleges, rank them by preference, and export your optimized MCC choice filling order to PDF.' },
    { icon: '⚡', title: 'Instant Browser Results', desc: 'All calculations run client-side. Change your rank or category and see 750+ results update in milliseconds.' },
    { icon: '📱', title: 'Mobile-First Design', desc: 'Fully responsive and touch-optimized. Use it on your phone during counselling day without lag or formatting issues.' },
    { icon: '🔒', title: 'Secure & Private', desc: 'Your rank and category data stay strictly private. We never sell student data to private colleges or third parties.' },
  ];

  const howItWorks = [
    { step: '01', icon: '📝', title: 'Enter Your Rank or Score', desc: 'Input your NEET All India Rank (AIR) or expected score, and select your candidate category (Open/OBC/EWS/SC/ST).' },
    { step: '02', icon: '⚙️', title: 'Run Predictive Engine', desc: 'Our algorithm cross-references 70,858 verified MCC seat allotment records across all rounds, quotas, and state bodies.' },
    { step: '03', icon: '🎯', title: 'Review Ranked Matches', desc: 'Inspect college predictions organized into 4 strategic pillars (Safety, Target, Reach, Long Shot) with bond & fee data.' },
    { step: '04', icon: '📋', title: 'Export Choice Filling List', desc: 'Add top institutions to your wishlist, arrange your preferred priority sequence, and export the official MCC order.' },
  ];

  const faqs = [
    {
      q: 'How accurate is this NEET College Predictor?',
      a: 'Unlike generic predictors using estimated flat percentages, our engine is built directly on 70,858 actual seat allotments from official MCC NEET Counselling 2024 and 2025. It evaluates exact round-by-round closing ranks and seat matrix variations.'
    },
    {
      q: 'Can reserved category students get Open (General) seats?',
      a: 'Yes! According to official MCC and Supreme Court admission rules, reserved category candidates (OBC, EWS, SC, ST) with high merit ranks are eligible to claim Open seats. Our algorithm evaluates both your reserved category and Open seats automatically.'
    },
    {
      q: 'How does the 4-Pillar Strategy (Safety, Target, Reach) work?',
      a: 'We evaluate your rank against historical cutoff confidence intervals: Safety (ranks comfortably within cutoff), Target (close to projected median), Reach (aspirational within upgrade range), and Long Shot (unlikely but possible in stray vacancy rounds).'
    },
    {
      q: 'Does this cover AIIMS, JIPMER, and Central Universities?',
      a: 'Yes! All AIIMS institutes (New Delhi, Bhopal, Bhubaneswar, Jodhpur, etc.), JIPMER Puducherry & Karaikal, AMU, BHU, ESI hospitals, and Deemed medical universities are fully indexed.'
    },
    {
      q: 'What is the difference between Basic Pass and Season Pass?',
      a: 'Basic Pass (₹149) gives you access to Full AIQ + Deemed predictions for Rounds 1 & 2. Season Pass VIP (₹299) includes all rounds (R1, R2, R3 & Stray Vacancy), State Quota deep cutoffs, drag-and-drop choice filling, PDF export, rural bond calculator, and unlimited predictions.'
    },
  ];

  return (
    <div className="w-full relative overflow-x-hidden">
      {/* VIP Return Banner for Pro Users Viewing Public Page */}
      {isPro && showPublicView && (
        <div className="sticky top-14 z-40 bg-gradient-to-r from-teal-900/90 via-slate-900/95 to-amber-900/90 text-white border-b border-teal-500/30 backdrop-blur-md px-4 py-2.5 text-xs text-center flex flex-wrap items-center justify-center gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">
              Active Candidate Session: <strong>Dr. {profile?.displayName || user?.displayName || 'Aspirant'}</strong> ({tierCategory.label})
            </span>
          </div>
          <button
            onClick={() => setShowPublicView(false)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Return to Candidate Cockpit</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>
      )}

      {/* ── AMBIENT BACKGROUND GLOWS (Centrally balanced, no horizontal scroll) ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-teal-500/15 via-emerald-500/5 to-transparent blur-3xl rounded-full" />
      </div>

      {/* ═══════════════════════════════════════════════
          SECTION 1 — HERO SECTION
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 text-center">
        <div className="container-custom">
          {/* Live Tag Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-300 dark:border-teal-400/35 dark:bg-teal-400/10 text-xs font-bold mb-6 shadow-sm">
            <BrandIcon size={20} className="-ml-1" />
            <span>NEET UG · AIQ &amp; 36-State Cutoff Intelligence · 70,858 Allotments</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.12] mb-5 font-heading">
            Know Your<br />
            <span className="g1">Medical College Chances</span><br />
            <span className="text-slate-800 dark:text-white/85 text-3xl sm:text-5xl lg:text-6xl font-extrabold block mt-2">Before You Apply</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-white/70 max-w-2xl mx-auto leading-relaxed mb-8">
            Built on <strong className="text-slate-900 dark:text-white font-bold">70,000+ official MCC seat allotment records</strong> from 2024 &amp; 2025.
            Exact round-by-round cutoffs for AIIMS, GMCs, Deemed, and 750+ medical colleges across all quotas.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <div className="relative inline-block w-full sm:w-auto">
              <span className="free-badge-float">100% FREE</span>
              <Link
                href="/predict?claim=free"
                className="btn-primary w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base font-black shadow-[0_8px_25px_rgba(0,229,170,0.35)]"
              >
                <Gift className="h-4 w-4" />
                <span>Claim Free Prediction</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Link
              href="/colleges"
              className="btn-secondary w-full sm:w-auto px-7 py-3.5 text-sm sm:text-base font-bold bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:border-white/15 dark:hover:bg-white/10"
            >
              <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-300" />
              <span>Explore 750+ Colleges</span>
            </Link>
          </div>
          <p className="text-xs text-slate-500 dark:text-white/45 flex items-center justify-center gap-1.5 mb-10">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Instant prediction engine · No credit card required</span>
          </p>

          {/* Hero Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12">
            {[
              { val: '750+', label: 'Medical Colleges' },
              { val: '2024–25', label: 'Verified Cutoffs' },
              { val: '₹149', label: 'Starting Pass' },
              { val: '36 States', label: 'AIQ + State Quotas' },
            ].map((st) => (
              <div key={st.label} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-white/[0.03] dark:border-white/10 text-center">
                <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mono-font">{st.val}</div>
                <div className="text-[11px] text-slate-600 dark:text-white/50 font-semibold uppercase tracking-wider mt-0.5">{st.label}</div>
              </div>
            ))}
          </div>

          {/* ── INTERACTIVE LIVE PREVIEW RANK TEASER CARD ── */}
          <div className="rank-teaser text-left">
            {/* Header with Mode Toggle */}
            <div className="rt-top">
              <span className="flex items-center text-teal-700 dark:text-teal-300">
                <span className="dot" />
                Live Preview · Test Any Rank
              </span>
              <div className="flex rounded-lg border border-slate-300 bg-slate-100 dark:border-white/15 dark:bg-black/60 p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setInputMode('rank')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    inputMode === 'rank' ? 'bg-teal-600 text-white dark:bg-teal-400 dark:text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950 dark:text-white/60 dark:hover:text-white'
                  }`}
                >
                  By Rank
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('score')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    inputMode === 'score' ? 'bg-teal-600 text-white dark:bg-teal-400 dark:text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950 dark:text-white/60 dark:hover:text-white'
                  }`}
                >
                  By Score
                </button>
              </div>
            </div>

            {/* Input Row */}
            <form onSubmit={handleQuickPredict}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                {inputMode === 'rank' ? (
                  <div className="rt-input-row mb-0">
                    <span className="rt-hash">#</span>
                    <input
                      type="number"
                      min="1"
                      max="2500000"
                      value={rankValue}
                      onChange={(e) => setRankValue(e.target.value)}
                      placeholder="Enter AIR (e.g. 12500)"
                      className="rt-input"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      min="100"
                      max="720"
                      value={scoreValue}
                      onChange={(e) => setScoreValue(e.target.value)}
                      placeholder="Score (100–720)"
                      className="rt-input"
                      required
                    />
                    {estimatedAir && (
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold mt-1 block">
                        ≈ AIR {estimatedAir.toLocaleString()} estimated
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="select-field"
                  >
                    <option value="Open">Open (General / UR)</option>
                    <option value="OBC">OBC</option>
                    <option value="EWS">EWS</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="Open PwD">Open PwD</option>
                    <option value="OBC PwD">OBC PwD</option>
                    <option value="EWS PwD">EWS PwD</option>
                    <option value="SC PwD">SC PwD</option>
                    <option value="ST PwD">ST PwD</option>
                  </select>
                </div>
              </div>

              {/* Matches for current rank */}
              <div className="rt-results mb-4">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-white/50 font-bold px-1 mb-1">
                  <span>SAMPLE MATCHES FOR AIR {currentRank.toLocaleString()}</span>
                  <span className="text-teal-600 dark:text-teal-400 font-mono">LIVE PREVIEW</span>
                </div>
                {teaserColleges.map((c, i) => (
                  <div key={i} className="rt-result">
                    <span className={`chip ${c.chipClass}`}>{c.chip}</span>
                    <span className="rt-rname text-slate-900 dark:text-white">{c.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-white/40 font-mono hidden sm:inline">{c.cutoff}</span>
                    <span className="rt-rpct text-teal-700 dark:text-teal-300">{c.pct}</span>
                  </div>
                ))}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="btn-primary w-full py-3 text-sm font-black uppercase tracking-wider"
              >
                <Compass className="h-4 w-4" />
                <span>Run Full Predictive Analysis</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="rt-cta text-slate-500 dark:text-white/60">
              Want the full 750+ college breakdown?{' '}
              <Link href={`/predict?rank=${currentRank}&cat=${category}&claimed=true`} className="text-teal-600 dark:text-teal-400 font-bold">
                Open Predictor Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 2 — TRUST STRIP BANNER
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 py-4">
        <div className="container-custom">
          <div className="trust-strip">
            <div className="ts-glow-bg" />
            <div className="ts-badge-wrap">
              <div className="ts-icon">
                <div className="ts-icon-glow" />
                <Sparkles className="h-7 w-7 text-emerald-600 dark:text-teal-400" />
              </div>
            </div>
            <div className="ts-content">
              <div className="ts-tag">
                <span className="ts-tag-dot" />
                <span>100% Risk-Free Preview</span>
              </div>
              <h3 className="ts-title">
                Skeptical? <span className="ts-highlight">Test our algorithm for free.</span>
              </h3>
              <p className="ts-desc !text-slate-700 dark:!text-white/70">
                We are so confident in our precision cutoff data that you can run your exact NEET rank through our AI prediction engine once, absolutely free. See your top college matches before deciding on the Season Pass.
              </p>
              <div className="ts-features">
                <span className="ts-feature-item !text-slate-800 dark:!text-white/90 !bg-slate-100 dark:!bg-white/5 !border-slate-300 dark:!border-white/10">
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-teal-400 shrink-0" /> Instant AI Match
                </span>
                <span className="ts-feature-item !text-slate-800 dark:!text-white/90 !bg-slate-100 dark:!bg-white/5 !border-slate-300 dark:!border-white/10">
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-teal-400 shrink-0" /> 750+ Medical Colleges
                </span>
                <span className="ts-feature-item !text-slate-800 dark:!text-white/90 !bg-slate-100 dark:!bg-white/5 !border-slate-300 dark:!border-white/10">
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-teal-400 shrink-0" /> Zero Payment Needed
                </span>
              </div>
            </div>
            <div className="ts-action">
              <Link href="/predict" className="btn-trust-cta">
                <Lock className="h-4 w-4" />
                <span>Unlock Free Search</span>
                <ArrowRight className="h-4 w-4 btn-arrow" />
              </Link>
              <div className="ts-action-note !text-slate-600 dark:!text-white/50 font-medium">
                ⚡ Instant 10-sec test · No card needed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 3 — OFFICIAL STATS BANNER
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-white/[0.02] py-14 my-8">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { val: '70,858+', label: 'MCC Allotments Verified', color: 'text-teal-600 dark:text-teal-300' },
              { val: '750+', label: 'Medical & Dental Colleges', color: 'text-amber-600 dark:text-amber-300' },
              { val: '17,671', label: 'Cutoff Categories Indexed', color: 'text-emerald-600 dark:text-emerald-300' },
              { val: '100%', label: 'Official Grounded Data', color: 'text-purple-600 dark:text-purple-300' },
            ].map((s) => (
              <div key={s.label} className="group">
                <div className={`text-4xl sm:text-5xl lg:text-6xl font-black mono-font tracking-tight mb-2 ${s.color} transition-transform group-hover:scale-105 duration-300`}>
                  {s.val}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 4 — FEATURES GRID (Why Choose Us)
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="sec-label">Why Choose Us</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight mb-3 font-heading">
              Everything You Need for NEET Counselling
            </h2>
            <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-xl mx-auto">
              Navigate the complex MCC AIQ and State counselling process with confidence and transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass-panel p-6 sm:p-8 hover:border-teal-400/35 hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div className="text-3xl mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2 font-heading">{f.title}</h3>
                <p className="text-sm text-slate-600 dark:text-white/65 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 5 — 4-PILLAR STRATEGY FRAMEWORK
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24 border-y border-slate-200 dark:border-white/8 bg-slate-50/50 dark:bg-white/[0.015]">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-block text-xs font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 dark:border-amber-400/25">
              Admission Strategy Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight mb-3 font-heading">
              The 4-Pillar Counselling Architecture
            </h2>
            <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-xl mx-auto">
              Never waste choices on improbable seats or settle prematurely. Every option is structured into clear risk tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                label: '🟢 Safety Choices',
                desc: 'Your rank comfortably sits below historical cutoff margins. Essential bottom anchors ensuring you never leave counselling empty-handed.',
                tag: '> 90% Confidence',
                tagColor: 'text-emerald-700 dark:text-emerald-400',
                borderLeft: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400',
                pillar: '01',
              },
              {
                icon: <Target className="h-6 w-6" />,
                label: '🟡 Target Choices',
                desc: 'Cutoffs closely align with your rank in Round 2 or Round 3 allotments. Your primary sweet spot for realistic high-quality admissions.',
                tag: 'Competitive Sweet Spot',
                tagColor: 'text-amber-700 dark:text-amber-400',
                borderLeft: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
                pillar: '02',
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                label: '🟠 Reach Choices',
                desc: 'Aspirational colleges slightly above your rank. Valid targets during round-by-round seat vacancy upgrades through later rounds.',
                tag: 'High-Yield Upgrade',
                tagColor: 'text-orange-700 dark:text-orange-400',
                borderLeft: 'border-l-4 border-l-orange-500 dark:border-l-orange-400',
                pillar: '03',
              },
              {
                icon: <Flame className="h-6 w-6" />,
                label: '🔴 Long Shot',
                desc: 'High-reward dream colleges requiring substantial cutoff drops or special stray vacancy seat cancellations to materialize.',
                tag: 'Stray Vacancy Target',
                tagColor: 'text-rose-700 dark:text-rose-400',
                borderLeft: 'border-l-4 border-l-rose-500 dark:border-l-rose-400',
                pillar: '04',
              },
            ].map((p) => (
              <div
                key={p.pillar}
                className={`glass-panel p-6 ${p.borderLeft} hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-teal-700 dark:text-teal-300 font-mono text-xs font-bold">PILLAR {p.pillar}</span>
                    <span className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white/90">
                      {p.icon}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white mb-2">{p.label}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 leading-relaxed mb-6">{p.desc}</p>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <span className={`text-xs font-extrabold ${p.tagColor}`}>{p.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 6 — HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="sec-label">Simple Process</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight mb-3 font-heading">
              From Rank to Final Choice List in 4 Steps
            </h2>
            <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-xl mx-auto">
              Engineered for clarity and ease of decision-making under counselling pressure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((st) => (
              <div
                key={st.step}
                className="glass-panel p-6 text-center hover:border-teal-400/30 hover:-translate-y-1 transition-all duration-300 relative group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 dark:bg-teal-400/15 dark:border-teal-400/30 flex items-center justify-center font-mono font-black text-xs text-teal-800 dark:text-teal-300 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {st.step}
                </div>
                <div className="text-3xl mb-3">{st.icon}</div>
                <h4 className="text-base font-bold text-slate-950 dark:text-white mb-2 font-heading">{st.title}</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 7 — HIGH-CONTRAST PRICING
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24 border-y border-slate-200 dark:border-white/8 bg-slate-50/50 dark:bg-white/[0.015]">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-block text-xs font-black text-teal-800 dark:text-teal-300 uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/30 dark:border-teal-400/25">
              Transparent Medical Counselling Plans
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight mb-3 font-heading">
              Choose Your Counselling Plan
            </h2>
            <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-xl mx-auto">
              Pay once. Use throughout all rounds of NEET UG counselling until final seat confirmation.
            </p>
          </div>

          {checkoutError && (
            <div className="max-w-4xl mx-auto mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold text-center">
              {checkoutError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Card 1: Basic Pass */}
            <div className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-teal-500/35 text-white shadow-xl hover:shadow-[0_20px_45px_rgba(20,184,166,0.2)] hover:border-teal-400/50 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="text-xs font-black tracking-wider uppercase text-teal-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Essential Tier</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    50% OFF TODAY
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight">Basic Pass</h3>
                <p className="text-xs text-white/60 mt-1 mb-5">
                  Designed for candidates seeking instant AIQ and Deemed cutoff forecasts.
                </p>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl sm:text-5xl font-black text-white font-mono">₹149</span>
                  <span className="text-sm text-white/40 line-through font-mono">₹299</span>
                  <span className="text-xs font-bold text-teal-400 ml-1">One-time payment</span>
                </div>

                <div className="w-full h-px bg-white/10 my-6" />

                <ul className="space-y-3.5 text-xs sm:text-sm text-white/85">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>Full AI Predictor — 750+ Medical &amp; Dental Colleges</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>15% AIQ &amp; Deemed University Cutoff Datasets</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>Candidate Wishlist — save &amp; categorize institutions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>Round 1 &amp; Round 2 Cutoff Trends Analysis</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4">
                {tierCategory.type === 'pro_plus' ? (
                  <div className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Active Plan · Basic Pass Unlocked</span>
                  </div>
                ) : tierCategory.type === 'pro_vip' ? (
                  <div className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-white/10 border border-white/20 text-white/80 text-center flex items-center justify-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Included in Your Active VIP Pass</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCheckoutPlan('basic')}
                    className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 transition-all shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Select Basic Pass — ₹149</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                )}
                <p className="text-[11px] text-white/60 text-center mt-3 flex items-center justify-center gap-1.5 font-medium">
                  <Lock className="h-3 w-3 text-teal-400" /> Instant Access · Razorpay 256-bit Secure
                </p>
              </div>
            </div>

            {/* Card 2: Season Pass VIP */}
            <div className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 via-[#181308] to-slate-950 border-2 border-amber-500/50 text-white shadow-2xl hover:shadow-[0_20px_50px_rgba(245,158,11,0.25)] hover:border-amber-400 transition-all duration-300 flex flex-col justify-between group">
              {/* Floating Top Ribbon */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-1.5 whitespace-nowrap">
                <span>⭐</span>
                <span>Most Popular · Recommended for All 4 Rounds</span>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-3 mt-1">
                  <div className="text-xs font-black tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>Complete VIP Package</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    SAVE ₹300
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Season Pass 2026 VIP</span>
                  <Crown className="w-5 h-5 text-amber-400 inline" />
                </h3>
                <p className="text-xs text-white/65 mt-1 mb-5">
                  Complete counselling authority covering 85% State Quota, Choice Sequencer, and Stray vacancy.
                </p>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl sm:text-5xl font-black text-amber-300 font-mono">
                    ₹{couponFinalAmount ?? 299}
                  </span>
                  <span className="text-sm text-white/40 line-through font-mono">₹599</span>
                  {discountApplied && couponDiscountRupees > 0 && (
                    <span className="text-xs font-bold text-amber-400 ml-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                      ₹{couponDiscountRupees} Coupon Applied
                    </span>
                  )}
                </div>

                <div className="w-full h-px bg-white/10 my-6" />

                <ul className="space-y-3.5 text-xs sm:text-sm text-white/90">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span><strong>Unlimited AI Predictions</strong> across All 4 Rounds + Stray Vacancy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span><strong>15% AIQ + 85% State Quota</strong> Deep Data across 36 States &amp; UTs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span><strong>Smart Choice Filling Matrix</strong> — algorithm-sorted priority list</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span><strong>Export Final Choice Order</strong> to clean formatted PDF</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span><strong>State Rural Service Bond &amp; Penalty</strong> calculator</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span><strong>24/7 Priority Helpdesk</strong> assistance through admission day</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4">
                {/* Coupon Code Box */}
                {!discountApplied && (
                  <>
                    <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-1.5">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                        placeholder="PROMO CODE (e.g. NEET50)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold placeholder:text-white/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shrink-0 transition-all cursor-pointer shadow-sm"
                      >
                        Apply
                      </button>
                    </form>
                    {couponError && (
                      <p className="text-[11px] text-rose-300 font-semibold mb-2.5">{couponError}</p>
                    )}
                  </>
                )}

                {tierCategory.type === 'pro_vip' ? (
                  <Link
                    href="/predict"
                    className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 text-center flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
                  >
                    <Crown className="w-4 h-4 text-slate-950" />
                    <span>You are a VIP Member · Launch Predictor</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </Link>
                ) : tierCategory.type === 'pro_plus' ? (
                  <button
                    type="button"
                    onClick={handleUpgradeToSeason}
                    className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 transition-all shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4 text-slate-950" />
                    <span>Upgrade to VIP for ₹150 (Pay Difference)</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCheckoutPlan('season')}
                    className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 transition-all shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4 text-slate-950" />
                    <span>Get Season Pass VIP — ₹{discountApplied ? '249' : '299'}</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                )}

                <p className="text-[11px] text-white/60 text-center mt-3 flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> UPI · Cards · NetBanking · 100% Secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 8 — DATA & METHODOLOGY (replaces unverified testimonials)
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="sec-label">Data &amp; Methodology</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight mb-3 font-heading">
              Grounded in Official Allotment Data
            </h2>
            <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-xl mx-auto">
              No manufactured reviews. Here is exactly what powers every prediction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: `${STATS.allotments} Verified Allotments`,
                desc: `Every prediction is derived from official MCC NEET ${STATS.dataYears} round-by-round seat allotment records — no synthetic or estimated percentages.`,
              },
              {
                icon: <Building2 className="h-6 w-6" />,
                title: `${STATS.colleges} Colleges Indexed`,
                desc: 'Government, AIIMS, JIPMER, central, and deemed medical & dental institutions across all states and UTs.',
              },
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                title: 'Transparent Round-by-Round Logic',
                desc: 'Cutoffs, quotas, categories, bonds and fees are shown with their source rounds so you can audit every number yourself.',
              },
            ].map((t, idx) => (
              <div key={idx} className="glass-panel p-6 sm:p-8 flex flex-col hover:border-teal-400/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-5">
                  {t.icon}
                </div>
                <h4 className="text-base font-bold text-slate-950 dark:text-white mb-2 font-heading">{t.title}</h4>
                <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 9 — TELEGRAM COMMUNITY BANNER
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 pb-12">
        <div className="container-custom">
          <div className="rounded-2xl border border-[#0088cc]/30 bg-gradient-to-r from-sky-50 via-white to-sky-100 dark:from-[#12121f] dark:via-[#0d1520] dark:to-[#0088cc]/15 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md dark:shadow-xl">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="h-14 w-14 rounded-2xl bg-[#0088cc]/20 border border-[#0088cc]/40 text-[#0088cc] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                <Send className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white mb-1 font-heading">
                  Join NEET Counselling Alerts on Telegram
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60">
                  Get real-time notices for MCC choice locking deadlines, seat matrix updates, and stray vacancy dates.
                </p>
              </div>
            </div>
            <a
              href={process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/neetcounselling'}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-full bg-[#0088cc] hover:bg-[#0099e6] !text-white font-extrabold text-sm flex items-center gap-2 shadow-lg transition-all shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>Join Channel</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 10 — FAQ ACCORDION
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <div className="sec-label">Got Questions?</div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight mb-3 font-heading">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 dark:text-white/60 text-sm">Everything you need to know about our algorithm and MCC cutoffs.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`glass-panel overflow-hidden transition-all duration-200 ${
                  openFaqIndex === i ? 'border-teal-500/40 shadow-sm' : 'hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <HelpCircle className={`h-5 w-5 shrink-0 ${openFaqIndex === i ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-white/40'}`} />
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{faq.q}</span>
                  </span>
                  <span className="shrink-0 text-slate-400 dark:text-white/50">
                    {openFaqIndex === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>
                {openFaqIndex === i && (
                  <div className="px-5 pb-5 pl-12 text-sm text-slate-700 dark:text-white/70 leading-relaxed border-t border-slate-200 dark:border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 11 — BOTTOM CALL TO ACTION
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 pb-20">
        <div className="container-custom">
          <div className="rounded-3xl bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-purple-500/10 dark:from-teal-500/20 dark:via-blue-500/15 dark:to-purple-500/20 border border-teal-500/30 p-10 sm:p-14 text-center shadow-xl">
            <div className="text-4xl mb-3">🩺</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white mb-4 tracking-tight font-heading">
              Ready to Discover Your Medical College?
            </h2>
            <p className="text-slate-600 dark:text-white/70 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
              Join thousands of NEET aspirants who plan their admissions with data-backed accuracy. Start your free prediction right now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/predict"
                className="btn-primary px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[0_8px_25px_rgba(0,229,170,0.35)]"
              >
                <Compass className="h-4 w-4" />
                <span>Start Free Prediction</span>
              </Link>
              <Link
                href="/colleges"
                className="btn-secondary px-8 py-4 text-sm font-bold bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:border-white/15 dark:hover:bg-white/10"
              >
                <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Browse 750+ Colleges</span>
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
}
