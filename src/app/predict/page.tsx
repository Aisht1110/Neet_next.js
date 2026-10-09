'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Compass, 
  Sparkles, 
  RotateCcw, 
  Search, 
  Building2, 
  Loader2,
  Download,
  Scale,
  CheckCircle2,
  ShieldCheck,
  Check,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  Crown,
  Zap,
  Lock,
  Gift,
} from 'lucide-react';
import { getCollegeData } from '@/lib/engine/collegeData';
import { scoreToRank } from '@/lib/engine/scoreToRank';
import { runPredictionEngine, modeHints, quotaMap } from '@/lib/engine/predictor';
import { 
  CollegeIndexEntry, 
  PredictionResult, 
  StrategyKey 
} from '@/lib/engine/types';
import { CollegeCard } from '@/components/predictor/CollegeCard';
import { CutoffModal } from '@/components/predictor/CutoffModal';
import { CompareDrawer } from '@/components/predictor/CompareDrawer';
import { DonutSummary } from '@/components/predictor/DonutSummary';
import { PredictionLimitModal } from '@/components/predictor/PredictionLimitModal';
import { PaymentCelebrationModal } from '@/components/payment/PaymentCelebrationModal';
import { AuthModal } from '@/components/common/AuthModal';
import { BrandIcon } from '@/components/common/BrandIcon';
import { useAuth } from '@/lib/firebase/AuthContext';

function PredictorContent() {
  const searchParams = useSearchParams();
  const { user, profile, tierCategory, canPredict, recordPrediction } = useAuth();

  // Input States — initialized empty so predictor does NOT run until user enters details
  const [inputMode, setInputMode] = useState<'rank' | 'score'>('rank');
  const [rank, setRank] = useState<string>('');
  const [score, setScore] = useState<string>('');
  const [category, setCategory] = useState<string>('Open');
  const [mode, setMode] = useState<string>('best');
  const [selectedCourses, setSelectedCourses] = useState<string[]>(['MBBS']);
  const [selectedQuotas, setSelectedQuotas] = useState<string[]>([
    'All India',
    'Open Seat Quota',
    'Deemed/Paid Seats Quota'
  ]);

  // Mobile Filter Drawer & Scroll Reference
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const autoRanRef = React.useRef<boolean>(false);

  // Execution & Validation States
  const [hasPredicted, setHasPredicted] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [introFinished, setIntroFinished] = useState<boolean>(false);
  const [introFading, setIntroFading] = useState<boolean>(false);
  const [loadPercent, setLoadPercent] = useState<number>(14);
  const [loadStatus, setLoadStatus] = useState<string>('INITIALIZING MCC ADMISSION ENGINE…');
  const [collegeIndex, setCollegeIndex] = useState<Map<string, CollegeIndexEntry> | null>(null);
  const [rawResults, setRawResults] = useState<PredictionResult[]>([]);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [procPercent, setProcPercent] = useState<number>(12);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCollegeType, setSelectedCollegeType] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('strategy-asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PER_PAGE = 20;

  // Modal & Compare States
  const [activeCollegeModal, setActiveCollegeModal] = useState<PredictionResult | null>(null);
  const [compareList, setCompareList] = useState<PredictionResult[]>([]);
  const [limitModal, setLimitModal] = useState<{ open: boolean; reason: 'REGISTER_REQUIRED' | 'UPGRADE_REQUIRED'; message?: string }>({
    open: false,
    reason: 'REGISTER_REQUIRED'
  });
  const [celebrationModal, setCelebrationModal] = useState<{ open: boolean; planKey: string; paymentId: string }>({
    open: false,
    planKey: 'season',
    paymentId: ''
  });
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // 1. Parse query params from URL if user arrived from homepage estimator
  useEffect(() => {
    const urlRank = searchParams.get('rank');
    const urlScore = searchParams.get('score');
    const urlCat = searchParams.get('cat');
    const urlInputMode = searchParams.get('inputMode');
    const urlMode = searchParams.get('mode');

    if (urlCat) setCategory(urlCat);
    if (urlMode && ['best', 'trend', '2024', '2025', 'round1', 'round2', 'round3', 'stray'].includes(urlMode)) {
      setMode(urlMode);
    }

    if (urlInputMode === 'score' || urlMode === 'score' || urlScore) {
      setInputMode('score');
      if (urlScore) setScore(urlScore);
    } else if (urlRank) {
      setInputMode('rank');
      setRank(urlRank);
    }
  }, [searchParams]);

  // 2. Load dataset with animated radar loader progression
  useEffect(() => {
    setLoadPercent(14);
    setLoadStatus('CONNECTING TO MCC ALLOTMENT ARCHIVE…');

    const t1 = setTimeout(() => {
      setLoadPercent(42);
      setLoadStatus('INDEXING 17,671 CUTOFF SUMMARY RECORDS…');
    }, 280);

    const t2 = setTimeout(() => {
      setLoadPercent(76);
      setLoadStatus('PARSING 70,858 VERIFIED ALLOTMENTS…');
    }, 650);

    const t3 = setTimeout(() => {
      setLoadPercent(94);
      setLoadStatus('CALIBRATING STATISTICAL CUTOFF MARGINS…');
    }, 1050);

    let isMounted = true;

    getCollegeData()
      .then(({ index }) => {
        if (!isMounted) return;
        setCollegeIndex(index);
        setTimeout(() => {
          if (!isMounted) return;
          setLoadPercent(100);
          setLoadStatus('SYSTEM READY · LAUNCHING PREDICTOR');
          setDataLoaded(true);
          setTimeout(() => {
            if (!isMounted) return;
            setIntroFading(true);
            setTimeout(() => {
              if (!isMounted) return;
              setIntroFinished(true);
            }, 400);
          }, 350);
        }, 1200);
      })
      .catch((err: any) => {
        console.error('Failed to load cutoff database:', err);
        if (!isMounted) return;
        setLoadPercent(100);
        setDataLoaded(true);
        setIntroFading(true);
        setTimeout(() => setIntroFinished(true), 300);
      });

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // 3. Execute Prediction Logic
  const executePrediction = (targetRank?: number, targetScore?: number, modeType: 'rank' | 'score' = 'rank') => {
    if (!collegeIndex) return;

    // Check Entitlement Quota
    const check = canPredict();
    if (!check.allowed) {
      if (check.reason === 'REGISTER_REQUIRED') {
        setAuthModalOpen(true);
      } else {
        setLimitModal({
          open: true,
          reason: 'UPGRADE_REQUIRED',
          message: check.message
        });
      }
      return;
    }

    recordPrediction();

    setIsPredicting(true);
    setProcessingStep(1);
    setProcPercent(14);

    setTimeout(() => {
      setProcessingStep(2);
      setProcPercent(46);
    }, 280);

    setTimeout(() => {
      setProcessingStep(3);
      setProcPercent(78);
    }, 600);

    setTimeout(() => {
      setProcessingStep(4);
      setProcPercent(96);
    }, 950);

    setTimeout(() => {
      setProcPercent(100);
      const calculatedRank = modeType === 'rank'
        ? (targetRank || 15000)
        : scoreToRank(targetScore || 640);

      const results = runPredictionEngine(collegeIndex, {
        rank: calculatedRank,
        score: modeType === 'score' ? targetScore : undefined,
        inputMode: modeType,
        category,
        mode,
        courses: selectedCourses,
        quotas: selectedQuotas
      });

      setRawResults(results);
      setHasPredicted(true);
      setSelectedStrategy(null);
      setSelectedState('');
      setSelectedCollegeType('');
      setCurrentPage(1);
      setIsPredicting(false);
      setProcessingStep(0);
      setIsMobileFiltersOpen(false);

      // On mobile viewports, automatically smooth-scroll to results HUD
      setTimeout(() => {
        if (typeof window !== 'undefined' && resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }, 1250);
  };

  // 4. Auto-run on initial load ONLY IF explicit rank or score was provided in URL params
  useEffect(() => {
    if (dataLoaded && collegeIndex && !autoRanRef.current) {
      const urlRank = searchParams.get('rank');
      const urlScore = searchParams.get('score');
      if (urlRank || urlScore) {
        autoRanRef.current = true;
        const parsedR = urlRank ? parseInt(urlRank, 10) : undefined;
        const parsedS = urlScore ? parseInt(urlScore, 10) : undefined;
        executePrediction(parsedR, parsedS, urlScore ? 'score' : 'rank');
      }
    }
  }, [dataLoaded, collegeIndex, searchParams]);

  // 5. Handle manual submission from the user
  const handleRunPrediction = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError('');

    if (inputMode === 'rank') {
      const cleanRank = rank.trim().replace(/,/g, '');
      const parsedRank = parseInt(cleanRank, 10);
      if (!cleanRank || isNaN(parsedRank) || parsedRank < 1 || parsedRank > 2500000) {
        setValidationError('Please enter a valid NEET All India Rank (AIR) between 1 and 2,500,000.');
        return;
      }
      executePrediction(parsedRank, undefined, 'rank');
    } else {
      const cleanScore = score.trim();
      const parsedScore = parseInt(cleanScore, 10);
      if (!cleanScore || isNaN(parsedScore) || parsedScore < 100 || parsedScore > 720) {
        setValidationError('Please enter a valid NEET score between 100 and 720.');
        return;
      }
      executePrediction(undefined, parsedScore, 'score');
    }
  };

  // 6. Handle quick preset buttons
  const handleSelectPreset = (val: number, modeType: 'rank' | 'score') => {
    setValidationError('');
    setInputMode(modeType);
    if (modeType === 'rank') {
      setRank(val.toString());
      executePrediction(val, undefined, 'rank');
    } else {
      setScore(val.toString());
      executePrediction(undefined, val, 'score');
    }
  };

  // 7. Reset all parameters & clear results
  const handleReset = () => {
    setRank('');
    setScore('');
    setCategory('Open');
    setMode('best');
    setSelectedCourses(['MBBS']);
    setSelectedQuotas(['All India', 'Open Seat Quota', 'Deemed/Paid Seats Quota']);
    setRawResults([]);
    setHasPredicted(false);
    setValidationError('');
    setSelectedStrategy(null);
    setSelectedState('');
    setSelectedCollegeType('');
    setCurrentPage(1);
    setIsMobileFiltersOpen(false);
  };

  // Filtered & Sorted Results
  const filteredResults = useMemo(() => {
    return rawResults.filter((item) => {
      if (selectedStrategy && item.strategy.key !== selectedStrategy) return false;
      if (selectedState && item.state !== selectedState) return false;
      if (selectedCollegeType && item.collegeType.type !== selectedCollegeType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchState = (item.state || '').toLowerCase().includes(q);
        const matchInst = item.institute.toLowerCase().includes(q);
        if (!matchName && !matchState && !matchInst) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'strategy-asc') {
        if (a.strategy.sort !== b.strategy.sort) return a.strategy.sort - b.strategy.sort;
        return a.closingRank - b.closingRank;
      }
      if (sortBy === 'rank-asc') return a.closingRank - b.closingRank;
      if (sortBy === 'rank-desc') return b.closingRank - a.closingRank;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [rawResults, selectedStrategy, selectedState, selectedCollegeType, searchQuery, sortBy]);

  // Strategy Counts
  const counts = useMemo(() => {
    return {
      safety: rawResults.filter(r => r.strategy.key === 'safety').length,
      target: rawResults.filter(r => r.strategy.key === 'target').length,
      reach: rawResults.filter(r => r.strategy.key === 'reach').length,
      longshot: rawResults.filter(r => r.strategy.key === 'longshot').length,
      total: rawResults.length,
    };
  }, [rawResults]);

  // Available states in current results
  const availableStates = useMemo(() => {
    return Array.from(new Set(rawResults.map(r => r.state).filter(Boolean))).sort();
  }, [rawResults]);

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / PER_PAGE);
  const pagedResults = useMemo(() => {
    return filteredResults.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  }, [filteredResults, currentPage]);

  const toggleCourse = (c: string) => {
    if (selectedCourses.includes(c)) {
      if (selectedCourses.length === 1) return;
      setSelectedCourses(selectedCourses.filter(item => item !== c));
    } else {
      setSelectedCourses([...selectedCourses, c]);
    }
  };

  const toggleQuota = (q: string) => {
    if (selectedQuotas.includes(q)) {
      if (selectedQuotas.length === 1) return;
      setSelectedQuotas(selectedQuotas.filter(item => item !== q));
    } else {
      setSelectedQuotas([...selectedQuotas, q]);
    }
  };

  const handleToggleCompare = (college: PredictionResult) => {
    if (compareList.some(c => c.key === college.key)) {
      setCompareList(compareList.filter(c => c.key !== college.key));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare a maximum of 3 colleges simultaneously.');
        return;
      }
      setCompareList([...compareList, college]);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredResults.length === 0) return;
    const headers = ['College Name', 'State', 'Course', 'Quota', 'Category', 'College Type', 'Strategy', 'Chance Tier', 'Cutoff AIR', 'User Rank'];
    const rows = filteredResults.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.state || '').replace(/"/g, '""')}"`,
      `"${r.course}"`,
      `"${r.quota}"`,
      `"${r.category}"`,
      `"${r.collegeType.label}"`,
      `"${r.strategy.label}"`,
      `"${r.chance.label}"`,
      r.closingRank,
      r.userRank
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `neet_predicted_colleges_${rank || score || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parsedScoreNum = parseInt(score, 10);
  const estimatedAirFromScore = !isNaN(parsedScoreNum) && parsedScoreNum >= 100 && parsedScoreNum <= 720
    ? scoreToRank(parsedScoreNum)
    : null;

  // Quota description pill
  const quotaRemaining = tierCategory.unlimited
    ? 'Unlimited'
    : Math.max(0, (tierCategory.freeLimit || 3) - profile.predictionsCount);

  return (
    <div className="w-full relative">
      {/* ═══ HIGH-TECH GYROSCOPIC RADAR FULL-VIEWPORT INTRO LOADER ═══ */}
      {!introFinished && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 transition-all duration-500 ease-in-out ${
            introFading ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
          } bg-[#070710]/98 backdrop-blur-2xl`}
        >
          {/* Background grid lines */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(0,229,170,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,170,0.04) 1px, transparent 1px)',
            backgroundSize: '44px 44px'
          }} />

          <div className="page-intro-loader max-w-xs w-full mx-auto text-center px-4 animate-fade-in">
            <div className="pil-backdrop-glow" />

            {/* Radar Wheel — responsive sizing */}
            <div className="pil-wheel-box !w-[110px] !h-[110px] sm:!w-[140px] sm:!h-[140px] mx-auto">
              <div className="pil-ring pil-ring-1" />
              <div className="pil-ring pil-ring-2" />
              <div className="pil-ring pil-ring-3" />
              <div className="pil-radar-sweep" />
              <div className="pil-core !w-12 !h-12 sm:!w-14 sm:!h-14">
                <Compass className="pil-core-icon !text-lg sm:!text-xl" />
              </div>
            </div>

            {/* Heading */}
            <h3 className="font-heading font-black text-lg sm:text-2xl text-white tracking-tight mb-0.5 mt-0">
              NEET ADMISSION ENGINE
            </h3>
            <p className="text-[10px] sm:text-xs font-bold text-teal-300 uppercase tracking-widest mb-5 min-h-[1.5rem] flex items-center justify-center">
              {loadStatus}
            </p>

            {/* Progress bar */}
            <div className="pil-progress-bar-wrap w-full max-w-[240px] sm:max-w-xs mx-auto">
              <div
                className="pil-progress-bar-fill"
                style={{ width: `${loadPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between w-full max-w-[240px] sm:max-w-xs mx-auto mt-1.5 text-xs">
              <span className="text-white/35 text-[10px] uppercase font-mono">Loading Engine</span>
              <span className="mono-font text-xs font-extrabold text-teal-300">{loadPercent}%</span>
            </div>

            {/* Skip button */}
            <button
              type="button"
              onClick={() => {
                setIntroFading(true);
                setTimeout(() => setIntroFinished(true), 250);
              }}
              className="mt-7 px-5 py-2 rounded-full border border-white/[0.12] bg-white/[0.06] text-[11px] text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              Skip intro &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── 1. COMPACT HERO HEADER BAR ── */}
      <header className="hero-header">
        <div className="hero-content">
          <div className="hero-flex">
            <div className="hero-left">
              <div className="hero-tag">
                <span className="pulse"></span>
                <span>NEET UG OFFICIAL COUNSELLING ENGINE</span>
              </div>
              <h1 className="hero-title text-xl sm:text-2xl md:text-3xl font-black">
                NEET College <span className="text-gradient">Predictor &amp; Intelligence</span>
              </h1>
              <p className="hero-sub">
                Empirical Round 1–Stray Vacancy Cutoff Projections grounded in 70,858 verified MCC seat allotments.
              </p>
              <div className="hero-pills-row">
                <span className="data-pill">⚡ 2-Year Weighted Model</span>
                <span className="data-pill">🏥 750+ Colleges</span>
                <span className="data-pill">📜 State Bonds &amp; Penalties</span>
                <span className="data-pill">🎓 50% Internal PG Quotas</span>
              </div>
            </div>

            <div className="hero-stats-row hidden md:flex">
              <div className="hs-item">
                <div className="hs-val text-teal-600 dark:text-teal-300">70,858</div>
                <div className="hs-lbl">Allotments</div>
              </div>
              <div className="hs-item">
                <div className="hs-val text-amber-600 dark:text-amber-300">17,671</div>
                <div className="hs-lbl">Cutoff Records</div>
              </div>
              <div className="hs-item">
                <div className="hs-val text-purple-600 dark:text-purple-300">36</div>
                <div className="hs-lbl">States Covered</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── CLAIM PREDICTION & ENTITLEMENT ACTIVE BANNER ── */}
      <div className="container-custom pt-4 pb-2">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-teal-500/30 dark:border-teal-400/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {tierCategory.unlimited
                    ? '👑 Counselling Pass Active (Unlimited Access)'
                    : user
                    ? 'Candidate Account Active'
                    : '🎁 Claim 5 Free Trial Predictions'}
                </span>
                <span className="rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-300 font-mono font-black text-[10px] px-2 py-[2px] border border-teal-500/40">
                  {tierCategory.unlimited ? 'UNLIMITED' : user ? `${quotaRemaining} RUNS LEFT` : 'LOGIN REQUIRED'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-white/60 text-[11px] mt-0.5">
                {tierCategory.unlimited
                  ? 'All 750+ medical college predictions, choice filling tools, and round-by-round cutoffs unlocked.'
                  : user
                  ? `You have ${quotaRemaining} free AI simulations remaining on your candidate profile.`
                  : 'Candidate login is required to claim your 5 Free AI Predictions across all 750+ medical colleges.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            {!user ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-xs shadow-sm hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Claim Free Trial (Sign In)</span>
              </button>
            ) : !tierCategory.unlimited ? (
              <button
                type="button"
                onClick={() => setLimitModal({ open: true, reason: 'UPGRADE_REQUIRED' })}
                className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs transition-colors flex items-center gap-1"
              >
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span>Upgrade to Pass</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── 2. PREDICTOR 2-COLUMN WRAPPER ── */}
      <div className="predictor-wrap">
        {/* Mobile Quick Parameter Summary Bar */}
        {hasPredicted && (
          <div className="lg:hidden p-3 rounded-2xl bg-white/95 dark:bg-[#0c1024]/95 border border-slate-200 dark:border-teal-400/30 shadow-md dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center justify-between gap-2.5 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black text-xs shrink-0">
                ⚡
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white truncate">
                  <span className="text-teal-700 dark:text-teal-300 mono-font">
                    {inputMode === 'rank' ? `AIR #${parseInt(rank || '0', 10).toLocaleString()}` : `Score ${score}/720`}
                  </span>
                  <span className="text-slate-300 dark:text-white/30">·</span>
                  <span className="text-purple-700 dark:text-purple-300">{category}</span>
                  <span className="text-slate-300 dark:text-white/30">·</span>
                  <span className="text-slate-600 dark:text-white/70">{selectedCourses.join(', ')}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-white/50 truncate flex items-center gap-1.5 mt-0.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold mono-font">{filteredResults.length}</span>
                  <span>matches found</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="px-3 py-1.5 rounded-xl border border-teal-500/40 bg-teal-500/15 text-teal-800 dark:text-teal-300 hover:bg-teal-500/25 text-xs font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <span>{isMobileFiltersOpen ? 'Hide' : 'Edit'}</span>
              <span className="text-[10px]">{isMobileFiltersOpen ? '▲' : '▼'}</span>
            </button>
          </div>
        )}

        {/* ── LEFT COLUMN: CONTROL PANEL ── */}
        <aside className={`sidebar ${hasPredicted && !isMobileFiltersOpen ? 'hidden lg:flex' : 'flex'}`}>
          <form onSubmit={handleRunPrediction} className="space-y-4">
            {/* Mobile form header with close button */}
            {hasPredicted && isMobileFiltersOpen && (
              <div className="lg:hidden flex items-center justify-between p-3 rounded-xl bg-teal-400/10 border border-teal-400/25 text-xs">
                <span className="font-bold text-teal-300">Modify Rank &amp; Filter Options</span>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="text-white/70 hover:text-white font-bold px-2 py-0.5 rounded bg-white/5"
                >
                  ✕ Close
                </button>
              </div>
            )}

            {/* Quota / Pass Status Pill */}
            <div className="p-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {tierCategory.unlimited ? (
                  <Crown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                ) : (
                  <Zap className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                )}
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-[11px]">{tierCategory.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-white/50">
                    {tierCategory.unlimited 
                      ? 'Unlimited AI Predictions' 
                      : `${quotaRemaining} predictions remaining`}
                  </div>
                </div>
              </div>
              {!tierCategory.unlimited && (
                <button
                  type="button"
                  onClick={() => setLimitModal({ open: true, reason: user ? 'UPGRADE_REQUIRED' : 'REGISTER_REQUIRED' })}
                  className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:bg-amber-400/15 dark:border-amber-400/30 dark:text-amber-300 font-bold text-[10px] hover:bg-amber-500/25 transition-colors cursor-pointer"
                >
                  Upgrade
                </button>
              )}
            </div>

            {/* Card 1: 01 Rank / Score */}
            <div className="filter-card">
              <div className="fc-header">
                <div className="fc-num">01</div>
                <div className="fc-title">Candidate Rank / Score</div>
              </div>

              <div className="flex rounded-lg border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5 p-0.5 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('rank');
                    setValidationError('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    inputMode === 'rank' ? 'bg-teal-500 text-white font-black dark:bg-teal-400 dark:text-slate-950 shadow-sm' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  By Rank (AIR)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('score');
                    setValidationError('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    inputMode === 'score' ? 'bg-teal-500 text-white font-black dark:bg-teal-400 dark:text-slate-950 shadow-sm' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  By Score (out of 720)
                </button>
              </div>

              {inputMode === 'rank' ? (
                <div>
                  <label className="field-label">NEET All India Rank (AIR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={rank}
                    onChange={(e) => {
                      setRank(e.target.value);
                      setValidationError('');
                    }}
                    className="field-input"
                  />
                  <p className="field-hint">Enter your overall NEET All India Rank from your scorecard</p>
                </div>
              ) : (
                <div>
                  <label className="field-label">NEET Score (100–720)</label>
                  <input
                    type="number"
                    placeholder="e.g. 640"
                    value={score}
                    onChange={(e) => {
                      setScore(e.target.value);
                      setValidationError('');
                    }}
                    className="field-input"
                  />
                  {estimatedAirFromScore && (
                    <div className="mt-2 p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:bg-teal-400/10 dark:border-teal-400/30 dark:text-teal-300 text-xs flex items-center justify-between font-mono animate-fade-in">
                      <span>Approx. AIR:</span>
                      <strong className="text-sm">#{estimatedAirFromScore.toLocaleString()}</strong>
                    </div>
                  )}
                  <p className="field-hint">Approximated using calibrated NTA percentile distribution</p>
                </div>
              )}

              {validationError && (
                <div className="mt-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Card 2: 02 Category */}
            <div className="filter-card">
              <div className="fc-header">
                <div className="fc-num">02</div>
                <div className="fc-title">Counselling Category</div>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="field-select mb-1"
              >
                <option value="Open">Open (General / Unreserved)</option>
                <option value="OBC">OBC (Other Backward Classes)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="Open PwD">Open PwD</option>
                <option value="OBC PwD">OBC PwD</option>
                <option value="EWS PwD">EWS PwD</option>
                <option value="SC PwD">SC PwD</option>
                <option value="ST PwD">ST PwD</option>
              </select>
            </div>

            {/* Card 3: 03 Mode */}
            <div className="filter-card">
              <div className="fc-header">
                <div className="fc-num">03</div>
                <div className="fc-title">Prediction Engine Mode</div>
              </div>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="field-select mb-1.5"
              >
                <option value="best">Weighted 2-Year Forecast (2024 &amp; 2025 Recommended)</option>
                <option value="trend">YoY Trend Shift (Tightening vs Opening)</option>
                <option value="2025">2025 Cutoffs Only</option>
                <option value="2024">2024 Cutoffs Only</option>
                <option value="round1">Round 1 Only (Strict Initial Ranks)</option>
                <option value="round2">Round 2 Only</option>
                <option value="round3">Round 3 (Mop-Up)</option>
                <option value="stray">Stray Vacancy (Final Allotments)</option>
              </select>
              <p className="text-[11px] text-slate-500 dark:text-white/45 italic leading-snug">{modeHints[mode]}</p>
            </div>

            {/* Card 4: 04 Courses */}
            <div className="filter-card">
              <div className="fc-header">
                <div className="fc-num">04</div>
                <div className="fc-title">Medical Courses</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['MBBS', 'BDS', 'B.Sc. Nursing'].map((c) => {
                  const isChecked = selectedCourses.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCourse(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-teal-500/15 text-teal-800 border-teal-500/40 dark:bg-teal-400/20 dark:text-teal-300 dark:border-teal-400/40 font-black'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900 dark:bg-white/5 dark:text-white/60 dark:border-white/10 dark:hover:border-white/20'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 5: 05 Quotas */}
            <div className="filter-card">
              <div className="fc-header">
                <div className="fc-num">05</div>
                <div className="fc-title">Counselling Quotas</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
                {Object.keys(quotaMap).map((q) => {
                  const isChecked = selectedQuotas.includes(q);
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => toggleQuota(q)}
                      className={`flex items-center justify-between p-2 sm:p-2.5 rounded-lg text-xs font-medium border transition-all text-left cursor-pointer ${
                        isChecked
                          ? 'bg-teal-500/15 text-teal-900 border-teal-500/40 dark:bg-white/15 dark:text-white dark:border-white/30 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100 dark:bg-white/[0.02] dark:text-white/50 dark:border-white/5 dark:hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-1">{q}</span>
                      {isChecked && <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Run Predictor CTA with Breathing Glow Animation */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isPredicting || !dataLoaded}
              className="predict-btn cursor-pointer"
            >
              {isPredicting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Allotments…</span>
                </>
              ) : (
                <>
                  <Compass className="h-5 w-5 text-slate-950" />
                  <span>{hasPredicted ? 'Update Matches' : 'Find My Colleges (Run Engine)'}</span>
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={handleReset}
              className="reset-btn"
            >
              <RotateCcw className="h-3.5 w-3.5 inline mr-1" />
              <span>Reset All Parameters</span>
            </button>

            {/* Trust note */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-800 dark:bg-teal-400/[0.04] dark:border-teal-400/20 dark:text-teal-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>Verified MCC Empirical Model · Zero synthetic predictions</span>
            </div>
          </form>
        </aside>

        {/* ── RIGHT COLUMN: RESULTS & INTELLIGENCE HUD ── */}
        <main className="results-area" ref={resultsRef}>
          {isPredicting ? (
            /* ═══ 4-STEP REAL-TIME PROCESSING HUD ═══ */
            <div className="glass-panel p-6 sm:p-10 text-center animate-fade-in border-2 border-teal-400/40 shadow-[0_0_40px_rgba(0,229,170,0.2)] relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-teal-400/5 via-transparent to-transparent" />
              <Loader2 className="h-10 w-10 animate-spin text-teal-400 mx-auto mb-4" />
              
              <div className="text-sm sm:text-base font-extrabold text-teal-300 mb-1 font-heading">
                Running Empirical Cutoff Engine: Step {processingStep} of 4 ({procPercent}%)
              </div>
              <p className="text-xs text-white/60 mb-6 max-w-md mx-auto">
                Comparing your candidate rank across 70,858 historical MCC Round 1–Stray seat allocations…
              </p>

              {/* Step Timeline Indicator */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto text-left">
                {[
                  { step: 1, name: '1. Ingestion', desc: 'Rank & Allotment Load' },
                  { step: 2, name: '2. Cutoff Match', desc: '2024 & 2025 Rounds' },
                  { step: 3, name: '3. Quota Tiers', desc: 'Category Margins' },
                  { step: 4, name: '4. Strategy', desc: '4-Pillar Ranking' },
                ].map((st) => {
                  const isDone = processingStep > st.step;
                  const isActive = processingStep === st.step;
                  return (
                    <div
                      key={st.step}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-teal-400/15 border-teal-400/50 shadow-[0_0_15px_rgba(0,229,170,0.2)]'
                          : isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-white/[0.02] border-white/5 text-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : isActive ? (
                          <Loader2 className="h-3.5 w-3.5 text-teal-300 animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                        )}
                        <span className={`text-xs font-bold ${isActive ? 'text-teal-300' : isDone ? 'text-emerald-400' : 'text-white/40'}`}>
                          {st.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 truncate">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : !hasPredicted ? (
            /* ── INITIAL WELCOME HUD STATE (When user hasn't run predictor yet) ── */
            <div className="glass-panel p-5 sm:p-10 text-center relative overflow-hidden border border-teal-400/25">
              <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />

              {/* Radial Icon Core */}
              <div className="relative z-10 mb-4 sm:mb-6 inline-flex items-center justify-center">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-400/20 via-blue-500/15 to-purple-500/20 border border-teal-400/35 flex items-center justify-center shadow-[0_0_35px_rgba(0,229,170,0.25)]">
                  <Compass className="h-8 w-8 sm:h-12 sm:w-12 text-teal-300" />
                </div>
              </div>

              <div className="relative z-10 max-w-xl mx-auto">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-0.8 rounded-full bg-teal-400/10 border border-teal-400/30 text-teal-300 text-[11px] sm:text-xs font-bold mb-3 sm:mb-4 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-400 animate-pulse" />
                  <span>Awaiting Your NEET Details</span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 sm:mb-3 font-heading">
                  NEET College Predictor &amp; Cutoff Engine
                </h2>

                <p className="text-slate-600 dark:text-white/65 text-xs sm:text-sm md:text-base leading-relaxed mb-6 sm:mb-8">
                  Enter your <strong className="text-slate-900 dark:text-white">All India Rank (AIR)</strong> or <strong className="text-slate-900 dark:text-white">NEET Score</strong> on the left control panel, select your category &amp; quotas, then click <strong className="text-teal-700 dark:text-teal-300">&ldquo;Find My Colleges&rdquo;</strong> to view your personalized college matches.
                </p>

                {/* Quick Test Presets */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 mb-6 sm:mb-8 text-left">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider block mb-2 sm:mb-2.5">
                    ⚡ Or test with a sample rank preset:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => handleSelectPreset(5000, 'rank')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:bg-teal-400/10 dark:border-teal-400/30 dark:text-teal-300 hover:bg-teal-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>AIR 5,000</span>
                      <span className="text-[10px] text-teal-700 dark:text-teal-400/70 font-normal hidden sm:inline">(Top AIIMS &amp; GMCs)</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => handleSelectPreset(15000, 'rank')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:bg-amber-400/10 dark:border-amber-400/30 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>AIR 15,000</span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400/70 font-normal hidden sm:inline">(State Sweet Spot)</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => handleSelectPreset(645, 'score')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-800 dark:bg-purple-400/10 dark:border-purple-400/30 dark:text-purple-300 hover:bg-purple-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Score 645</span>
                      <span className="text-[10px] text-purple-700 dark:text-purple-400/70 font-normal hidden sm:inline">(≈ AIR 8,200)</span>
                    </motion.button>
                  </div>
                </div>

                {/* 3 Step Flow Guide */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/8">
                    <span className="text-teal-700 dark:text-teal-400 font-mono font-black text-xs block mb-1">01. ENTER DETAILS</span>
                    <p className="text-xs text-slate-600 dark:text-white/60 leading-snug">Input your AIR or score and select candidate category.</p>
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/8">
                    <span className="text-amber-700 dark:text-amber-400 font-mono font-black text-xs block mb-1">02. RUN PREDICTION</span>
                    <p className="text-xs text-slate-600 dark:text-white/60 leading-snug">Evaluates 70,858 verified allotments from MCC 2024 &amp; 2025.</p>
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/8">
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-xs block mb-1">03. 4-PILLAR LIST</span>
                    <p className="text-xs text-slate-600 dark:text-white/60 leading-snug">Review Safety, Target, Reach &amp; Long Shot categorized matches.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── RESULTS DISPLAYED AFTER USER RUNS PREDICTION ── */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* Donut Summary Dashboard */}
              <DonutSummary
                counts={counts}
                activeFilter={selectedStrategy}
                onSelectFilter={setSelectedStrategy}
              />

              {/* Stats Toolbar */}
              <div className="stats-bar">
                <div className="flex items-center justify-between w-full md:w-auto gap-2">
                  <div className="text-xs text-slate-600 dark:text-white/70 font-bold">
                    Matches: <strong className="text-slate-900 dark:text-white mono-font text-sm">{filteredResults.length}</strong> colleges
                  </div>
                  {filteredResults.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="md:hidden h-7 px-2.5 rounded-lg border border-white/10 bg-white/5 text-teal-300 hover:bg-white/10 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Export results to CSV"
                    >
                      <Download className="h-3 w-3" />
                      <span>CSV</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  {/* Search Box */}
                  <div className="relative flex-1 sm:w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Filter college or state…"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="field-input pl-8 py-1.5 text-xs w-full font-normal"
                    />
                  </div>

                  {/* Dropdowns Grid */}
                  <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                    {/* State Select */}
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="field-select py-1.5 text-xs w-full sm:w-auto sm:min-w-[120px] truncate"
                    >
                      <option value="">All States ({availableStates.length})</option>
                      {availableStates.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {/* College Type Select */}
                    <select
                      value={selectedCollegeType}
                      onChange={(e) => {
                        setSelectedCollegeType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="field-select py-1.5 text-xs w-full sm:w-auto sm:min-w-[100px] truncate"
                    >
                      <option value="">All Types</option>
                      <option value="AIIMS">AIIMS</option>
                      <option value="JIPMER">JIPMER</option>
                      <option value="ESI">ESI</option>
                      <option value="Government">Govt</option>
                      <option value="Deemed">Deemed</option>
                      <option value="Central">Central</option>
                    </select>

                    {/* Sort By Select */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="field-select py-1.5 text-xs w-full sm:w-auto sm:min-w-[120px] truncate"
                    >
                      <option value="strategy-asc">Recommended</option>
                      <option value="rank-asc">Cutoff: Low→High</option>
                      <option value="rank-desc">Cutoff: High→Low</option>
                      <option value="name-asc">Name (A-Z)</option>
                    </select>

                    {/* Desktop CSV Button */}
                    {filteredResults.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="hidden md:flex h-8 px-2.5 rounded-lg border border-white/10 bg-white/5 text-teal-300 hover:bg-white/10 text-xs font-bold items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="Export results to CSV"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>CSV</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results List */}
              {filteredResults.length > 0 ? (
                <div className="results-grid">
                  {pagedResults.map((college, idx) => (
                    <CollegeCard
                      key={college.key}
                      college={college}
                      indexNum={(currentPage - 1) * PER_PAGE + idx + 1}
                      onOpenDetails={setActiveCollegeModal}
                      onToggleCompare={handleToggleCompare}
                      isSelectedForCompare={compareList.some(c => c.key === college.key)}
                    />
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="btn-secondary py-2 px-4 text-xs disabled:opacity-30 cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-slate-600 dark:text-white/60 px-2 mono-font">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="btn-secondary py-2 px-4 text-xs disabled:opacity-30 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-panel p-12 text-center">
                  <Building2 className="h-10 w-10 text-slate-400 dark:text-white/30 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No colleges match your active filters</h3>
                  <p className="text-xs text-slate-600 dark:text-white/50 max-w-sm mx-auto mb-4">
                    Try widening your quota selections, resetting state filters, or switching baseline mode.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedStrategy(null);
                      setSelectedState('');
                      setSelectedCollegeType('');
                      setSearchQuery('');
                    }}
                    className="btn-secondary py-2 px-5 text-xs cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>

      {/* Historical Breakdown Modal */}
      <CutoffModal
        college={activeCollegeModal}
        onClose={() => setActiveCollegeModal(null)}
      />

      {/* Side-by-Side Compare Drawer */}
      <CompareDrawer
        compareList={compareList}
        onRemove={(key) => setCompareList(compareList.filter(c => c.key !== key))}
        onClear={() => setCompareList([])}
      />

      {/* Paywall Prediction Limit Modal */}
      {limitModal.open && (
        <PredictionLimitModal
          reason={limitModal.reason}
          message={limitModal.message}
          onClose={() => setLimitModal(prev => ({ ...prev, open: false }))}
          onUpgradeSuccess={(planKey, paymentId) => {
            setCelebrationModal({ open: true, planKey, paymentId });
          }}
        />
      )}

      {/* Post-Payment Celebration Modal */}
      {celebrationModal.open && (
        <PaymentCelebrationModal
          planKey={celebrationModal.planKey}
          paymentId={celebrationModal.paymentId}
          onClose={() => setCelebrationModal(prev => ({ ...prev, open: false }))}
        />
      )}

      {/* Auth Modal for Claiming 5 Free Trial Predictions */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Claim Your 5 Free AI Predictions"
        subtitle="Sign in or create a free candidate account to unlock instant cutoff forecasts across all 750+ medical colleges."
        onSuccess={() => {
          setAuthModalOpen(false);
          const targetRank = rank ? parseInt(rank, 10) : undefined;
          const targetScore = score ? parseInt(score, 10) : undefined;
          if (targetRank || targetScore) {
            executePrediction(targetRank, targetScore, inputMode);
          }
        }}
      />
    </div>
  );
}

export default function PredictPage() {
  return (
    <Suspense fallback={
      <div className="p-16 text-center text-white/50">Loading predictor…</div>
    }>
      <PredictorContent />
    </Suspense>
  );
}
