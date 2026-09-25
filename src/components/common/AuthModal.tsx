'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Crown, 
  Zap, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Gift,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { FirebaseUser } from '@/lib/firebase/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  onSuccess?: (user: FirebaseUser) => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  title = 'Claim Your 5 Free AI Predictions',
  subtitle = 'Login or create a free candidate account to unlock instant cutoff forecasts across all 750+ medical colleges.',
  onSuccess,
  defaultMode = 'signup',
}) => {
  const [mounted, setMounted] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('Open');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    signInAsDemoCandidate 
  } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setAuthMode(defaultMode);
    setError('');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, defaultMode]);

  if (!mounted || !isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const u = await signInWithGoogle();
      onClose();
      if (onSuccess) onSuccess(u);
    } catch (err: any) {
      setError(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      let u: FirebaseUser;
      if (authMode === 'login') {
        u = await signInWithEmail(email, password);
      } else {
        u = await signUpWithEmail(email, password, displayName, {
          rank,
          category,
        });
      }
      onClose();
      if (onSuccess) onSuccess(u);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (tier: 'free' | 'pro_vip') => {
    setError('');
    setIsSubmitting(true);
    try {
      const u = await signInAsDemoCandidate(tier);
      onClose();
      if (onSuccess) onSuccess(u);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-modal-overlay">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0c0c1e] border border-slate-200 dark:border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden animate-modal-content">
        {/* Glow Header Accent */}
        <div className="h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Top Value Badge */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-800 dark:text-teal-300 text-xs font-black uppercase tracking-wider mb-2">
              <Gift className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Free Trial Activation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-white/60 mt-1.5 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] mb-4">
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-teal-500 text-white dark:bg-teal-400 dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Register (Claim 5 Free)
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-teal-500 text-white dark:bg-teal-400 dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Google 1-Click Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-60 mb-3.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Connecting…
              </span>
            ) : (
              <span>Continue with Google</span>
            )}
          </button>

          {/* Divider */}
          <div className="relative mb-3.5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-white/10" />
            </div>
            <span className="relative px-2.5 bg-white dark:bg-[#0c0c1e] text-[10px] font-bold text-slate-400 dark:text-white/35 uppercase tracking-wider">
              or with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {authMode === 'signup' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-white/70 mb-1">
                  Candidate Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Dr. Aryan Patel"
                  className="input-field text-xs py-2"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-white/70 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@gmail.com"
                className="input-field text-xs py-2"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-white/70 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field text-xs py-2"
              />
            </div>

            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-white/50 mb-1">
                    NEET Rank (Optional)
                  </label>
                  <input
                    type="number"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="e.g. 15000"
                    className="input-field text-xs py-1.5 mono-font"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-white/50 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="select-field text-xs py-1.5"
                  >
                    <option value="Open">Open</option>
                    <option value="OBC">OBC</option>
                    <option value="EWS">EWS</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md mt-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing…</span>
                </>
              ) : (
                <span>{authMode === 'signup' ? 'Claim 5 Free Predictions →' : 'Sign In to Account →'}</span>
              )}
            </button>
          </form>

          {/* Quick Demo Test Access Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 space-y-1.5 text-center">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('free')}
                disabled={isSubmitting}
                className="flex-1 py-1.5 px-2 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white text-[11px] font-bold transition-all cursor-pointer"
              >
                Test Basic Free (5 Runs)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('pro_vip')}
                disabled={isSubmitting}
                className="flex-1 py-1.5 px-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Crown className="h-3 w-3 text-amber-500" />
                <span>Test VIP Pass</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-white/40">
              1-Click instant test login for evaluation &amp; trial verification.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
