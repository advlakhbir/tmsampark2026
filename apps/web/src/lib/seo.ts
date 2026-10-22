import type { Metadata } from 'next';

export type SeoInput = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  image?: string;
  canonical?: string;
};

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

export function buildMetadata(input: SeoInput): Metadata {
  const canonical = input.canonical || absoluteUrl(input.path);
  const index = input.index !== false;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: { index, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: 'TMSAMPARK',
      type: 'website',
      images: input.image ? [{ url: input.image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
    },
  };
}
