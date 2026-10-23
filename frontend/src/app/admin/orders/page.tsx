'use client';

import Link from 'next/link';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@tmsampark/shared';
import { Notice, Panel, useResource } from '@/components/admin/resource';

type Order = { _id: string; referenceNumber: string; serviceName: string; status: OrderStatus; totalPaise: number; createdAt: string };

export default function OrdersPage() {
  const { data, error, loading } = useResource<Order[]>('/admin/orders');
  return (
    <Panel title="Orders">
      <Notice loading={loading} error={error} empty={!loading && !data?.length ? 'No orders yet.' : ''} />
      <table className="w-full text-left text-sm">
        <thead><tr className="text-slate-500"><th className="py-2">Reference</th><th>Service</th><th>Status</th></tr></thead>
        <tbody>
          {(data || []).map((order) => (
            <tr key={order._id} className="border-t">
              <td className="py-3"><Link className="font-semibold text-royal" href={`/admin/orders/${order._id}`}>{order.referenceNumber}</Link></td>
              <td>{order.serviceName}</td>
              <td>{ORDER_STATUS_LABELS[order.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
