import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Sign in' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
