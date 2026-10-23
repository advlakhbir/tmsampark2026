import crypto from 'node:crypto';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { Service, ServiceCategory, ServicePackage, Payment, Lead } from '../models/index.js';
import { csrfFrom, makeStaff, resetDb, signIn, startApp, stopApp } from './helpers.js';

let app: Express;

beforeAll(async () => {
  app = await startApp();
});

afterAll(async () => {
  await stopApp();
});

beforeEach(async () => {
  await resetDb();
});

async function catalogue() {
  const category = await ServiceCategory.create({
    name: 'Company Registration',
    slug: 'company-registration',
    summary: 'Company forms',
    status: 'published',
  });
  const service = await Service.create({
    name: 'Private Limited Company Registration',
    slug: 'private-limited-company-registration',
    categoryId: category._id,
    summary: 'Prepare a private limited application',
    overview: 'Overview',
    status: 'published',
    documents: [{ name: 'PAN', description: 'Identity', mandatory: true }],
    seo: { title: 'Private limited assistance', description: 'Prepare the application', index: true },
    feeIsSample: true,
  });
  await Service.create({
    name: 'Hidden draft',
    slug: 'hidden-draft',
    categoryId: category._id,
    status: 'draft',
    summary: 'not public',
  });
  const pack = await ServicePackage.create({
    serviceId: service._id,
    name: 'Preparation',
    professionalFeePaise: 100000,
    governmentFeePaise: 0,
    included: ['Draft'],
    excluded: ['Government fee'],
    feeIsSample: true,
    active: true,
  });
  return { category, service, pack };
}

describe('TMSAMPARK platform', () => {
  it('registers, rejects bad input, and keeps customers out of admin', async () => {
    const agent = (await import('supertest')).default.agent(app);
    const csrfRes = await agent.get('/api/v1/auth/csrf');
    const bad = await agent.post('/api/v1/auth/register').set('x-csrf-token', csrfRes.body.data.token).send({ name: 'A', email: 'not-email', phone: '1', password: 'short', consent: true });
    expect(bad.status, JSON.stringify(bad.body)).toBe(400);
    const malformed = await agent.post('/api/v1/auth/register').set('content-type', 'application/json').set('x-csrf-token', csrfRes.body.data.token).send('{');
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('INVALID_JSON');

    const fresh = (await import('supertest')).default.agent(app);
    const freshCsrf = await fresh.get('/api/v1/auth/csrf');
    const registered = await fresh
      .post('/api/v1/auth/register')
      .set('x-csrf-token', freshCsrf.body.data.token)
      .send({ name: 'Asha Rao', email: 'asha@example.com', phone: '9811111111', password: 'Password12345', consent: true });
    expect(registered.status, JSON.stringify(registered.body)).toBe(201);
    const me = await fresh.get('/api/v1/auth/me');
    expect(me.status, JSON.stringify(me.body)).toBe(200);
    expect(me.body.data.role).toBe('customer');
    const denied = await fresh.get('/api/v1/admin/leads');
    expect(denied.status).toBe(403);
  });

  it('hides drafts, stores enquiries, assigns leads, and isolates customer records', async () => {
    const { service, pack } = await catalogue();
    const admin = await makeStaff('super_admin', 'admin@example.com');
    const support = await makeStaff('support_agent', 'support@example.com');
    const editor = await makeStaff('content_editor', 'editor@example.com');
    const adminSession = await signIn(app, admin.email, admin.password);
    const supportSession = await signIn(app, support.email, support.password);
    const editorSession = await signIn(app, editor.email, editor.password);

    const list = await (await import('supertest')).default(app).get('/api/v1/services');
    expect(list.status, JSON.stringify(list.body)).toBe(200);
    expect(list.body.data.map((item: { slug: string }) => item.slug)).toContain(service.slug);
    expect(list.body.data.map((item: { slug: string }) => item.slug)).not.toContain('hidden-draft');
    expect(list.body.data[0].seo.description).toBeTruthy();

    const invalid = await (await import('supertest')).default(app).post('/api/v1/enquiries').send({ name: 'No', email: 'no@example.com', phone: '9811111112', message: 'too short', source: 'contact', consent: false });
    expect(invalid.status).toBe(400);

    const spam = await (await import('supertest')).default(app).post('/api/v1/enquiries').send({
      name: 'Bot',
      email: 'bot@example.com',
      phone: '9811111113',
      message: 'This is a spam message for the form.',
      source: 'contact',
      consent: true,
      companyWebsite: 'https://spam.example',
    });
    expect(spam.body.data.stored).toBe(false);
    expect(await Lead.countDocuments({ email: 'bot@example.com' })).toBe(0);

    const visitor = await (await import('supertest')).default(app).post('/api/v1/enquiries').send({
      name: 'Meera Shah',
      email: 'meera@example.com',
      phone: '9811111114',
      message: 'I want help preparing a private limited application.',
      source: 'service_enquiry',
      serviceSlug: service.slug,
      consent: true,
      utm: { source: 'google', campaign: 'brand' },
    });
    expect(visitor.status).toBe(201);

    const leads = await adminSession.agent.get('/api/v1/admin/leads');
    expect(leads.body.data).toHaveLength(1);
    const leadId = leads.body.data[0]._id as string;

    const forbiddenExport = await supportSession.agent.get('/api/v1/admin/leads/export').set('x-csrf-token', supportSession.csrf);
    expect(forbiddenExport.status).toBe(403);
    const settingsDenied = await editorSession.agent.put('/api/v1/admin/settings').set('x-csrf-token', editorSession.csrf).send({ brandName: 'Nope' });
    expect(settingsDenied.status).toBe(403);

    const supportUser = await (await import('../models/index.js')).User.findOne({ email: support.email });
    const assigned = await adminSession.agent
      .patch(`/api/v1/admin/leads/${leadId}`)
      .set('x-csrf-token', adminSession.csrf)
      .send({ assignedTo: String(supportUser!._id), status: 'contacted' });
    expect(assigned.status).toBe(200);
    expect(assigned.body.data.status).toBe('contacted');

    const customerAgent = (await import('supertest')).default.agent(app);
    const customerCsrf = await customerAgent.get('/api/v1/auth/csrf');
    const registered = await customerAgent.post('/api/v1/auth/register').set('x-csrf-token', customerCsrf.body.data.token).send({
      name: 'Meera Shah',
      email: 'meera@example.com',
      phone: '9811111114',
      password: 'Password12345',
      consent: true,
    });
    expect(registered.status).toBe(201);
    const customerCsrfToken = csrfFrom(registered.headers['set-cookie'] as string[]);
    const customerId = registered.body.data.customerId as string;
    const otherAgent = (await import('supertest')).default.agent(app);
    const otherCsrf = await otherAgent.get('/api/v1/auth/csrf');
    await otherAgent.post('/api/v1/auth/register').set('x-csrf-token', otherCsrf.body.data.token).send({
      name: 'Other Person',
      email: 'other@example.com',
      phone: '9811111115',
      password: 'Password12345',
      consent: true,
    });

    const orderRes = await adminSession.agent.post('/api/v1/admin/orders').set('x-csrf-token', adminSession.csrf).send({
      customerId,
      leadId,
      serviceId: String(service._id),
      packageId: String(pack._id),
      addOnNames: [],
    });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.data.order._id as string;
    const reference = orderRes.body.data.order.referenceNumber as string;

    const mine = await customerAgent.get('/api/v1/customer/orders');
    expect(mine.body.data).toHaveLength(1);
    const theirs = await otherAgent.get(`/api/v1/customer/orders/${orderId}`);
    expect(theirs.status).toBe(404);

    const checklistId = orderRes.body.data.application.checklist[0]._id as string;
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
    const uploaded = await customerAgent
      .post(`/api/v1/customer/orders/${orderId}/documents`)
      .set('x-csrf-token', customerCsrfToken)
      .field('checklistItemId', checklistId)
      .field('label', 'PAN')
      .attach('file', pdf, { filename: 'pan.pdf', contentType: 'application/pdf' });
    expect(uploaded.status).toBe(201);
    const documentId = uploaded.body.data.id as string;
    const stolen = await otherAgent.get(`/api/v1/customer/documents/${documentId}/download`);
    expect(stolen.status).toBe(404);

    const updated = await adminSession.agent
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('x-csrf-token', adminSession.csrf)
      .send({ status: 'documents_pending', note: 'PAN received', customerVisible: true });
    expect(updated.status).toBe(200);
    const seen = await customerAgent.get(`/api/v1/customer/orders/${orderId}`);
    expect(seen.body.data.order.status).toBe('documents_pending');
    expect(seen.body.data.application.timeline.some((item: { note: string }) => item.note === 'PAN received')).toBe(true);

    const tracked = await (await import('supertest')).default(app).post('/api/v1/applications/track').send({ referenceNumber: reference, email: 'meera@example.com' });
    expect(tracked.status).toBe(200);
    expect(tracked.body.data.status).toBe('documents_pending');
  });

  it('verifies payment signatures and ignores duplicate webhooks', async () => {
    const { service, pack } = await catalogue();
    const admin = await makeStaff('super_admin', 'pay-admin@example.com');
    const session = await signIn(app, admin.email, admin.password);
    const customerAgent = (await import('supertest')).default.agent(app);
    const csrf = await customerAgent.get('/api/v1/auth/csrf');
    const registered = await customerAgent.post('/api/v1/auth/register').set('x-csrf-token', csrf.body.data.token).send({
      name: 'Pay Customer',
      email: 'pay@example.com',
      phone: '9811111116',
      password: 'Password12345',
      consent: true,
    });
    expect(registered.status).toBe(201);
    const customerCsrfToken = csrfFrom(registered.headers['set-cookie'] as string[]);
    const orderRes = await session.agent.post('/api/v1/admin/orders').set('x-csrf-token', session.csrf).send({
      customerId: registered.body.data.customerId,
      serviceId: String(service._id),
      packageId: String(pack._id),
      addOnNames: [],
    });
    const orderId = orderRes.body.data.order._id as string;
    const started = await customerAgent.post(`/api/v1/customer/orders/${orderId}/pay`).set('x-csrf-token', customerCsrfToken);
    expect(started.body.data.configured).toBe(false);
    const payment = await Payment.findById(started.body.data.paymentId);
    payment!.providerOrderId = 'order_test_1';
    await payment!.save();
    const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update('order_test_1|pay_test_1').digest('hex');
    const verified = await customerAgent.post('/api/v1/customer/payments/verify').set('x-csrf-token', customerCsrfToken).send({
      paymentId: String(payment!._id),
      providerOrderId: 'order_test_1',
      providerPaymentId: 'pay_test_1',
      signature,
    });
    expect(verified.status).toBe(200);
    expect(verified.body.data.status).toBe('captured');
    const again = await customerAgent.post('/api/v1/customer/payments/verify').set('x-csrf-token', customerCsrfToken).send({
      paymentId: String(payment!._id),
      providerOrderId: 'order_test_1',
      providerPaymentId: 'pay_test_1',
      signature,
    });
    expect(again.body.data.duplicate).toBe(true);

    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_test_1', order_id: 'order_test_1', amount: payment!.amountPaise, status: 'captured' } } },
    });
    const webhookSignature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '').update(payload).digest('hex');
    const request = (await import('supertest')).default(app);
    const first = await request.post('/api/v1/payments/webhook/razorpay').set('content-type', 'application/json').set('x-razorpay-signature', webhookSignature).set('x-razorpay-event-id', 'evt_1').send(payload);
    const second = await request.post('/api/v1/payments/webhook/razorpay').set('content-type', 'application/json').set('x-razorpay-signature', webhookSignature).set('x-razorpay-event-id', 'evt_1').send(payload);
    expect(first.status, JSON.stringify(first.body)).toBe(200);
    expect(second.body.data.duplicate).toBe(true);
    const bad = await request.post('/api/v1/payments/webhook/razorpay').set('content-type', 'application/json').set('x-razorpay-signature', 'bad').send(payload);
    expect(bad.status).toBe(400);
  });

  it('publishes blog posts and keeps drafts private', async () => {
    const editor = await makeStaff('content_editor', 'writer@example.com');
    const session = await signIn(app, editor.email, editor.password);
    const created = await session.agent.post('/api/v1/admin/posts').set('x-csrf-token', session.csrf).send({
      title: 'How to prepare a filing',
      excerpt: 'A short guide',
      content: 'Word '.repeat(220),
      status: 'draft',
      seo: { title: 'Prepare a filing', description: 'A short guide for applicants', index: true },
    });
    expect(created.status).toBe(201);
    const hidden = await (await import('supertest')).default(app).get('/api/v1/posts');
    expect(hidden.body.data).toHaveLength(0);
    const published = await session.agent.patch(`/api/v1/admin/posts/${created.body.data._id}`).set('x-csrf-token', session.csrf).send({ status: 'published' });
    expect(published.status).toBe(200);
    const visible = await (await import('supertest')).default(app).get(`/api/v1/posts/${published.body.data.slug}`);
    expect(visible.status).toBe(200);
    expect(visible.body.data.seo.title).toBe('Prepare a filing');
    expect(visible.body.data.readingTimeMinutes).toBeGreaterThan(0);
  });
});
