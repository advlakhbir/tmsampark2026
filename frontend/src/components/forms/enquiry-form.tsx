'use client';

import { enquirySchema } from '@tmsampark/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button, TextArea, TextField } from '@/components/ui/primitives';
import { ApiError, api } from '@/lib/api';

type FormValues = z.infer<typeof enquirySchema>;

export function EnquiryForm({
  source,
  serviceSlug,
  heading = 'Tell us what you need',
}: {
  source: FormValues['source'];
  serviceSlug?: string;
  heading?: string;
}) {
  const [done, setDone] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const form = useForm<FormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      source,
      serviceSlug: serviceSlug || '',
      consent: undefined as unknown as true,
      companyWebsite: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setFormError('');
    let utm: FormValues['utm'];
    let landingPath = '';
    try {
      utm = JSON.parse(sessionStorage.getItem('tms_utm') || '{}');
      landingPath = sessionStorage.getItem('tms_landing') || '';
    } catch {
      utm = undefined;
    }
    try {
      const result = await api<{ id?: string; duplicate?: boolean; stored?: boolean }>('/enquiries', {
        method: 'POST',
        body: JSON.stringify({ ...values, utm, landingPath, serviceSlug: serviceSlug || values.serviceSlug }),
      });
      if (result.stored === false) {
        setDone('Thanks. If this was a genuine enquiry, please send it again without extra website fields.');
        return;
      }
      setDone(result.duplicate ? 'We already have a recent enquiry with these details and will use that request.' : 'Your enquiry is saved. A team member will reply using the contact details you entered.');
      form.reset({ ...values, message: '', consent: undefined as unknown as true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'The enquiry could not be saved.');
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-teal/30 bg-white p-6 shadow-card" role="status">
        <h2 className="text-xl font-semibold text-navy">Request received</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{done}</p>
        <button className="mt-4 text-sm font-semibold text-royal" onClick={() => setDone(null)}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-semibold text-navy">{heading}</h2>
      <p className="mt-1 text-sm text-slate-600">This is an enquiry, not a government filing. We reply before any application is prepared.</p>
      <div className="mt-5 grid gap-4">
        <TextField label="Name" {...form.register('name')} error={form.formState.errors.name?.message} />
        <TextField label="Email" type="email" autoComplete="email" {...form.register('email')} error={form.formState.errors.email?.message} />
        <TextField label="Phone" autoComplete="tel" {...form.register('phone')} error={form.formState.errors.phone?.message} />
        <TextArea label="How can we help?" {...form.register('message')} error={form.formState.errors.message?.message} />
        <label className="absolute left-[-9999px]" aria-hidden="true">
          Company website
          <input tabIndex={-1} autoComplete="off" {...form.register('companyWebsite')} />
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" {...form.register('consent')} />
          <span>I agree that TMSAMPARK may use these details to respond to this enquiry, as described in the privacy notice.</span>
        </label>
        {form.formState.errors.consent ? <p className="text-sm text-red-700">{form.formState.errors.consent.message}</p> : null}
        {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Sending…' : 'Submit enquiry'}
        </Button>
      </div>
    </form>
  );
}
