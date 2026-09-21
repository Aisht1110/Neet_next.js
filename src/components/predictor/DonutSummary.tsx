'use client';

import React from 'react';
import { StrategyKey } from '@/lib/engine/types';

interface DonutSummaryProps {
  counts: {
    safety: number;
    target: number;
    reach: number;
    longshot: number;
    total: number;
  };
  activeFilter: StrategyKey | null;
  onSelectFilter: (key: StrategyKey | null) => void;
}

export const DonutSummary: React.FC<DonutSummaryProps> = ({
  counts,
  activeFilter,
  onSelectFilter
}) => {
  const { safety, target, reach, longshot, total } = counts;

  if (total === 0) return null;

  // Calculate SVG arc strokes
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const safetyPct = safety / total;
  const targetPct = target / total;
  const reachPct = reach / total;
  const longshotPct = longshot / total;

  const safetyStroke = safetyPct * circumference;
  const targetStroke = targetPct * circumference;
  const reachStroke = reachPct * circumference;
  const longshotStroke = longshotPct * circumference;

  const safetyOffset = 0;
  const targetOffset = -safetyStroke;
  const reachOffset = -(safetyStroke + targetStroke);
  const longshotOffset = -(safetyStroke + targetStroke + reachStroke);

  const pillars: { key: StrategyKey; label: string; count: number; color: string; bg: string; border: string }[] = [
    { key: 'safety', label: 'Safety', count: safety, color: '#22d97a', bg: 'rgba(34,217,122,0.1)', border: 'rgba(34,217,122,0.3)' },
    { key: 'target', label: 'Target', count: target, color: '#ffd93d', bg: 'rgba(255,217,61,0.1)', border: 'rgba(255,217,61,0.3)' },
    { key: 'reach', label: 'Reach', count: reach, color: '#ff6b35', bg: 'rgba(255,107,53,0.1)', border: 'rgba(255,107,53,0.3)' },
    { key: 'longshot', label: 'Long Shot', count: longshot, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.3)' },
  ];

  return (
    <div className="glass-panel p-3.5 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        {/* Left: Donut Chart */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width="95" height="95" viewBox="0 0 100 100" className="-rotate-90 transform sm:w-[110px] sm:h-[110px]">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="12"
            />
            {/* Safety Arc */}
            {safety > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#22d97a"
                strokeWidth="12"
                strokeDasharray={`${safetyStroke} ${circumference}`}
                strokeDashoffset={safetyOffset}
                className="transition-all duration-500"
              />
            )}
            {/* Target Arc */}
            {target > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#ffd93d"
                strokeWidth="12"
                strokeDasharray={`${targetStroke} ${circumference}`}
                strokeDashoffset={targetOffset}
                className="transition-all duration-500"
              />
            )}
            {/* Reach Arc */}
            {reach > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#ff6b35"
                strokeWidth="12"
                strokeDasharray={`${reachStroke} ${circumference}`}
                strokeDashoffset={reachOffset}
                className="transition-all duration-500"
              />
            )}
            {/* Longshot Arc */}
            {longshot > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#f43f5e"
                strokeWidth="12"
                strokeDasharray={`${longshotStroke} ${circumference}`}
                strokeDashoffset={longshotOffset}
                className="transition-all duration-500"
              />
            )}
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-base sm:text-lg font-black text-white mono-font">{total}</span>
            <span className="text-[9px] sm:text-[10px] text-white/50 font-bold uppercase tracking-wider -mt-1">Seats</span>
          </div>
        </div>

        {/* Right: Strategy Filter Chips */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full">
          {pillars.map((p) => {
            const isSelected = activeFilter === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onSelectFilter(isSelected ? null : p.key)}
                className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-white/30 scale-[1.02]'
                    : 'hover:border-white/20'
                }`}
                style={{
                  backgroundColor: isSelected ? p.bg : 'rgba(255,255,255,0.02)',
                  borderColor: isSelected ? p.color : 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-white/90">
                    {p.label} <span className="hidden md:inline font-normal text-white/50">Choices</span>
                  </span>
                  <span
                    className="text-xs font-black mono-font px-1.5 py-0.5 rounded-md"
                    style={{ color: p.color, backgroundColor: p.bg }}
                  >
                    {p.count}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-white/40">
                  {total > 0 ? Math.round((p.count / total) * 100) : 0}% of choices
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
