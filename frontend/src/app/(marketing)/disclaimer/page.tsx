import type { Metadata } from 'next';
import { Policy, policyMetadata } from '@/components/content/policy';

export async function generateMetadata(): Promise<Metadata> {
  return policyMetadata('disclaimer', '/disclaimer');
}

export default function Page() {
  return <Policy kind="disclaimer" />;
}
