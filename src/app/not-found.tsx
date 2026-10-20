import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="container-custom py-20 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl font-black text-teal-600 dark:text-teal-400 mono-font mb-4">404</div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Page not found
        </h1>
        <p className="text-sm text-slate-600 dark:text-white/60 mb-6">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary px-6 py-3 text-sm font-bold">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
