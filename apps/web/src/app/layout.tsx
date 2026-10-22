import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const sans = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'TMSAMPARK', template: '%s · TMSAMPARK' },
  description: 'TMSAMPARK helps Indian businesses prepare company, tax, licence, and compliance applications.',
  applicationName: 'TMSAMPARK',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
