import type { Metadata } from 'next';
import { Policy, policyMetadata } from '@/components/content/policy';

export async function generateMetadata(): Promise<Metadata> {
  return policyMetadata('privacy', '/privacy-policy');
}

export default function Page() {
  return <Policy kind="privacy" />;
}
