'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
} from 'lucide-react';
import { getCollegeData } from '@/lib/engine/collegeData';
import { scoreToRank } from '@/lib/engine/scoreToRank';
import { 
  runPredictionEngine, 
  quotaMap, 
  modeHints 
} from '@/lib/engine/predictor';
import { 
  CollegeIndexEntry, 
  PredictionResult, 
  StrategyKey 
} from '@/lib/engine/types';
import { DonutSummary } from '@/components/predictor/DonutSummary';
import { CollegeCard } from '@/components/predictor/CollegeCard';
import { CutoffModal } from '@/components/predictor/CutoffModal';
import { CompareDrawer } from '@/components/predictor/CompareDrawer';
import { BrandIcon } from '@/components/common/BrandIcon';

function PredictorContent() {
  const searchParams = useSearchParams();

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

  // Execution & Validation States
  const [hasPredicted, setHasPredicted] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [collegeIndex, setCollegeIndex] = useState<Map<string, CollegeIndexEntry> | null>(null);
  const [rawResults, setRawResults] = useState<PredictionResult[]>([]);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(0);

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

  // 2. Load dataset in the background
  useEffect(() => {
    getCollegeData()
      .then(({ index }) => {
        setCollegeIndex(index);
        setDataLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load cutoff database:', err);
      });
  }, []);

  // 3. Execute Prediction Logic
  const executePrediction = (targetRank?: number, targetScore?: number, modeType: 'rank' | 'score' = 'rank') => {
    if (!collegeIndex) return;
    setIsPredicting(true);
    setProcessingStep(1);

    setTimeout(() => setProcessingStep(2), 180);
    setTimeout(() => setProcessingStep(3), 360);
    setTimeout(() => {
      setProcessingStep(4);
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
        if (typeof window !== 'undefined' && window.innerWidth <= 1024 && resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }, 500);
  };

  // 4. ONLY auto-run on initial load IF explicit rank or score was provided in URL params!
  useEffect(() => {
    if (dataLoaded && collegeIndex) {
      const urlRank = searchParams.get('rank');
      const urlScore = searchParams.get('score');
      if (urlRank || urlScore) {
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

  // Instant CSV Export
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

  return (
    <div className="w-full">
      {/* ── 1. COMPACT HERO HEADER BAR (Matching predict.html) ── */}
      <header className="hero-header">
        <div className="hero-content">
          <div className="hero-flex">
            <div className="hero-left">
              <div className="hero-tag">
                <BrandIcon size={18} className="-ml-0.5" />
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
                <div className="hs-val text-teal-300">70,858</div>
                <div className="hs-lbl">Allotments</div>
              </div>
              <div className="hs-item">
                <div className="hs-val text-amber-300">17,671</div>
                <div className="hs-lbl">Cutoff Records</div>
              </div>
              <div className="hs-item">
                <div className="hs-val text-purple-300">36</div>
                <div className="hs-lbl">States Covered</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. PREDICTOR 2-COLUMN WRAPPER ── */}
      <div className="predictor-wrap">
        {/* Mobile Quick Parameter Summary Bar (Visible on mobile/tablet <= 1024px when hasPredicted is true) */}
        {hasPredicted && (
          <div className="lg:hidden p-3 rounded-2xl bg-[#0c1024]/95 border border-teal-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center justify-between gap-2.5 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/15 border border-teal-400/30 text-teal-300 font-black text-xs shrink-0">
                ⚡
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-xs font-bold text-white truncate">
                  <span className="text-teal-300 mono-font">
                    {inputMode === 'rank' ? `AIR #${parseInt(rank || '0', 10).toLocaleString()}` : `Score ${score}/720`}
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="text-purple-300">{category}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/70">{selectedCourses.join(', ')}</span>
                </div>
                <div className="text-[11px] text-white/50 truncate flex items-center gap-1.5 mt-0.5">
                  <span className="text-emerald-400 font-bold mono-font">{filteredResults.length}</span>
                  <span>matches found</span>
                  <span className="text-white/20">·</span>
                  <span className="text-white/40">{selectedQuotas.length} quotas</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="px-3 py-1.5 rounded-xl border border-teal-400/40 bg-teal-400/15 text-teal-300 hover:bg-teal-400/25 text-xs font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
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

            {/* Card 1: 01 Rank / Score */}
            <div className="filter-card">
              <div className="fc-header">
                <div className="fc-num">01</div>
                <div className="fc-title">Candidate Rank / Score</div>
              </div>

              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('rank');
                    setValidationError('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    inputMode === 'rank' ? 'bg-teal-400 text-slate-950 shadow' : 'text-white/60 hover:text-white'
                  }`}
                >
                  All India Rank (AIR)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('score');
                    setValidationError('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    inputMode === 'score' ? 'bg-teal-400 text-slate-950 shadow' : 'text-white/60 hover:text-white'
                  }`}
                >
                  NEET Score (100–720)
                </button>
              </div>

              {inputMode === 'rank' ? (
                <div>
                  <input
                    type="number"
                    min="1"
                    max="2500000"
                    value={rank}
                    onChange={(e) => {
                      setRank(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    className="field-input text-teal-300 font-bold"
                    placeholder="Enter your AIR (e.g. 12500)"
                    autoFocus={!hasPredicted}
                  />
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-white/40">Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(5000, 'rank')}
                      className="text-[10px] text-teal-400 hover:text-teal-300 bg-white/5 px-2 py-0.5 rounded border border-white/10"
                    >
                      #5,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(15000, 'rank')}
                      className="text-[10px] text-teal-400 hover:text-teal-300 bg-white/5 px-2 py-0.5 rounded border border-white/10"
                    >
                      #15,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(45000, 'rank')}
                      className="text-[10px] text-teal-400 hover:text-teal-300 bg-white/5 px-2 py-0.5 rounded border border-white/10"
                    >
                      #45,000
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="number"
                    min="100"
                    max="720"
                    value={score}
                    onChange={(e) => {
                      setScore(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    className="field-input text-teal-300 font-bold"
                    placeholder="Enter Score (e.g. 645)"
                    autoFocus={!hasPredicted}
                  />
                  {estimatedAirFromScore && (
                    <p className="text-[11px] text-teal-300 font-semibold mt-1">
                      Estimated AIR: ~{estimatedAirFromScore.toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-white/40">Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(680, 'score')}
                      className="text-[10px] text-teal-400 hover:text-teal-300 bg-white/5 px-2 py-0.5 rounded border border-white/10"
                    >
                      680
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(645, 'score')}
                      className="text-[10px] text-teal-400 hover:text-teal-300 bg-white/5 px-2 py-0.5 rounded border border-white/10"
                    >
                      645
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(590, 'score')}
                      className="text-[10px] text-teal-400 hover:text-teal-300 bg-white/5 px-2 py-0.5 rounded border border-white/10"
                    >
                      590
                    </button>
                  </div>
                </div>
              )}

              {validationError && (
                <div className="mt-2.5 p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
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
                className="field-select"
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
              {category !== 'Open' && (
                <p className="text-[11px] text-white/45 mt-1.5 leading-snug">
                  * Evaluated for both {category} and Open (UR) merit seats automatically.
                </p>
              )}
            </div>

            {/* Card 3: 03 Forecast Baseline Mode */}
            <div className="filter-card">
              <div className="fc-header">
                <div className="fc-num">03</div>
                <div className="fc-title">Forecast Baseline Mode</div>
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
              <p className="text-[11px] text-white/45 italic leading-snug">{modeHints[mode]}</p>
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
                          ? 'bg-teal-400/20 text-teal-300 border-teal-400/40'
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
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
                          ? 'bg-white/15 text-white border-white/30 font-bold'
                          : 'bg-white/[0.02] text-white/50 border-white/5 hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-1">{q}</span>
                      {isChecked && <Check className="h-3.5 w-3.5 text-teal-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Run Predictor CTA */}
            <button
              type="submit"
              disabled={isPredicting || !dataLoaded}
              className="predict-btn"
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
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="reset-btn"
            >
              <RotateCcw className="h-3.5 w-3.5 inline mr-1" />
              <span>Reset All Parameters</span>
            </button>

            {/* Close filters button on mobile when opened */}
            {hasPredicted && isMobileFiltersOpen && (
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="lg:hidden w-full py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white text-xs font-bold bg-white/5"
              >
                Close &amp; View {filteredResults.length} Matches
              </button>
            )}

            {/* Trust note */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-400/[0.04] border border-teal-400/20 text-xs text-teal-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal-400" />
              <span>Verified MCC Empirical Model · Zero synthetic predictions</span>
            </div>
          </form>
        </aside>

        {/* ── RIGHT COLUMN: RESULTS & INTELLIGENCE HUD ── */}
        <main className="results-area" ref={resultsRef}>
          {!dataLoaded ? (
            <div className="glass-panel p-10 sm:p-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Loading MCC Allotment Database…</h3>
              <p className="text-xs text-white/50">Indexing 17,671 cutoff records</p>
            </div>
          ) : isPredicting ? (
            /* Multi-step Processing HUD */
            <div className="glass-panel p-6 sm:p-10 text-center animate-fade-in border border-teal-400/30">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-teal-400 mx-auto mb-3" />
              <div className="text-xs sm:text-sm font-bold text-teal-300 mb-1">
                Analyzing Cutoffs: Step {processingStep} of 4 ({processingStep * 25}%)
              </div>
              <p className="text-[11px] sm:text-xs text-white/60 mb-4 sm:mb-6">Evaluating your rank across 70,858 verified historical seat records…</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-[11px] text-white/50 max-w-md mx-auto">
                <div className={processingStep >= 1 ? 'text-teal-300 font-bold' : ''}>1. Ingestion</div>
                <div className={processingStep >= 2 ? 'text-teal-300 font-bold' : ''}>2. Cutoff Match</div>
                <div className={processingStep >= 3 ? 'text-teal-300 font-bold' : ''}>3. Quota Tiers</div>
                <div className={processingStep >= 4 ? 'text-teal-300 font-bold' : ''}>4. Strategy Pillars</div>
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

                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2 sm:mb-3 font-heading">
                  NEET College Predictor &amp; Cutoff Engine
                </h2>

                <p className="text-white/65 text-xs sm:text-sm md:text-base leading-relaxed mb-6 sm:mb-8">
                  Enter your <strong className="text-white">All India Rank (AIR)</strong> or <strong className="text-white">NEET Score</strong> on the left control panel, select your category &amp; quotas, then click <strong className="text-teal-300">&ldquo;Find My Colleges&rdquo;</strong> to view your personalized college matches.
                </p>

                {/* Quick Test Presets */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 sm:mb-8 text-left">
                  <span className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2 sm:mb-2.5">
                    ⚡ Or test with a sample rank preset:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(5000, 'rank')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-400/10 border border-teal-400/30 text-teal-300 hover:bg-teal-400/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>AIR 5,000</span>
                      <span className="text-[10px] text-teal-400/70 font-normal hidden sm:inline">(Top AIIMS &amp; GMCs)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(15000, 'rank')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 hover:bg-amber-400/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>AIR 15,000</span>
                      <span className="text-[10px] text-amber-400/70 font-normal hidden sm:inline">(State Sweet Spot)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(645, 'score')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-400/10 border border-purple-400/30 text-purple-300 hover:bg-purple-400/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Score 645</span>
                      <span className="text-[10px] text-purple-400/70 font-normal hidden sm:inline">(≈ AIR 8,200)</span>
                    </button>
                  </div>
                </div>

                {/* 3 Step Flow Guide */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/8">
                    <span className="text-teal-400 font-mono font-black text-xs block mb-1">01. ENTER DETAILS</span>
                    <p className="text-xs text-white/60 leading-snug">Input your AIR or score and select candidate category.</p>
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/8">
                    <span className="text-amber-400 font-mono font-black text-xs block mb-1">02. RUN PREDICTION</span>
                    <p className="text-xs text-white/60 leading-snug">Evaluates 70,858 verified allotments from MCC 2024 &amp; 2025.</p>
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/8">
                    <span className="text-emerald-400 font-mono font-black text-xs block mb-1">03. 4-PILLAR LIST</span>
                    <p className="text-xs text-white/60 leading-snug">Review Safety, Target, Reach &amp; Long Shot categorized matches.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── RESULTS DISPLAYED AFTER USER RUNS PREDICTION ── */
            <div>
              {/* Donut Summary Dashboard */}
              <DonutSummary
                counts={counts}
                activeFilter={selectedStrategy}
                onSelectFilter={setSelectedStrategy}
              />

              {/* Stats Toolbar */}
              <div className="stats-bar">
                <div className="flex items-center justify-between w-full md:w-auto gap-2">
                  <div className="text-xs text-white/70 font-bold">
                    Matches: <strong className="text-white mono-font text-sm">{filteredResults.length}</strong> colleges
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

                  {/* Dropdowns Grid for Mobile, Inline for Desktop */}
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
                      <span className="text-xs text-white/60 px-2 mono-font">
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
                  <Building2 className="h-10 w-10 text-white/30 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No colleges match your active filters</h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto mb-4">
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
            </div>
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
