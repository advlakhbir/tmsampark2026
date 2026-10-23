'use client';

import { useState } from 'react';
import { formatInr } from '@tmsampark/shared';
import { Notice, Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

type Payment = { _id: string; provider: string; amountPaise: number; status: string; providerPaymentId?: string; createdAt: string };
type Refund = { _id: string; amountPaise: number; status: string; reason: string };

export default function PaymentsPage() {
  const { data, error, loading, reload } = useResource<{ payments: Payment[]; refunds: Refund[] }>('/admin/payments');
  const [orderId, setOrderId] = useState('');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');

  async function record() {
    setMessage('');
    await api('/admin/payments/manual', { method: 'POST', body: JSON.stringify({ orderId, reference }) });
    setMessage('Payment recorded after server-side capture.');
    await reload();
  }

  return (
    <Panel title="Payments">
      <Notice loading={loading} error={error} />
      <p className="mb-3 text-xs text-slate-500">Manual records are for transfers you have already reconciled. Card numbers are never stored.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order id" className="rounded border px-2 py-2 text-sm" aria-label="Order id" />
        <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Bank reference" className="rounded border px-2 py-2 text-sm" aria-label="Reference" />
        <button className="rounded-lg bg-navy px-3 py-2 text-sm text-white" onClick={() => void record()}>Record captured payment</button>
      </div>
      {message ? <p className="mb-3 text-sm text-teal">{message}</p> : null}
      <table className="w-full text-left text-sm">
        <thead><tr className="text-slate-500"><th className="py-2">Provider</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>{(data?.payments || []).map((payment) => <tr key={payment._id} className="border-t"><td className="py-2">{payment.provider}</td><td>{formatInr(payment.amountPaise)}</td><td>{payment.status}</td></tr>)}</tbody>
      </table>
      <h2 className="mt-6 font-semibold">Refund requests</h2>
      <ul className="text-sm">{(data?.refunds || []).map((refund) => <li key={refund._id}>{formatInr(refund.amountPaise)} · {refund.status} · {refund.reason}</li>)}</ul>
    </Panel>
  );
}
