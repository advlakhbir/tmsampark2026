'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Logo } from '@/components/brand/logo';
import { Button, TextField } from '@/components/ui/primitives';
import { ApiError, api, ensureCsrf } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await ensureCsrf();
      const user = await api<{ role: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      const next = params.get('next');
      const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : '';
      router.replace(safe || (user.role === 'customer' ? '/customer' : '/admin'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Logo variant="lockup" />
      <h1 className="mt-6 text-2xl font-semibold text-navy">Sign in</h1>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} name="email" />
        <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} name="password" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit">Sign in</Button>
      </form>
      <p className="mt-4 text-sm"><Link href="/register" className="text-royal">Create a customer account</Link> · <Link href="/reset-password" className="text-royal">Forgot password</Link></p>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<p className="p-8 text-sm">Loading…</p>}><LoginForm /></Suspense>;
}
