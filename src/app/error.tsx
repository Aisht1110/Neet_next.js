'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="container-custom py-20 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-slate-600 dark:text-white/60 mb-6">
          An unexpected error occurred while loading this page. You can try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="btn-primary px-6 py-3 text-sm font-bold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
