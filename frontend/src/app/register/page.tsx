'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/brand/logo';
import { Button, TextField } from '@/components/ui/primitives';
import { ApiError, api, ensureCsrf } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', consent: false });
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await ensureCsrf();
      await api('/auth/register', { method: 'POST', body: JSON.stringify({ ...form, consent: true }) });
      router.replace('/customer');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the account');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Logo variant="lockup" />
      <h1 className="mt-6 text-2xl font-semibold text-navy">Create an account</h1>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <TextField label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} name="name" />
        <TextField label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} name="email" />
        <TextField label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} name="phone" />
        <TextField label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} name="password" />
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} /> I agree to the privacy notice.</label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" disabled={!form.consent}>Create account</Button>
      </form>
      <p className="mt-4 text-sm"><Link href="/login" className="text-royal">Already registered</Link></p>
    </main>
  );
}
