'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { LogoLink } from '@/components/brand/logo';
import { api } from '@/lib/api';

const links = [
  ['/customer', 'Home'],
  ['/customer/orders', 'Applications'],
  ['/customer/documents', 'Documents'],
  ['/customer/payments', 'Payments'],
  ['/customer/tickets', 'Tickets'],
  ['/customer/notifications', 'Notifications'],
  ['/customer/profile', 'Profile'],
];

export function CustomerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState('');
  useEffect(() => {
    api<{ name: string; role: string }>('/auth/me')
      .then((user) => {
        if (user.role !== 'customer') {
          router.replace('/admin');
          return;
        }
        setName(user.name);
      })
      .catch(() => router.replace('/login?next=/customer'));
  }, [router]);
  if (!name) return <p className="p-8 text-sm">Checking your session…</p>;
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-page items-center justify-between px-4 py-4">
          <LogoLink />
          <button className="text-sm" onClick={() => void api('/auth/logout', { method: 'POST' }).then(() => router.replace('/login'))}>Sign out</button>
        </div>
        <nav className="mx-auto flex max-w-page gap-4 overflow-auto px-4 pb-3 text-sm" aria-label="Account">
          {links.map(([href, label]) => <Link key={href} href={href} className={pathname === href ? 'font-semibold text-royal' : 'text-slate-600'}>{label}</Link>)}
        </nav>
      </header>
      <div className="mx-auto max-w-page px-4 py-6">{children}</div>
    </div>
  );
}
