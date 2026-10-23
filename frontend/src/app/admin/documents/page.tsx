'use client';

import { useState } from 'react';
import { Notice, Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

type Doc = { _id: string; originalName: string; status: string; scanStatus: string; label?: string };

export default function DocumentsPage() {
  const { data, error, loading, reload } = useResource<Doc[]>('/admin/documents');
  const [message, setMessage] = useState('');

  async function review(id: string, status: 'approved' | 'rejected') {
    await api(`/admin/documents/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    setMessage(`Marked ${status}.`);
    await reload();
  }

  return (
    <Panel title="Documents">
      <Notice loading={loading} error={error} empty={!loading && !data?.length ? 'No private documents uploaded.' : ''} />
      {message ? <p className="mb-2 text-sm text-teal">{message}</p> : null}
      <ul className="space-y-2 text-sm">
        {(data || []).map((doc) => (
          <li key={doc._id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2">
            <span>{doc.originalName} · {doc.status} · scan {doc.scanStatus}</span>
            <span className="flex gap-2">
              <a className="text-royal" href={`/api/v1/admin/documents/${doc._id}/download`}>Download</a>
              <button onClick={() => void review(doc._id, 'approved')}>Approve</button>
              <button onClick={() => void review(doc._id, 'rejected')}>Reject</button>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
