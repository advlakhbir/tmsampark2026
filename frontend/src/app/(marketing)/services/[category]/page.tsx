import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ServiceCardView } from '@/components/home/home-page';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { serverFetch } from '@/lib/api';
import type { ServiceCard } from '@/lib/content';
import { buildMetadata, siteUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const data = await serverFetch<{ category: { name: string; summary: string; seo?: { title?: string; description?: string; index?: boolean } }; services: ServiceCard[] }>(`/categories/${category}`);
  if (!data) return buildMetadata({ title: 'Category', description: 'Service category', path: `/services/${category}`, index: false });
  return buildMetadata({
    title: data.category.seo?.title || data.category.name,
    description: data.category.seo?.description || data.category.summary,
    path: `/services/${category}`,
    index: data.category.seo?.index !== false,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const data = await serverFetch<{ category: { name: string; slug: string; summary: string; description: string }; services: ServiceCard[] }>(`/categories/${category}`);
  if (!data) notFound();
  const services = data.services.map((service) => ({ ...service, categorySlug: data.category.slug, categoryName: data.category.name }));
  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/services', label: 'Services' }, { label: data.category.name }]} />
      <h1 className="mt-4 text-3xl font-semibold text-navy">{data.category.name}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{data.category.description || data.category.summary}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {services.map((service) => <ServiceCardView key={service._id} service={service} />)}
      </div>
      <p className="sr-only">{siteUrl()}</p>
    </div>
  );
}
