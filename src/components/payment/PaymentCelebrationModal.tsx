'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Crown, Sparkles, CheckCircle2, Compass, ListOrdered, X } from 'lucide-react';
import { PLANS, PlanDetails } from '@/lib/payment/paymentService';

interface PaymentCelebrationModalProps {
  planKey: string;
  paymentId: string;
  onClose: () => void;
}

export const PaymentCelebrationModal: React.FC<PaymentCelebrationModalProps> = ({
  planKey,
  paymentId,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const plan: PlanDetails = PLANS[planKey] || PLANS.season;
  const isVip = plan.tier === 'pro_vip';
  const glowColor = isVip ? '#fbbf24' : '#38bdf8';

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-modal-overlay">
      <div 
        className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl text-center bg-[#0d1226] border-2 shadow-2xl overflow-hidden animate-modal-content"
        style={{
          borderColor: isVip ? 'rgba(251, 191, 36, 0.7)' : 'rgba(56, 189, 248, 0.7)',
          boxShadow: `0 0 50px ${glowColor}40`,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Bouncing Celebration Emoji */}
        <div className="text-5xl sm:text-6xl mb-3 animate-bounce">
          🎉
        </div>

        <div 
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 border"
          style={{
            backgroundColor: `${glowColor}20`,
            color: glowColor,
            borderColor: `${glowColor}50`,
          }}
        >
          <Sparkles className="h-3 w-3" />
          <span>PAYMENT SUCCESSFUL</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-2 font-heading">
          Welcome to{' '}
          <span 
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: isVip 
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b, #ea580c)' 
                : 'linear-gradient(135deg, #38bdf8, #06b6d4, #10b981)',
            }}
          >
            {plan.tierLabel}
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-6">
          Your <strong>{plan.name}</strong> is now permanently activated! All AI predictors, choice ranking tools, and cutoff reports are fully unlocked.
        </p>

        {/* Receipt Box */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-xs text-left space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-white/60">Transaction ID:</span>
            <span className="font-mono text-white font-bold truncate max-w-[180px]">{paymentId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">Plan:</span>
            <span className="font-bold text-white">{plan.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">Validity:</span>
            <span className="font-bold text-teal-300">All Counselling Rounds (1 Year)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/predict"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition-transform hover:scale-[1.02]"
            style={{
              background: isVip
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                : 'linear-gradient(135deg, #00e5aa, #38bdf8)',
              color: '#050b14',
            }}
          >
            <Compass className="h-4 w-4" />
            <span>Run Predictor</span>
          </Link>

          <Link
            href="/choice-fill"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors"
          >
            <ListOrdered className="h-4 w-4" />
            <span>Choice Filling</span>
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
};
