import type { Metadata } from 'next';
import Link from 'next/link';
import { formatInr } from '@tmsampark/shared';
import { getSettings, serverFetch } from '@/lib/api';
import type { ServiceCard } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Pricing',
  description: 'Professional fees are listed separately from government charges and tax. Sample fees are labelled until you replace them.',
  path: '/pricing',
});

export default async function PricingPage() {
  const [settings, services] = await Promise.all([getSettings(), serverFetch<ServiceCard[]>('/services?limit=48')]);
  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">Pricing</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">A package price is the professional fee for the scope listed. Government fees, stamp duty, and third-party charges are extra unless the package says they are included. GST on professional fees is {settings.tax.gstRatePercent}% where it applies. {settings.tax.note}</p>
      <div className="mt-8 space-y-6">
        {(services || []).map((service) => (
          <section key={service._id} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-navy"><Link href={`/services/${service.categorySlug}/${service.slug}`}>{service.name}</Link></h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(service.packages || []).map((pack) => (
                <article key={pack._id} className="rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold">{pack.name}</h3>
                  <p className="mt-2 text-2xl font-semibold text-navy">{formatInr(pack.professionalFeePaise)}</p>
                  <p className="text-xs text-slate-500">{pack.feeIsSample ? 'Sample professional fee' : 'Professional fee'}</p>
                  <p className="mt-2 text-sm text-slate-600">{pack.governmentFeeNote}</p>
                  <p className="mt-2 text-sm">Included: {(pack.included || []).join(', ') || 'See the service page'}</p>
                  <p className="text-sm text-slate-500">Not included: {(pack.excluded || []).join(', ') || 'Items outside the written scope'}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm">Read the <Link className="font-semibold text-royal" href="/refund-policy">refund and cancellation policy</Link> before you pay. It is a draft until it is marked reviewed.</p>
    </div>
  );
}
