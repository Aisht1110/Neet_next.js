'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  HelpCircle, 
  FileText, 
  ShieldCheck, 
  ExternalLink, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Phone
} from 'lucide-react';
import { BrandIcon } from '@/components/common/BrandIcon';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'guide' | 'docs' | 'refund' | 'privacy'>('guide');

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider mb-2">
          <BrandIcon size={18} />
          <span>Candidate Support Center</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
          MCC Counselling Guide & Official Resources
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 mt-1 max-w-2xl">
          Everything you need to navigate MCC Round 1 to Stray Vacancy counselling, document verification, and admission policies.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-1 mb-8 overflow-x-auto">
        {[
          { id: 'guide', label: 'Counselling Process Guide', icon: HelpCircle },
          { id: 'docs', label: 'Document Checklist', icon: FileText },
          { id: 'refund', label: 'Security Deposit & Refund', icon: ShieldCheck },
          { id: 'privacy', label: 'Terms & Privacy', icon: AlertCircle },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-teal-500/15 text-teal-800 border border-teal-500/40 shadow-sm dark:bg-teal-400/20 dark:text-teal-300 dark:border-teal-400/40'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'guide' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>MCC All India Quota (15%) Counselling Flow</span>
              </h3>
              <div className="space-y-4 text-xs text-slate-700 dark:text-white/70 leading-relaxed">
                <p>
                  1. <strong className="text-slate-950 dark:text-white font-bold">Registration & Fee Payment:</strong> Candidates register on mcc.nic.in and pay the non-refundable registration fee plus the refundable security deposit.
                </p>
                <p>
                  2. <strong className="text-slate-950 dark:text-white font-bold">Choice Filling & Locking:</strong> Submit your ordered list of medical colleges. Remember to manually lock your choices before the deadline; otherwise, choices will auto-lock.
                </p>
                <p>
                  3. <strong className="text-slate-950 dark:text-white font-bold">Seat Allotment Result:</strong> MCC runs the central allotment algorithm. If allotted a seat, candidates can choose Free Exit (Round 1 only) or report to the college and opt for willingness to upgrade in Round 2.
                </p>
                <p>
                  4. <strong className="text-slate-950 dark:text-white font-bold">Subsequent Rounds:</strong> Round 2 allows fresh choices. If allotted in Round 3 or Stray Vacancy, non-joining leads to forfeiture of security deposit and debarment from NEET for 1 year.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-panel p-5">
                <h4 className="font-bold text-slate-950 dark:text-white text-sm mb-2">Free Exit Rule (Round 1)</h4>
                <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                  In Round 1, if you are allotted a college that you do not wish to join, you can simply not report to the college without losing your security deposit.
                </p>
              </div>
              <div className="glass-panel p-5">
                <h4 className="font-bold text-slate-950 dark:text-white text-sm mb-2">Upgradation Policy</h4>
                <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                  You can secure your Round 1 college by physically reporting, and still participate in Round 2. If upgraded, your earlier seat is automatically released.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="glass-panel p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Mandatory Documents for College Reporting</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                'NTA NEET UG Admit Card',
                'NTA NEET UG Scorecard / Rank Letter',
                'Provisional Allotment Letter generated online by MCC',
                'Class 10th Certificate & Marksheet (Date of Birth verification)',
                'Class 12th Certificate & Marksheet',
                'Valid Government Photo ID (Aadhaar Card / PAN / Passport)',
                '8 Passport size photographs (same as affixed on NEET application)',
                'Caste / Category Certificate (OBC-NCL / EWS issued within valid financial year)',
                'PwD Disability Certificate from designated MCC Disability Center (if applicable)',
              ].map((doc, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-800 dark:text-white/80">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="glass-panel p-6 animate-fade-in text-xs text-slate-700 dark:text-white/70 leading-relaxed space-y-4">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Security Deposit & Refund Guidelines</span>
            </h3>
            <p>
              Security deposits paid to MCC during counselling registration are strictly refunded back to the original bank account or card from which payment was made after completion of all counselling rounds.
            </p>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-300">
              <strong className="font-bold">Forfeiture Condition:</strong> If a candidate is allotted a seat in Round 2, Round 3, or Stray Vacancy and fails to join the allotted college, the refundable security deposit will be forfeited by MCC.
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="glass-panel p-6 animate-fade-in text-xs text-slate-700 dark:text-white/70 leading-relaxed space-y-4">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Terms of Use & Privacy Statement</h3>
            <p>
              This website provides educational cutoff forecasting and historical analytics for medical aspirants. Data is sourced from official Medical Counselling Committee (MCC) public records. We do not sell or share candidate data with third-party coaching institutions.
            </p>
            <p>
              Cutoffs, chance margins, and rank predictions are calculated empirically from historical datasets. Final seat allotments are subject exclusively to official MCC seat matrix publications and the MCC allotment algorithm.
            </p>
          </div>
        )}
      </div>

      {/* Official Links Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-white/50">
        <div>
          <span>Official MCC Inquiry Email: </span>
          <a href="mailto:adgme@nic.in" className="text-teal-700 dark:text-teal-300 hover:underline">adgme@nic.in</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://mcc.nic.in" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-teal-700 dark:text-teal-300 hover:underline">
            <span>mcc.nic.in</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a href="https://exams.nta.ac.in/NEET" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-teal-700 dark:text-teal-300 hover:underline">
            <span>exams.nta.ac.in</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
