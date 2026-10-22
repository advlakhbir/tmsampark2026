import type { Metadata } from 'next';
import { getSettings } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

type PolicyKind = 'privacy' | 'terms' | 'refund' | 'disclaimer';

export async function policyMetadata(kind: PolicyKind, path: string): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata({
    title: kind === 'privacy' ? 'Privacy policy' : kind === 'terms' ? 'Terms and conditions' : kind === 'refund' ? 'Refund and cancellation' : 'Disclaimer',
    description: 'Policy text for TMSAMPARK. Draft pages stay out of the index until they are marked reviewed.',
    path,
    index: settings.policies.legallyReviewed,
  });
}

export async function Policy({ kind }: { kind: PolicyKind }) {
  const settings = await getSettings();
  const body = settings.policies[kind];
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {!settings.policies.legallyReviewed ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">This text is a draft for legal review. Do not treat it as the company’s final policy.</p>
      ) : null}
      <h1 className="mt-4 text-3xl font-semibold text-navy capitalize">{kind === 'refund' ? 'Refund and cancellation' : kind.replace('-', ' ')}</h1>
      <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">{body || 'Policy text has not been saved yet. Add it from the admin settings.'}</div>
    </article>
  );
}
