'use client';

import { useParams } from 'next/navigation';
import { BlogEditor } from '@/components/admin/content';
export default function Page() {
  const params = useParams<{ id: string }>();
  return <BlogEditor id={params.id} />;
}
