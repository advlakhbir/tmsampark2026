import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Markdown } from '@/components/content/markdown';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { serverFetch } from '@/lib/api';
import { buildMetadata, siteUrl } from '@/lib/seo';

type Post = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  publishedAt?: string;
  readingTimeMinutes: number;
  seo?: { title?: string; description?: string; index?: boolean; canonical?: string };
  related?: { title: string; slug: string; excerpt: string }[];
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await serverFetch<Post>(`/posts/${slug}`);
  if (!post) return buildMetadata({ title: 'Guide', description: 'Guide', path: `/blogs/${slug}`, index: false });
  return buildMetadata({
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    path: `/blogs/${slug}`,
    canonical: post.seo?.canonical,
    index: post.seo?.index !== false,
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await serverFetch<Post>(`/posts/${slug}`);
  if (!post) notFound();
  const url = `${siteUrl()}/blogs/${slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: post.authorName },
    description: post.excerpt,
    mainEntityOfPage: url,
  };
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/blogs', label: 'Guides' }, { label: post.title }]} />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy">{post.title}</h1>
      <p className="mt-3 text-sm text-slate-500">{post.authorName}, {post.authorRole}{post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString('en-IN')}` : ''} · {post.readingTimeMinutes} min read</p>
      <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-950">Educational note. Not legal, tax, or filing advice for your situation.</p>
      <div className="mt-6"><Markdown source={post.content} /></div>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`}>Share on X</a>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}>Share on LinkedIn</a>
      </div>
      {post.related?.length ? (
        <aside className="mt-10">
          <h2 className="text-lg font-semibold text-navy">Related reading</h2>
          <ul className="mt-2 space-y-2 text-sm">{post.related.map((item) => <li key={item.slug}><Link className="font-semibold text-royal" href={`/blogs/${item.slug}`}>{item.title}</Link></li>)}</ul>
        </aside>
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </article>
  );
}
