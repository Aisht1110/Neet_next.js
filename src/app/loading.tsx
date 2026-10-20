import React from 'react';

export default function Loading() {
  return (
    <div className="container-custom py-24 flex flex-col items-center justify-center text-center">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-white/10 border-t-teal-500 animate-spin mb-4" />
      <p className="text-sm font-semibold text-slate-500 dark:text-white/50">Loading…</p>
    </div>
  );
}
