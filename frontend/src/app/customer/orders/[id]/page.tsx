'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@tmsampark/shared';
import { useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

type Payload = {
  order: { referenceNumber: string; serviceName: string; status: OrderStatus; packageName: string };
  application: { timeline: { status: string; note: string; at: string }[]; checklist: { _id: string; label: string; status: string }[] } | null;
  invoices: { _id: string; number: string; totalPaise: number }[];
};

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const { data, error, loading, reload } = useResource<Payload>(`/customer/orders/${params.id}`);
  const [item, setItem] = useState('');
  const [message, setMessage] = useState('');

  async function upload(file: File) {
    const body = new FormData();
    body.set('file', file);
    body.set('label', file.name);
    if (item) body.set('checklistItemId', item);
    await api(`/customer/orders/${params.id}/documents`, { method: 'POST', body });
    setMessage('Document received. It is stored privately.');
    await reload();
  }

  if (loading) return <div className="h-24 animate-pulse rounded bg-slate-100" />;
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return null;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-navy">{data.order.referenceNumber}</h1>
      <p className="text-sm">{data.order.serviceName} · {data.order.packageName}</p>
      <p className="text-sm font-semibold">{ORDER_STATUS_LABELS[data.order.status]}</p>
      <ol className="space-y-2 text-sm">{data.application?.timeline.map((entry, index) => <li key={index} className="rounded-lg bg-white p-3">{entry.status.replaceAll('_', ' ')}{entry.note ? ` — ${entry.note}` : ''}</li>)}</ol>
      <h2 className="font-semibold">Requested documents</h2>
      <ul className="text-sm">{data.application?.checklist.map((row) => <li key={row._id}>{row.label} — {row.status}</li>)}</ul>
      <label className="block text-sm">Checklist item
        <select className="mt-1 w-full max-w-md rounded border px-2 py-2" value={item} onChange={(event) => setItem(event.target.value)}>
          <option value="">Not linked</option>
          {data.application?.checklist.map((row) => <option key={row._id} value={row._id}>{row.label}</option>)}
        </select>
      </label>
      <label className="block text-sm">Upload PDF, JPG, PNG, WEBP, or DOCX
        <input className="mt-1 block" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
      </label>
      {message ? <p className="text-sm text-teal">{message}</p> : null}
      <h2 className="font-semibold">Invoices</h2>
      <ul className="text-sm">{data.invoices.map((invoice) => <li key={invoice._id}>{invoice.number}</li>)}</ul>
    </div>
  );
}
