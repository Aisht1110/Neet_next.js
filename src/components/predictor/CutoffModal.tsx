'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Sparkles, 
  MapPin, 
  GraduationCap, 
  ExternalLink,
  Layers,
  Users
} from 'lucide-react';
import { RoundInfo, MasterCollege } from '@/lib/engine/types';
import { 
  STATE_BOND_DATA, 
  STATE_STIPEND_DATA, 
  getInternalPgQuota, 
  getEstimatedFee, 
  getClinicalExposure 
} from '@/lib/engine/collegeIntelligence';

export interface CutoffModalCollegeData {
  key?: string;
  name: string;
  institute: string;
  state?: string;
  course?: string;
  quota?: string;
  availableQuotas?: string[];
  category?: string;
  availableCategories?: string[];
  isUrFallback?: boolean;
  closingRank?: number;
  collegeType?: { cls?: string; label?: string; type?: string };
  masterInfo?: MasterCollege;
  projected?: {
    basis?: string;
    note?: string;
    best2024?: number | null;
    best2025?: number | null;
    rank?: number;
  };
  rounds?: RoundInfo[];
  allHistoricalRounds?: RoundInfo[];
}

interface CutoffModalProps {
  college: CutoffModalCollegeData | null;
  onClose: () => void;
}

export const CutoffModal: React.FC<CutoffModalProps> = ({ college, onClose }) => {
  const [selectedModalQuota, setSelectedModalQuota] = useState<string>('all');
  const [selectedModalCategory, setSelectedModalCategory] = useState<string>('all');

  // Reset selected filters when college changes
  useEffect(() => {
    if (college) {
      setSelectedModalQuota(college.quota || 'all');
      setSelectedModalCategory(college.category || 'all');
    } else {
      setSelectedModalQuota('all');
      setSelectedModalCategory('all');
    }
  }, [college]);

  // Close on Escape key press
  useEffect(() => {
    if (!college) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [college, onClose]);

  if (!college) return null;

  const normalizeRName = (r: string) => {
    const s = String(r || '').trim();
    if (s === '1' || s.toLowerCase() === 'round 1') return 'Round 1';
    if (s === '2' || s.toLowerCase() === 'round 2') return 'Round 2';
    if (s === '3' || s.toLowerCase() === 'round 3') return 'Round 3';
    if (s.toLowerCase() === 'special_stray' || s.toLowerCase().includes('special stray')) return 'Special Stray Vacancy';
    if (s.toLowerCase() === 'stray' || s.toLowerCase().includes('stray vacancy')) return 'Stray Vacancy';
    return s;
  };

  const rawRounds = (college.allHistoricalRounds && college.allHistoricalRounds.length > 0)
    ? college.allHistoricalRounds
    : (college.rounds || []);

  const normalizedRounds = rawRounds.map(r => ({
    ...r,
    round: normalizeRName(r.round),
    year: String(r.year),
    quota: r.quota || college.quota || 'All India',
    allotted_category: r.allotted_category || r.candidate_category || college.category || 'Open'
  }));

  const availableQuotas = Array.from(
    new Set([
      ...(college.availableQuotas || []),
      ...normalizedRounds.map(r => r.quota).filter(Boolean)
    ])
  ) as string[];

  const availableCategories = Array.from(
    new Set([
      ...(college.availableCategories || []),
      ...normalizedRounds.map(r => r.allotted_category).filter(Boolean)
    ])
  ) as string[];

  const activeRounds = normalizedRounds.filter(r => {
    if (selectedModalQuota !== 'all' && r.quota !== selectedModalQuota) return false;
    if (selectedModalCategory !== 'all' && r.allotted_category !== selectedModalCategory) return false;
    return true;
  });

  const standardRounds = ['Round 1', 'Round 2', 'Round 3', 'Stray Vacancy', 'Special Stray Vacancy'];

  // Collect distinct (round, quota) rows
  const comboMap = new Map<string, { round: string; quota: string }>();
  for (const r of activeRounds) {
    const qKey = selectedModalQuota === 'all' ? r.quota : (college.quota || r.quota);
    const k = `${r.round}|${qKey}`;
    if (!comboMap.has(k)) {
      comboMap.set(k, { round: r.round, quota: qKey });
    }
  }

  const sortedCombos = Array.from(comboMap.values()).sort((a, b) => {
    const idxA = standardRounds.indexOf(a.round);
    const idxB = standardRounds.indexOf(b.round);
    const posA = idxA === -1 ? 99 : idxA;
    const posB = idxB === -1 ? 99 : idxB;
    if (posA !== posB) return posA - posB;
    return a.quota.localeCompare(b.quota);
  });

  const stateName = college.state || 'All India';
  const courseName = college.course || 'MBBS';
  const quotaName = college.quota || 'All India';
  const categoryName = college.category || 'Open';
  const cTypeCls = college.collegeType?.cls || 'ctype-govt';
  const cTypeLabel = college.collegeType?.label || 'GOVT';
  const cutoffRankVal = college.closingRank || college.projected?.rank || 0;
  const basisText = college.projected?.basis || 'Official MCC counselling allotment history across multiple rounds and years.';
  const noteText = college.projected?.note || '';

  const bondInfo = STATE_BOND_DATA[stateName] || null;
  const stipendInfo = STATE_STIPEND_DATA[stateName] || null;
  const pgQuota = getInternalPgQuota(college.name);
  const feeInfo = getEstimatedFee(college.name, quotaName);
  const clinicalInfo = getClinicalExposure(college.name);

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0f1122] p-4 sm:p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="pr-8 sm:pr-10 mb-4 sm:mb-5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <span className={`badge ${cTypeCls}`}>{cTypeLabel}</span>
            {college.masterInfo?.management && (
              <span className="badge bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {college.masterInfo.management}
              </span>
            )}
            <span className="badge bg-teal-400/10 text-teal-300 border border-teal-400/30">{courseName}</span>
            {availableQuotas.length > 1 ? (
              availableQuotas.map((q) => (
                <span key={q} className="badge bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                  {q}
                </span>
              ))
            ) : (
              <span className="badge bg-white/5 text-white/70 border border-white/10">{quotaName}</span>
            )}
            <span className="badge bg-purple-400/10 text-purple-300 border border-purple-400/30">
              {categoryName} {college.isUrFallback && '(UR Open Merit Seat)'}
            </span>
            {college.masterInfo?.established_year && (
              <span className="badge bg-white/5 text-white/50 border border-white/10 font-mono text-[10px]">
                Est. {college.masterInfo.established_year}
              </span>
            )}
            {college.masterInfo?.mbbs_seats && (
              <span className="badge bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 font-mono text-[10px]">
                {college.masterInfo.mbbs_seats} Approved Seats
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-xl font-black text-white leading-snug">{college.name}</h3>
          <p className="text-xs text-white/50 flex flex-wrap items-center gap-1.5 mt-1.5">
            <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
            <span>{stateName}</span>
            {college.masterInfo?.university && (
              <>
                <span className="text-white/20">·</span>
                <span className="text-white/70">Affiliated to {college.masterInfo.university}</span>
              </>
            )}
            <span className="text-white/20">·</span>
            <span className="text-white/40">{college.institute}</span>
          </p>
        </div>

        {/* Intelligence Grid: Fee, Bond, Stipend, Beds */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
          {/* Annual Tuition */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 sm:p-3 text-left">
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">
              Annual Tuition
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-400 mono-font">
              {feeInfo.annualFee}
            </span>
          </div>

          {/* Service Bond */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 sm:p-3 text-left">
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">
              Service Bond
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-300 mono-font">
              {bondInfo ? `${bondInfo.years} ${bondInfo.years === 1 ? 'Yr' : 'Yrs'} (${bondInfo.penalty})` : '0 Yrs'}
            </span>
          </div>

          {/* Intern Stipend */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 sm:p-3 text-left">
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">
              Monthly Stipend
            </span>
            <span className="text-xs sm:text-sm font-black text-teal-300 mono-font">
              {stipendInfo ? stipendInfo.display : 'State Scale'}
            </span>
          </div>

          {/* Hospital Bed Capacity */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 sm:p-3 text-left">
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">
              Hospital Beds
            </span>
            <span className="text-xs sm:text-sm font-black text-white mono-font">
              {clinicalInfo.beds}
            </span>
          </div>
        </div>

        {/* 50% Internal PG Quota Banner (If applicable) */}
        {pgQuota && (
          <div className="glass-panel p-3.5 mb-5 border-l-4 border-l-purple-400 bg-purple-400/[0.05] flex items-start gap-2.5">
            <GraduationCap className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-purple-300 block">{pgQuota.quotaName} ({pgQuota.univ})</span>
              <p className="text-[11px] text-white/70 mt-0.5">{pgQuota.description} <strong className="text-purple-200">Advantage: {pgQuota.advantage}</strong></p>
            </div>
          </div>
        )}

        {/* Prediction Basis Banner */}
        <div className="glass-panel p-4 mb-5 border-l-4 border-l-teal-400 bg-teal-400/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Projected Cutoff Rationalization</span>
            </span>
            <span className="text-xs font-black mono-font text-white">
              Cutoff: ~{cutoffRankVal > 0 ? cutoffRankVal.toLocaleString() : 'N/A'} AIR
            </span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            {basisText}
          </p>
          {noteText && (
            <p className="text-[11px] text-white/50 mt-1 italic">
              {noteText}
            </p>
          )}
        </div>

        {/* Historical Round-by-Round Table */}
        <div className="mb-5">
          <div className="space-y-2.5 mb-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-teal-400" />
                <span>Official MCC Allotment Archive (All Rounds &amp; Years)</span>
              </h4>
              <span className="text-[11px] text-teal-300 mono-font font-semibold">
                {activeRounds.length} records active
              </span>
            </div>

            {/* Filter Pills Row 1: Category Filter */}
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white/[0.02] border border-white/8">
                <span className="text-[9px] sm:text-[10px] text-white/50 uppercase font-semibold flex items-center gap-1">
                  <Users className="h-3 w-3 text-purple-400" />
                  <span>Category:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedModalCategory('all')}
                  className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedModalCategory === 'all'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  All ({availableCategories.length})
                </button>
                {availableCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedModalCategory(c)}
                    className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedModalCategory === c
                        ? 'bg-purple-500 text-white shadow-sm font-bold'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Filter Pills Row 2: Quota Filter */}
            {availableQuotas.length > 1 && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white/[0.02] border border-white/8">
                <span className="text-[9px] sm:text-[10px] text-white/50 uppercase font-semibold">Quota:</span>
                <button
                  type="button"
                  onClick={() => setSelectedModalQuota('all')}
                  className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedModalQuota === 'all'
                      ? 'bg-teal-400 text-slate-950 shadow-sm font-bold'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  All Quotas ({availableQuotas.length})
                </button>
                {availableQuotas.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedModalQuota(q)}
                    className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedModalQuota === q
                        ? 'bg-teal-400 text-slate-950 shadow-sm font-bold'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs min-w-[460px]">
              <thead className="bg-white/5 text-white/60 font-semibold border-b border-white/10">
                <tr>
                  <th className="p-3">Counselling Round</th>
                  <th className="p-3">2024 Closing AIR</th>
                  <th className="p-3">2025 Closing AIR</th>
                  <th className="p-3">YoY Margin Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedCombos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-white/40 italic">
                      <div>
                        <p>No historical round allotments for Category: <strong className="text-white/70">{selectedModalCategory}</strong> | Quota: <strong className="text-white/70">{selectedModalQuota}</strong>.</p>
                        <button
                          type="button"
                          onClick={() => { setSelectedModalCategory('all'); setSelectedModalQuota('all'); }}
                          className="mt-2 text-xs text-teal-300 underline hover:text-teal-200 cursor-pointer"
                        >
                          View All Categories &amp; Quotas
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedCombos.map((combo) => {
                    const r24 = activeRounds.find(
                      r => r.year === '2024' && r.round === combo.round && (selectedModalQuota !== 'all' || r.quota === combo.quota)
                    );
                    const r25 = activeRounds.find(
                      r => r.year === '2025' && r.round === combo.round && (selectedModalQuota !== 'all' || r.quota === combo.quota)
                    );

                    if (!r24 && !r25) return null;

                    const c24 = r24?.closing_rank ? Number(r24.closing_rank) : null;
                    const c25 = r25?.closing_rank ? Number(r25.closing_rank) : null;
                    const diff = c24 !== null && c25 !== null ? c25 - c24 : null;

                    return (
                      <tr key={`${combo.round}-${combo.quota}`} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-medium text-white">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold">{combo.round}</span>
                              {selectedModalQuota === 'all' && availableQuotas.length > 1 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-teal-300 border border-white/10 font-normal">
                                  {combo.quota}
                                </span>
                              )}
                              {selectedModalCategory === 'all' && (r24?.allotted_category || r25?.allotted_category) && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20 font-normal">
                                  {r24?.allotted_category || r25?.allotted_category}
                                </span>
                              )}
                            </div>
                            {((r24?.allotment_count || 0) > 0 || (r25?.allotment_count || 0) > 0) && (
                              <span className="text-[10px] text-white/40 block mt-0.5">
                                {[
                                  r24?.allotment_count ? `2024: ${r24.allotment_count} seats` : null,
                                  r25?.allotment_count ? `2025: ${r25.allotment_count} seats` : null
                                ].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 mono-font">
                          {c24 ? (
                            <div>
                              <span className="font-bold text-white/90">{c24.toLocaleString()} AIR</span>
                              {r24?.opening_rank && r24.opening_rank !== c24 ? (
                                <span className="text-[10px] text-white/40 block">Open: {r24.opening_rank.toLocaleString()}</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                        <td className="p-3 mono-font">
                          {c25 ? (
                            <div>
                              <span className="font-bold text-teal-300">{c25.toLocaleString()} AIR</span>
                              {r25?.opening_rank && r25.opening_rank !== c25 ? (
                                <span className="text-[10px] text-teal-400/50 block">Open: {r25.opening_rank.toLocaleString()}</span>
                              ) : null}
                            </div>
                          ) : combo.round === 'Round 1' ? (
                            <span className="text-white/35 text-[11px] italic">Not in 2025 MCC release</span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                        <td className="p-3 mono-font">
                          {diff !== null ? (
                            <span className={diff >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {diff >= 0 ? `+${diff.toLocaleString()} (Opened)` : `${diff.toLocaleString()} (Tightened)`}
                            </span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-white/40 mt-2 italic text-left">
            * Data source: Official MCC counselling allotment records across 2024 (Rounds 1, 2, 3 &amp; Stray Vacancy) and 2025 (Rounds 2, 3 &amp; Special Stray Vacancy).
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div>
            {college.masterInfo?.official_website && (
              <a
                href={college.masterInfo.official_website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-teal-300 hover:text-teal-200 flex items-center gap-1.5 transition-colors"
              >
                <span>Official College Website</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-secondary py-2 px-5 text-xs cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
