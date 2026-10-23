import Link from 'next/link';

export const BRAND_SLOGAN = 'All In One Platform For Business Registration, Compliance, HR & Legal Tech';

export function Logo({
  variant = 'header',
  className = '',
  priority = false,
}: {
  tone?: 'dark' | 'light';
  variant?: 'header' | 'lockup';
  className?: string;
  priority?: boolean;
}) {
  const frame = variant === 'header' ? 'h-16 w-auto' : 'h-auto w-full max-w-xl';
  return (
    <span className={`inline-flex rounded-md bg-white ${className}`}>
      <img
        src="/brand/tmsampark-logo.jpg"
        alt="TMSAMPARK"
        width={1024}
        height={378}
        className={frame}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </span>
  );
}

export function LogoLink({
  variant = 'header',
}: {
  tone?: 'dark' | 'light';
  variant?: 'header' | 'lockup';
}) {
  return (
    <Link href="/" className="rounded-md" aria-label="TMSAMPARK home">
      <Logo variant={variant} />
    </Link>
  );
}
