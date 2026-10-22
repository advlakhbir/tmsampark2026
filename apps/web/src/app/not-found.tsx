import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-sm font-semibold text-teal">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy">That page is not here</h1>
      <p className="mt-3 text-sm text-slate-600">The address may have changed. Try the service catalogue or the homepage.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-lg bg-royal px-4 py-2.5 text-sm font-semibold text-white">Home</Link>
        <Link href="/services" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Services</Link>
      </div>
    </div>
  );
}
