import Link from 'next/link';

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href,
    })),
  };
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <li key={item.label} className="flex gap-2">
              {item.href ? <Link href={item.href} className="hover:text-navy">{item.label}</Link> : <span aria-current="page">{item.label}</span>}
              {index < items.length - 1 ? <span aria-hidden="true">/</span> : null}
            </li>
          ))}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
