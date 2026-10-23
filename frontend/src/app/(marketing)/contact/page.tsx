import type { Metadata } from 'next';
import { EnquiryForm } from '@/components/forms/enquiry-form';
import { getSettings } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { telLink, whatsappLink } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description: 'Send a consultation request to TMSAMPARK. Phone, email, and hours are configured by the business.',
  path: '/contact',
});

export default async function ContactPage() {
  const settings = await getSettings();
  const call = telLink(settings.contact.phone);
  const chat = whatsappLink(settings.contact.whatsapp || settings.contact.phone);
  return (
    <div className="mx-auto grid max-w-page gap-8 px-4 py-10 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl font-semibold text-navy">Contact</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Use the form for a consultation or a service question. We store the enquiry and reply using the details you provide.</p>
        <dl className="mt-6 space-y-3 text-sm">
          <div><dt className="font-semibold text-navy">Hours</dt><dd>{settings.contact.hours}</dd></div>
          <div><dt className="font-semibold text-navy">Email</dt><dd>{settings.contact.email ? <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a> : 'Not configured yet'}</dd></div>
          <div><dt className="font-semibold text-navy">Phone</dt><dd>{call ? <a href={call}>{settings.contact.phone}</a> : 'Not configured yet'}</dd></div>
          <div><dt className="font-semibold text-navy">WhatsApp</dt><dd>{chat ? <a href={chat}>Message on WhatsApp</a> : 'Shown when a valid business number is saved'}</dd></div>
        </dl>
      </div>
      <EnquiryForm source="contact" heading="Send a message" />
    </div>
  );
}
