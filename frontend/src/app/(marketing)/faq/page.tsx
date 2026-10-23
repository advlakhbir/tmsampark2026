import type { Metadata } from 'next';
import { serverFetch } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Frequently asked questions',
  description: 'Answers about how TMSAMPARK engagements, fees, and application tracking work.',
  path: '/faq',
});

export default async function FaqPage() {
  const faqs = await serverFetch<{ question: string; answer: string; category: string }[]>('/faqs');
  const schema = faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
      }
    : null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">Frequently asked questions</h1>
      <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {(faqs || []).map((faq) => (
          <details key={faq.question} className="px-5 py-4">
            <summary className="cursor-pointer font-medium text-navy">{faq.question}</summary>
            <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
          </details>
        ))}
      </div>
      {!faqs?.length ? <p className="mt-4 text-sm text-slate-600">FAQs appear here after they are published.</p> : null}
      {schema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /> : null}
    </div>
  );
}
