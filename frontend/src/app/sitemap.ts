import type { MetadataRoute } from 'next';
import { getSettings, serverFetch } from '@/lib/api';
import type { ServiceCard } from '@/lib/content';
import { siteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const settings = await getSettings();
  const [services, categories, posts] = await Promise.all([
    serverFetch<ServiceCard[]>('/services?limit=100'),
    serverFetch<{ slug: string }[]>('/categories'),
    serverFetch<{ slug: string; publishedAt?: string }[]>('/posts?limit=100'),
  ]);
  const staticPaths = ['', '/about', '/services', '/pricing', '/contact', '/blogs', '/faq', '/track-application'];
  const policyPaths = settings.policies.legallyReviewed ? ['/privacy-policy', '/terms-and-conditions', '/refund-policy', '/disclaimer'] : [];
  const entries: MetadataRoute.Sitemap = [...staticPaths, ...policyPaths].map((path) => ({
    url: `${base}${path || '/'}`,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
  for (const category of categories || []) entries.push({ url: `${base}/services/${category.slug}`, changeFrequency: 'weekly', priority: 0.6 });
  for (const service of services || []) entries.push({ url: `${base}/services/${service.categorySlug}/${service.slug}`, changeFrequency: 'weekly', priority: 0.8 });
  for (const post of posts || []) entries.push({ url: `${base}/blogs/${post.slug}`, lastModified: post.publishedAt, changeFrequency: 'monthly', priority: 0.5 });
  return entries;
}
