'use client';

import { useState } from 'react';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@tmsampark/shared';
import { Button, TextField } from '@/components/ui/primitives';
import { ApiError, api } from '@/lib/api';

export function TrackForm() {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ referenceNumber: string; serviceName: string; status: OrderStatus; timeline: { status: string; note: string; at: string }[]; checklist: { label: string; status: string }[] } | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const data = await api<NonNullable<typeof result>>('/applications/track', { method: 'POST', body: JSON.stringify({ referenceNumber, email }) });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : 'Could not look up that application.');
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">Track an application</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Enter the reference number and the email on the order. This page shows status only, not documents.</p>
      <form className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5" onSubmit={onSubmit}>
        <TextField label="Reference number" value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} name="referenceNumber" />
        <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} name="email" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit">Look up</Button>
      </form>
      {result ? (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-navy">{result.referenceNumber}</h2>
          <p className="text-sm">{result.serviceName}</p>
          <p className="mt-2 text-sm font-semibold">{ORDER_STATUS_LABELS[result.status] || result.status}</p>
          <ol className="mt-4 space-y-3 text-sm">
            {result.timeline.map((item, index) => (
              <li key={`${item.at}-${index}`}><span className="font-medium">{item.status.replaceAll('_', ' ')}</span>{item.note ? ` — ${item.note}` : ''}</li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
