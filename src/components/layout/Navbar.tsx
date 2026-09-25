'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Compass, 
  Building2, 
  ListOrdered, 
  Heart, 
  HelpCircle, 
  Menu, 
  X, 
  User,
  Sun,
  Moon,
  LogIn,
  Crown,
  Zap,
} from 'lucide-react';
import { useUserData } from '@/lib/store/useUserData';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useAuth } from '@/lib/firebase/AuthContext';
import { BrandIcon } from '@/components/common/BrandIcon';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { wishlist, choiceFill, isLoaded } = useUserData();
  const { theme, toggleTheme, mounted } = useTheme();
  const { user, profile, tierCategory } = useAuth();

  const navLinks = [
    { name: 'Predictor', href: '/predict', icon: Compass, isAI: true },
    { name: 'Colleges & Fees', href: '/colleges', icon: Building2 },
    { name: 'Choice Filling', href: '/choice-fill', icon: ListOrdered, count: (mounted && isLoaded) ? choiceFill.length : 0 },
    { name: 'Wishlist', href: '/wishlist', icon: Heart, count: (mounted && isLoaded) ? wishlist.length : 0 },
    { name: 'MCC Guide', href: '/support', icon: HelpCircle },
  ];

  const userInitial = user
    ? (profile.displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()
    : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#070710]/95 dark:text-white dark:shadow-none">
      <div className="container-custom flex items-center justify-between py-2.5">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(0,229,170,0.25)] group-hover:scale-105 transition-transform">
            🩺
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-950 dark:text-white">
                NEET Counselling
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-white/50 -mt-0.5 hidden sm:block">
              AI Cutoff &amp; Allocation Forecasting
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links Pill */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full border border-slate-300/80 bg-slate-100/95 px-3 py-1 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-800 font-extrabold border border-teal-500/40 shadow-sm dark:bg-teal-400/15 dark:text-teal-300 dark:border-teal-400/30 dark:shadow-[0_0_12px_rgba(0,229,170,0.2)]'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 dark:text-white/75 dark:hover:text-white dark:hover:bg-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.name}</span>
                {link.isAI && (
                  <span className="rounded bg-teal-500/20 px-1 py-[2px] text-[9px] font-black text-teal-800 border border-teal-500/40 -ml-0.5 dark:bg-teal-400/20 dark:text-teal-300 dark:border-teal-400/30">
                    AI
                  </span>
                )}
                {typeof link.count === 'number' && link.count > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-[2px] text-[9px] font-mono font-black text-amber-800 dark:text-amber-300 ml-0.5">
                    {link.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Theme Toggle + Predict Button + User Profile Avatar + Hamburger */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleTheme();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all cursor-pointer shadow-sm active:scale-90 select-none dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
            title={mounted ? (theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode') : 'Toggle visual theme'}
            aria-label="Toggle visual theme"
          >
            {mounted ? (
              theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="h-4 w-4 text-sky-600 hover:-rotate-12 transition-transform" />
              )
            ) : (
              <Sun className="h-4 w-4 text-amber-400 opacity-70" />
            )}
          </button>

          {/* Quick Predict CTA */}
          <Link
            href="/predict"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-3.5 py-1.5 text-xs font-extrabold !text-white shadow-[0_0_15px_rgba(5,150,105,0.3)] hover:brightness-110 active:scale-95 transition-all select-none dark:from-teal-400 dark:to-emerald-400 dark:!text-slate-950 dark:shadow-[0_0_15px_rgba(0,229,170,0.3)]"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Predict Now</span>
          </Link>

          {/* User Profile Avatar Button */}
          {mounted && user ? (
            <Link
              href="/account"
              className={`nav-round-profile-btn ${tierCategory.cls} active:scale-95`}
              title={`${profile.displayName || 'Candidate'} · ${tierCategory.label}`}
            >
              <span>{userInitial}</span>
              {tierCategory.icon && (
                <span className={`nav-mini-badge ${tierCategory.cls}`}>
                  {tierCategory.icon}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-100 active:scale-95 px-3.5 py-1.5 text-xs font-bold text-slate-800 transition-all shadow-sm select-none dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white"
              title="Sign in to your account"
            >
              <LogIn className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 active:scale-90 transition-transform cursor-pointer dark:border-white/10 dark:bg-white/5 dark:text-white lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white/98 text-slate-900 px-4 py-4 lg:hidden animate-fade-in shadow-xl dark:border-white/10 dark:bg-[#070710]/98 dark:text-white">
          {/* User Status Bar in Mobile Menu */}
          <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-200 dark:border-white/10">
            {mounted && user ? (
              <div className="flex items-center gap-2.5">
                <div className={`nav-round-profile-btn ${tierCategory.cls} !w-8 !h-8 !text-xs`}>
                  {userInitial}
                  {tierCategory.icon && (
                    <span className={`nav-mini-badge ${tierCategory.cls} !w-3.5 !h-3.5 !text-[8px]`}>
                      {tierCategory.icon}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {profile.displayName || user.email}
                  </div>
                  <div className="text-[10px] text-teal-600 dark:text-teal-300 font-semibold">
                    {tierCategory.label}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 dark:text-white/70">
                <span>Welcome, Candidate!</span>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-sky-600" />
                  <span>Switch to Dark</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold ${
                    isActive 
                      ? 'bg-teal-500/15 text-teal-700 border border-teal-500/30 dark:bg-teal-400/15 dark:text-teal-300 dark:border-teal-400/30' 
                      : 'text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </div>
                  {typeof link.count === 'number' && link.count > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
              <Link
                href="/predict"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full py-2.5 text-xs text-center justify-center font-bold"
              >
                Open College Predictor
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 rounded-xl border border-slate-300 bg-slate-100 text-center text-xs font-bold text-slate-800 hover:bg-slate-200 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:text-white"
              >
                {user ? 'View My Account & Passes' : 'Sign In to My Account'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
