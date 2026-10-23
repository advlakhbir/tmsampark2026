import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'About TMSAMPARK',
  description: 'TMSAMPARK is a private desk for business registrations and compliance. We publish the scope, the fee, and the status of each engagement.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">About TMSAMPARK</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">TMSAMPARK exists to make routine business filings easier to follow. Founders and small teams use the catalogue to see what a service includes, what it costs, and which documents are needed before anyone files on their behalf.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['Clarity', 'Every engagement starts with a written scope. Professional fees, tax, and government charges are separated.'],
          ['Consent', 'We file an application only after you review it and authorise the submission.'],
          ['Traceability', 'Orders receive a reference number. Status changes are stored and shown to the customer who owns them.'],
        ].map(([title, body]) => (
          <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-navy">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </article>
        ))}
      </div>
      <section className="mt-10 max-w-3xl">
        <h2 className="text-xl font-semibold text-navy">The team section</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Names, qualifications, and photographs are added by an administrator only when they are real. This installation does not invent lawyers, awards, or office addresses.</p>
      </section>
      <section className="mt-8 max-w-3xl">
        <h2 className="text-xl font-semibold text-navy">How an engagement runs</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
          <li>You choose a published service and send an enquiry.</li>
          <li>We confirm the scope and the current fee.</li>
          <li>If you proceed, an order and application reference are created.</li>
          <li>You upload the documents that were requested.</li>
          <li>You approve the draft. We then file or prepare, as the scope describes.</li>
          <li>Status updates stay on the application until it is completed, held, or closed.</li>
        </ol>
      </section>
    </div>
  );
}
