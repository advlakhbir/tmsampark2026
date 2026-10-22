'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Notice, Panel, useResource } from '@/components/admin/resource';

export function CustomersPage() {
  const { data, error, loading } = useResource<{ _id: string; name: string; email: string; phone: string; status: string }[]>('/admin/customers');
  return (
    <Panel title="Customers">
      <Notice loading={loading} error={error} empty={!loading && !data?.length ? 'No customers yet.' : ''} />
      <ul className="text-sm">{(data || []).map((customer) => <li key={customer._id} className="border-b py-2"><Link className="font-semibold text-royal" href={`/admin/customers/${customer._id}`}>{customer.name}</Link> · {customer.email}</li>)}</ul>
    </Panel>
  );
}

export function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, error, loading } = useResource<{ customer: { name: string; email: string; phone: string }; leads: { _id: string; status: string }[]; orders: { _id: string; referenceNumber: string }[]; documents: { _id: string; originalName: string }[]; tickets: { _id: string; subject: string; status: string }[] }>(`/admin/customers/${params.id}`);
  return (
    <Panel title={data?.customer.name || 'Customer'}>
      <Notice loading={loading} error={error} />
      {data ? (
        <div className="space-y-3 text-sm">
          <p>{data.customer.email} · {data.customer.phone}</p>
          <h2 className="font-semibold">Orders</h2>
          <ul>{data.orders.map((order) => <li key={order._id}><Link className="text-royal" href={`/admin/orders/${order._id}`}>{order.referenceNumber}</Link></li>)}</ul>
          <h2 className="font-semibold">Enquiries</h2>
          <ul>{data.leads.map((lead) => <li key={lead._id}>{lead.status}</li>)}</ul>
          <h2 className="font-semibold">Documents</h2>
          <ul>{data.documents.map((doc) => <li key={doc._id}>{doc.originalName}</li>)}</ul>
          <h2 className="font-semibold">Tickets</h2>
          <ul>{data.tickets.map((ticket) => <li key={ticket._id}><Link className="text-royal" href={`/admin/tickets/${ticket._id}`}>{ticket.subject}</Link></li>)}</ul>
        </div>
      ) : null}
    </Panel>
  );
}
