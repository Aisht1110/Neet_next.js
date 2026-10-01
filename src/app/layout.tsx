import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter, DM_Mono, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { AuthProvider } from '@/lib/firebase/AuthContext';
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
  metadataBase: new URL('https://neetcounsellor.online'),
  title: {
    default: 'NEET Counselling — AI College Predictor & Cutoff Intelligence',
    template: '%s | NEET Counselling'
  },
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
  alternates: {
    canonical: 'https://neetcounsellor.online',
  },
  openGraph: {
    title: 'NEET Counselling — AI College Predictor & Cutoff Intelligence',
    description: 'Forecast MBBS, BDS & AYUSH admission chances using 70,000+ verified MCC allotment records.',
    url: 'https://neetcounsellor.online',
    siteName: 'NEET Counselling',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEET Counselling — AI College Predictor',
    description: 'Predict NEET medical college cutoffs and round-by-round seat allotments.',
  },
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

export const viewport: Viewport = {
  themeColor: '#070710',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${dmMono.variable} ${outfit.variable}`} 
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased flex flex-col justify-between transition-colors">
        <Script
          id="neet-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('neet_theme')||'dark';document.documentElement.setAttribute('data-theme',t);if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}else{document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <Script
          src="/js/firebase-config.js"
          strategy="beforeInteractive"
        />
        <Script
          id="neet-payment-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.PAYMENT_WORKER_URL = "${process.env.NEXT_PUBLIC_PAYMENT_WORKER_URL || 'https://neet-payment-worker.upmatripathi500.workers.dev'}"; window.PAYMENT_CONFIG = { workerBaseUrl: window.PAYMENT_WORKER_URL, fallbackRazorpayKey: "${process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_SP68tZHdB0UVLX'}" };`,
          }}
        />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <ThemeProvider>
          <AuthProvider>
            <ParticleCanvas />
            <div className="relative z-10 flex flex-col min-h-screen justify-between w-full overflow-x-hidden">
              <Navbar />
              <main className="flex-1 w-full">{children}</main>
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
