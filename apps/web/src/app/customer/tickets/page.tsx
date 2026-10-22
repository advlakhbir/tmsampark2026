'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

export default function TicketsPage() {
  const { data, reload } = useResource<{ _id: string; subject: string; status: string }[]>('/customer/tickets');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  async function create() {
    await api('/customer/tickets', { method: 'POST', body: JSON.stringify({ subject, category: 'General', priority: 'normal', message }) });
    setSubject('');
    setMessage('');
    await reload();
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Support</h1>
      <div className="grid max-w-lg gap-2">
        <input className="rounded border px-3 py-2" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" aria-label="Subject" />
        <textarea className="rounded border px-3 py-2" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What do you need?" aria-label="Message" />
        <button className="w-fit rounded-lg bg-royal px-3 py-2 text-sm text-white" onClick={() => void create()}>Open ticket</button>
      </div>
      <ul className="text-sm">{(data || []).map((ticket) => <li key={ticket._id}><Link className="font-semibold text-royal" href={`/customer/tickets/${ticket._id}`}>{ticket.subject}</Link> · {ticket.status}</li>)}</ul>
    </div>
  );
}
