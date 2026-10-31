"use client";

import { cn } from "@/lib/utils";

/**
 * Clean modern section header for landing page sections.
 */
export function SectionHeader({
  index,
  eyebrow,
  title,
  lede,
  className,
  children,
}: {
  index?: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <div className="flex items-center gap-2.5 mb-3">
        {index && (
          <span className="flex h-5 items-center rounded-sm bg-accent/10 px-2 font-mono text-[11px] font-semibold text-accent">
            {index}
          </span>
        )}
        <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
          {eyebrow}
        </p>
      </div>
      <h2 className="sc-h2">{title}</h2>
      {lede && <p className="sc-lede mt-3.5 max-w-2xl text-[15.5px] leading-relaxed text-ink-2">{lede}</p>}
      {children}
    </div>
  );
}
