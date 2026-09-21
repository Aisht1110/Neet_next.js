'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Search, 
  Sparkles, 
  ExternalLink, 
  BookOpen, 
  Filter, 
  Loader2, 
  Heart,
  Compass,
  ArrowRight,
  Info
} from 'lucide-react';
import { getCollegeData } from '@/lib/engine/collegeData';
import { CollegeIndexEntry, RoundInfo, MasterCollege } from '@/lib/engine/types';
import { getCollegeType } from '@/lib/engine/predictor';
import { 
  STATE_BOND_DATA, 
  STATE_STIPEND_DATA, 
  getEstimatedFee, 
  getInternalPgQuota 
} from '@/lib/engine/collegeIntelligence';
import { useUserData } from '@/lib/store/useUserData';
import { CutoffModal, CutoffModalCollegeData } from '@/components/predictor/CutoffModal';
import { BrandIcon } from '@/components/common/BrandIcon';

export default function CollegesPage() {
  const [index, setIndex] = useState<Map<string, CollegeIndexEntry> | null>(null);
  const [search, setSearch] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('MBBS');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeCollegeModal, setActiveCollegeModal] = useState<CutoffModalCollegeData | null>(null);
  const PER_PAGE = 24;

  const { isInWishlist, toggleWishlist } = useUserData();

  useEffect(() => {
    getCollegeData().then(({ index }) => {
      setIndex(index);
    });
  }, []);

  // Aggregate unique colleges from index
  const uniqueColleges = useMemo(() => {
    if (!index) return [];
    const map = new Map<string, {
      key: string;
      id: string;
      name: string;
      institute: string;
      state: string;
      course: string;
      quota: string;
      availableQuotas: string[];
      category: string;
      availableCategories: string[];
      type: ReturnType<typeof getCollegeType>;
      bestRank: number;
      masterInfo?: MasterCollege;
      rounds: RoundInfo[];
    }>();

    for (const [, entry] of index) {
      if (selectedCourse && entry.course !== selectedCourse) continue;

      const slug = `${entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${entry.course.toLowerCase()}`;

      const cType = getCollegeType(entry.institute, entry.quota);
      const allSourceRounds = entry.allHistoricalRounds && entry.allHistoricalRounds.length > 0
        ? entry.allHistoricalRounds
        : entry.rounds;
      const minRank = Math.min(...allSourceRounds.map(r => r.closing_rank).filter(r => r > 0));

      if (!map.has(slug)) {
        const initialQuotas = entry.availableQuotas && entry.availableQuotas.length > 0
          ? [...entry.availableQuotas]
          : [entry.quota];
        const initialCategories = entry.availableCategories && entry.availableCategories.length > 0
          ? [...entry.availableCategories]
          : [entry.category];

        map.set(slug, {
          key: entry.key,
          id: slug,
          name: entry.name,
          institute: entry.institute,
          state: entry.state,
          course: entry.course,
          quota: entry.quota,
          availableQuotas: initialQuotas,
          category: entry.category,
          availableCategories: initialCategories,
          type: cType,
          bestRank: minRank !== Infinity ? minRank : 0,
          masterInfo: entry.masterInfo,
          rounds: [...allSourceRounds],
        });
      } else {
        const existing = map.get(slug)!;
        if (minRank < existing.bestRank && minRank > 0) {
          existing.bestRank = minRank;
        }
        if (!existing.masterInfo && entry.masterInfo) {
          existing.masterInfo = entry.masterInfo;
        }

        // Add any missing quotas
        if (!existing.availableQuotas.includes(entry.quota)) {
          existing.availableQuotas.push(entry.quota);
        }
        if (entry.availableQuotas) {
          for (const q of entry.availableQuotas) {
            if (!existing.availableQuotas.includes(q)) existing.availableQuotas.push(q);
          }
        }

        // Add any missing categories
        if (!existing.availableCategories.includes(entry.category)) {
          existing.availableCategories.push(entry.category);
        }
        if (entry.availableCategories) {
          for (const cat of entry.availableCategories) {
            if (!existing.availableCategories.includes(cat)) existing.availableCategories.push(cat);
          }
        }

        // Merge all rounds additively without overwriting or dropping
        for (const r of allSourceRounds) {
          const already = existing.rounds.some(
            er => er.year === r.year && er.round === r.round && er.quota === r.quota && er.allotted_category === r.allotted_category
          );
          if (!already) {
            existing.rounds.push(r);
          }
        }

        // Prioritize Open category & All India quota for card default labels
        if (entry.category === 'Open' && (existing.category !== 'Open' || entry.quota === 'All India' || entry.quota === 'Open Seat Quota')) {
          existing.key = entry.key;
          existing.quota = entry.quota;
          existing.category = entry.category;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.bestRank === 0) return 1;
      if (b.bestRank === 0) return -1;
      return a.bestRank - b.bestRank;
    });
  }, [index, selectedCourse]);

  // Filtered colleges
  const filtered = useMemo(() => {
    return uniqueColleges.filter((c) => {
      if (selectedState && c.state !== selectedState) return false;
      if (selectedType && c.type.type !== selectedType) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.state || '').toLowerCase().includes(q) || c.institute.toLowerCase().includes(q);
      }
      return true;
    });
  }, [uniqueColleges, selectedState, selectedType, search]);

  const states = useMemo(() => {
    return Array.from(new Set(uniqueColleges.map(c => c.state).filter(Boolean))).sort();
  }, [uniqueColleges]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleOpenCollegeDetails = (c: typeof uniqueColleges[0]) => {
    const rounds2024 = c.rounds.filter(r => String(r.year) === '2024');
    const rounds2025 = c.rounds.filter(r => String(r.year) === '2025');
    const min2024 = rounds2024.map(r => r.closing_rank).filter(r => r > 0).sort((a,b) => a-b)[0] || null;
    const min2025 = rounds2025.map(r => r.closing_rank).filter(r => r > 0).sort((a,b) => a-b)[0] || null;

    setActiveCollegeModal({
      key: c.key,
      name: c.name,
      institute: c.institute,
      state: c.state,
      course: c.course,
      quota: c.quota,
      availableQuotas: c.availableQuotas,
      category: c.category,
      availableCategories: c.availableCategories,
      closingRank: c.bestRank,
      collegeType: c.type,
      masterInfo: c.masterInfo,
      rounds: c.rounds,
      allHistoricalRounds: c.rounds,
      projected: {
        basis: `Official MCC Counselling allotment record across 2024 & 2025. Best historical closing rank: ~${c.bestRank > 0 ? c.bestRank.toLocaleString() : 'N/A'} AIR across all counselling rounds.`,
        best2024: min2024,
        best2025: min2025,
        rank: c.bestRank,
      }
    });
  };

  return (
    <div className="w-full">
      {/* ── HERO BANNER ── */}
      <header className="hero-header">
        <div className="hero-content">
          <div className="hero-flex">
            <div className="hero-left">
              <div className="hero-tag">
                <BrandIcon size={18} className="-ml-0.5" />
                <span>OFFICIAL MEDICAL COLLEGES DIRECTORY</span>
              </div>
              <h1 className="hero-title text-2xl sm:text-3xl font-black">
                700+ Medical Colleges & <span className="text-gradient">Fee Explorer</span>
              </h1>
              <p className="hero-sub">
                Explore annual tuition fees, state rural bonds, monthly stipends, and internal PG quotas across all Indian institutions.
              </p>
              <div className="hero-pills-row">
                <span className="data-pill">🏥 Government Medical Colleges</span>
                <span className="data-pill">✨ All 20+ AIIMS & JIPMER</span>
                <span className="data-pill">📜 Verified State Bonds</span>
              </div>
            </div>

            <div className="hero-stats-row hidden sm:flex">
              <div className="hs-item">
                <div className="hs-val">{uniqueColleges.length || '700+'}</div>
                <div className="hs-lbl">Institutions</div>
              </div>
              <div className="hs-item">
                <div className="hs-val">{states.length || '36'}</div>
                <div className="hs-lbl">States & UTs</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN DIRECTORY AREA ── */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Search & Filter Bar */}
        <div className="glass-panel p-4 sm:p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search college name, state, or city…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field pl-10 text-xs py-2.5"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
            {/* Course Filter */}
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setCurrentPage(1);
              }}
              className="select-field text-xs py-2 w-auto"
            >
              <option value="MBBS">MBBS Only</option>
              <option value="BDS">BDS Only</option>
              <option value="B.Sc. Nursing">B.Sc. Nursing</option>
              <option value="">All Courses</option>
            </select>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setCurrentPage(1);
              }}
              className="select-field text-xs py-2 w-auto min-w-[130px]"
            >
              <option value="">All States ({states.length})</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="select-field text-xs py-2 w-auto min-w-[130px]"
            >
              <option value="">All College Types</option>
              <option value="AIIMS">AIIMS</option>
              <option value="JIPMER">JIPMER</option>
              <option value="ESI">ESI Hospitals</option>
              <option value="Government">Government Medical Colleges</option>
              <option value="Deemed">Deemed Universities</option>
              <option value="Central">Central Universities</option>
            </select>
          </div>
        </div>

        {/* College Grid */}
        {index ? (
          <div>
            <div className="text-xs text-white/60 mb-5 px-1 font-semibold flex items-center justify-between">
              <span>Showing {paged.length} of {filtered.length} matching medical colleges</span>
              {filtered.length > 0 && <span className="mono-font text-teal-400">Page {currentPage} of {totalPages}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map((c) => {
                const bond = STATE_BOND_DATA[c.state] || null;
                const stipend = STATE_STIPEND_DATA[c.state] || null;
                const fee = getEstimatedFee(c.name, c.quota);
                const pg = getInternalPgQuota(c.name);
                const isWishlisted = isInWishlist(c.key);

                return (
                  <div 
                    key={c.id} 
                    onClick={() => handleOpenCollegeDetails(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenCollegeDetails(c);
                      }
                    }}
                    className="glass-panel p-5 hover:border-teal-400/50 hover:shadow-[0_0_24px_rgba(0,229,170,0.12)] transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`badge ${c.type.cls}`}>{c.type.label}</span>
                          {c.masterInfo?.management && (
                            <span className="badge bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {c.masterInfo.management}
                            </span>
                          )}
                          <span className="badge bg-teal-400/10 text-teal-300 border border-teal-400/20">{c.course}</span>
                          {c.masterInfo?.established_year && (
                            <span className="badge bg-white/5 text-white/50 border border-white/10 font-mono text-[10px]">
                              Est. {c.masterInfo.established_year}
                            </span>
                          )}
                          {pg && (
                            <span className="badge bg-purple-400/15 text-purple-300 border border-purple-400/30 text-[10px]">
                              {pg.univ.includes('DU') ? '50% DU PG' : pg.univ.includes('IPU') ? '50% IPU PG' : 'Internal PG'}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist({
                              key: c.key,
                              name: c.name,
                              institute: c.institute,
                              state: c.state,
                              course: c.course,
                              quota: c.quota,
                              category: c.category,
                              closingRank: c.bestRank,
                              collegeType: c.type.label,
                              savedAt: new Date().toISOString()
                            });
                          }}
                          className={`h-8 w-8 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                            isWishlisted ? 'border-rose-400/50 bg-rose-400/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]' : 'border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                          }`}
                          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-400 text-rose-400' : ''}`} />
                        </button>
                      </div>

                      <h3 className="font-bold text-white text-base leading-snug line-clamp-2 mb-1 group-hover:text-teal-300 transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-xs text-white/50 flex items-center gap-1.5 mb-3.5">
                        <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                        <span>{c.state || 'All India'}</span>
                      </p>

                      {/* Quick Metrics: Fee, Seats, Bond, Stipend */}
                      <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] mb-4">
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase font-bold">Annual Fee</span>
                          <span className="font-bold text-emerald-400 mono-font truncate block">{fee.annualFee}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase font-bold">MBBS Seats</span>
                          <span className="font-bold text-cyan-300 mono-font truncate block">
                            {c.masterInfo?.mbbs_seats ? `${c.masterInfo.mbbs_seats} Seats` : '150 - 250'}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase font-bold">Rural Bond</span>
                          <span className="font-bold text-amber-300 block truncate">
                            {bond ? (bond.years === 0 ? '0 Yrs' : `${bond.years} Yrs`) : 'No Bond'}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase font-bold">Stipend</span>
                          <span className="font-bold text-teal-300 mono-font block truncate">
                            {stipend ? stipend.display : 'State'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <div className="text-xs min-w-0">
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Best Closing Rank</span>
                        <span className="font-black text-teal-300 mono-font text-sm truncate block">
                          {c.bestRank > 0 ? `~${c.bestRank.toLocaleString()} AIR` : 'Cutoff Varies'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCollegeDetails(c);
                          }}
                          className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 hover:border-teal-400/50 hover:bg-teal-400/10 text-teal-300 cursor-pointer"
                          title="View Round-by-Round Breakdown"
                        >
                          <Info className="h-3.5 w-3.5" />
                          <span>Cutoffs</span>
                        </button>

                        <Link
                          href={`/predict?rank=${c.bestRank || 15000}`}
                          onClick={(e) => e.stopPropagation()}
                          className="btn-primary py-1.5 px-3 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Compass className="h-3.5 w-3.5 text-slate-950" />
                          <span>Predict</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
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
          <div className="glass-panel p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Loading College Directory…</h3>
            <p className="text-xs text-white/50">Aggregating nationwide medical seat matrices</p>
          </div>
        )}
      </div>

      {/* Historical Breakdown Modal */}
      <CutoffModal
        college={activeCollegeModal}
        onClose={() => setActiveCollegeModal(null)}
      />
    </div>
  );
}
