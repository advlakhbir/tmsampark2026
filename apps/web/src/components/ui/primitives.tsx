import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-royal text-white hover:bg-[#1d48b5] shadow-sm',
    secondary: 'border border-navy/15 bg-white text-navy hover:border-navy/40',
    ghost: 'text-navy hover:bg-white',
    danger: 'bg-red-700 text-white hover:bg-red-800',
  }[variant];
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60',
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const { label, error, id, ...rest } = props;
  const fieldId = id || rest.name;
  return (
    <label className="block text-sm" htmlFor={fieldId}>
      <span className="mb-1.5 block font-medium text-navy">{label}</span>
      <input id={fieldId} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-ink outline-none ring-teal focus:ring-2" {...rest} />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  const { label, error, id, ...rest } = props;
  const fieldId = id || rest.name;
  return (
    <label className="block text-sm" htmlFor={fieldId}>
      <span className="mb-1.5 block font-medium text-navy">{label}</span>
      <textarea id={fieldId} className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-ink outline-none ring-teal focus:ring-2" {...rest} />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
