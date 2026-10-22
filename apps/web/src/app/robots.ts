import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/customer', '/login', '/register', '/reset-password', '/api'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
