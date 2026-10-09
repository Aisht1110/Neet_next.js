'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Heart, 
  ListOrdered, 
  ShieldCheck, 
  ArrowRight, 
  Tag, 
  Loader2,
  Lock
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { initiateCheckout, validateCoupon, PLANS } from '@/lib/payment/paymentService';
import { BrandIcon } from './BrandIcon';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'wishlist' | 'choice_fill' | 'general';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  feature = 'general'
}) => {
  const [mounted, setMounted] = useState(false);
  const { user, profile, activateVerifiedTier } = useAuth();
  const [couponCode, setCouponCode] = useState('NEETPRO');
  const [couponStatus, setCouponStatus] = useState('');
  const [discount, setDiscount] = useState(50); // Default ₹50 off with NEETPRO
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponStatus('Enter a coupon code');
      setDiscount(0);
      return;
    }
    const res = await validateCoupon(couponCode, 'season');
    if (res.valid && res.discountRupees) {
      setDiscount(res.discountRupees);
      setCouponStatus(`✓ ₹${res.discountRupees} off applied!`);
    } else {
      setDiscount(0);
      setCouponStatus(res.message || 'Invalid coupon');
    }
  };

  const handleUpgradeNow = async () => {
    setIsProcessing(true);
    try {
      await initiateCheckout({
        planKey: 'season',
        couponCode: couponCode.trim(),
        user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
        onSuccess: async (paymentId, planKey) => {
          await activateVerifiedTier('pro_vip', paymentId);
          setIsProcessing(false);
          onClose();
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
        onError: (err) => {
          console.error('Checkout error:', err);
          setIsProcessing(false);
        }
      });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const basePrice = PLANS.season.price; // 299
  const finalPrice = Math.max(1, basePrice - discount);

  const getFeatureHeadline = () => {
    if (feature === 'wishlist') {
      return {
        badge: 'Shortlist Locked',
        title: 'Unlock Personal College Wishlist',
        desc: 'Save your dream colleges across devices, organize state vs AIQ preferences, and 1-click transfer to Choice Filling.'
      };
    }
    if (feature === 'choice_fill') {
      return {
        badge: 'Choice Sequencer Locked',
        title: 'Unlock Smart Choice Filling Tool',
        desc: 'Prevent fatal choice ordering mistakes. AI auto-sorts your preferences by closing rank and generates an MCC-ready submission sheet.'
      };
    }
    return {
      badge: 'Season Pass VIP',
      title: 'Upgrade to Complete Counselling Suite',
      desc: 'Get full access to College Shortlisting, the MCC Choice Sequencer, Auto-Sort, and VIP Member benefits.'
    };
  };

  const info = getFeatureHeadline();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="upgrade-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div 
            key="upgrade-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl sm:rounded-3xl border-2 border-amber-500/40 bg-white dark:bg-[#0c0d16] p-5 sm:p-7 shadow-[0_10px_50px_rgba(245,158,11,0.22)] relative overflow-hidden text-left"
          >
            {/* Subtle background gradient glow */}
            <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-amber-500/10 dark:bg-amber-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-teal-500/10 dark:bg-teal-400/10 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="h-4 w-4" />
            </motion.button>

        {/* Header Tag */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
            <Crown className="h-3.5 w-3.5" />
            <span>{info.badge}</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-white/40">VIP Feature</span>
        </div>

        {/* Title & Desc */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-snug">
          {info.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 mt-1.5 leading-relaxed">
          {info.desc}
        </p>

        {/* What You Unlock Grid */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/50 block mb-1">
            Season Pass VIP Unlocks:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-slate-800 dark:text-white/80 font-medium">Personal College Wishlist</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-slate-800 dark:text-white/80 font-medium">Smart Choice Filling Sequencer</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-slate-800 dark:text-white/80 font-medium">AI Auto-Sort by Closing Rank</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-slate-800 dark:text-white/80 font-medium">Choice Order Blunder Guard</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-slate-800 dark:text-white/80 font-medium">Official MCC Print & CSV Export</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-slate-800 dark:text-white/80 font-medium">Golden VIP Glow Badge</span>
            </div>
          </div>
        </div>

        {/* Coupon Strip */}
        <div className="mt-4 flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/8">
          <Tag className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 ml-1" />
          <input 
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Coupon Code"
            className="flex-1 bg-transparent border-0 text-xs font-bold mono-font text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            className="px-2.5 py-1 rounded-lg bg-teal-600 dark:bg-teal-400 text-white dark:text-slate-950 font-bold text-[11px] cursor-pointer hover:brightness-110 transition-all"
          >
            Apply
          </button>
        </div>
        {couponStatus && (
          <p className={`text-[11px] font-semibold mt-1 px-1 ${discount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {couponStatus}
          </p>
        )}

        {/* Price & Checkout CTA */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block">All Rounds Access (1 Year)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 mono-font">
                ₹{finalPrice}
              </span>
              <span className="text-xs text-slate-400 dark:text-white/40 line-through">₹599</span>
              {discount > 0 && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Save ₹{discount}!</span>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleUpgradeNow}
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs sm:text-sm shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:brightness-110 hover:shadow-[0_4px_24px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Launching Secure Checkout…</span>
              </>
            ) : (
              <>
                <Crown className="h-4 w-4" />
                <span>Unlock Season Pass (₹{finalPrice})</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Security / Guarantee footer */}
        <div className="mt-3 text-center">
          <span className="text-[10px] text-slate-500 dark:text-white/40 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Official Razorpay 256-Bit Encrypted · Instant Activation</span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>,
document.body
);
};
