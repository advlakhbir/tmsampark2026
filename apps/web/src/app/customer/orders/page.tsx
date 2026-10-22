'use client';

import Link from 'next/link';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@tmsampark/shared';
import { useResource } from '@/components/admin/resource';

export default function OrdersPage() {
  const { data, loading } = useResource<{ _id: string; referenceNumber: string; serviceName: string; status: OrderStatus }[]>('/customer/orders');
  if (loading) return <div className="h-24 animate-pulse rounded bg-slate-100" />;
  return (
    <ul className="space-y-2 text-sm">
      {(data || []).map((order) => <li key={order._id} className="rounded-xl border bg-white p-4"><Link className="font-semibold text-royal" href={`/customer/orders/${order._id}`}>{order.referenceNumber}</Link><p>{order.serviceName} · {ORDER_STATUS_LABELS[order.status]}</p></li>)}
    </ul>
  );
}
