'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ListOrdered, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Sparkles, 
  Printer, 
  Compass, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Wand2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useUserData } from '@/lib/store/useUserData';
import { STATE_BOND_DATA, getEstimatedFee, getInternalPgQuota } from '@/lib/engine/collegeIntelligence';
import { BrandIcon } from '@/components/common/BrandIcon';

export default function ChoiceFillPage() {
  const { 
    choiceFill, 
    removeFromChoiceFill, 
    reorderChoices, 
    smartSortChoices, 
    clearChoiceFill,
    isLoaded 
  } = useUserData();

  const handlePrint = () => {
    window.print();
  };

  const safetyCount = choiceFill.filter(c => c.strategyKey === 'safety').length;
  const targetCount = choiceFill.filter(c => c.strategyKey === 'target').length;
  const reachCount = choiceFill.filter(c => c.strategyKey === 'reach').length;
  const longshotCount = choiceFill.filter(c => c.strategyKey === 'longshot').length;

  if (!isLoaded) {
    return (
      <div className="py-20 text-center text-white/50">
        Loading choice order builder…
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-teal-400 font-bold uppercase tracking-wider mb-2">
            <BrandIcon size={18} />
            <span>MCC Choice Submission Sequencer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Choice Filling Order ({choiceFill.length} choices)
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Order your choices strategically from dream targets to safety nets before locking on the MCC portal.
          </p>
        </div>

        {/* Action Buttons */}
        {choiceFill.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={smartSortChoices}
              className="btn-secondary py-2 px-3.5 text-xs flex items-center gap-1.5"
              title="Sort choices by cutoff competitiveness"
            >
              <Wand2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Smart Sort</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Export / Print PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Choice List */}
      {choiceFill.length > 0 ? (
        <div className="space-y-4">
          {/* Strategy Distribution Bar */}
          <div className="glass-panel p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-white/70">
            <div className="flex items-center gap-2">
              <span className="text-white/40 uppercase font-bold text-[10px]">Pillars:</span>
              <span className="font-bold text-emerald-400">🟢 Safety: {safetyCount}</span>
              <span className="text-white/20">·</span>
              <span className="font-bold text-amber-300">🟡 Target: {targetCount}</span>
              <span className="text-white/20">·</span>
              <span className="font-bold text-orange-400">🟠 Reach: {reachCount}</span>
              {longshotCount > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="font-bold text-rose-400">🔴 Long Shot: {longshotCount}</span>
                </>
              )}
            </div>

            <div className="text-[11px] text-white/40 mono-font">
              Total {choiceFill.length} preferences
            </div>
          </div>

          {/* Golden Counselling Rule Alert */}
          <div className="glass-panel p-4 border-l-4 border-l-amber-400 bg-amber-400/[0.04] text-xs text-white/70 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block mb-0.5">Golden Rule of MCC Choice Locking:</span>
              Always place the highest cutoff and most aspirational colleges on top. The MCC allotment algorithm stops at the first choice you qualify for and will never evaluate preferences below it!
            </div>
          </div>

          {/* Choice Cards List */}
          <div className="space-y-3">
            {choiceFill.map((item, index) => {
              const bond = STATE_BOND_DATA[item.state] || null;
              const fee = getEstimatedFee(item.name, item.quota);
              const pg = getInternalPgQuota(item.name);

              return (
                <div
                  key={item.key}
                  className="glass-panel p-4 sm:p-5 flex items-center justify-between gap-4 transition-all hover:border-teal-400/30"
                >
                  {/* Order Number & Content */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 border border-teal-400/30 text-teal-300 font-black text-sm mono-font">
                      #{index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {item.collegeType && (
                          <span className="badge bg-white/5 text-white/70 border border-white/10 text-[10px]">
                            {item.collegeType}
                          </span>
                        )}
                        <span className="badge bg-teal-400/10 text-teal-300 border border-teal-400/20 text-[10px]">
                          {item.course}
                        </span>
                        <span className="badge bg-white/5 text-white/60 border border-white/5 text-[10px]">
                          {item.quota}
                        </span>
                        {pg && (
                          <span className="badge bg-purple-400/15 text-purple-300 border border-purple-400/30 text-[10px]">
                            {pg.univ.includes('DU') ? '50% DU PG' : pg.univ.includes('IPU') ? '50% IPU PG' : 'Internal PG'}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-white text-sm sm:text-base leading-snug truncate">
                        {item.name}
                      </h3>

                      <div className="text-xs text-white/50 flex flex-wrap items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-white/70">
                          <MapPin className="h-3 w-3 text-teal-400" />
                          <span>{item.state}</span>
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="mono-font text-teal-300 font-semibold">
                          Cutoff: ~{item.closingRank.toLocaleString()} AIR
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="text-emerald-400 font-semibold">{fee.annualFee}</span>
                        {bond && bond.years > 0 && (
                          <>
                            <span className="text-white/20">·</span>
                            <span className="text-amber-300">{bond.years} Yr Bond</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Move Controls & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      disabled={index === 0}
                      onClick={() => reorderChoices(index, index - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
                      title="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>

                    <button
                      disabled={index === choiceFill.length - 1}
                      onClick={() => reorderChoices(index, index + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
                      title="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => removeFromChoiceFill(item.key)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-rose-400/70 hover:bg-rose-400/15 hover:text-rose-400 transition-all ml-1"
                      title="Remove Choice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-white/10 text-xs text-white/40">
            <span>Ready for MCC Locking: {choiceFill.length} colleges sequence</span>
            <button
              onClick={() => {
                if (confirm('Clear all choices in this list?')) {
                  clearChoiceFill();
                }
              }}
              className="text-rose-400/80 hover:text-rose-400 underline font-semibold flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset List</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-16 text-center">
          <ListOrdered className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Your Choice List is Empty</h3>
          <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto mb-6">
            Run the College Predictor and click the plus (+) button on colleges to add them to your personalized choice filling sequence.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/predict" className="btn-primary py-2.5 px-6 text-xs inline-flex items-center gap-2">
              <Compass className="h-4 w-4" />
              <span>Launch College Predictor</span>
            </Link>
            <Link href="/colleges" className="btn-secondary py-2.5 px-6 text-xs inline-flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Explore Colleges</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
