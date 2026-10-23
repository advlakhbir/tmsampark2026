'use client';

import { useResource } from '@/components/admin/resource';

export default function DocumentsPage() {
  const { data, loading } = useResource<{ _id: string; originalName: string; status: string; scanStatus: string }[]>('/customer/documents');
  if (loading) return <div className="h-24 animate-pulse rounded bg-slate-100" />;
  return (
    <ul className="space-y-2 text-sm">
      {(data || []).map((doc) => <li key={doc._id} className="rounded-xl border bg-white p-4">{doc.originalName} · {doc.status} · {doc.scanStatus} · <a className="text-royal" href={`/api/v1/customer/documents/${doc._id}/download`}>Download</a></li>)}
    </ul>
  );
}
