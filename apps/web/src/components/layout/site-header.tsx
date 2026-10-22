'use client';

import Link from 'next/link';
import { Menu, Phone, X } from 'lucide-react';
import { useState } from 'react';
import { LogoLink } from '@/components/brand/logo';
import type { PublicSettings } from '@/lib/api';
import { telLink } from '@/lib/utils';

export function SiteHeader({ settings }: { settings: PublicSettings }) {
  const [open, setOpen] = useState(false);
  const call = telLink(settings.contact.phone);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-[88px] max-w-page items-center justify-between gap-4 px-4 py-2">
        <LogoLink />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {settings.navigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-700 hover:text-navy">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/track-application" className="rounded-lg px-3 py-2 text-sm font-medium text-navy">
            Track
          </Link>
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-navy">
            Sign in
          </Link>
          <Link href="/contact" className="rounded-lg bg-royal px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d48b5]">
            Talk to an expert
          </Link>
        </div>
        <button className="rounded-md p-2 lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((value) => !value)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
          {settings.navigation.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-md px-2 py-3 text-sm font-medium" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="block rounded-md px-2 py-3 text-sm font-medium" onClick={() => setOpen(false)}>
            Sign in
          </Link>
          {call ? (
            <a href={call} className="mt-1 flex items-center gap-2 rounded-lg bg-navy px-3 py-3 text-sm font-semibold text-white">
              <Phone size={16} /> Call
            </a>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
