import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return buildMetadata({
    title: 'Guides',
    description: 'Educational notes on preparing company, tax, and trademark filings. These are not legal advice.',
    path: '/blogs',
    index: !q,
  });
}

export default async function BlogsPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const query = await searchParams;
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.tag) params.set('tag', query.tag);
  const posts = await serverFetch<{ title: string; slug: string; excerpt: string; tags: string[]; readingTimeMinutes: number; authorName: string; publishedAt?: string }[]>(`/posts?${params.toString()}`);
  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">Guides</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Practical notes from the TMSAMPARK editorial desk. They explain process. They are not advice for your facts.</p>
      <form className="mt-6 flex gap-2" action="/blogs">
        <label className="sr-only" htmlFor="blog-q">Search guides</label>
        <input id="blog-q" name="q" defaultValue={query.q || ''} className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Search guides" />
        <button className="rounded-lg bg-navy px-4 text-sm font-semibold text-white">Search</button>
      </form>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {(posts || []).map((post) => (
          <article key={post.slug} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-navy"><Link href={`/blogs/${post.slug}`}>{post.title}</Link></h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt}</p>
            <p className="mt-3 text-xs text-slate-500">{post.authorName} · {post.readingTimeMinutes} min read</p>
            <div className="mt-2 flex flex-wrap gap-2">{post.tags?.map((tag) => <Link key={tag} href={`/blogs?tag=${encodeURIComponent(tag)}`} className="text-xs font-semibold text-teal">{tag}</Link>)}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
