'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

export default function NewServicePage() {
  const router = useRouter();
  const categories = useResource<{ _id: string; name: string }[]>('/admin/categories');
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    try {
      const created = await api<{ _id: string }>('/admin/services', {
        method: 'POST',
        body: JSON.stringify({ name, summary, categoryId, status: 'draft', overview: summary }),
      });
      router.push(`/admin/services/${created._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the service');
    }
  }

  return (
    <Panel title="New service">
      <div className="grid max-w-xl gap-3">
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="rounded border px-3 py-2" aria-label="Category">
          <option value="">Category</option>
          {(categories.data || []).map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
        </select>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="rounded border px-3 py-2" aria-label="Name" />
        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Summary" className="min-h-24 rounded border px-3 py-2" aria-label="Summary" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="rounded-lg bg-royal px-4 py-2 text-sm font-semibold text-white" onClick={() => void submit()}>Create draft</button>
      </div>
    </Panel>
  );
}
