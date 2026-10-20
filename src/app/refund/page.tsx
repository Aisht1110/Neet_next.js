import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund and cancellation policy for NEET Counselling passes.',
  alternates: { canonical: `${SITE.url}/refund` },
};

export default function RefundPage() {
  return (
    <div className="container-narrow py-12">
      <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white mb-2 font-heading">
        Refund Policy
      </h1>
      <p className="text-xs text-slate-500 dark:text-white/50 mb-8">Last updated: January 2026</p>

      <div className="space-y-8 text-sm text-slate-700 dark:text-white/70 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">1. Digital product</h2>
          <p>
            Passes on {SITE.name} are digital products that unlock access immediately upon successful payment.
            Because access is granted instantly, refunds are limited as described below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">2. When you are eligible for a refund</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You were charged but your pass was <strong>not activated</strong> due to a technical failure on our side.</li>
            <li>You were charged twice for the same purchase (duplicate payment).</li>
            <li>An unauthorised transaction was made using your payment method.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">3. When refunds are not provided</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You changed your mind after the pass was activated.</li>
            <li>You disagree with a prediction outcome, since predictions are advisory and not a guarantee of admission.</li>
            <li>You did not use the service during the validity period.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">4. How to request a refund</h2>
          <p>
            Contact us via the <Link href="/support" className="text-teal-600 dark:text-teal-400 font-semibold">Support page</Link>{' '}
            within <strong>7 days</strong> of the transaction, including your registered email and the Razorpay
            Payment ID (beginning with <code>pay_</code>).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">5. Processing time</h2>
          <p>
            Approved refunds are processed to the original payment method within 5–7 business days. Bank or
            gateway timelines may vary.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-2">6. Cancellation</h2>
          <p>
            You may stop using the service at any time. Cancellation does not automatically trigger a refund
            unless you meet the eligibility conditions above.
          </p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/10 flex gap-4 text-xs">
        <Link href="/privacy" className="text-teal-600 dark:text-teal-400 font-semibold">Privacy Policy</Link>
        <Link href="/terms" className="text-teal-600 dark:text-teal-400 font-semibold">Terms of Service</Link>
      </div>
    </div>
  );
}
