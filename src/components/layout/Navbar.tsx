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
  ArrowRight
} from 'lucide-react';
import { useUserData } from '@/lib/store/useUserData';
import { BrandIcon } from '@/components/common/BrandIcon';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { wishlist, choiceFill } = useUserData();

  const navLinks = [
    { name: 'Predictor', href: '/predict', icon: Compass },
    { name: 'Colleges', href: '/colleges', icon: Building2 },
    { name: 'Choice Filling', href: '/choice-fill', icon: ListOrdered, count: choiceFill.length },
    { name: 'Wishlist', href: '/wishlist', icon: Heart, count: wishlist.length },
    { name: 'MCC Guide', href: '/support', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#070710]/95 backdrop-blur-xl">
      <div className="container-custom flex items-center justify-between py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-white no-underline group shrink-0">
          <BrandIcon size={38} className="group-hover:scale-105 transition-transform" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">NEET Counselling</span>
              <span className="rounded-md bg-teal-400/15 px-1.5 py-0.5 text-[10px] font-extrabold text-teal-300 border border-teal-400/30">UG</span>
            </div>
            <p className="text-[10px] text-white/50 -mt-0.5 hidden sm:block">AI-Powered Cutoff Forecasting</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 shadow-inner">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-teal-400/15 text-teal-300 border border-teal-400/30 shadow-[0_0_12px_rgba(0,229,170,0.2)]'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.name}</span>
                {link.name === 'Predictor' && (
                  <span className="rounded bg-teal-400/20 px-1 py-0.2 text-[9px] font-black text-teal-300 border border-teal-400/30 -ml-0.5">
                    AI
                  </span>
                )}
                {typeof link.count === 'number' && link.count > 0 && (
                  <span className="rounded-full bg-amber-400/20 px-1.5 py-0.2 text-[9px] font-mono font-black text-amber-300 ml-0.5">
                    {link.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action CTAs */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/predict"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-[0_0_18px_rgba(0,229,170,0.3)] hover:brightness-110 transition-all"
          >
            <Compass className="h-3.5 w-3.5 text-slate-950" />
            <span>Predict Now</span>
          </Link>

          <Link
            href="/account"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Candidate Profile"
          >
            <User className="h-4 w-4" />
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#070710]/95 px-4 py-4 lg:hidden animate-fade-in">
          <div className="flex items-center gap-2.5 px-2 pb-3 mb-2 border-b border-white/10">
            <BrandIcon size={28} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">NEET Counselling</span>
                <span className="rounded bg-teal-400/20 px-1 py-0.2 text-[9px] font-black text-teal-300 border border-teal-400/30">UG</span>
              </div>
              <p className="text-[9px] text-white/50">AI Forecasting Engine</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl p-3 text-sm font-semibold ${
                    isActive ? 'bg-teal-400/15 text-teal-300 border border-teal-400/30' : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </div>
                  {typeof link.count === 'number' && link.count > 0 && (
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-white/10">
              <Link
                href="/predict"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full py-2.5 text-xs text-center justify-center font-bold"
              >
                Open College Predictor
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
