import type { Metadata } from 'next';
import { Policy, policyMetadata } from '@/components/content/policy';

export async function generateMetadata(): Promise<Metadata> {
  return policyMetadata('terms', '/terms-and-conditions');
}

export default function Page() {
  return <Policy kind="terms" />;
}
