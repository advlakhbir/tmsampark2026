import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EnquiryForm } from '@/components/forms/enquiry-form';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { serverFetch } from '@/lib/api';
import { priceLabel, type ServiceDetail } from '@/lib/content';
import { buildMetadata, siteUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ category: string; service: string }> }): Promise<Metadata> {
  const { category, service } = await params;
  const data = await serverFetch<ServiceDetail>(`/services/${category}/${service}`);
  if (!data) return buildMetadata({ title: 'Service', description: 'Service detail', path: `/services/${category}/${service}`, index: false });
  return buildMetadata({
    title: data.seo?.title || data.name,
    description: data.seo?.description || data.summary,
    path: `/services/${category}/${service}`,
    canonical: data.seo?.canonical || undefined,
    index: data.seo?.index !== false,
  });
}

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-navy">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

export default async function ServicePage({ params }: { params: Promise<{ category: string; service: string }> }) {
  const { category, service: slug } = await params;
  const service = await serverFetch<ServiceDetail>(`/services/${category}/${slug}`);
  if (!service) notFound();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.summary,
    provider: { '@type': 'Organization', name: 'TMSAMPARK', url: siteUrl() },
    url: `${siteUrl()}/services/${category}/${slug}`,
  };
  const faqSchema = service.faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: service.faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
      }
    : null;

  return (
    <div className="mx-auto grid max-w-page gap-10 px-4 py-10 lg:grid-cols-[1.4fr_0.8fr]">
      <article>
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/services', label: 'Services' }, { href: `/services/${service.category.slug}`, label: service.category.name }, { label: service.name }]} />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy md:text-4xl">{service.name}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{service.summary}</p>
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{service.disclaimer}</p>
        <div className="prose mt-6 max-w-none whitespace-pre-wrap text-sm leading-7 text-slate-700">{service.overview}</div>
        <List title="Who usually asks for this" items={service.whoNeeds} />
        <List title="What you can expect from us" items={service.benefits} />
        <List title="Eligibility notes" items={service.eligibility} />
        <List title="Requirements" items={service.requirements} />
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-navy">Documents commonly requested</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {service.documents?.map((doc) => (
              <li key={doc.name} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <span className="font-medium text-navy">{doc.name}</span>
                {doc.mandatory ? <span className="ml-2 text-xs text-slate-500">Usually required</span> : null}
                {doc.description ? <p className="text-slate-600">{doc.description}</p> : null}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-navy">Process</h2>
          <ol className="mt-3 space-y-3">
            {service.process?.map((step, index) => (
              <li key={step.title} className="rounded-lg bg-white p-4 shadow-card">
                <p className="text-xs font-semibold text-teal">Step {index + 1}</p>
                <h3 className="font-semibold text-navy">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>
        <List title="Deliverables" items={service.deliverables} />
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-navy">Packages</h2>
          <p className="mt-2 text-sm text-slate-600">Professional fees are for our work. Government fees and stamp duty are extra unless a package says they are included. <Link className="font-semibold text-royal" href="/refund-policy">Refund policy</Link></p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(service.packages || []).map((pack) => (
              <article key={pack._id} className={`rounded-xl border bg-white p-5 ${pack.highlighted ? 'border-teal' : 'border-slate-200'}`}>
                <h3 className="font-semibold text-navy">{pack.name}</h3>
                <p className="mt-2 text-2xl font-semibold text-navy">{priceLabel(pack.professionalFeePaise, pack.feeIsSample)}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{pack.governmentFeeNote}</p>
                <ul className="mt-3 list-disc pl-4 text-sm text-slate-700">{pack.included?.map((item) => <li key={item}>{item}</li>)}</ul>
                {pack.excluded?.length ? <p className="mt-3 text-xs text-slate-500">Not included: {pack.excluded.join(', ')}</p> : null}
              </article>
            ))}
          </div>
        </section>
        {service.addOns?.length ? (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-navy">Optional add-ons</h2>
            <ul className="mt-3 space-y-2 text-sm">{service.addOns.map((item) => <li key={item.name}>{item.name} — {priceLabel(item.pricePaise, service.feeIsSample)}</li>)}</ul>
          </section>
        ) : null}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-navy">Timing</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{service.timeline?.estimate}</p>
          <p className="mt-2 text-sm text-slate-500">Depends on: {service.timeline?.dependencies?.join(', ')}</p>
        </section>
        {service.faqs?.length ? (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-navy">Questions about this service</h2>
            <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {service.faqs.map((faq) => (
                <details key={faq.question} className="px-4 py-3">
                  <summary className="cursor-pointer font-medium text-navy">{faq.question}</summary>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
        {service.related?.length ? (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-navy">Related services</h2>
            <ul className="mt-3 space-y-2 text-sm">{service.related.map((item) => <li key={item.slug}><Link className="font-semibold text-royal" href={`/services/${item.categorySlug}/${item.slug}`}>{item.name}</Link></li>)}</ul>
          </section>
        ) : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
      </article>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <EnquiryForm source="apply_now" serviceSlug={service.slug} heading="Apply now" />
        <p className="mt-3 text-xs leading-5 text-slate-500">Apply now sends an enquiry. An application reference is created when an order is opened.</p>
      </aside>
    </div>
  );
}
