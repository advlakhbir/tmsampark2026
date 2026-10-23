'use client';

import Link from 'next/link';
import { MessageCircle, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { telLink, whatsappLink } from '@/lib/utils';

export function MobileCta({ phone, whatsapp }: { phone?: string; whatsapp?: string }) {
  const call = telLink(phone);
  const chat = whatsappLink(whatsapp || phone);
  if (!call && !chat) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-slate-200 bg-white p-3 lg:hidden">
      {call ? (
        <a href={call} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-navy py-3 text-sm font-semibold text-white">
          <Phone size={16} /> Call
        </a>
      ) : null}
      {chat ? (
        <a href={chat} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal py-3 text-sm font-semibold text-white">
          <MessageCircle size={16} /> WhatsApp
        </a>
      ) : (
        <Link href="/contact" className="flex flex-1 items-center justify-center rounded-lg bg-royal py-3 text-sm font-semibold text-white">
          Enquire
        </Link>
      )}
    </div>
  );
}

export function Attribution() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      term: params.get('utm_term') || undefined,
      content: params.get('utm_content') || undefined,
    };
    if (Object.values(utm).some(Boolean)) sessionStorage.setItem('tms_utm', JSON.stringify(utm));
    if (!sessionStorage.getItem('tms_landing')) sessionStorage.setItem('tms_landing', window.location.pathname);
  }, []);
  return null;
}

export function CookieNotice() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('tms_cookie')) setOpen(true);
  }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-x-3 bottom-20 z-40 rounded-xl border border-slate-200 bg-white p-4 shadow-card lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm">
      <p className="text-sm leading-6 text-ink">Sign-in uses a necessary session cookie. This installation does not load advertising cookies.</p>
      <div className="mt-3 flex gap-2">
        <button className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white" onClick={() => { localStorage.setItem('tms_cookie', 'accepted'); setOpen(false); }}>
          OK
        </button>
        <Link href="/privacy-policy" className="rounded-lg px-3 py-2 text-sm font-semibold text-navy">
          Privacy
        </Link>
      </div>
    </div>
  );
}
