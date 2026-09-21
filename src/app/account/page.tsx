'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Award, 
  Crown, 
  Zap, 
  Save, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { BrandIcon } from '@/components/common/BrandIcon';

export default function AccountPage() {
  const [name, setName] = useState('NEET Aspirant');
  const [email, setEmail] = useState('');
  const [targetScore, setTargetScore] = useState('640');
  const [targetRank, setTargetRank] = useState('15000');
  const [category, setCategory] = useState('Open');
  const [domicileState, setDomicileState] = useState('Delhi (NCT)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('neet_user_profile');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.name) setName(p.name);
        if (p.email) setEmail(p.email);
        if (p.targetScore) setTargetScore(p.targetScore);
        if (p.targetRank) setTargetRank(p.targetRank);
        if (p.category) setCategory(p.category);
        if (p.domicileState) setDomicileState(p.domicileState);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = { name, email, targetScore, targetRank, category, domicileState };
    localStorage.setItem('neet_user_profile', JSON.stringify(profile));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-teal-400 font-bold uppercase tracking-wider mb-2">
          <BrandIcon size={18} />
          <span>Candidate Dashboard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Candidate Profile & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-white/60 mt-1">
          Configure your category eligibility, target scores, and counselling notification alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Plan & Status */}
        <div className="space-y-6">
          {/* Plan Status Card */}
          <div className="glass-panel p-5 border border-amber-400/30 bg-amber-400/[0.03]">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
              <Crown className="h-4 w-4 text-amber-400" />
              <span>Membership Tier</span>
            </div>
            <h3 className="text-lg font-black text-white mb-1">Standard Access</h3>
            <p className="text-xs text-white/60 mb-4 leading-relaxed">
              Full access to AI forecasting models, historical cutoff comparisons, and choice order sequencers.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs mb-4">
              <div className="flex items-center justify-between text-white/70 mb-1">
                <span>Free Prediction Quota</span>
                <span className="font-bold text-teal-300">Unlimited</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full w-full" />
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="glass-panel p-5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Navigation</h4>
            <div className="space-y-2 text-xs">
              <Link href="/predict" className="block p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors">
                ⚡ Open College Predictor
              </Link>
              <Link href="/choice-fill" className="block p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors">
                📋 View Choice Sequence
              </Link>
              <Link href="/wishlist" className="block p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors">
                ❤️ My Shortlisted Colleges
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="glass-panel p-6 sm:p-7 space-y-5">
            <h3 className="text-base font-bold text-white pb-3 border-b border-white/10 flex items-center justify-between">
              <span>Candidate Admission Parameters</span>
              {savedSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Preferences Saved!</span>
                </span>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Candidate Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Your Full Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field text-sm"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Target NEET AIR</label>
                <input
                  type="number"
                  value={targetRank}
                  onChange={(e) => setTargetRank(e.target.value)}
                  className="input-field mono-font text-sm"
                  placeholder="e.g. 15000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Target NEET Score</label>
                <input
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  className="input-field mono-font text-sm"
                  placeholder="e.g. 640"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Counselling Category</label>
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
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Home Domicile State</label>
                <input
                  type="text"
                  value={domicileState}
                  onChange={(e) => setDomicileState(e.target.value)}
                  className="input-field text-sm"
                  placeholder="e.g. Delhi (NCT), Maharashtra"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="submit"
                className="btn-primary py-2.5 px-6 text-xs flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Profile Preferences</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
