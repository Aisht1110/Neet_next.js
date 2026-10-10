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
  metadataBase: new URL('https://neet.counsellor4u.in'),
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
    'AIQ cutoff rank',
    'NEET Counselling 2025',
    'NEET Counselling 2024',
    'State Quota cutoffs',
    'Medical college fees and bonds',
    'NEET choice filling tool',
    'counsellor4u',
    'neet counsellor4u'
  ],
  authors: [{ name: 'ASN Studios' }, { name: 'NEET Counselling Team' }],
  creator: 'ASN Studios',
  publisher: 'counsellor4u.in',
  applicationName: 'NEET Counselling AI',
  alternates: {
    canonical: 'https://neet.counsellor4u.in',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'NEET Counselling — AI College Predictor & Cutoff Intelligence',
    description: 'Forecast MBBS, BDS & AYUSH admission chances using 70,000+ verified MCC allotment records.',
    url: 'https://neet.counsellor4u.in',
    siteName: 'NEET Counselling',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://neet.counsellor4u.in/icon.png',
        width: 1024,
        height: 1024,
        alt: 'NEET Counselling AI College Predictor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEET Counselling — AI College Predictor',
    description: 'Predict NEET medical college cutoffs and round-by-round seat allotments.',
    images: ['https://neet.counsellor4u.in/icon.png'],
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
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#070710',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://neet.counsellor4u.in/#website',
      url: 'https://neet.counsellor4u.in',
      name: 'NEET Counselling — AI College Predictor',
      description: 'Forecast MBBS, BDS & AYUSH admission chances using 70,000+ verified MCC allotment records.',
      publisher: {
        '@type': 'Organization',
        name: 'ASN Studios',
        url: 'https://neet.counsellor4u.in',
        logo: {
          '@type': 'ImageObject',
          url: 'https://neet.counsellor4u.in/icon.png',
        },
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://neet.counsellor4u.in/colleges?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
      inLanguage: 'en-IN',
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://neet.counsellor4u.in/#webapp',
      name: 'NEET AI College Predictor & Counselling Intelligence',
      url: 'https://neet.counsellor4u.in',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
      featureList: [
        'AI College Predictor by NEET Rank & Score',
        '750+ Medical & Dental Colleges Cutoff Intelligence',
        'MCC Smart Choice Filling Sequencer',
        'State Quota vs AIQ Allotment Rules',
        'Service Bonds & Stipends Transparency',
      ],
    },
  ],
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
          id="neet-jsonld-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
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
            __html: `window.PAYMENT_WORKER_URL = "${process.env.NEXT_PUBLIC_PAYMENT_WORKER_URL || 'https://neet-payment-worker.upmatripathi500.workers.dev'}"; window.PAYMENT_CONFIG = { workerBaseUrl: window.PAYMENT_WORKER_URL, fallbackRazorpayKey: "${process.env.NEXT_PUBLIC_RAZORPAY_KEY || ''}" };`,
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
