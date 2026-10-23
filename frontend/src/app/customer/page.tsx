'use client';

import Link from 'next/link';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@tmsampark/shared';
import { useResource } from '@/components/admin/resource';

export default function CustomerHome() {
  const orders = useResource<{ _id: string; referenceNumber: string; serviceName: string; status: OrderStatus }[]>('/customer/orders');
  const notes = useResource<{ _id: string; title: string; body: string; readAt?: string }[]>('/customer/notifications');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">Your applications</h1>
      <ul className="space-y-2 text-sm">
        {(orders.data || []).map((order) => (
          <li key={order._id} className="rounded-xl border bg-white p-4">
            <Link className="font-semibold text-royal" href={`/customer/orders/${order._id}`}>{order.referenceNumber}</Link>
            <p>{order.serviceName}</p>
            <p>{ORDER_STATUS_LABELS[order.status]}</p>
          </li>
        ))}
      </ul>
      {!orders.loading && !orders.data?.length ? <p className="text-sm text-slate-600">When an order is opened for your email, it appears here.</p> : null}
      <h2 className="text-lg font-semibold text-navy">Notifications</h2>
      <ul className="text-sm">{(notes.data || []).slice(0, 5).map((note) => <li key={note._id}>{note.title}</li>)}</ul>
    </div>
  );
}
