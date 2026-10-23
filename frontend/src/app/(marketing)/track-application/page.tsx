import type { Metadata } from 'next';
import { TrackForm } from './track-form';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Track an application',
  description: 'Look up a TMSAMPARK application with its reference number and email address.',
  path: '/track-application',
  index: false,
});

export default function TrackPage() {
  return <TrackForm />;
}
