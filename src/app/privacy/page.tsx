import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, STATS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How NEET Counselling collects, uses and protects your personal data.',
  alternates: { canonical: `${SITE.url}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="container-narrow py-12">
      <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white mb-2 font-heading">
        Privacy Policy
      </h1>
      <p className="text-xs text-slate-500 dark:text-white/50 mb-8">Last updated: January 2026</p>

      <div className="space-y-8 text-sm text-slate-700 dark:text-white/70 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">1. Who we are</h2>
          <p>
            {SITE.name} ({SITE.domain}) is an independent educational analytics service operated by {SITE.studio}.
            We are not affiliated with the National Testing Agency (NTA), the Medical Counselling Committee (MCC),
            or any government body.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">2. Information we collect</h2>
          <p>When you create an account or use the predictor, we may collect:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Account details: name, email address, and (for Google sign-in) your Google profile basics.</li>
            <li>Academic inputs: your NEET rank, score, category and state, which you enter to run predictions.</li>
            <li>Usage data: prediction counts and saved colleges/wishlists associated with your account.</li>
            <li>Payment data: order and payment identifiers returned by our payment gateway (Razorpay). We never store your card, UPI or bank details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">3. How we use it</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To run college-cutoff predictions and save your preferences.</li>
            <li>To process payments and activate your pass.</li>
            <li>To provide support and improve the accuracy and usability of the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">4. What we do NOT do</h2>
          <p>
            We do <strong>not</strong> sell, rent or share your personal data with coaching institutes, private
            colleges or third-party marketers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">5. Third-party services</h2>
          <p>
            We use Google Firebase for authentication and data storage, and Razorpay for payment processing.
            Their handling of data is governed by their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">6. Data retention & deletion</h2>
          <p>
            You may request deletion of your account and associated data at any time by contacting us.
            Payment records may be retained as required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">7. Data source</h2>
          <p>
            Cutoff and allotment data is compiled from publicly available official MCC records ({STATS.allotments}{' '}
            allotments across {STATS.dataYears}). It does not contain any personal information about candidates.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">8. Contact</h2>
          <p>
            For privacy questions, reach us via the <Link href="/support" className="text-teal-600 dark:text-teal-400 font-semibold">Support page</Link>.
          </p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/10 flex gap-4 text-xs">
        <Link href="/terms" className="text-teal-600 dark:text-teal-400 font-semibold">Terms of Service</Link>
        <Link href="/refund" className="text-teal-600 dark:text-teal-400 font-semibold">Refund Policy</Link>
      </div>
    </div>
  );
}
