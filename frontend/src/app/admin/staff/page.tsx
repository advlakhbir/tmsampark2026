'use client';

import { useState } from 'react';
import { STAFF_ROLES } from '@tmsampark/shared';
import { Notice, Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

type Staff = { _id: string; name: string; email: string; role: string; status: string };

export default function StaffPage() {
  const { data, error, loading, reload } = useResource<Staff[]>('/admin/staff');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<(typeof STAFF_ROLES)[number]>('support_agent');
  const [message, setMessage] = useState('');

  async function create() {
    setMessage('');
    await api('/admin/staff', { method: 'POST', body: JSON.stringify({ name, email, password, role }) });
    setMessage('Staff account created. Ask them to change the password.');
    setPassword('');
    await reload();
  }

  return (
    <Panel title="Staff">
      <Notice loading={loading} error={error} />
      <div className="mb-4 grid max-w-md gap-2">
        <input className="rounded border px-3 py-2" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} aria-label="Name" />
        <input className="rounded border px-3 py-2" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Email" />
        <input className="rounded border px-3 py-2" placeholder="Temporary password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} aria-label="Password" />
        <select className="rounded border px-3 py-2" value={role} onChange={(event) => setRole(event.target.value as (typeof STAFF_ROLES)[number])} aria-label="Role">
          {STAFF_ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="rounded-lg bg-navy px-3 py-2 text-sm text-white" onClick={() => void create()}>Create staff account</button>
        {message ? <p className="text-sm text-teal">{message}</p> : null}
      </div>
      <ul className="text-sm">{(data || []).map((person) => <li key={person._id} className="border-b py-2">{person.name} · {person.email} · {person.role} · {person.status}</li>)}</ul>
    </Panel>
  );
}
