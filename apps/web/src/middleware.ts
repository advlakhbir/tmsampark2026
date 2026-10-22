import { NextResponse, type NextRequest } from 'next/server';

type RedirectRow = { fromPath: string; toPath: string; statusCode: number };
let cache: { at: number; rows: RedirectRow[] } = { at: 0, rows: [] };

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/admin') || pathname.startsWith('/customer')) {
    return NextResponse.next();
  }
  if (Date.now() - cache.at > 60_000) {
    try {
      const response = await fetch(`${process.env.API_URL || 'http://127.0.0.1:4000'}/api/v1/redirects`);
      if (response.ok) {
        const json = (await response.json()) as { data: RedirectRow[] };
        cache = { at: Date.now(), rows: json.data || [] };
      }
    } catch {
      cache = { ...cache, at: Date.now() };
    }
  }
  const match = cache.rows.find((row) => row.fromPath === pathname);
  if (!match) return NextResponse.next();
  return NextResponse.redirect(new URL(match.toPath, request.url), match.statusCode);
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'] };
