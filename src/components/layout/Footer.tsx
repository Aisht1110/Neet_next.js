import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink, Mail, Phone } from 'lucide-react';
import { BrandIcon } from '@/components/common/BrandIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-[#06060c] pt-14 pb-10 text-white/70 text-sm">
      <div className="container-custom">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 text-white no-underline mb-4 group">
              <BrandIcon size={38} className="group-hover:scale-105 transition-transform" />
              <div>
                <span className="font-extrabold text-lg text-white">NEET Counselling</span>
                <span className="ml-2 rounded-md bg-teal-400/15 px-1.5 py-0.5 text-[10px] font-extrabold text-teal-300 border border-teal-400/30">UG</span>
              </div>
            </Link>
            <p className="text-white/60 text-xs leading-relaxed max-w-sm mb-4">
              Comprehensive AI-assisted college predictor, choice filling optimizer, and cutoff analysis tool built on 70,000+ verified MCC allotment records from NEET 2024 & 2025.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Shield className="h-3.5 w-3.5 text-teal-400" />
              <span>Independent Counselling Analytics Portal</span>
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-wider text-teal-400">Tools & Predictor</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/predict" className="hover:text-white transition-colors">College Predictor</Link></li>
              <li><Link href="/colleges" className="hover:text-white transition-colors">700+ Medical Colleges</Link></li>
              <li><Link href="/choice-fill" className="hover:text-white transition-colors">Smart Choice Filling</Link></li>
              <li><Link href="/wishlist" className="hover:text-white transition-colors">My Saved Wishlist</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">My Profile & Quotas</Link></li>
            </ul>
          </div>

          {/* Official Resources */}
          <div>
            <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-wider text-amber-400">Official Portals</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="https://mcc.nic.in" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  <span>MCC Official Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://exams.nta.ac.in/NEET" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  <span>NTA NEET UG Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://nmc.org.in" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  <span>National Medical Commission</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li><Link href="/support" className="hover:text-white transition-colors">Counselling FAQs & Guide</Link></li>
            </ul>
          </div>

          {/* Help & Legal */}
          <div>
            <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-wider text-purple-400">Support & Legal</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/support" className="hover:text-white transition-colors">Help & Contact</Link></li>
              <li><Link href="/support#refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="/support#privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/support#terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>
            © NEET Counselling Platform. All rights reserved. Not affiliated with NTA or MCC.
          </p>
          <p className="max-w-md text-center md:text-right">
            Predictive intelligence based on historical allotment trends. Final allotments are determined solely by official MCC counselling algorithms.
          </p>
        </div>
      </div>
    </footer>
  );
};
