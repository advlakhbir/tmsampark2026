import type { Metadata } from 'next';
import Link from 'next/link';
import { ServiceCardView } from '@/components/home/home-page';
import { serverFetch } from '@/lib/api';
import type { ServiceCard } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }): Promise<Metadata> {
  const query = await searchParams;
  return buildMetadata({
    title: query.q ? 'Search services' : 'Services',
    description: 'Browse company, tax, licence, and documentation services. Sample fees are labelled, and government charges are extra.',
    path: '/services',
    index: !query.q && !query.category,
  });
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const query = await searchParams;
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  params.set('limit', '48');
  const [services, categories] = await Promise.all([
    serverFetch<ServiceCard[]>(`/services?${params.toString()}`, 30),
    serverFetch<{ name: string; slug: string; summary: string }[]>('/categories'),
  ]);
  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">Services</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Each service is a preparation and filing engagement. Availability depends on what is published in the catalogue.</p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" action="/services">
        <label className="sr-only" htmlFor="service-q">Search services</label>
        <input id="service-q" name="q" defaultValue={query.q || ''} placeholder="Search services" className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
        <button className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white">Search</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/services" className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">All</Link>
        {(categories || []).map((category) => (
          <Link key={category.slug} href={`/services/${category.slug}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">{category.name}</Link>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(services || []).map((service) => <ServiceCardView key={service._id} service={service} />)}
      </div>
      {!services?.length ? <p className="mt-6 text-sm text-slate-600">No published services matched.</p> : null}
    </div>
  );
}
