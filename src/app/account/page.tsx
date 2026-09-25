'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  Crown, 
  Zap, 
  Save, 
  CheckCircle2, 
  Lock, 
  Mail, 
  Sparkles, 
  LogOut, 
  ShieldCheck, 
  ArrowRight,
  Compass,
  Heart,
  ListOrdered,
  HelpCircle,
  KeyRound,
  AlertCircle,
  Loader2,
  Tag,
} from 'lucide-react';
import { BrandIcon } from '@/components/common/BrandIcon';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useUserData } from '@/lib/store/useUserData';
import { initiateCheckout, validateCoupon } from '@/lib/payment/paymentService';
import { PaymentCelebrationModal } from '@/components/payment/PaymentCelebrationModal';

function AccountContent() {
  const searchParams = useSearchParams();
  const { 
    user, 
    profile, 
    tierCategory, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    signOut, 
    resetPassword, 
    updateProfileData,
    activateVerifiedTier,
    signInAsDemoCandidate,
    isLoading 
  } = useAuth();
  const { wishlist, choiceFill } = useUserData();

  // Navigation tab state for dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'passes' | 'profile' | 'security'>('overview');

  // Auth form state (for unauthenticated users)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRank, setSignupRank] = useState('');
  const [signupCategory, setSignupCategory] = useState('Open');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [mounted, setMounted] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!resetModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [resetModalOpen]);

  // Profile preferences form state
  const [name, setName] = useState(profile.displayName || '');
  const [targetScore, setTargetScore] = useState(profile.score || '640');
  const [targetRank, setTargetRank] = useState(profile.rank || '15000');
  const [category, setCategory] = useState(profile.category || 'Open');
  const [domicileState, setDomicileState] = useState(profile.state || 'Delhi (NCT)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Coupon & Pass checkout state
  const [couponCode, setCouponCode] = useState('NEETPRO');
  const [couponStatus, setCouponStatus] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [celebration, setCelebration] = useState<{ open: boolean; planKey: string; paymentId: string }>({
    open: false,
    planKey: 'season',
    paymentId: '',
  });

  // Sync state with profile
  useEffect(() => {
    if (profile.displayName) setName(profile.displayName);
    if (profile.rank) setTargetRank(profile.rank);
    if (profile.score) setTargetScore(profile.score);
    if (profile.category) setCategory(profile.category);
    if (profile.state) setDomicileState(profile.state);
  }, [profile]);

  // Read URL query parameter for plan preselection
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && ['basic', 'season'].includes(planParam)) {
      if (user) {
        setActiveTab('passes');
      } else {
        setAuthMode('signup');
      }
    }
  }, [searchParams, user]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setAuthError('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Google sign in was cancelled or failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      await signInWithEmail(loginEmail, loginPassword);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Email Signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      await signUpWithEmail(signupEmail, signupPassword, signupName, {
        rank: signupRank,
        category: signupCategory,
      });
    } catch (err: any) {
      setAuthError(err.message || 'Could not create account. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setResetModalOpen(false);
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to send password reset email.');
    }
  };

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData({
      displayName: name,
      rank: targetRank,
      score: targetScore,
      category,
      state: domicileState,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Handle Coupon Apply
  const handleApplyCoupon = async (planKey: 'basic' | 'season') => {
    const res = await validateCoupon(couponCode, planKey);
    if (res.valid && res.discountRupees) {
      setCouponDiscount(res.discountRupees);
      setCouponStatus(`✓ ₹${res.discountRupees} Discount applied with code ${res.code}`);
    } else {
      setCouponDiscount(0);
      setCouponStatus(res.message || 'Invalid coupon code');
    }
  };

  // Handle Pass Purchase
  const handleBuyPass = async (planKey: 'basic' | 'season' | 'upgrade') => {
    if (!user) {
      setAuthMode('login');
      return;
    }

    await initiateCheckout({
      planKey,
      couponCode: couponDiscount > 0 ? couponCode : '',
      user,
      onSuccess: async (paymentId) => {
        const tier = planKey === 'basic' ? 'pro_plus' : 'pro_vip';
        await activateVerifiedTier(tier, paymentId);
        setCelebration({ open: true, planKey: planKey === 'upgrade' ? 'season' : planKey, paymentId });
      },
    });
  };

  const userInitial = user
    ? (profile.displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()
    : 'U';

  return (
    <div className="container-custom py-8">
      {/* ── UNAUTHENTICATED CANDIDATE VIEW ── */}
      {!user ? (
        <div className="max-w-md mx-auto py-6">
          {/* Auth Header */}
          <div className="text-center mb-8">
            {/* Top glow orb */}
            <div className="relative inline-flex mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(0,229,170,0.35)] dark:shadow-[0_0_40px_rgba(0,229,170,0.35)]">
                🩺
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-400 border-2 border-[#070710] dark:border-[#070710] flex items-center justify-center text-[10px] font-black text-slate-950">
                ✓
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 dark:text-white">
              {authMode === 'login' ? 'Welcome Back' : 'Join NEET Counselling'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-white/55 mt-2 leading-relaxed">
              {authMode === 'login'
                ? 'Sign in to access your predictions, saved colleges, and counselling data.'
                : 'Create your free account and get 5 AI predictions instantly — no card required.'}
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-2xl bg-white dark:bg-[#0c0c1e] border border-slate-200 dark:border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Card Top Teal Accent Bar */}
            <div className="h-0.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500" />

            <div className="p-6 sm:p-8">
              {/* Tab Switcher */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-teal-500 text-white dark:bg-teal-400 dark:text-slate-950 shadow-sm'
                      : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-teal-500 text-white dark:bg-teal-400 dark:text-slate-950 shadow-sm'
                      : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Register (Free)
                </button>
              </div>

              {/* Error Banner */}
              {authError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
              )}

              {/* Google Button — Always prominently first */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-800 dark:text-white font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:shadow-md mb-5 disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Connecting…</span></>
                  : <span>{authMode === 'login' ? 'Continue with Google' : 'Sign Up with Google'}</span>}
              </button>

              {/* Divider */}
              <div className="relative mb-5 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/10" /></div>
                <span className="relative px-3 bg-white dark:bg-[#0c0c1e] text-[11px] font-bold text-slate-400 dark:text-white/35 uppercase tracking-wider">or with email</span>
              </div>

              {/* Sign In Form */}
              {authMode === 'login' ? (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-white/65 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="candidate@example.com"
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-white/65">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { setResetEmail(loginEmail); setResetModalOpen(true); }}
                        className="text-xs text-teal-600 dark:text-teal-300 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full py-3 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Signing In…</span></> : <span>Sign In →</span>}
                  </button>
                </form>
              ) : (
                /* Create Account Form */
                <form onSubmit={handleEmailSignup} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-white/65 mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-white/65 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="candidate@example.com"
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-white/65 mb-1">
                      Password <span className="text-slate-400 dark:text-white/35 font-normal">(min. 6 characters)</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-white/55 mb-1">
                        NEET AIR <span className="font-normal opacity-70">(optional)</span>
                      </label>
                      <input
                        type="number"
                        value={signupRank}
                        onChange={(e) => setSignupRank(e.target.value)}
                        placeholder="e.g. 15000"
                        className="input-field text-xs mono-font"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-white/55 mb-1">
                        Category
                      </label>
                      <select
                        value={signupCategory}
                        onChange={(e) => setSignupCategory(e.target.value)}
                        className="select-field text-xs"
                      >
                        <option value="Open">Open</option>
                        <option value="OBC">OBC</option>
                        <option value="EWS">EWS</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full py-3 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Creating…</span></> : <span>Create Free Account →</span>}
                  </button>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <span className="text-[10px] text-slate-400 dark:text-white/30 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-500" /> No credit card needed
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-white/30 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-teal-400" /> 5 free AI predictions
                    </span>
                  </div>
                </form>
              )}

              {/* Quick Demo Access Buttons (1-click instant login for testing tiers) */}
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10 space-y-2 text-center">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await signInAsDemoCandidate('pro_vip');
                      } catch (e: any) {
                        setAuthError(e.message || 'Demo sign in failed.');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                    <span>Test VIP Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await signInAsDemoCandidate('free');
                      } catch (e: any) {
                        setAuthError(e.message || 'Demo sign in failed.');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white/80 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>Test Basic Free</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-white/40">
                  1-Click testing: Switch between Free (Basic) and VIP Pass anytime to test locks &amp; features.
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-6 sm:px-8 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06] text-center">
              <p className="text-[11px] text-slate-500 dark:text-white/40">
                Need help?{' '}
                <a href="mailto:asnstudios.app@gmail.com" className="text-teal-700 dark:text-teal-400 hover:underline font-semibold">
                  asnstudios.app@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── AUTHENTICATED CANDIDATE DASHBOARD ── */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Column: Profile Card & Sidebar Tabs */}
          <aside className="space-y-4">
            {/* Identity Card */}
            <div className="glass-panel p-5 text-center relative overflow-hidden">
              <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center font-black text-2xl font-heading acc-avatar-glow ${tierCategory.cls}`}>
                {userInitial}
              </div>
              <h2 className="text-base font-black text-slate-950 dark:text-white truncate font-heading">
                {profile.displayName || user.displayName || 'Candidate'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-white/50 truncate mb-3">{user.email}</p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: tierCategory.badgeBg,
                  color: tierCategory.badgeColor,
                  borderColor: `${tierCategory.badgeColor}40`,
                }}
              >
                <span>{tierCategory.label}</span>
              </div>
            </div>

            {/* Tab Navigation Menu */}
            <div className="glass-panel p-2 space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: Compass },
                { id: 'passes', label: 'Counselling Passes', icon: Crown },
                { id: 'profile', label: 'NEET Parameters', icon: User },
                { id: 'security', label: 'Security & Sign Out', icon: KeyRound },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-800 font-extrabold border border-teal-500/40 shadow-sm dark:bg-teal-400/15 dark:text-teal-300 dark:border-teal-400/30'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Logout Button */}
            <button
              type="button"
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-rose-400/40 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </aside>

          {/* Right Column: Active Dashboard Content Panel */}
          <main className="md:col-span-3 space-y-6">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* Active Membership Status Card */}
                <div className="glass-panel p-6 border-2 border-amber-400/40 bg-gradient-to-br from-amber-400/[0.06] to-transparent">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div>
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                        Active Membership
                      </span>
                      <h3 className="text-xl font-black text-slate-950 dark:text-white font-heading mt-0.5">
                        {tierCategory.label}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {!profile.isPremium && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('passes')}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow hover:brightness-110 transition-all cursor-pointer"
                        >
                          Upgrade to Season Pass
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <span className="text-slate-500 dark:text-white/50 block mb-1">Prediction Quota</span>
                      <strong className="text-sm font-black text-teal-700 dark:text-teal-300">
                        {tierCategory.unlimited ? 'Unlimited Runs' : `${profile.predictionsCount} used / 5 free`}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <span className="text-slate-500 dark:text-white/50 block mb-1">College Wishlist</span>
                      <strong className={`text-sm font-black ${tierCategory.canAccessWishlist ? 'text-amber-700 dark:text-amber-300' : 'text-slate-950 dark:text-white'}`}>
                        {tierCategory.canAccessWishlist ? 'Unlocked (VIP)' : 'Locked (Requires VIP)'}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <span className="text-slate-500 dark:text-white/50 block mb-1">Choice Sequencer</span>
                      <strong className={`text-sm font-black ${tierCategory.canAccessChoiceFiller ? 'text-amber-700 dark:text-amber-300' : 'text-slate-950 dark:text-white'}`}>
                        {tierCategory.canAccessChoiceFiller ? 'Unlocked (VIP)' : 'Locked (Requires VIP)'}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <span className="text-slate-500 dark:text-white/50 block mb-1">NEET Validity</span>
                      <strong className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                        All Rounds (1 Year)
                      </strong>
                    </div>
                  </div>

                  {profile.paymentId && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-white/60">
                      <span>Receipt Transaction: <strong className="font-mono text-slate-900 dark:text-white">{profile.paymentId}</strong></span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Verified Active</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Action Navigation Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    href="/predict"
                    className="glass-panel p-4 hover:border-teal-500/40 hover:-translate-y-1 transition-all group block shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-700 dark:text-teal-300 mb-3 group-hover:scale-110 transition-transform">
                      <Compass className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Run Predictor</h4>
                    <p className="text-[11px] text-slate-500 dark:text-white/50">Forecast college matches</p>
                  </Link>

                  <Link
                    href="/wishlist"
                    className="glass-panel p-4 hover:border-rose-400/40 hover:-translate-y-1 transition-all group block shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-400/15 border border-rose-400/30 flex items-center justify-center text-rose-600 dark:text-rose-300 mb-3 group-hover:scale-110 transition-transform">
                      <Heart className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">My Wishlist</h4>
                    <p className="text-[11px] text-slate-500 dark:text-white/50">{wishlist.length} colleges saved</p>
                  </Link>

                  <Link
                    href="/choice-fill"
                    className="glass-panel p-4 hover:border-amber-400/40 hover:-translate-y-1 transition-all group block shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-700 dark:text-amber-300 mb-3 group-hover:scale-110 transition-transform">
                      <ListOrdered className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Choice Sequence</h4>
                    <p className="text-[11px] text-slate-500 dark:text-white/50">{choiceFill.length} choices sequenced</p>
                  </Link>

                  <Link
                    href="/support"
                    className="glass-panel p-4 hover:border-sky-400/40 hover:-translate-y-1 transition-all group block shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-700 dark:text-sky-300 mb-3 group-hover:scale-110 transition-transform">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">MCC Counselling Guide</h4>
                    <p className="text-[11px] text-slate-500 dark:text-white/50">Rules, bonds &amp; quotas</p>
                  </Link>
                </div>
              </div>
            )}

            {/* 2. PASSES & BILLING TAB */}
            {activeTab === 'passes' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-black text-slate-950 dark:text-white font-heading">
                    NEET Counselling Passes
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 mt-1">
                    One-time activation. Valid for Round 1, Round 2, Round 3, Stray and Special Stray vacancy rounds.
                  </p>
                </div>

                {/* Coupon Input Strip */}
                <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto text-xs font-bold text-slate-800 dark:text-white/80">
                    <Tag className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span>Have a Coupon?</span>
                  </div>
                  <div className="flex-1 flex gap-2 w-full">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. NEETPRO"
                      className="input-field text-xs py-2 mono-font"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon('season')}
                      className="px-4 py-2 rounded-xl bg-teal-600 dark:bg-teal-400 text-white dark:text-slate-950 font-black text-xs hover:brightness-110 transition-all cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {couponStatus && (
                    <span className={`text-xs font-bold ${couponDiscount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {couponStatus}
                    </span>
                  )}
                </div>

                {/* Plan Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Basic Pass */}
                  <div className="glass-panel p-6 border border-sky-400/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                          Standard Access
                        </span>
                        <Zap className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <h4 className="text-lg font-black text-slate-950 dark:text-white font-heading mb-1">Basic Counselling Pass</h4>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-black text-slate-950 dark:text-white mono-font">
                          ₹{Math.max(1, 149 - couponDiscount)}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-white/40 line-through">₹299</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-700 dark:text-white/70 mb-6">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>Unlimited AI college predictions</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>All 750+ Medical colleges (AIQ &amp; State)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>All Filters (State, Quota, Category, Type)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>Fees, Rural Bonds, Stipends &amp; Hospital Beds</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-400 dark:text-white/40">
                          <span className="font-mono text-xs px-1 text-slate-400 dark:text-white/30">✕</span>
                          <span className="line-through">Personal College Wishlist</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-400 dark:text-white/40">
                          <span className="font-mono text-xs px-1 text-slate-400 dark:text-white/30">✕</span>
                          <span className="line-through">Choice Filling Sequencer</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyPass('basic')}
                      disabled={profile.tierType === 'pro_plus' || profile.tierType === 'pro_vip'}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-sm ${
                        profile.tierType === 'pro_vip'
                          ? 'bg-slate-200 text-slate-500 dark:bg-white/5 dark:text-white/40 cursor-default'
                          : profile.tierType === 'pro_plus'
                          ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-400/40 cursor-default'
                          : 'bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950 hover:brightness-110 cursor-pointer'
                      }`}
                    >
                      {profile.tierType === 'pro_vip'
                        ? 'Included with VIP Pass'
                        : profile.tierType === 'pro_plus'
                        ? 'Current Active Pass'
                        : 'Activate Basic Pass (₹149)'}
                    </button>
                  </div>

                  {/* Season Pass VIP */}
                  <div className="glass-panel p-6 border-2 border-amber-500/50 bg-amber-500/[0.04] dark:bg-amber-400/[0.03] flex flex-col justify-between relative shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                    <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                      MOST POPULAR
                    </span>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                          Complete VIP Suite
                        </span>
                        <Crown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                      </div>
                      <h4 className="text-lg font-black text-slate-950 dark:text-white font-heading mb-1">Season Counselling Pass</h4>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mono-font">
                          ₹{profile.tierType === 'pro_plus' ? Math.max(1, 150 - couponDiscount) : Math.max(1, 299 - couponDiscount)}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-white/40 line-through">
                          {profile.tierType === 'pro_plus' ? '₹299' : '₹599'}
                        </span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-800 dark:text-white/80 mb-6">
                        <li className="flex items-center gap-2 font-bold text-slate-950 dark:text-white">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Everything in Basic Pass</span>
                        </li>
                        <li className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Personal College Wishlist Unlocked</span>
                        </li>
                        <li className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Smart Choice Filling Sequencer &amp; AI Auto-Sort</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Choice Order Blunder Warning Sentinel</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>One-click MCC-Ready Print &amp; PDF Export</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Golden glowing avatar badge in navbar</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyPass(profile.tierType === 'pro_plus' ? 'upgrade' : 'season')}
                      disabled={profile.tierType === 'pro_vip'}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-lg ${
                        profile.tierType === 'pro_vip'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 cursor-pointer'
                      }`}
                    >
                      {profile.tierType === 'pro_vip'
                        ? 'Current Active VIP Pass'
                        : profile.tierType === 'pro_plus'
                        ? 'Upgrade to Season Pass (₹150)'
                        : 'Activate Season Pass (₹299)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PROFILE PARAMETERS TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-7 space-y-5 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white font-heading">
                      NEET Candidate Parameters
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-white/50">
                      These values populate default filters in the predictor and choice filling tool.
                    </p>
                  </div>
                  {savedSuccess && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Saved to Cloud!</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 mb-1.5">Candidate Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Your Full Name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 mb-1.5">Email (Primary)</label>
                    <input
                      type="email"
                      disabled
                      value={user.email || ''}
                      className="input-field text-sm opacity-60 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 mb-1.5">NEET All India Rank (AIR)</label>
                    <input
                      type="number"
                      value={targetRank}
                      onChange={(e) => setTargetRank(e.target.value)}
                      className="input-field mono-font text-sm"
                      placeholder="e.g. 15000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 mb-1.5">NEET Score (out of 720)</label>
                    <input
                      type="number"
                      value={targetScore}
                      onChange={(e) => setTargetScore(e.target.value)}
                      className="input-field mono-font text-sm"
                      placeholder="e.g. 640"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 mb-1.5">Counselling Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="select-field text-sm"
                    >
                      <option value="Open">Open (General / UR)</option>
                      <option value="OBC">OBC</option>
                      <option value="EWS">EWS</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="Open PwD">Open PwD</option>
                      <option value="OBC PwD">OBC PwD</option>
                      <option value="EWS PwD">EWS PwD</option>
                      <option value="SC PwD">SC PwD</option>
                      <option value="ST PwD">ST PwD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 mb-1.5">Home Domicile State</label>
                    <input
                      type="text"
                      value={domicileState}
                      onChange={(e) => setDomicileState(e.target.value)}
                      className="input-field text-sm"
                      placeholder="e.g. Delhi (NCT), Rajasthan"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary py-2.5 px-6 text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Parameters</span>
                  </button>
                </div>
              </form>
            )}

            {/* 4. SECURITY & SIGN OUT TAB */}
            {activeTab === 'security' && (
              <div className="glass-panel p-6 sm:p-7 space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white font-heading">
                    Security &amp; Password
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-white/50">
                    Manage authentication credentials and active sessions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Password Reset</span>
                    <span className="text-[11px] text-slate-500 dark:text-white/50">Send a password reset email link to {user.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (user.email) resetPassword(user.email).then(() => alert(`Password reset link sent to ${user.email}`));
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-800 dark:text-teal-300 text-xs font-bold hover:bg-teal-500/20 cursor-pointer"
                  >
                    Send Email
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">Sign Out Session</span>
                    <span className="text-[11px] text-slate-600 dark:text-white/50">Clears your authentication session on this browser</span>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Forgot Password Modal */}
      {resetModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-modal-overlay">
          <div className="relative w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-[#0d1226] border border-slate-200 dark:border-white/15 text-center shadow-2xl animate-modal-content">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Reset Account Password</h3>
            <p className="text-xs text-slate-600 dark:text-white/60 mb-4">
              Enter your registered email address to receive an official recovery link.
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-3">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="input-field text-xs py-2"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-xs text-slate-700 dark:text-white font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-2 text-xs font-bold justify-center cursor-pointer"
                >
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Post-Purchase Celebration Modal */}
      {celebration.open && (
        <PaymentCelebrationModal
          planKey={celebration.planKey}
          paymentId={celebration.paymentId}
          onClose={() => setCelebration({ open: false, planKey: 'season', paymentId: '' })}
        />
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <AccountContent />
    </React.Suspense>
  );
}
