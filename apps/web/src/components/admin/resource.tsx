'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, api } from '@/lib/api';

export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(path));

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this page');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-navy">{title}</h1>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Notice({ loading, error, empty }: { loading?: boolean; error?: string; empty?: string }) {
  if (loading) return <div className="h-24 animate-pulse rounded-lg bg-slate-100" aria-hidden="true" />;
  if (error) return <p className="text-sm text-red-700" role="alert">{error}</p>;
  if (empty) return <p className="text-sm text-slate-600">{empty}</p>;
  return null;
}
