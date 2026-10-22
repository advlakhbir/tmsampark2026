import type { Metadata } from 'next';
import { HomePage } from '@/components/home/home-page';
import { getSettings, serverFetch } from '@/lib/api';
import type { ServiceCard } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata({
    title: 'Business filings with a written scope',
    description: settings.seo.defaultDescription,
    path: '/',
  });
}

export default async function Page() {
  const [settings, services, posts, faqs, testimonials] = await Promise.all([
    getSettings(),
    serverFetch<{ data?: ServiceCard[] } & ServiceCard[]>('/services?featured=true&limit=6'),
    serverFetch<{ title: string; slug: string; excerpt: string; readingTimeMinutes: number }[]>('/posts?limit=3'),
    serverFetch<{ question: string; answer: string }[]>('/faqs?placement=home'),
    serverFetch<{ quote: string; personName: string; personRole?: string; organization?: string }[]>('/testimonials'),
  ]);
  const list = Array.isArray(services) ? services : [];
  return <HomePage settings={settings} services={list} posts={posts || []} faqs={faqs || []} testimonials={testimonials || []} />;
}
