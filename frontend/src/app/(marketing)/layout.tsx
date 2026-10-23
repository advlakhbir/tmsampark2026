import type { Metadata } from 'next';
import { Attribution, CookieNotice, MobileCta } from '@/components/layout/chrome';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { getSettings } from '@/lib/api';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const organization = settings.organizationVerified && settings.address
    ? {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: settings.brandName,
        url: siteUrl(),
        email: settings.contact.email || undefined,
        telephone: settings.contact.phone || undefined,
        address: settings.address,
      }
    : { '@context': 'https://schema.org', '@type': 'Organization', name: settings.brandName, url: siteUrl() };

  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      {settings.announcement.enabled ? (
        <div className="bg-navy text-center text-xs text-slate-100">
          <a href={settings.announcement.href} className="block px-4 py-2 hover:text-white">{settings.announcement.text}</a>
        </div>
      ) : null}
      <SiteHeader settings={settings} />
      <main id="content" className="pb-24 lg:pb-0">{children}</main>
      <SiteFooter settings={settings} />
      <MobileCta phone={settings.contact.phone} whatsapp={settings.contact.whatsapp} />
      <Attribution />
      <CookieNotice />
    </>
  );
}
