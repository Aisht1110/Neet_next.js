import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink, Mail, Phone } from 'lucide-react';
import { BrandIcon } from '@/components/common/BrandIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#06060c] pt-14 pb-10 text-slate-600 dark:text-white/70 text-sm transition-colors">
      <div className="container-custom">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 no-underline mb-4 group">
              <BrandIcon size={38} className="group-hover:scale-105 transition-transform" />
              <div>
                <span className="font-extrabold text-lg text-slate-900 dark:text-white">NEET Counselling</span>
                <span className="ml-2 rounded-md bg-teal-400/15 px-1.5 py-0.5 text-[10px] font-extrabold text-teal-600 dark:text-teal-300 border border-teal-400/30">UG</span>
                <div className="text-[11px] font-semibold tracking-wide text-teal-600/90 dark:text-teal-400/90 mt-0.5">
                  by ASN Studios
                </div>
              </div>
            </Link>
            <p className="text-slate-500 dark:text-white/60 text-xs leading-relaxed max-w-sm mb-4">
              Comprehensive AI-assisted college predictor, choice filling optimizer, and cutoff analysis tool built on 70,000+ verified MCC allotment records from NEET 2024 &amp; 2025.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-white/50">
              <Shield className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
              <span>Independent Counselling Analytics Portal · ASN Studios</span>
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <h4 className="font-bold text-teal-600 dark:text-teal-400 mb-4 text-xs uppercase tracking-wider">Tools &amp; Predictor</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/predict" className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">College Predictor</Link></li>
              <li><Link href="/colleges" className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">700+ Medical Colleges</Link></li>
              <li><Link href="/choice-fill" className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">Smart Choice Filling</Link></li>
              <li><Link href="/wishlist" className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">My Saved Wishlist</Link></li>
              <li><Link href="/account" className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">My Profile &amp; Quotas</Link></li>
            </ul>
          </div>

          {/* Official Resources */}
          <div>
            <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-4 text-xs uppercase tracking-wider">Official Portals</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="https://mcc.nic.in" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">
                  <span>MCC Official Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://exams.nta.ac.in/NEET" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">
                  <span>NTA NEET UG Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://nmc.org.in" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">
                  <span>National Medical Commission</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li><Link href="/support" className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">Counselling FAQs &amp; Guide</Link></li>
            </ul>
          </div>

          {/* Help & Legal */}
          <div>
            <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-4 text-xs uppercase tracking-wider">Support &amp; Legal</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/support" className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">Help &amp; Contact</Link></li>
              <li><Link href="/support#refund" className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="/support#privacy" className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/support#terms" className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-white/40">
          <p>
            &copy; {new Date().getFullYear()} NEET Counselling. An <span className="font-bold text-slate-700 dark:text-white/90">ASN Studios</span> Application. All rights reserved. Not affiliated with NTA or MCC.
          </p>
          <p className="max-w-md text-center md:text-right">
            Predictive intelligence based on historical allotment trends. Final allotments are determined solely by official MCC counselling algorithms.
          </p>
        </div>
      </div>
    </footer>
  );
};
