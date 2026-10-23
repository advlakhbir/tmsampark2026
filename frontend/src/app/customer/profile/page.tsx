'use client';

import { useEffect, useState } from 'react';
import { useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const profile = useResource<{ name: string; email: string; phone: string }>('/customer/profile');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (profile.data) {
      setName(profile.data.name);
      setPhone(profile.data.phone);
    }
  }, [profile.data]);
  return (
    <div className="max-w-md space-y-3">
      <h1 className="text-2xl font-semibold text-navy">Profile</h1>
      <p className="text-sm">{profile.data?.email}</p>
      <input className="w-full rounded border px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} aria-label="Name" />
      <input className="w-full rounded border px-3 py-2" value={phone} onChange={(event) => setPhone(event.target.value)} aria-label="Phone" />
      <button className="rounded-lg bg-royal px-3 py-2 text-sm text-white" onClick={() => void api('/customer/profile', { method: 'PUT', body: JSON.stringify({ name, phone }) }).then(() => setMessage('Profile saved.'))}>Save profile</button>
      <h2 className="pt-4 font-semibold">Change password</h2>
      <input type="password" className="w-full rounded border px-3 py-2" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} aria-label="Current password" />
      <input type="password" className="w-full rounded border px-3 py-2" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} aria-label="New password" />
      <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => void api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }).then(() => setMessage('Password changed. Sign in again.'))}>Change password</button>
      {message ? <p className="text-sm text-teal">{message}</p> : null}
    </div>
  );
}
