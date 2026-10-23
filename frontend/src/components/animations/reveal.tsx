'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ y: 8 }} whileInView={{ y: 0 }} viewport={{ once: true, margin: '0px 0px -40px' }} transition={{ duration: 0.35, delay }}>
      {children}
    </motion.div>
  );
}

export function Stagger({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
  return (
    <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" initial="hidden" whileInView="show" viewport={{ once: true }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <div>{children}</div>;
  return <motion.div variants={{ hidden: { y: 8 }, show: { y: 0 } }}>{children}</motion.div>;
}
