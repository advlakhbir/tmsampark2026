'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LEAD_STATUS_LABELS } from '@tmsampark/shared';
import { Notice, Panel, useResource } from '@/components/admin/resource';

type Lead = { _id: string; name: string; email: string; phone: string; status: keyof typeof LEAD_STATUS_LABELS; source: string; serviceName?: string; createdAt: string };

export default function LeadsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (status) params.set('status', status);
  const { data, error, loading } = useResource<{ data?: Lead[] } | Lead[]>(`/admin/leads?${params.toString()}`);
  const leads = Array.isArray(data) ? data : [];
  return (
    <Panel title="Leads" action={<a className="text-sm font-semibold text-royal" href="/api/v1/admin/leads/export">Export CSV</a>}>
      <div className="mb-4 flex gap-2">
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name or email" className="rounded-lg border px-3 py-2 text-sm" aria-label="Search leads" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border px-3 py-2 text-sm" aria-label="Status">
          <option value="">All statuses</option>
          {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <Notice loading={loading} error={error} empty={!loading && !leads.length ? 'No leads in this view.' : ''} />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="py-2">Name</th><th>Service</th><th>Source</th><th>Status</th></tr></thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id} className="border-t border-slate-100">
                <td className="py-3"><Link className="font-semibold text-royal" href={`/admin/leads/${lead._id}`}>{lead.name}</Link><p className="text-xs text-slate-500">{lead.email}</p></td>
                <td>{lead.serviceName || '—'}</td>
                <td>{lead.source}</td>
                <td>{LEAD_STATUS_LABELS[lead.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
