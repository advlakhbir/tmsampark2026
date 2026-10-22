'use client';

import { formatInr } from '@tmsampark/shared';
import { useResource } from '@/components/admin/resource';

export default function PaymentsPage() {
  const { data, loading } = useResource<{ payments: { _id: string; amountPaise: number; status: string; provider: string }[]; invoices: { _id: string; number: string; totalPaise: number }[] }>('/customer/payments');
  if (loading) return <div className="h-24 animate-pulse rounded bg-slate-100" />;
  return (
    <div className="space-y-4 text-sm">
      <h1 className="text-2xl font-semibold text-navy">Payments</h1>
      <ul>{(data?.payments || []).map((payment) => <li key={payment._id}>{payment.provider} · {formatInr(payment.amountPaise)} · {payment.status}</li>)}</ul>
      <h2 className="font-semibold">Invoices</h2>
      <ul>{(data?.invoices || []).map((invoice) => <li key={invoice._id}>{invoice.number} · {formatInr(invoice.totalPaise)}</li>)}</ul>
    </div>
  );
}
