'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { Button, TextField } from '@/components/ui/primitives';
import { api } from '@/lib/api';

function ResetForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const token = params.get('token') || '';

  async function requestReset(event: React.FormEvent) {
    event.preventDefault();
    const result = await api<{ delivered: boolean; reason: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
    setMessage(result.delivered ? 'Reset email sent.' : `Request accepted. Email was not sent (${result.reason}).`);
  }

  async function reset(event: React.FormEvent) {
    event.preventDefault();
    await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
    setMessage('Password updated. You can sign in.');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Logo variant="lockup" />
      <h1 className="mt-6 text-2xl font-semibold text-navy">Reset password</h1>
      {token ? (
        <form className="mt-6 space-y-4" onSubmit={reset}>
          <TextField label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} name="password" />
          <Button type="submit">Update password</Button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={requestReset}>
          <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} name="email" />
          <Button type="submit">Send reset link</Button>
        </form>
      )}
      {message ? <p className="mt-4 text-sm">{message}</p> : null}
    </main>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="p-8 text-sm">Loading…</p>}><ResetForm /></Suspense>;
}
