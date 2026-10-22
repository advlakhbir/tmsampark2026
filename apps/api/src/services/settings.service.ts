import { DEFAULT_NAV, SERVICE_DISCLAIMER } from '@tmsampark/shared';
import { SiteSettings } from '../models/index.js';

export const POLICY_TEMPLATES = {
  privacy: `DRAFT FOR LEGAL REVIEW — do not treat this as a final privacy policy.

TMSAMPARK collects the name, email, phone number, enquiry details, and documents you submit so we can respond and, if you proceed, deliver the service you request. Account passwords are stored only as hashes. Payment card numbers and CVV codes are not stored by TMSAMPARK.

We do not sell personal information. Staff access is limited by role. You may ask for a copy of your information or for corrections by using the contact details published on this website.

Replace this draft with a policy reviewed for the Digital Personal Data Protection Act, 2023 and any other law that applies to your entity before launch.`,
  terms: `DRAFT FOR LEGAL REVIEW — do not treat this as final terms of service.

TMSAMPARK provides assistance with preparing and tracking business and compliance applications. We are a private firm. We are not a government department, and submission to an authority happens only after you review and authorise it.

A quote lists the professional fee and, separately, government or third-party charges. Work starts after you accept the scope. Timelines are estimates and depend on your documents and the relevant authority.

Have counsel review limitation of liability, governing law, and consumer terms before launch.`,
  refund: `DRAFT FOR LEGAL REVIEW — do not treat this as a final refund policy.

If you cancel before we start preparation, you may request a refund of the professional fee already captured, minus any third-party cost that has already been incurred. Government fees paid to an authority are generally not refundable by TMSAMPARK.

After preparation has started, refunds are considered case by case and recorded in the payment ledger. This draft does not promise a specific refund outcome.

Replace this text with the policy your business will actually operate.`,
  disclaimer: `DRAFT FOR LEGAL REVIEW.

Information on this website is general and may not apply to your situation. It is not legal, tax, or professional advice. Official requirements, fees, and processing times are controlled by the relevant government authority and can change without notice on this website.

TMSAMPARK does not represent any ministry, department, or regulator.`,
};

export async function getSettings() {
  let settings = await SiteSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await SiteSettings.create({
      key: 'default',
      navigation: DEFAULT_NAV,
      policies: { ...POLICY_TEMPLATES, legallyReviewed: false },
    });
  }
  return settings;
}

export function toPublicSettings(settings: Awaited<ReturnType<typeof getSettings>>) {
  return {
    brandName: settings.brandName,
    tagline: settings.tagline,
    contact: settings.contact,
    social: settings.social,
    announcement: settings.announcement,
    tax: settings.tax,
    seo: settings.seo,
    policies: {
      privacy: settings.policies?.privacy || POLICY_TEMPLATES.privacy,
      terms: settings.policies?.terms || POLICY_TEMPLATES.terms,
      refund: settings.policies?.refund || POLICY_TEMPLATES.refund,
      disclaimer: settings.policies?.disclaimer || POLICY_TEMPLATES.disclaimer,
      legallyReviewed: Boolean(settings.policies?.legallyReviewed),
    },
    verifiedMetrics: (settings.verifiedMetrics || []).filter((item) => item.sourceNote && item.label),
    navigation: settings.navigation?.length ? settings.navigation : DEFAULT_NAV,
    address: settings.organizationVerified ? settings.address : '',
    organizationVerified: Boolean(settings.organizationVerified),
    serviceDisclaimer: SERVICE_DISCLAIMER,
  };
}
