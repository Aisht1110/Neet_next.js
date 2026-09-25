'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Heart, 
  Plus, 
  Info, 
  Check, 
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Lock
} from 'lucide-react';
import { PredictionResult } from '@/lib/engine/types';
import { useUserData } from '@/lib/store/useUserData';
import { useAuth } from '@/lib/firebase/AuthContext';
import { 
  STATE_BOND_DATA, 
  getEstimatedFee, 
  getInternalPgQuota 
} from '@/lib/engine/collegeIntelligence';
import { CardCutoffInline } from './CardCutoffInline';
import { UpgradeModal } from '@/components/common/UpgradeModal';

interface CollegeCardProps {
  college: PredictionResult;
  onOpenDetails: (college: PredictionResult) => void;
  indexNum?: number;
  isComparing?: boolean;
  onToggleCompare?: (college: PredictionResult) => void;
  isSelectedForCompare?: boolean;
}

export const CollegeCard: React.FC<CollegeCardProps> = ({
  college,
  onOpenDetails,
  indexNum = 1,
  onToggleCompare,
  isSelectedForCompare = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'wishlist' | 'choice_fill' | null>(null);
  const { tierCategory } = useAuth();
  const { isInWishlist, toggleWishlist, addToChoiceFill, choiceFill } = useUserData();
  const wishlisted = isInWishlist(college.key);
  const inChoiceFill = choiceFill.some(c => c.key === college.key);

  const userRank = college.userRank || 0;
  const cutoffRank = college.closingRank || 0;
  const diff = cutoffRank - userRank;

  // Visual rank bar ratio (how comfortably rank falls into cutoff)
  const ratio = cutoffRank > 0 ? Math.min(1, Math.max(0.05, userRank / cutoffRank)) : 0.5;
  const fillPct = Math.round(ratio * 100);
  const isAhead = diff >= 0;

  const bondInfo = STATE_BOND_DATA[college.state] || null;
  const feeInfo = getEstimatedFee(college.name, college.quota);
  const pgQuota = getInternalPgQuota(college.name);

  const best2024 = college.projected?.best2024;
  const best2025 = college.projected?.best2025;
  const stratKey = college.strategy?.key || 'target';
  const stratLabel = college.strategy?.label || 'TARGET';
  const chanceTier = college.chance?.tier || 'tMod';
  const chanceLabel = college.chance?.label || 'Moderate';

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div 
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      }}
      className={`result-card strat-${stratKey} ${isSelectedForCompare ? 'compare-selected' : ''} ${isExpanded ? 'is-expanded ring-2 ring-teal-500/50 dark:ring-teal-400/50 shadow-[0_4px_30px_rgba(0,229,170,0.14)]' : ''} cursor-pointer hover:border-teal-400/50 hover:shadow-[0_0_24px_rgba(0,229,170,0.12)] transition-all group`}
    >
      {/* ── LEFT SECTION: MAIN METRICS & DETAILS ── */}
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        {/* Top bar: Icon, Name & Badges */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/30 dark:border-teal-400/30 text-teal-700 dark:text-teal-300 font-black text-xs mono-font">
            #{indexNum}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`badge ${college.collegeType?.cls || 'ctype-govt'}`}>
                {college.collegeType?.label || 'GOVT'}
              </span>
              <span className="badge bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30">{college.course}</span>
              <span className="badge bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30">
                {college.quota}
                {college.availableQuotas && college.availableQuotas.length > 1 && ` (+${college.availableQuotas.length - 1} Quotas)`}
              </span>
              <span className="badge bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                {college.category} {college.isUrFallback && '(UR Open)'}
              </span>
              {college.masterInfo?.management && (
                <span className="badge bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  {college.masterInfo.management}
                </span>
              )}
              {pgQuota && (
                <span className="badge bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/40">
                  {pgQuota.univ.includes('DU') ? '50% DU PG' : pgQuota.univ.includes('IPU') ? '50% IPU PG' : 'Internal PG'}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors leading-snug line-clamp-2">
              {college.name}
            </h3>

            <div className="text-xs text-slate-500 dark:text-white/50 flex flex-wrap items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-slate-700 dark:text-white/70">
                <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{college.state || 'All India'}</span>
              </span>
              {college.masterInfo?.mbbs_seats && (
                <>
                  <span className="text-slate-300 dark:text-white/20">·</span>
                  <span className="text-teal-700 dark:text-teal-300 font-semibold">{college.masterInfo.mbbs_seats} Seats</span>
                </>
              )}
              {college.masterInfo?.established_year && (
                <>
                  <span className="text-slate-300 dark:text-white/20">·</span>
                  <span className="text-slate-500 dark:text-white/40 font-mono">Est. {college.masterInfo.established_year}</span>
                </>
              )}
              <span className="text-slate-300 dark:text-white/20">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{feeInfo.annualFee}</span>
              <span className="text-slate-300 dark:text-white/20">·</span>
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                {bondInfo ? (bondInfo.years === 0 ? '0 Yr Bond' : `${bondInfo.years} Yr Bond (${bondInfo.penalty})`) : 'No State Bond'}
              </span>
            </div>
          </div>
        </div>

        {/* 2024 vs 2025 Cutoff Comparison Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-1 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-xs">
          <span className="text-[10px] text-slate-500 dark:text-white/40 uppercase font-bold tracking-wider">Historical Cutoffs:</span>
          {best2024 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-800 dark:text-white/70 px-2 py-0.5 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
              2024: <strong>{best2024.toLocaleString()} AIR</strong>
            </span>
          )}
          {best2025 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/30 dark:border-teal-400/30">
              2025: <strong>{best2025.toLocaleString()} AIR</strong>
            </span>
          )}
          {best2024 && best2025 && (
            <span className={`text-[11px] font-mono font-bold ${best2025 - best2024 >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              ({best2025 - best2024 >= 0 ? `+${(best2025 - best2024).toLocaleString()} Opening` : `${(best2025 - best2024).toLocaleString()} Tightening`})
            </span>
          )}
        </div>

        {/* Rank Visual Comparison Bar */}
        <div className="rc-rank-bar-wrap">
          <div className="rc-rank-visual">
            <div className="rc-bar-bg">
              <div 
                className="rc-bar-fill" 
                style={{ 
                  width: `${fillPct}%`,
                  background: isAhead 
                    ? 'linear-gradient(90deg, #00e5aa, #22d97a)' 
                    : 'linear-gradient(90deg, #ffd93d, #f43f5e)'
                }} 
              />
            </div>
            <div className="rc-bar-labels">
              <span className="rc-bar-label">Your Rank: <span>{userRank.toLocaleString()}</span></span>
              <span className="rc-bar-label">Cutoff: <span>~{cutoffRank.toLocaleString()} AIR</span></span>
            </div>
          </div>

          <div className="rc-rank-nums">
            <div className="rc-rank-item">
              <span className="rc-rank-label">Rank Difference</span>
              <span className="rc-rank-val" style={{ color: isAhead ? '#059669' : '#ea580c' }}>
                {isAhead ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
              </span>
            </div>
            <div className="rc-rank-item">
              <span className="rc-rank-label">Status</span>
              <span className="rc-rank-val" style={{ color: isAhead ? '#059669' : '#ea580c', fontSize: '0.8rem' }}>
                {isAhead ? 'Safe Buffer' : 'Aspirational'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT SECTION: BADGES & USER ACTIONS ── */}
      <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between md:justify-center gap-2 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-white/10 shrink-0">
        {/* Badges */}
        <div className="flex items-center justify-between sm:justify-start md:justify-end gap-1.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`strategy-badge strat-${stratKey}`}>
              {stratLabel}
            </span>
            <span className={`chance-badge ${chanceTier}`}>
              {chanceLabel}
            </span>
          </div>

          {/* Quick Cutoff button on narrow mobile next to badges */}
          <div className="sm:hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-[11px] transition-all cursor-pointer ${
                isExpanded
                  ? 'border-teal-500 bg-teal-500 text-slate-950 shadow-sm'
                  : 'border-teal-500/40 bg-teal-500/15 text-teal-800 dark:text-teal-300 hover:bg-teal-500/25'
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <Info className="h-3 w-3" />
                  <span>Rounds</span>
                  <ChevronDown className="h-3 w-3 -ml-0.5 opacity-70" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Compare Button */}
            {onToggleCompare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(college);
                }}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  isSelectedForCompare
                    ? 'border-teal-500 bg-teal-500/20 text-teal-800 dark:border-teal-400 dark:bg-teal-400/20 dark:text-teal-300 shadow-sm'
                    : 'border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
                title={isSelectedForCompare ? 'Remove from Comparison' : 'Compare College'}
              >
                <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            )}

            {/* Save to Wishlist Button (Gated to VIP) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!tierCategory.canAccessWishlist) {
                  setUpgradeFeature('wishlist');
                  return;
                }
                toggleWishlist(college);
              }}
              className={`flex h-8 sm:h-9 items-center gap-1 px-2.5 sm:px-3 rounded-xl border transition-all cursor-pointer text-xs font-semibold ${
                wishlisted && tierCategory.canAccessWishlist
                  ? 'border-rose-500 bg-rose-500 text-white shadow-sm'
                  : 'border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
              title={
                !tierCategory.canAccessWishlist 
                  ? 'Unlock College Wishlist (Season Pass VIP)' 
                  : (wishlisted ? 'Remove from Wishlist' : 'Save to Shortlist')
              }
            >
              {!tierCategory.canAccessWishlist ? (
                <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              ) : (
                <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${wishlisted ? 'fill-white text-white' : 'text-slate-600 dark:text-white/70'}`} />
              )}
              <span className="text-[11px] sm:text-xs">
                {!tierCategory.canAccessWishlist ? 'Save' : (wishlisted ? 'Saved' : 'Save')}
              </span>
            </button>

            {/* Add to Choice Fill (Gated to VIP) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!tierCategory.canAccessChoiceFiller) {
                  setUpgradeFeature('choice_fill');
                  return;
                }
                addToChoiceFill({
                  key: college.key,
                  name: college.name,
                  institute: college.institute,
                  state: college.state,
                  course: college.course,
                  quota: college.quota,
                  category: college.category,
                  closingRank: college.closingRank,
                  strategyKey: stratKey,
                  collegeType: college.collegeType?.label || 'GOVT',
                  savedAt: new Date().toISOString()
                });
              }}
              disabled={inChoiceFill && tierCategory.canAccessChoiceFiller}
              className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition-all ${
                inChoiceFill && tierCategory.canAccessChoiceFiller
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-400/20 dark:text-emerald-300 cursor-default'
                  : 'border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer'
              }`}
              title={
                !tierCategory.canAccessChoiceFiller
                  ? 'Unlock Choice Sequencer (Season Pass VIP)'
                  : (inChoiceFill ? 'Added to Choice Filling' : 'Add to Choice Filling')
              }
            >
              {!tierCategory.canAccessChoiceFiller ? (
                <Lock className="h-3.5 w-3.5 text-amber-500" />
              ) : inChoiceFill ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>

            {/* View Details / Cutoff Toggle Button for sm+ screens */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all font-semibold text-xs shrink-0 cursor-pointer ${
                isExpanded
                  ? 'border-teal-500 bg-teal-500 text-slate-950 dark:bg-teal-400 dark:text-slate-950 font-bold shadow-sm'
                  : 'border-teal-500/40 bg-teal-500/10 text-teal-800 hover:bg-teal-500/20 dark:border-teal-400/40 dark:bg-teal-400/10 dark:text-teal-300 dark:hover:bg-teal-400/25'
              }`}
              title={isExpanded ? 'Collapse Cutoffs Breakdown' : 'Expand Cutoffs Breakdown in Place'}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <Info className="h-3.5 w-3.5" />
                  <span>Cutoffs</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── IN-PLACE EXPANDABLE CARD BREAKDOWN ── */}
      {isExpanded && (
        <div 
          className="col-span-full w-full"
          style={{ gridColumn: '1 / -1' }}
        >
          <CardCutoffInline 
            college={college} 
            onCollapse={() => setIsExpanded(false)}
            onOpenFullModal={() => onOpenDetails(college)}
          />
        </div>
      )}

      {/* ── UPGRADE PROMPT MODAL ── */}
      {upgradeFeature && (
        <UpgradeModal
          isOpen={!!upgradeFeature}
          onClose={() => setUpgradeFeature(null)}
          feature={upgradeFeature}
        />
      )}
    </div>
  );
};
