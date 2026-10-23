import Link from 'next/link';
import { BRAND_SLOGAN, LogoLink } from '@/components/brand/logo';
import type { PublicSettings } from '@/lib/api';

const policies = [
  ['/privacy-policy', 'Privacy'],
  ['/terms-and-conditions', 'Terms'],
  ['/refund-policy', 'Refunds'],
  ['/disclaimer', 'Disclaimer'],
];

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  return (
    <footer className="bg-navy text-slate-200">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <LogoLink tone="light" variant="lockup" />
          <p className="mt-4 text-sm font-semibold leading-6 text-white">{BRAND_SLOGAN}</p>
          {settings.tagline && settings.tagline !== BRAND_SLOGAN ? <p className="mt-2 text-sm leading-6 text-slate-300">{settings.tagline}</p> : null}
          <p className="mt-3 text-sm text-slate-400">A private services firm. Not a government website.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {settings.navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Policies</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {policies.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/track-application" className="hover:text-white">
                Track an application
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>{settings.contact.hours}</li>
            {settings.contact.email ? <li><a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a></li> : <li>Email is set from the admin panel.</li>}
            {settings.contact.phone ? <li><a href={`tel:${settings.contact.phone}`}>{settings.contact.phone}</a></li> : <li>Phone is set from the admin panel.</li>}
            {settings.address ? <li>{settings.address}</li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-page px-4 py-4 text-xs text-slate-400">© {new Date().getFullYear()} TMSAMPARK. Professional fees, government charges, and timelines are confirmed in writing before work starts.</p>
      </div>
    </footer>
  );
}
