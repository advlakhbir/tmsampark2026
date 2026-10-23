'use client';

import { Notice, Panel, useResource } from '@/components/admin/resource';

export default function AuditPage() {
  const { data, error, loading } = useResource<{ action: string; entityType: string; createdAt: string; requestId?: string }[]>('/admin/audit');
  return (
    <Panel title="Audit log">
      <Notice loading={loading} error={error} empty={!loading && !data?.length ? 'No audit events yet.' : ''} />
      <ul className="text-sm">{(data || []).map((row, index) => <li key={index} className="border-b py-2">{new Date(row.createdAt).toLocaleString('en-IN')} · {row.action} · {row.entityType}</li>)}</ul>
    </Panel>
  );
}
