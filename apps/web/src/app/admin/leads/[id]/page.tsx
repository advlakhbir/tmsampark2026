'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { LEAD_STATUSES } from '@tmsampark/shared';
import { Notice, Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

type Lead = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  source: string;
  serviceName?: string;
  utm?: { source?: string; campaign?: string };
  notes: { body: string; createdAt: string }[];
  activities: { message: string; at: string }[];
  matchingCustomer?: { _id: string; name: string } | null;
};

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, error, loading, reload } = useResource<Lead>(`/admin/leads/${params.id}`);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('contacted');
  const staff = useResource<{ _id: string; name: string; role: string }[]>('/admin/assignees');

  async function save(body: Record<string, unknown>) {
    await api(`/admin/leads/${params.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    await reload();
  }

  return (
    <Panel title={data?.name || 'Lead'}>
      <Notice loading={loading} error={error} />
      {data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p>{data.email} · {data.phone}</p>
            <p>Source: {data.source}{data.serviceName ? ` · ${data.serviceName}` : ''}</p>
            <p>Campaign: {data.utm?.campaign || '—'} / {data.utm?.source || '—'}</p>
            <p className="whitespace-pre-wrap rounded-lg bg-paper p-3">{data.message}</p>
            {data.matchingCustomer ? <p>Matching customer: {data.matchingCustomer.name}</p> : <p>No customer account with this email yet.</p>}
            <label className="block font-medium">Status
              <select className="mt-1 w-full rounded border px-2 py-2" value={status} onChange={(event) => setStatus(event.target.value)}>
                {LEAD_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button className="rounded-lg bg-royal px-3 py-2 text-white" onClick={() => void save({ status })}>Update status</button>
            <label className="block font-medium">Assign
              <select className="mt-1 w-full rounded border px-2 py-2" defaultValue="" onChange={(event) => { if (event.target.value) void save({ assignedTo: event.target.value }); }}>
                <option value="">Choose a teammate</option>
                {(staff.data || []).map((person) => <option key={person._id} value={person._id}>{person.name}</option>)}
              </select>
            </label>
            <label className="block font-medium">Internal note
              <textarea className="mt-1 w-full rounded border px-2 py-2" value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <button className="rounded-lg border px-3 py-2" onClick={() => void save({ note }).then(() => setNote(''))}>Add note</button>
          </div>
          <div>
            <h2 className="font-semibold text-navy">Activity</h2>
            <ul className="mt-2 space-y-2 text-sm">{data.activities?.map((item, index) => <li key={index}>{item.message}</li>)}</ul>
            <h2 className="mt-4 font-semibold text-navy">Notes</h2>
            <ul className="mt-2 space-y-2 text-sm">{data.notes?.map((item, index) => <li key={index}>{item.body}</li>)}</ul>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
