# Technical SEO checklist

This checklist describes what the site implements. It does not promise rankings or traffic.

## Implemented

- Server-rendered public pages with unique titles and descriptions from the database where a page has its own SEO fields.
- Canonical URLs. Filtered service and guide searches are `noindex` and canonicalise to the clean listing.
- `app/sitemap.ts` lists the homepage, catalogue, published services, and published guides. Draft policies stay out until they are marked reviewed.
- `app/robots.ts` disallows `/admin`, `/customer`, `/login`, `/register`, `/reset-password`, and `/api`.
- Open Graph and Twitter card fields on public pages.
- One `h1` per public template, breadcrumbs, and descriptive link text.
- JSON-LD: Organization. ProfessionalService is added only when an address is saved and the organisation is marked verified. Service on service pages. Article on guides. FAQPage on the FAQ page and on a service page that has its own questions. No aggregate ratings, invented reviews, or sample prices.
- Custom 404.
- Slug changes write a 301 in the redirect collection. Website middleware applies those redirects.
- Private areas send `noindex`.
- Images use the SVG logo and next/font with `display: swap`.

## Submit the sitemap

1. Deploy the site on the final HTTPS domain.
2. Set `NEXT_PUBLIC_SITE_URL` to that origin and rebuild so canonicals and the sitemap use it.
3. Open Google Search Console and add the domain property, or the URL-prefix property.
4. Verify ownership with the DNS record or the HTML file Google gives you. Do not invent a verification token in the repo.
5. In Sitemaps, submit `https://YOUR_DOMAIN/sitemap.xml`.
6. Inspect the homepage, one service URL, and one guide with URL Inspection after the first crawl.
7. Use the Page indexing report for excluded URLs. Admin and account URLs should stay excluded.

Repeat the sitemap submission in Bing Webmaster Tools if you want that index as well.

## Ongoing

- Write a unique summary for every service. Do not generate city doorway pages.
- Keep FAQ answers specific to the service.
- When a slug changes, confirm the redirect in an incognito window.
- Re-check structured data in the Rich Results Test after policy or service edits. Do not add review stars unless the page shows reviews that Google’s current guidelines allow, and only if those reviews are real.
