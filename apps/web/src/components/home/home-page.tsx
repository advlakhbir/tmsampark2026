import Link from 'next/link';
import { ArrowRight, Check, Search } from 'lucide-react';
import { formatInr } from '@tmsampark/shared';
import { EnquiryForm } from '@/components/forms/enquiry-form';
import { DepthCard, PlatformStage } from '@/components/animations/stage';
import { Reveal, Stagger, StaggerItem } from '@/components/animations/reveal';
import type { PublicSettings } from '@/lib/api';
import { BRAND_SLOGAN, Logo } from '@/components/brand/logo';
import { priceLabel, type ServiceCard } from '@/lib/content';

export function ServiceCardView({ service }: { service: ServiceCard }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 border-t-2 border-t-teal bg-white p-5 shadow-[0_18px_40px_rgba(16,35,63,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">{service.categoryName}</p>
      <h3 className="mt-2 text-lg font-semibold text-navy">{service.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{service.summary}</p>
      <p className="mt-4 text-sm font-medium text-navy">{priceLabel(service.startingProfessionalFeePaise, service.feeIsSample !== false)}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{service.timeline?.estimate || 'Timeline depends on documents and the authority.'}</p>
      <Link href={`/services/${service.categorySlug}/${service.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-royal">
        View details <ArrowRight size={16} />
      </Link>
    </article>
  );
}

export function HomePage({
  settings,
  services,
  posts,
  faqs,
  testimonials,
}: {
  settings: PublicSettings;
  services: ServiceCard[];
  posts: { title: string; slug: string; excerpt: string; readingTimeMinutes: number }[];
  faqs: { question: string; answer: string }[];
  testimonials: { quote: string; personName: string; personRole?: string; organization?: string }[];
}) {
  return (
    <>
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(36,87,214,0.16),transparent_55%),radial-gradient(ellipse_at_left,rgba(196,161,90,0.16),transparent_45%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-page items-center gap-8 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div>
          <Logo variant="lockup" priority />
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-navy">{BRAND_SLOGAN}</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight text-navy md:text-5xl">
            Company filings, tax work, and licences with the scope written down first.
          </h1>
          <p className="rise mt-4 max-w-xl text-base leading-7 text-slate-600">
            TMSAMPARK prepares applications for Indian businesses and tracks them after you approve the filing. We are not a government portal, and we do not start work on a hidden fee.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/services" className="rounded-lg bg-royal px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(36,87,214,0.28)]">
              Explore services
            </Link>
            <Link href="/contact" className="rounded-lg border border-navy/15 bg-white px-4 py-2.5 text-sm font-semibold text-navy">
              Talk to an expert
            </Link>
          </div>
        </div>
        <div>
          <PlatformStage />
          <form action="/services" className="relative z-10 -mt-6 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_24px_50px_rgba(16,35,63,0.12)] backdrop-blur">
          <label htmlFor="q" className="text-sm font-semibold text-navy">
            Search the catalogue
          </label>
          <div className="mt-3 flex gap-2">
            <input id="q" name="q" placeholder="GST, trademark, Udyam…" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <button className="rounded-lg bg-navy px-3 text-white" aria-label="Search services">
              <Search size={18} />
            </button>
          </div>
          <ol className="mt-5 space-y-3 text-sm">
            {['Choose a service and a written package', 'Share documents from the checklist', 'Approve the draft before anything is filed', 'Follow the reference number we issue'].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal/10 text-xs font-semibold text-teal">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </form>
        </div>
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 py-8" aria-labelledby="popular-services">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="popular-services" className="text-2xl font-semibold text-navy">Services people start with</h2>
          <Link href="/services" className="text-sm font-semibold text-royal">All services</Link>
        </div>
        {services.length ? (
          <Stagger>
            {services.map((service) => (
              <StaggerItem key={service._id}>
                <DepthCard>
                  <ServiceCardView service={service} />
                </DepthCard>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">The service catalogue is unavailable right now. It is loaded from the database after seeding.</p>
        )}
      </section>

      <section className="mx-auto grid max-w-page gap-8 px-4 py-12 md:grid-cols-2">
        <Reveal>
          <h2 className="text-2xl font-semibold text-navy">Why teams use TMSAMPARK</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {['A quote that separates professional fees, tax, and government charges', 'A checklist of documents before you pay', 'Filing only after you approve the draft', 'A reference number you can track without calling'].map((item) => (
              <li key={item} className="flex gap-2"><Check className="mt-0.5 text-teal" size={18} /> {item}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="text-2xl font-semibold text-navy">What we will not claim</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">We do not publish invented customer counts, awards, or lawyer profiles. Verified figures appear here only after an administrator records them with a source note.</p>
          {settings.verifiedMetrics.length ? (
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {settings.verifiedMetrics.map((metric) => (
                <div key={metric.label} className="rounded-xl bg-white p-4 shadow-card">
                  <dt className="text-xs text-slate-500">{metric.label}</dt>
                  <dd className="text-2xl font-semibold text-navy">{metric.value}</dd>
                  <p className="text-xs text-slate-500">{metric.sourceNote}</p>
                </div>
              ))}
            </dl>
          ) : null}
        </Reveal>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-page px-4">
          <h2 className="text-2xl font-semibold text-navy">Sample professional fees</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Figures marked sample are demonstration prices from the database. Government fees are extra. GST rate in settings is {settings.tax.gstRatePercent}% on professional fees where it applies. {settings.tax.note}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {services.slice(0, 3).map((service, index) => (
              <DepthCard key={service._id} className={index === 1 ? 'md:-translate-y-3' : ''}>
                <article className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_36px_rgba(16,35,63,0.08)]">
                  <h3 className="font-semibold text-navy">{service.name}</h3>
                  <p className="mt-3 text-2xl font-semibold text-navy">{service.startingProfessionalFeePaise != null ? formatInr(service.startingProfessionalFeePaise) : 'On request'}</p>
                  <p className="text-xs text-slate-500">Sample professional fee, excluding government charges</p>
                  <Link href="/pricing" className="mt-4 inline-block text-sm font-semibold text-royal">Compare packages</Link>
                </article>
              </DepthCard>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length ? (
        <section className="mx-auto max-w-page px-4 py-14">
          <h2 className="text-2xl font-semibold text-navy">Authorised testimonials</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {testimonials.map((item) => (
              <blockquote key={item.quote} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm leading-6">“{item.quote}”</p>
                <footer className="mt-3 text-sm font-semibold text-navy">{item.personName}{item.personRole ? `, ${item.personRole}` : ''}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-page px-4 py-8">
        <h2 className="text-2xl font-semibold text-navy">From the guides</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-navy"><Link href={`/blogs/${post.slug}`}>{post.title}</Link></h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt}</p>
              <p className="mt-3 text-xs text-slate-500">{post.readingTimeMinutes} min read</p>
            </article>
          ))}
        </div>
      </section>

      {faqs.length ? (
        <section className="mx-auto max-w-page px-4 py-8">
          <h2 className="text-2xl font-semibold text-navy">Questions</h2>
          <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {faqs.slice(0, 5).map((faq) => (
              <details key={faq.question} className="group px-5 py-4">
                <summary className="cursor-pointer font-medium text-navy">{faq.question}</summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-page gap-8 px-4 py-14 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="text-2xl font-semibold text-navy">Ask for a consultation</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Share the filing you have in mind. We will reply with what we need from you and whether we can take it on.</p>
        </div>
        <EnquiryForm source="consultation" heading="Request a call back" />
      </section>
    </>
  );
}
