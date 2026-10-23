'use client';

import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { useRef, type PointerEvent, type ReactNode } from 'react';

const slabs = [
  { href: '/services/company-registration', index: '01', title: 'Business Registration', note: 'Companies, LLPs, and OPC', x: -36, y: 86, z: 110 },
  { href: '/services/annual-compliance', index: '02', title: 'Compliance', note: 'Returns and annual filings', x: 128, y: 18, z: 36 },
  { href: '/services', index: '03', title: 'HR Solutions', note: 'People and workplace records', x: -148, y: 4, z: 64 },
  { href: '/services/legal-documentation', index: '04', title: 'Legal Tech', note: 'Documents and trademarks', x: 18, y: -96, z: 150 },
];

export function PlatformStage() {
  const reduce = useReducedMotion();
  const world = useRef<HTMLDivElement>(null);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (reduce || !world.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    world.current.style.transform = `rotateX(${(14 - y * 7).toFixed(2)}deg) rotateY(${(-16 + x * 12).toFixed(2)}deg)`;
  }

  function reset() {
    if (world.current) world.current.style.transform = '';
  }

  return (
    <div className="stage" onPointerMove={tilt} onPointerLeave={reset}>
      <div ref={world} className="stage-world">
        <div className="stage-floor" />
        {slabs.map((slab) => (
          <Link
            key={slab.title}
            href={slab.href}
            className="stage-slab"
            style={{ transform: `translate3d(${slab.x}px, ${slab.y}px, ${slab.z}px)` }}
          >
            <span className="stage-slab-body">
              <span className="stage-index">{slab.index}</span>
              <span>
                <span className="block text-sm font-semibold text-navy">{slab.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{slab.note}</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DepthCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const card = useRef<HTMLDivElement>(null);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (reduce || !card.current) return;
    const box = card.current.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    card.current.style.transform = `rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateZ(10px)`;
  }

  function reset() {
    if (card.current) card.current.style.transform = '';
  }

  return (
    <div className={`h-full [perspective:900px] ${className}`}>
      <div ref={card} className="depth-card h-full" onPointerMove={tilt} onPointerLeave={reset}>
        {children}
      </div>
    </div>
  );
}
