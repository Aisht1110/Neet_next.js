'use client';

import React, { useState } from 'react';
import { 
  ChevronUp, 
  Layers, 
  Users, 
  Sparkles, 
  ExternalLink, 
  GraduationCap, 
  Building2, 
  Calendar,
  BedDouble,
  FileText,
  Maximize2
} from 'lucide-react';
import { RoundInfo, MasterCollege } from '@/lib/engine/types';
import { 
  STATE_BOND_DATA, 
  STATE_STIPEND_DATA, 
  getInternalPgQuota, 
  getEstimatedFee, 
  getClinicalExposure 
} from '@/lib/engine/collegeIntelligence';

export interface CardCutoffInlineCollegeData {
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

interface CardCutoffInlineProps {
  college: CardCutoffInlineCollegeData;
  onCollapse?: () => void;
  onOpenFullModal?: () => void;
}

export const CardCutoffInline: React.FC<CardCutoffInlineProps> = ({ 
  college, 
  onCollapse,
  onOpenFullModal
}) => {
  const [selectedQuota, setSelectedQuota] = useState<string>(college.quota || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(college.category || 'all');

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
    if (selectedQuota !== 'all' && r.quota !== selectedQuota) return false;
    if (selectedCategory !== 'all' && r.allotted_category !== selectedCategory) return false;
    return true;
  });

  const standardRounds = ['Round 1', 'Round 2', 'Round 3', 'Stray Vacancy', 'Special Stray Vacancy'];

  // Collect distinct (round, quota) rows
  const comboMap = new Map<string, { round: string; quota: string }>();
  for (const r of activeRounds) {
    const qKey = selectedQuota === 'all' ? r.quota : (college.quota || r.quota);
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
  const quotaName = college.quota || 'All India';
  const bondInfo = STATE_BOND_DATA[stateName] || null;
  const stipendInfo = STATE_STIPEND_DATA[stateName] || null;
  const pgQuota = getInternalPgQuota(college.name);
  const feeInfo = getEstimatedFee(college.name, quotaName);
  const clinicalInfo = getClinicalExposure(college.name);
  const basisText = college.projected?.basis;
  const noteText = college.projected?.note;

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className="mt-3 pt-3.5 border-t border-slate-200 dark:border-white/10 space-y-3.5 animate-modal-content text-left cursor-default"
    >
      {/* ── INTELLIGENCE SUMMARY STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03]">
          <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-white/40 block mb-0.5">Annual Tuition</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400 mono-font text-xs sm:text-sm">{feeInfo.annualFee}</span>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03]">
          <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-white/40 block mb-0.5">Rural Bond</span>
          <span className="font-bold text-amber-700 dark:text-amber-300 mono-font text-xs sm:text-sm">
            {bondInfo ? `${bondInfo.years} ${bondInfo.years === 1 ? 'Yr' : 'Yrs'} (${bondInfo.penalty})` : '0 Yrs (No Bond)'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03]">
          <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-white/40 block mb-0.5">Intern Stipend</span>
          <span className="font-bold text-teal-700 dark:text-teal-300 mono-font text-xs sm:text-sm">
            {stipendInfo ? stipendInfo.display : 'State Scale'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03]">
          <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-white/40 block mb-0.5">Hospital Beds</span>
          <span className="font-bold text-slate-900 dark:text-white mono-font text-xs sm:text-sm">{clinicalInfo.beds}</span>
        </div>
      </div>

      {/* 50% Internal PG Quota Banner (If applicable) */}
      {pgQuota && (
        <div className="p-3 rounded-xl border-l-4 border-l-purple-500 dark:border-l-purple-400 bg-purple-500/[0.07] dark:bg-purple-400/[0.06] flex items-start gap-2.5">
          <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-purple-900 dark:text-purple-300 block">{pgQuota.quotaName} ({pgQuota.univ})</span>
            <p className="text-[11px] text-slate-600 dark:text-white/70 mt-0.5">
              {pgQuota.description} <strong className="text-purple-700 dark:text-purple-300">Advantage: {pgQuota.advantage}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Rationalization note */}
      {basisText && (
        <div className="p-3 rounded-xl border-l-4 border-l-teal-500 dark:border-l-teal-400 bg-teal-500/[0.06] dark:bg-teal-400/[0.04] text-xs">
          <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 mb-0.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Projected Cutoff Rationalization</span>
          </span>
          <p className="text-[11px] text-slate-700 dark:text-white/70 leading-relaxed">{basisText}</p>
          {noteText && <p className="text-[10px] text-slate-500 dark:text-white/50 mt-1 italic">{noteText}</p>}
        </div>
      )}

      {/* ── FILTER PILLS & ARCHIVE HEADER ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Official MCC Allotment Archive</span>
          </span>
          <span className="text-[11px] text-teal-700 dark:text-teal-300 mono-font font-semibold">
            {activeRounds.length} allotments
          </span>
        </div>

        {/* Filter Row 1: Category Filter */}
        {availableCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/8">
            <span className="text-[9px] text-slate-500 dark:text-white/50 uppercase font-semibold flex items-center gap-1 px-1">
              <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span>Category:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white shadow-sm font-bold'
                  : 'bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-300 dark:hover:bg-white/10'
              }`}
            >
              All ({availableCategories.length})
            </button>
            {availableCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                  selectedCategory === c
                    ? 'bg-purple-600 text-white shadow-sm font-bold'
                    : 'bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-300 dark:hover:bg-white/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Filter Row 2: Quota Filter */}
        {availableQuotas.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/8">
            <span className="text-[9px] text-slate-500 dark:text-white/50 uppercase font-semibold px-1">Quota:</span>
            <button
              type="button"
              onClick={() => setSelectedQuota('all')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                selectedQuota === 'all'
                  ? 'bg-teal-600 text-white dark:bg-teal-400 dark:text-slate-950 shadow-sm font-bold'
                  : 'bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-300 dark:hover:bg-white/10'
              }`}
            >
              All Quotas ({availableQuotas.length})
            </button>
            {availableQuotas.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setSelectedQuota(q)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                  selectedQuota === q
                    ? 'bg-teal-600 text-white dark:bg-teal-400 dark:text-slate-950 shadow-sm font-bold'
                    : 'bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-300 dark:hover:bg-white/10'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── ALLOTMENT DATA TABLE ── */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.01]">
        <table className="w-full text-left text-xs min-w-[440px]">
          <thead className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/60 font-semibold border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="p-2.5">Counselling Round</th>
              <th className="p-2.5">2024 Closing AIR</th>
              <th className="p-2.5">2025 Closing AIR</th>
              <th className="p-2.5">YoY Shift</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {sortedCombos.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-500 dark:text-white/40 italic">
                  No records for Category: {selectedCategory} | Quota: {selectedQuota}
                </td>
              </tr>
            ) : (
              sortedCombos.map((combo) => {
                const r24 = activeRounds.find(
                  r => r.year === '2024' && r.round === combo.round && (selectedQuota !== 'all' || r.quota === combo.quota)
                );
                const r25 = activeRounds.find(
                  r => r.year === '2025' && r.round === combo.round && (selectedQuota !== 'all' || r.quota === combo.quota)
                );

                if (!r24 && !r25) return null;

                const c24 = r24?.closing_rank ? Number(r24.closing_rank) : null;
                const c25 = r25?.closing_rank ? Number(r25.closing_rank) : null;
                const diff = c24 !== null && c25 !== null ? c25 - c24 : null;

                return (
                  <tr key={`${combo.round}-${combo.quota}`} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold">{combo.round}</span>
                        {selectedQuota === 'all' && availableQuotas.length > 1 && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-teal-800 dark:text-teal-300 border border-slate-200 dark:border-white/10 font-normal">
                            {combo.quota}
                          </span>
                        )}
                        {selectedCategory === 'all' && (r24?.allotted_category || r25?.allotted_category) && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/20 font-normal">
                            {r24?.allotted_category || r25?.allotted_category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 mono-font">
                      {c24 ? (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white/90">{c24.toLocaleString()} AIR</span>
                          {r24?.opening_rank && r24.opening_rank !== c24 ? (
                            <span className="text-[10px] text-slate-500 dark:text-white/40 block">Open: {r24.opening_rank.toLocaleString()}</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-white/30">—</span>
                      )}
                    </td>
                    <td className="p-2.5 mono-font">
                      {c25 ? (
                        <div>
                          <span className="font-bold text-teal-700 dark:text-teal-300">{c25.toLocaleString()} AIR</span>
                          {r25?.opening_rank && r25.opening_rank !== c25 ? (
                            <span className="text-[10px] text-teal-600/70 dark:text-teal-400/50 block">Open: {r25.opening_rank.toLocaleString()}</span>
                          ) : null}
                        </div>
                      ) : combo.round === 'Round 1' ? (
                        <span className="text-slate-500 dark:text-white/35 text-[10px] italic">Not in '25 release</span>
                      ) : (
                        <span className="text-slate-400 dark:text-white/30">—</span>
                      )}
                    </td>
                    <td className="p-2.5 mono-font">
                      {diff !== null ? (
                        <span className={`text-[11px] font-bold ${diff >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                          {diff >= 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ACTIONS ── */}
      <div className="flex items-center justify-between gap-3 pt-2 text-xs">
        <div className="flex items-center gap-2">
          {college.masterInfo?.official_website && (
            <a
              href={college.masterInfo.official_website}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-teal-700 dark:text-teal-300 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>Official Website</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {onOpenFullModal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullModal();
              }}
              className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 cursor-pointer transition-all"
              title="Open full dialog overlay"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Full Screen</span>
            </button>
          )}
        </div>

        {onCollapse && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCollapse();
            }}
            className="text-[11px] font-semibold text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-all"
          >
            <span>Hide Breakdown</span>
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
