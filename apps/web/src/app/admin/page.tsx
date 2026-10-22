'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatInr, LEAD_STATUS_LABELS, ORDER_STATUS_LABELS } from '@tmsampark/shared';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Notice, Panel } from '@/components/admin/resource';
import { useResource } from '@/components/admin/resource';

type Dashboard = {
  leadTotal: number;
  newLeads: number;
  leadsByStatus: Record<string, number>;
  orderTotal: number;
  ordersByStatus: Record<string, number>;
  capturedRevenuePaise: number;
  recentLeads: { _id: string; name: string; email: string; status: string; serviceName?: string }[];
  recentOrders: { _id: string; referenceNumber: string; serviceName: string; status: string; totalPaise: number }[];
  note: string;
};

export default function AdminHome() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  const { data, error, loading } = useResource<Dashboard>(`/admin/dashboard?${query.toString()}`);
  const funnel = Object.entries(data?.leadsByStatus || {}).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-4">
      <Panel title="Overview" action={
        <div className="flex gap-2 text-sm">
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From" className="rounded border px-2 py-1" />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To" className="rounded border px-2 py-1" />
        </div>
      }>
        <Notice loading={loading} error={error} />
        {data ? (
          <>
            <p className="text-xs text-slate-500">{data.note}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Leads', data.leadTotal],
                ['New leads', data.newLeads],
                ['Orders', data.orderTotal],
                ['Captured payments', formatInr(data.capturedRevenuePaise)],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-paper p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-navy">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel}>
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Bar dataKey="count" fill="#2457D6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <h2 className="font-semibold text-navy">Recent enquiries</h2>
                <ul className="mt-2 space-y-2 text-sm">{data.recentLeads.map((lead) => <li key={lead._id}><Link className="font-medium text-royal" href={`/admin/leads/${lead._id}`}>{lead.name}</Link> · {LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS] || lead.status}</li>)}</ul>
              </div>
              <div>
                <h2 className="font-semibold text-navy">Recent orders</h2>
                <ul className="mt-2 space-y-2 text-sm">{data.recentOrders.map((order) => <li key={order._id}><Link className="font-medium text-royal" href={`/admin/orders/${order._id}`}>{order.referenceNumber}</Link> · {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}</li>)}</ul>
              </div>
            </div>
          </>
        ) : null}
      </Panel>
    </div>
  );
}
