import { formatInr } from '@tmsampark/shared';

export type ServiceCard = {
  _id: string;
  name: string;
  slug: string;
  summary: string;
  categorySlug: string;
  categoryName: string;
  startingProfessionalFeePaise: number | null;
  timeline?: { estimate?: string; dependencies?: string[] };
  featured?: boolean;
  feeIsSample?: boolean;
  packages?: PackageRecord[];
  status?: string;
};

export type PackageRecord = {
  _id: string;
  name: string;
  description?: string;
  professionalFeePaise: number;
  governmentFeePaise?: number;
  governmentFeeNote?: string;
  included?: string[];
  excluded?: string[];
  highlighted?: boolean;
  feeIsSample?: boolean;
};

export type ServiceDetail = ServiceCard & {
  overview: string;
  whoNeeds: string[];
  benefits: string[];
  eligibility: string[];
  requirements: string[];
  documents: { name: string; description?: string; mandatory?: boolean }[];
  process: { title: string; description: string }[];
  deliverables: string[];
  addOns: { name: string; description?: string; pricePaise: number }[];
  faqs: { question: string; answer: string }[];
  related: { name: string; slug: string; summary: string; categorySlug: string }[];
  category: { name: string; slug: string };
  disclaimer: string;
  seo?: { title?: string; description?: string; canonical?: string; index?: boolean };
};

export function priceLabel(paise: number | null | undefined, sample?: boolean): string {
  if (paise == null) return 'Fee on request';
  return `${formatInr(paise)} professional fee${sample ? ' (sample)' : ''}`;
}
