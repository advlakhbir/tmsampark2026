'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { hasPermission, type Permission, type Role } from '@tmsampark/shared';
import { Logo } from '@/components/brand/logo';
import { api } from '@/lib/api';

type SessionUser = { id: string; name: string; email: string; role: Role };

const links: { href: string; label: string; permission?: Permission }[] = [
  { href: '/admin', label: 'Overview', permission: 'leads:read' },
  { href: '/admin/leads', label: 'Leads', permission: 'leads:read' },
  { href: '/admin/orders', label: 'Orders', permission: 'orders:read' },
  { href: '/admin/customers', label: 'Customers', permission: 'customers:read' },
  { href: '/admin/payments', label: 'Payments', permission: 'payments:read' },
  { href: '/admin/documents', label: 'Documents', permission: 'documents:read' },
  { href: '/admin/services', label: 'Services', permission: 'services:read' },
  { href: '/admin/blog', label: 'Guides', permission: 'content:read' },
  { href: '/admin/faqs', label: 'FAQs', permission: 'content:read' },
  { href: '/admin/testimonials', label: 'Testimonials', permission: 'content:read' },
  { href: '/admin/tickets', label: 'Tickets', permission: 'tickets:read' },
  { href: '/admin/reports', label: 'Reports', permission: 'reports:read' },
  { href: '/admin/staff', label: 'Staff', permission: 'staff:read' },
  { href: '/admin/settings', label: 'Settings', permission: 'settings:read' },
  { href: '/admin/audit', label: 'Audit', permission: 'audit:read' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    api<SessionUser>('/auth/me')
      .then((session) => {
        if (session.role === 'customer') {
          router.replace('/customer');
          return;
        }
        setUser(session);
      })
      .catch(() => router.replace('/login?next=/admin'));
  }, [router]);

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  if (!user) return <p className="p-8 text-sm text-slate-600">Checking your session…</p>;

  const visible = links.filter((link) => !link.permission || hasPermission(user.role, link.permission) || user.role === 'super_admin');

  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-navy text-slate-100 md:min-h-screen">
        <div className="px-4 py-5"><Logo tone="light" /></div>
        <nav className="flex gap-2 overflow-auto px-3 pb-4 md:block md:space-y-1" aria-label="Admin">
          {visible.map((link) => (
            <Link key={link.href} href={link.href} className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm ${pathname === link.href ? 'bg-white/10 text-white' : 'text-slate-300'}`}>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">{user.name} · {user.role.replaceAll('_', ' ')}</p>
          <button className="text-sm font-semibold text-navy" onClick={() => void logout()}>Sign out</button>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
