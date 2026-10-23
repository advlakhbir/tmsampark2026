'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

export default function TicketPage() {
  const params = useParams<{ id: string }>();
  const tickets = useResource<{ _id: string; subject: string; messages: { body: string }[] }[]>('/customer/tickets');
  const ticket = tickets.data?.find((item) => item._id === params.id);
  const [body, setBody] = useState('');
  async function reply() {
    await api(`/customer/tickets/${params.id}/messages`, { method: 'POST', body: JSON.stringify({ body, visibility: 'customer' }) });
    setBody('');
    await tickets.reload();
  }
  if (!ticket) return <p className="text-sm">Loading ticket…</p>;
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-navy">{ticket.subject}</h1>
      {ticket.messages.map((message, index) => <p key={index} className="rounded bg-white p-3 text-sm">{message.body}</p>)}
      <textarea className="w-full rounded border px-3 py-2" value={body} onChange={(event) => setBody(event.target.value)} aria-label="Reply" />
      <button className="rounded-lg bg-navy px-3 py-2 text-sm text-white" onClick={() => void reply()}>Reply</button>
    </div>
  );
}
