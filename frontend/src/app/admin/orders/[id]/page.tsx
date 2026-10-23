'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from '@tmsampark/shared';
import { Notice, Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

type Payload = {
  order: { _id: string; referenceNumber: string; serviceName: string; status: OrderStatus; packageName: string; totalPaise: number };
  application: { checklist: { _id: string; label: string; status: string }[]; timeline: { status: string; note: string; visibleToCustomer: boolean }[] } | null;
  documents: { _id: string; originalName: string; status: string }[];
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, error, loading, reload } = useResource<Payload>(`/admin/orders/${params.id}`);
  const [status, setStatus] = useState<OrderStatus>('under_review');
  const [note, setNote] = useState('');

  async function update() {
    await api(`/admin/orders/${params.id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note, customerVisible: true }) });
    setNote('');
    await reload();
  }

  return (
    <Panel title={data?.order.referenceNumber || 'Order'}>
      <Notice loading={loading} error={error} />
      {data ? (
        <div className="space-y-4 text-sm">
          <p>{data.order.serviceName} · {data.order.packageName} · {ORDER_STATUS_LABELS[data.order.status]}</p>
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)} className="rounded border px-2 py-2" aria-label="New status">
              {ORDER_STATUSES.map((item) => <option key={item} value={item}>{ORDER_STATUS_LABELS[item]}</option>)}
            </select>
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note for the customer" className="min-w-64 rounded border px-2 py-2" />
            <button className="rounded-lg bg-royal px-3 py-2 text-white" onClick={() => void update()}>Update status</button>
          </div>
          <h2 className="font-semibold text-navy">Checklist</h2>
          <ul>{data.application?.checklist.map((item) => <li key={item._id}>{item.label} — {item.status}</li>)}</ul>
          <h2 className="font-semibold text-navy">Documents</h2>
          <ul>{data.documents.map((doc) => <li key={doc._id}><a className="text-royal" href={`/api/v1/admin/documents/${doc._id}/download`}>{doc.originalName}</a> · {doc.status}</li>)}</ul>
        </div>
      ) : null}
    </Panel>
  );
}
