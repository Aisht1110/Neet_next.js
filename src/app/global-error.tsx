'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#070710',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              Application error
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
              A critical error occurred. Please reload the page.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '0.8rem 1.6rem',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #00e5aa, #00b4d8)',
                color: '#050b14',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
