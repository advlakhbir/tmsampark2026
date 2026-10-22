import type { EnquiryInput } from '@tmsampark/shared';
import { ContactEnquiry, Customer, Lead, Service } from '../models/index.js';
import { AppError } from '../utils/errors.js';

export async function createEnquiry(input: EnquiryInput, meta: { ip: string }) {
  if (input.companyWebsite && input.companyWebsite.trim()) {
    return { ok: true, stored: false };
  }
  const email = input.email.toLowerCase();
  const serviceSlug = input.serviceSlug || '';
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const duplicate = await Lead.findOne({
    email,
    source: input.source,
    serviceSlug,
    createdAt: { $gte: since },
  });
  if (duplicate) {
    return { ok: true, stored: true, duplicate: true, id: String(duplicate._id) };
  }

  let serviceName = '';
  if (serviceSlug) {
    const service = await Service.findOne({ slug: serviceSlug, status: 'published' });
    if (!service) throw new AppError(400, 'Choose a published service', 'SERVICE_NOT_FOUND');
    serviceName = service.name;
  }

  const customer = await Customer.findOne({ email });
  const enquiry = await ContactEnquiry.create({
    name: input.name,
    email,
    phone: input.phone,
    message: input.message,
    source: input.source,
    serviceSlug,
    consentAt: new Date(),
    utm: input.utm,
    landingPath: input.landingPath || '',
    ip: meta.ip,
  });
  const lead = await Lead.create({
    name: input.name,
    email,
    phone: input.phone,
    message: input.message,
    source: input.source,
    serviceSlug,
    serviceName,
    status: 'new',
    utm: input.utm,
    landingPath: input.landingPath || '',
    consentAt: new Date(),
    customerId: customer?._id,
    contactEnquiryId: enquiry._id,
    ip: meta.ip,
    activities: [{ type: 'created', message: 'Enquiry received from the website', at: new Date() }],
  });
  enquiry.leadId = lead._id;
  await enquiry.save();
  return { ok: true, stored: true, duplicate: false, id: String(lead._id) };
}
