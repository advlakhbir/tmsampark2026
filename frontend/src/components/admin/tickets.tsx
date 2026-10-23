'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Notice, Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

type Ticket = { _id: string; subject: string; status: string; priority: string; messages: { body: string; visibility: string; authorRole: string }[] };

export function TicketList() {
  const { data, error, loading } = useResource<Ticket[]>('/admin/tickets');
  return (
    <Panel title="Tickets">
      <Notice loading={loading} error={error} empty={!loading && !data?.length ? 'No tickets.' : ''} />
      <ul className="text-sm">{(data || []).map((ticket) => <li key={ticket._id} className="border-b py-2"><Link className="font-semibold text-royal" href={`/admin/tickets/${ticket._id}`}>{ticket.subject}</Link> · {ticket.status}</li>)}</ul>
    </Panel>
  );
}

export function TicketDetail() {
  const params = useParams<{ id: string }>();
  const { data, error, loading, reload } = useResource<Ticket>(`/admin/tickets/${params.id}`);
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'customer' | 'internal'>('customer');
  async function reply() {
    await api(`/admin/tickets/${params.id}`, { method: 'PATCH', body: JSON.stringify({ body, visibility, status: 'in_progress' }) });
    setBody('');
    await reload();
  }
  return (
    <Panel title={data?.subject || 'Ticket'}>
      <Notice loading={loading} error={error} />
      {data ? (
        <div className="space-y-3 text-sm">
          {data.messages.map((message, index) => <p key={index} className="rounded bg-paper p-3"><span className="text-xs uppercase text-slate-500">{message.visibility} · {message.authorRole}</span><br />{message.body}</p>)}
          <textarea value={body} onChange={(event) => setBody(event.target.value)} className="w-full rounded border px-3 py-2" aria-label="Reply" />
          <select value={visibility} onChange={(event) => setVisibility(event.target.value as 'customer' | 'internal')} className="rounded border px-2 py-2" aria-label="Visibility">
            <option value="customer">Customer-facing</option>
            <option value="internal">Internal note</option>
          </select>
          <button className="ml-2 rounded-lg bg-royal px-3 py-2 text-white" onClick={() => void reply()}>Send</button>
        </div>
      ) : null}
    </Panel>
  );
}
