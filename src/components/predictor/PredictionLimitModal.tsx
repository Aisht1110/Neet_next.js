'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { Crown, Zap, UserPlus, X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { initiateCheckout } from '@/lib/payment/paymentService';

interface PredictionLimitModalProps {
  reason: 'REGISTER_REQUIRED' | 'UPGRADE_REQUIRED';
  message?: string;
  onClose: () => void;
  onUpgradeSuccess?: (planKey: string, paymentId: string) => void;
}

export const PredictionLimitModal: React.FC<PredictionLimitModalProps> = ({
  reason,
  message,
  onClose,
  onUpgradeSuccess,
}) => {
  const [mounted, setMounted] = useState(false);
  const { user, activateVerifiedTier } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const isGuest = reason === 'REGISTER_REQUIRED';

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleBuy = async (planKey: 'basic' | 'season') => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = `/account?plan=${planKey}`;
      }
      return;
    }

    await initiateCheckout({
      planKey,
      couponCode,
      user,
      onSuccess: async (paymentId) => {
        const tierType = planKey === 'season' ? 'pro_vip' : 'pro_plus';
        await activateVerifiedTier(tierType, paymentId);
        onClose();
        if (onUpgradeSuccess) onUpgradeSuccess(planKey, paymentId);
      },
    });
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-modal-overlay">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl text-center bg-[#0d1226] border border-amber-400/40 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden animate-modal-content">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon Core */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_25px_rgba(245,158,11,0.3)]">
          ⚡
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 font-heading">
          {isGuest ? 'Guest Free Limit Reached' : 'Free Predictions Completed'}
        </h3>

        <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-6">
          {message || 'Unlock instant unlimited predictions across 750+ medical colleges for all rounds of NEET counselling.'}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 mb-5 text-left">
          {/* Season Pass Option */}
          <button
            type="button"
            onClick={() => handleBuy('season')}
            className="w-full p-4 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-400/15 via-orange-500/10 to-transparent hover:border-amber-400 hover:from-amber-400/25 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm">Season Counselling Pass</span>
                  <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-[2px] text-[10px] font-black text-amber-300">
                    VIP ★
                  </span>
                </div>
                <p className="text-[11px] text-white/60">Full Predictor + Choice Filling Tool</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-amber-300 mono-font">₹299</div>
              <div className="text-[10px] text-white/40 line-through">₹599</div>
            </div>
          </button>

          {/* Basic Pass Option */}
          <button
            type="button"
            onClick={() => handleBuy('basic')}
            className="w-full p-3.5 rounded-2xl border border-sky-400/30 bg-sky-400/[0.05] hover:border-sky-400/60 hover:bg-sky-400/10 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-400/20 border border-sky-400/40 text-sky-300 flex items-center justify-center font-black">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-white text-xs sm:text-sm">Basic Counselling Pass</span>
                <p className="text-[11px] text-white/50">Unlimited Predictions All Rounds</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-sky-300 mono-font">₹149</div>
              <div className="text-[10px] text-white/40 line-through">₹299</div>
            </div>
          </button>

          {/* Guest Sign-In Option */}
          {isGuest && (
            <Link
              href="/account"
              onClick={onClose}
              className="w-full p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4 text-teal-400" />
              <span>Sign In with Google for 5 Free Runs</span>
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-white/40 hover:text-white/70 transition-colors underline cursor-pointer"
        >
          Dismiss &amp; continue viewing current matches
        </button>
      </div>
    </div>,
    document.body
  );
};
