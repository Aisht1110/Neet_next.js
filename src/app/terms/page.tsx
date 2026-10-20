import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the NEET Counselling predictor and passes.',
  alternates: { canonical: `${SITE.url}/terms` },
};

export default function TermsPage() {
  return (
    <div className="container-narrow py-12">
      <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white mb-2 font-heading">
        Terms of Service
      </h1>
      <p className="text-xs text-slate-500 dark:text-white/50 mb-8">Last updated: January 2026</p>

      <div className="space-y-8 text-sm text-slate-700 dark:text-white/70 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">1. Scope of service</h2>
          <p>
            {SITE.name} provides educational forecasting tools based on historical MCC allotment data.
            By using the service you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">2. No guarantee of admission</h2>
          <p>
            All predictions, cutoff estimates, chance probabilities and strategy suggestions are
            <strong> informational only</strong>. Final seat allotment is determined solely by the official MCC
            counselling algorithm and seat matrix. We make no guarantee of admission to any institution.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">3. Independence</h2>
          <p>
            This is an independent portal operated by {SITE.studio}. It is not affiliated with, endorsed by, or
            connected to NTA, MCC, the National Medical Commission or any government authority.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">4. Passes & access</h2>
          <p>
            Paid passes (Basic and Season) grant access to features for the stated validity period.
            Access is tied to the account that purchased the pass and may not be shared, resold or transferred.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">5. Acceptable use</h2>
          <p>
            You agree not to scrape, resell, reverse-engineer, or abuse the service, and not to attempt to
            circumvent access controls or obtain paid features without payment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">6. Payments</h2>
          <p>
            Payments are processed by Razorpay. Amounts, discounts and plan details are shown before checkout.
            Refunds are governed by our <Link href="/refund" className="text-teal-600 dark:text-teal-400 font-semibold">Refund Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">7. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, {SITE.studio} shall not be liable for any decision made in
            reliance on the service, nor for any indirect or consequential loss arising from its use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">8. Changes</h2>
          <p>
            We may update these terms from time to time. Continued use of the service constitutes acceptance of
            the revised terms.
          </p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/10 flex gap-4 text-xs">
        <Link href="/privacy" className="text-teal-600 dark:text-teal-400 font-semibold">Privacy Policy</Link>
        <Link href="/refund" className="text-teal-600 dark:text-teal-400 font-semibold">Refund Policy</Link>
      </div>
    </div>
  );
}
