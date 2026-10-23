import { buildMetadata } from '../src/lib/seo';
import { describe, expect, it } from 'vitest';

describe('SEO metadata', () => {
  it('sets a canonical URL and noindex when asked', () => {
    const meta = buildMetadata({
      title: 'Private limited assistance',
      description: 'Prepare the application',
      path: '/services/company-registration/private-limited-company-registration',
      index: false,
    });
    expect(meta.alternates?.canonical).toContain('/services/company-registration/private-limited-company-registration');
    expect(meta.robots).toMatchObject({ index: false, follow: true });
    expect(meta.openGraph?.title).toBe('Private limited assistance');
  });
});
