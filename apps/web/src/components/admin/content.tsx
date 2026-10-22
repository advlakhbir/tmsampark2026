'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notice, Panel, useResource } from '@/components/admin/resource';
import { api } from '@/lib/api';

type Post = { _id: string; title: string; slug: string; status: string };

export function BlogAdmin() {
  const { data, error, loading, reload } = useResource<Post[]>('/admin/posts');
  const [title, setTitle] = useState('');
  async function create() {
    const post = await api<Post>('/admin/posts', { method: 'POST', body: JSON.stringify({ title, content: title, excerpt: title, status: 'draft' }) });
    setTitle('');
    await reload();
    location.href = `/admin/blog/${post._id}`;
  }
  return (
    <Panel title="Guides">
      <Notice loading={loading} error={error} />
      <div className="mb-4 flex gap-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New guide title" className="rounded border px-3 py-2" aria-label="Title" />
        <button className="rounded-lg bg-navy px-3 py-2 text-sm text-white" onClick={() => void create()}>Create draft</button>
      </div>
      <ul className="text-sm">{(data || []).map((post) => <li key={post._id} className="border-b py-2"><Link className="font-semibold text-royal" href={`/admin/blog/${post._id}`}>{post.title}</Link> · {post.status}</li>)}</ul>
    </Panel>
  );
}

export function BlogEditor({ id }: { id: string }) {
  const posts = useResource<Post[]>('/admin/posts');
  const post = posts.data?.find((item) => item._id === id);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!post || loaded) return;
    setStatus(post.status);
    setSeoTitle(post.title);
    setLoaded(true);
  }, [post, loaded]);
  async function save() {
    await api(`/admin/posts/${id}`, { method: 'PATCH', body: JSON.stringify({ content, status, seo: { title: seoTitle, description: seoDescription, index: status === 'published', canonical: '', ogImage: '' } }) });
    await posts.reload();
  }
  return (
    <Panel title={post?.title || 'Guide'}>
      <div className="grid gap-3">
        <textarea className="min-h-48 rounded border px-3 py-2" value={content} onChange={(event) => setContent(event.target.value)} aria-label="Content" placeholder="Write the guide in short paragraphs." />
        <input className="rounded border px-3 py-2" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} aria-label="SEO title" />
        <textarea className="rounded border px-3 py-2" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} aria-label="Meta description" />
        <p className="rounded bg-paper p-3 text-sm"><strong>{seoTitle}</strong><br />{seoDescription}</p>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded border px-3 py-2" aria-label="Status">
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
        <button className="rounded-lg bg-royal px-4 py-2 text-sm font-semibold text-white" onClick={() => void save()}>Save</button>
      </div>
    </Panel>
  );
}

export function FaqAdmin() {
  const { data, error, loading, reload } = useResource<{ _id: string; question: string; answer: string; status: string }[]>('/admin/faqs');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  async function create() {
    await api('/admin/faqs', { method: 'POST', body: JSON.stringify({ question, answer, status: 'published', placement: 'both' }) });
    setQuestion('');
    setAnswer('');
    await reload();
  }
  return (
    <Panel title="FAQs">
      <Notice loading={loading} error={error} />
      <div className="mb-4 grid gap-2">
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Question" className="rounded border px-3 py-2" aria-label="Question" />
        <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Answer" className="rounded border px-3 py-2" aria-label="Answer" />
        <button className="w-fit rounded-lg bg-navy px-3 py-2 text-sm text-white" onClick={() => void create()}>Publish FAQ</button>
      </div>
      <ul className="space-y-2 text-sm">{(data || []).map((faq) => <li key={faq._id}><strong>{faq.question}</strong><p>{faq.answer}</p></li>)}</ul>
    </Panel>
  );
}

export function TestimonialAdmin() {
  const { data, error, loading, reload } = useResource<{ _id: string; quote: string; personName: string; status: string }[]>('/admin/testimonials');
  const [quote, setQuote] = useState('');
  const [personName, setPersonName] = useState('');
  const [authorized, setAuthorized] = useState(false);
  async function create() {
    await api('/admin/testimonials', { method: 'POST', body: JSON.stringify({ quote, personName, authorized: true, status: 'published' }) });
    setQuote('');
    setPersonName('');
    setAuthorized(false);
    await reload();
  }
  return (
    <Panel title="Testimonials">
      <Notice loading={loading} error={error} empty={!loading && !data?.length ? 'No testimonials yet. Add one only if you have permission to publish it.' : ''} />
      <div className="mb-4 grid gap-2">
        <textarea value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="Quote" className="rounded border px-3 py-2" aria-label="Quote" />
        <input value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="Person's name" className="rounded border px-3 py-2" aria-label="Name" />
        <label className="text-sm"><input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} /> I confirm this testimonial is genuine and authorised for publication.</label>
        <button disabled={!authorized} className="w-fit rounded-lg bg-navy px-3 py-2 text-sm text-white disabled:opacity-50" onClick={() => void create()}>Publish</button>
      </div>
      <ul className="text-sm">{(data || []).map((item) => <li key={item._id} className="border-b py-2">{item.personName}: {item.quote}</li>)}</ul>
    </Panel>
  );
}
