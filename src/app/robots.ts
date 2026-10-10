import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/.env*', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/_next/static/', '/_next/image*'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/icon*.png', '/favicon*.png'],
      },
    ],
    sitemap: 'https://neet.counsellor4u.in/sitemap.xml',
    host: 'https://neet.counsellor4u.in',
  };
}
