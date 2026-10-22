'use client';

import { useEffect, useState } from 'react';
import { Notice, Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';
import type { PublicSettings } from '@/lib/api';

type Settings = PublicSettings & { integrations: { email: boolean; razorpay: boolean; sms: boolean; storage: string; s3: boolean; malwareScan: boolean } };

export default function SettingsPage() {
  const { data, error, loading, reload } = useResource<Settings>('/admin/settings');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [hours, setHours] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!data) return;
    setEmail(data.contact.email || '');
    setPhone(data.contact.phone || '');
    setWhatsapp(data.contact.whatsapp || '');
    setHours(data.contact.hours || '');
    setAnnouncement(data.announcement.text || '');
    setPrivacy(data.policies.privacy || '');
    setReviewed(data.policies.legallyReviewed);
  }, [data]);

  async function save() {
    await api('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        contact: { email, phone, whatsapp, hours },
        announcement: { enabled: true, text: announcement, href: '/disclaimer' },
        policies: { ...data?.policies, privacy, legallyReviewed: reviewed },
      }),
    });
    setMessage('Settings saved.');
    await reload();
  }

  return (
    <Panel title="Settings">
      <Notice loading={loading} error={error} />
      {data ? (
        <div className="grid max-w-2xl gap-3 text-sm">
          <p>Email delivery: {data.integrations.email ? 'configured' : 'not configured — messages are stored, not marked sent.'}</p>
          <p>Razorpay: {data.integrations.razorpay ? 'configured' : 'not configured'} · SMS: {data.integrations.sms ? 'configured' : 'not configured'} · Storage: {data.integrations.storage} · Malware scan: {data.integrations.malwareScan ? 'configured' : 'uploads marked not_scanned'}</p>
          <input className="rounded border px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Public email" placeholder="Public email" />
          <input className="rounded border px-3 py-2" value={phone} onChange={(event) => setPhone(event.target.value)} aria-label="Public phone" placeholder="Public phone" />
          <input className="rounded border px-3 py-2" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} aria-label="WhatsApp number" placeholder="WhatsApp number" />
          <input className="rounded border px-3 py-2" value={hours} onChange={(event) => setHours(event.target.value)} aria-label="Business hours" placeholder="Business hours" />
          <textarea className="rounded border px-3 py-2" value={announcement} onChange={(event) => setAnnouncement(event.target.value)} aria-label="Announcement" />
          <textarea className="min-h-40 rounded border px-3 py-2" value={privacy} onChange={(event) => setPrivacy(event.target.value)} aria-label="Privacy policy" />
          <label><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} /> Policies have been legally reviewed and may be indexed</label>
          <button className="w-fit rounded-lg bg-royal px-4 py-2 font-semibold text-white" onClick={() => void save()}>Save settings</button>
          {message ? <p className="text-teal">{message}</p> : null}
        </div>
      ) : null}
    </Panel>
  );
}
