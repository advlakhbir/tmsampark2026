'use client';

import { useState } from 'react';
import { Notice, Panel, useResource } from '@/components/admin/resource';

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const { data, error, loading } = useResource<{
    leads: { _id: string; count: number }[];
    orders: { _id: string; count: number }[];
    revenue: { totalPaise: number; count: number }[];
    refunds: { _id: string; count: number; amountPaise: number }[];
    demand: { _id: string; count: number }[];
    workload: { _id: string; count: number }[];
  }>(`/admin/reports?${params.toString()}`);
  const qs = params.toString();
  return (
    <Panel title="Reports" action={<span className="flex gap-2 text-sm"><a className="text-royal" href={`/api/v1/admin/reports/export?kind=leads&${qs}`}>Leads CSV</a><a className="text-royal" href={`/api/v1/admin/reports/export?kind=orders&${qs}`}>Orders CSV</a><a className="text-royal" href={`/api/v1/admin/reports/export?kind=revenue&${qs}`}>Revenue CSV</a></span>}>
      <div className="mb-4 flex gap-2">
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From" className="rounded border px-2 py-1" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To" className="rounded border px-2 py-1" />
      </div>
      <Notice loading={loading} error={error} />
      {data ? (
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <section><h2 className="font-semibold">Lead status</h2><ul>{data.leads.map((row) => <li key={row._id}>{row._id}: {row.count}</li>)}</ul></section>
          <section><h2 className="font-semibold">Orders</h2><ul>{data.orders.map((row) => <li key={row._id}>{row._id}: {row.count}</li>)}</ul></section>
          <section><h2 className="font-semibold">Captured revenue (paise)</h2><ul>{data.revenue.map((row, index) => <li key={index}>{row.totalPaise} across {row.count}</li>)}</ul></section>
          <section><h2 className="font-semibold">Refunds</h2><ul>{data.refunds.map((row) => <li key={row._id}>{row._id}: {row.count}</li>)}</ul></section>
          <section><h2 className="font-semibold">Service demand</h2><ul>{data.demand.map((row) => <li key={row._id || 'none'}>{row._id || 'Unspecified'}: {row.count}</li>)}</ul></section>
          <section><h2 className="font-semibold">Workload</h2><ul>{data.workload.map((row) => <li key={String(row._id)}>{String(row._id || 'Unassigned')}: {row.count}</li>)}</ul></section>
        </div>
      ) : null}
    </Panel>
  );
}
