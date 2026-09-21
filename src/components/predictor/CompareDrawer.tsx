'use client';

import React, { useState } from 'react';
import { 
  Scale, 
  X, 
  Check, 
  MapPin, 
  Sparkles, 
  ExternalLink,
  DollarSign,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { PredictionResult } from '@/lib/engine/types';
import { 
  STATE_BOND_DATA, 
  STATE_STIPEND_DATA, 
  getEstimatedFee, 
  getInternalPgQuota 
} from '@/lib/engine/collegeIntelligence';

interface CompareDrawerProps {
  compareList: PredictionResult[];
  onRemove: (key: string) => void;
  onClear: () => void;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  compareList,
  onRemove,
  onClear
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Bar */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl rounded-2xl border border-teal-400/40 bg-[#0c1024]/95 p-2.5 sm:p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-fade-in">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/20 text-teal-300 shrink-0">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Compare ({compareList.length}/3)</span>
              <span className="text-[11px] text-white/50 hidden sm:inline">Side-by-side cutoff &amp; fee comparison</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {compareList.map((c) => (
              <div key={c.key} className="hidden md:flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-white/80">
                <span className="truncate max-w-[120px]">{c.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(c.key)}
                  className="text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setIsOpenModal(true)}
              className="btn-primary py-1.5 sm:py-2 px-3 sm:px-4 text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              Compare
            </button>

            <button
              type="button"
              onClick={onClear}
              className="text-xs text-white/40 hover:text-white px-1.5 sm:px-2 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0f1122] p-4 sm:p-6 shadow-2xl">
            <button
              onClick={() => setIsOpenModal(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 sm:mb-6 pr-8">
              <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-teal-400" />
                <span>Side-by-Side Medical College Comparison</span>
              </h3>
              <p className="text-xs text-white/50 mt-1">Comparing cutoffs, state bonds, stipends, and internal quotas</p>
            </div>

            <div className="overflow-x-auto">
              <div className={`grid gap-3 sm:gap-4 ${
                compareList.length === 1 ? 'grid-cols-1' : compareList.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {compareList.map((c) => {
                  const bond = STATE_BOND_DATA[c.state] || null;
                  const stipend = STATE_STIPEND_DATA[c.state] || null;
                  const fee = getEstimatedFee(c.name, c.quota);
                  const pg = getInternalPgQuota(c.name);

                  return (
                    <div key={c.key} className="glass-panel p-5 border border-white/10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`badge ${c.collegeType.cls} text-[10px]`}>{c.collegeType.label}</span>
                          <span className="badge bg-teal-400/10 text-teal-300 border border-teal-400/20 text-[10px]">{c.course}</span>
                        </div>

                        <h4 className="font-bold text-white text-base leading-snug mb-1">{c.name}</h4>
                        <p className="text-xs text-white/50 mb-4">{c.state} · {c.quota}</p>

                        <div className="space-y-2.5 text-xs">
                          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                            <span className="text-white/40 block text-[10px] uppercase font-bold">Projected Cutoff</span>
                            <span className="font-bold text-teal-300 mono-font text-sm">~{c.closingRank.toLocaleString()} AIR</span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                            <span className="text-white/40 block text-[10px] uppercase font-bold">Strategy Pillar</span>
                            <span className={`font-bold ${c.strategy.cls}`}>{c.strategy.label} ({c.chance.label})</span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                            <span className="text-white/40 block text-[10px] uppercase font-bold">Annual Tuition Fee</span>
                            <span className="font-bold text-emerald-400 mono-font">{fee.annualFee}</span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                            <span className="text-white/40 block text-[10px] uppercase font-bold">Rural Service Bond</span>
                            <span className="font-bold text-amber-300">
                              {bond ? `${bond.years} Years (${bond.penalty})` : '0 Years'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                            <span className="text-white/40 block text-[10px] uppercase font-bold">Internship Stipend</span>
                            <span className="font-bold text-teal-300 mono-font">
                              {stipend ? stipend.display : 'State Scale'}
                            </span>
                          </div>

                          {pg && (
                            <div className="p-2.5 rounded-lg bg-purple-400/10 border border-purple-400/20 text-purple-200">
                              <span className="block text-[10px] uppercase font-bold text-purple-300">Internal PG Quota</span>
                              <span>{pg.quotaName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemove(c.key)}
                        className="mt-5 text-xs text-rose-400 hover:underline text-center w-full"
                      >
                        Remove from comparison
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-5 mt-5 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="btn-secondary py-2 px-6 text-xs"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
