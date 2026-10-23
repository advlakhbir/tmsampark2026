import type { Metadata } from 'next';
import { CustomerShell } from '@/components/customer/shell';

export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Account' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
