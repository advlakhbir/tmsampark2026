'use client';

import { useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

export default function NotificationsPage() {
  const { data, reload } = useResource<{ _id: string; title: string; body: string; readAt?: string }[]>('/customer/notifications');
  return (
    <ul className="space-y-2 text-sm">
      {(data || []).map((item) => (
        <li key={item._id} className="rounded-xl border bg-white p-4">
          <p className="font-semibold">{item.title}</p>
          <p>{item.body}</p>
          {!item.readAt ? <button className="mt-2 text-royal" onClick={() => void api(`/customer/notifications/${item._id}/read`, { method: 'POST' }).then(() => reload())}>Mark read</button> : null}
        </li>
      ))}
    </ul>
  );
}
