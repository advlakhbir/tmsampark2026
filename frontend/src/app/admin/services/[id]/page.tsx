'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Notice, Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

type Service = {
  _id: string;
  name: string;
  summary: string;
  overview: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  seo?: { title?: string; description?: string; canonical?: string; index?: boolean };
  feeIsSample?: boolean;
};

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const resource = useResource<{ service: Service; packages: { _id: string; name: string; professionalFeePaise: number }[] }>(`/admin/services/${params.id}`);
  const [form, setForm] = useState<Partial<Service>>({});
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (resource.data?.service) {
      setForm(resource.data.service);
      setSeoTitle(resource.data.service.seo?.title || '');
      setSeoDescription(resource.data.service.seo?.description || '');
    }
  }, [resource.data]);

  async function save() {
    await api(`/admin/services/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...form, seo: { title: seoTitle, description: seoDescription, index: true, canonical: '', ogImage: '' } }),
    });
    setMessage('Saved.');
    await resource.reload();
  }

  async function addPackage() {
    const rupees = Number(prompt('Sample professional fee in rupees'));
    if (!rupees) return;
    await api(`/admin/services/${params.id}/packages`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Preparation', professionalFeePaise: Math.round(rupees * 100), feeIsSample: true, included: ['Preparation'], excluded: ['Government fees'] }),
    });
    await resource.reload();
  }

  return (
    <Panel title="Edit service">
      <Notice loading={resource.loading} error={resource.error} />
      {resource.data ? (
        <div className="grid max-w-2xl gap-3">
          <input className="rounded border px-3 py-2" aria-label="Name" value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <textarea className="min-h-20 rounded border px-3 py-2" aria-label="Summary" value={form.summary || ''} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
          <textarea className="min-h-32 rounded border px-3 py-2" aria-label="Overview" value={form.overview || ''} onChange={(event) => setForm({ ...form, overview: event.target.value })} />
          <label className="text-sm">Status
            <select className="mt-1 w-full rounded border px-3 py-2" value={form.status || 'draft'} onChange={(event) => setForm({ ...form, status: event.target.value as Service['status'] })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.featured)} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Featured</label>
          <h2 className="font-semibold text-navy">Search snippet</h2>
          <input className="rounded border px-3 py-2" aria-label="SEO title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="SEO title" />
          <textarea className="rounded border px-3 py-2" aria-label="Meta description" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} placeholder="Meta description" />
          <p className="rounded-lg bg-paper p-3 text-sm"><strong>{seoTitle || form.name}</strong><br />{seoDescription || form.summary}</p>
          <button className="rounded-lg bg-royal px-4 py-2 text-sm font-semibold text-white" onClick={() => void save()}>Save</button>
          {message ? <p className="text-sm text-teal">{message}</p> : null}
          <h2 className="font-semibold text-navy">Packages</h2>
          <ul className="text-sm">{resource.data.packages.map((pack) => <li key={pack._id}>{pack.name} · ₹{pack.professionalFeePaise / 100}</li>)}</ul>
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => void addPackage()}>Add package</button>
        </div>
      ) : null}
    </Panel>
  );
}
