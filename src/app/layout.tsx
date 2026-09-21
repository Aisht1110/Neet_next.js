import type { Metadata } from 'next';
import { Inter, DM_Mono, Outfit } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ParticleCanvas } from '@/components/layout/ParticleCanvas';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NEET Counselling — AI College Predictor & Cutoff Intelligence',
  description:
    'Forecast MBBS, BDS & AYUSH admission chances using 70,000+ verified MCC allotment records from NEET 2024 & 2025. Comprehensive AIQ, State, and Category counselling strategies.',
  keywords: [
    'NEET Counselling',
    'NEET College Predictor',
    'MCC Cutoffs',
    'MBBS admission predictor',
    'AIIMS closing rank',
    'AIQ cutoff rank'
  ],
  icons: {
    icon: [
      { url: '/favicon.png', sizes: 'any' },
      { url: '/icon.png', sizes: '1024x1024', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmMono.variable} ${outfit.variable} dark`} style={{overflowX: 'hidden'}}>
      <head>
        <meta name="theme-color" content="#070710" />
      </head>
      <body className="min-h-screen bg-[#070710] text-white antialiased flex flex-col justify-between relative overflow-x-hidden">
        <ParticleCanvas />
        <div className="relative z-10 flex flex-col min-h-screen justify-between w-full overflow-x-hidden">
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
