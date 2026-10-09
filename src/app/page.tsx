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
  Star,
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
} from 'lucide-react';
import { scoreToRank } from '@/lib/engine/scoreToRank';
import { BrandIcon } from '@/components/common/BrandIcon';
import { useAuth } from '@/lib/firebase/AuthContext';
import { initiateCheckout } from '@/lib/payment/paymentService';
import { PaymentCelebrationModal } from '@/components/payment/PaymentCelebrationModal';

export default function HomePage() {
  const router = useRouter();
  const { user, activateVerifiedTier } = useAuth();
  const [inputMode, setInputMode] = useState<'rank' | 'score'>('rank');
  const [rankValue, setRankValue] = useState<string>('12500');
  const [scoreValue, setScoreValue] = useState<string>('645');
  const [category, setCategory] = useState<string>('Open');
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountApplied, setDiscountApplied] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<{ open: boolean; planKey: string; paymentId: string }>({
    open: false,
    planKey: 'season',
    paymentId: '',
  });

  const handleCheckoutPlan = async (planKey: 'basic' | 'season') => {
    if (!user) {
      router.push(`/account?plan=${planKey}`);
      return;
    }

    await initiateCheckout({
      planKey,
      couponCode: discountApplied ? couponCode : '',
      user,
      onSuccess: async (paymentId) => {
        const tier = planKey === 'season' ? 'pro_vip' : 'pro_plus';
        await activateVerifiedTier(tier, paymentId);
        setCelebration({ open: true, planKey, paymentId });
      },
    });
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

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (['NEET', 'NEET50', 'DOCTOR', 'OFF50', 'NEETPRO', 'NEETPASS', 'NEET2026'].includes(code)) {
      setDiscountApplied(true);
    } else {
      alert('Invalid coupon code. Try "NEETPRO" or "NEET50" for ₹50 off.');
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

  const testimonials = [
    {
      quote: 'The 4-pillar classification helped me secure my Round 2 upgrade at MAMC New Delhi. The historical 2-year cutoff shift data was 100% accurate.',
      name: 'Dr. Ananya Sharma',
      rank: 'AIR 642',
      college: 'MAMC New Delhi',
      avatar: 'A',
      color: 'from-teal-400 to-cyan-500',
    },
    {
      quote: 'Reserved category Open seat evaluation is a lifesaver. Most predictors misled me, but this accurately showed both my OBC rank and UR cutoff margins.',
      name: 'Rohan Verma',
      rank: 'AIR 4,820',
      college: 'KGMU Lucknow',
      avatar: 'R',
      color: 'from-blue-400 to-indigo-500',
    },
    {
      quote: 'The Smart Choice Filling tool exported my list in strict priority order. I entered it directly into the MCC portal and was allotted GMC Chandigarh in Round 1!',
      name: 'Pooja Deshmukh',
      rank: 'AIR 1,180',
      college: 'GMCH Chandigarh',
      avatar: 'P',
      color: 'from-purple-400 to-pink-500',
    },
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
            <div className="inline-block text-xs font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/30 dark:border-purple-400/25">
              Transparent Counselling Plans
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight mb-3 font-heading">
              Choose Your Counselling Plan
            </h2>
            <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-xl mx-auto">
              Pay once. Use throughout all rounds of NEET counselling until seat confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Card 1: Basic Pass (Electric Blue) */}
            <div className="pricing-card-blue p-8 sm:p-10 flex flex-col justify-between relative text-white">
              <div>
                <div className="pricing-title-white">Basic Pass</div>
                <div className="pricing-price-white"><span>₹</span>149</div>
                <div className="pricing-orig-white">₹299 regular price</div>
                <div className="pricing-divider-white" />
                <ul className="pricing-list-white">
                  <li className="pricing-item-white"><Check className="h-4 w-4 text-white shrink-0" /> Full predictor — 750+ Medical Colleges</li>
                  <li className="pricing-item-white"><Check className="h-4 w-4 text-white shrink-0" /> AIQ (15%) &amp; Deemed Cutoff Data</li>
                  <li className="pricing-item-white"><Check className="h-4 w-4 text-white shrink-0" /> Wishlist — save &amp; track institutions</li>
                  <li className="pricing-item-white"><Check className="h-4 w-4 text-white shrink-0" /> Round 1 &amp; Round 2 Cutoff Trends</li>
                </ul>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => handleCheckoutPlan('basic')}
                  className="pricing-btn-pill-white btn-blue-text cursor-pointer"
                >
                  Select Basic — ₹149
                </button>
                <p className="text-[11px] text-white/70 text-center mt-3 flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" /> Instant Access · Razorpay Verified
                </p>
              </div>
            </div>

            {/* Card 2: Season Pass VIP (Royal Purple) */}
            <div className="pricing-card-purple p-8 sm:p-10 flex flex-col justify-between relative text-white">
              <div className="card-top-ribbon">⭐ Most Popular · Best Value</div>
              <div>
                <div className="pricing-title-white flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-amber-300" />
                  <span>Season Pass VIP</span>
                </div>
                <div className="pricing-price-white">
                  <span>₹</span>{discountApplied ? '249' : '299'}
                </div>
                <div className="pricing-orig-white">
                  ₹599 regular price {discountApplied && <span className="text-amber-300 font-bold ml-2">(₹50 Promo Applied)</span>}
                </div>
                <div className="pricing-divider-white" />
                <ul className="pricing-list-white">
                  <li className="pricing-item-white"><Check className="h-4 w-4 text-amber-300 shrink-0" /> Unlimited AI Predictions (All 4 Rounds + Stray)</li>
                  <li className="pricing-item-white"><Check className="h-4 w-4 text-amber-300 shrink-0" /> 15% AIQ + 85% State Quota Deep Data (36 States)</li>
                  <li className="pricing-item-white"><Check className="h-4 w-4 text-amber-300 shrink-0" /> Smart Drag-and-Drop Choice Filling Matrix</li>
                  <li className="pricing-item-white"><Check className="h-4 w-4 text-amber-300 shrink-0" /> Export Choice Order to Formatted PDF</li>
                  <li className="pricing-item-white"><Check className="h-4 w-4 text-amber-300 shrink-0" /> State Rural Service Bond &amp; Penalty Calculator</li>
                  <li className="pricing-item-white"><Check className="h-4 w-4 text-amber-300 shrink-0" /> 24/7 Priority Helpdesk Support</li>
                </ul>
              </div>

              <div>
                {/* Coupon Code Box */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="PROMO CODE (e.g. NEET50)"
                    className="w-full px-3 py-2 rounded-xl bg-white/15 border border-white/25 text-white text-xs font-bold placeholder:text-white/50 focus:outline-none focus:border-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shrink-0 hover:bg-amber-300 transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => handleCheckoutPlan('season')}
                  className="pricing-btn-pill-white btn-purple-text cursor-pointer"
                >
                  Get VIP Pass — ₹{discountApplied ? '249' : '299'}
                </button>
                <p className="text-[11px] text-white/70 text-center mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-300" /> UPI · Cards · NetBanking · 100% Secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 8 — TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="sec-label">Student Experiences</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight mb-3 font-heading">
              Trusted by Doctors &amp; Top Aspirants
            </h2>
            <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-xl mx-auto">
              Real testimonials from students who navigated NEET counselling successfully.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="glass-panel p-6 sm:p-8 flex flex-col justify-between hover:border-teal-400/30 transition-all duration-300">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 dark:fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed italic mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.color} text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md`}>
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-950 dark:text-white">{t.name}</h4>
                    <p className="text-xs text-teal-700 dark:text-teal-300 font-mono font-bold">{t.rank} · {t.college}</p>
                  </div>
                </div>
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
              href="https://t.me"
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
