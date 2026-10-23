import type { Metadata } from 'next';
import { Policy, policyMetadata } from '@/components/content/policy';

export async function generateMetadata(): Promise<Metadata> {
  return policyMetadata('refund', '/refund-policy');
}

export default function Page() {
  return <Policy kind="refund" />;
}
