'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Notice, Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

type Service = { _id: string; name: string; slug: string; status: string; featured: boolean };
type Category = { _id: string; name: string; slug: string };

export default function ServicesAdminPage() {
  const services = useResource<Service[]>('/admin/services');
  const categories = useResource<Category[]>('/admin/categories');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [message, setMessage] = useState('');

  async function createService() {
    setMessage('');
    await api('/admin/services', { method: 'POST', body: JSON.stringify({ categoryId, name, status: 'draft', summary: '', overview: '' }) });
    setName('');
    setMessage('Draft service created.');
    await services.reload();
  }

  return (
    <div className="space-y-4">
      <Panel title="Services" action={<Link className="text-sm font-semibold text-royal" href="/admin/services/new">New service</Link>}>
        <Notice loading={services.loading} error={services.error} />
        <ul className="space-y-2 text-sm">
          {(services.data || []).map((service) => (
            <li key={service._id} className="flex items-center justify-between border-b border-slate-100 py-2">
              <span>{service.name} <span className="text-slate-500">({service.status})</span></span>
              <Link className="font-semibold text-royal" href={`/admin/services/${service._id}`}>Edit</Link>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Quick draft">
        <div className="flex flex-wrap gap-2">
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="rounded border px-2 py-2" aria-label="Category">
            <option value="">Category</option>
            {(categories.data || []).map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Service name" className="rounded border px-2 py-2" />
          <button className="rounded-lg bg-navy px-3 py-2 text-sm text-white" onClick={() => void createService()}>Create draft</button>
        </div>
        {message ? <p className="mt-2 text-sm text-teal">{message}</p> : null}
      </Panel>
    </div>
  );
}
