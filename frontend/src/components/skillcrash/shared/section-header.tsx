"use client";

import { cn } from "@/lib/utils";

/**
 * Editorial section header — a consistent rhythm across the landing page:
 *
 *   [ 01 ]  THE PROBLEM ─────────────────────
 *   An agent can fail in the edge case
 *   you never tested.
 *   Supporting lede copy…
 *
 * The index is a small quiet chip (not the workflow stage numbers, which live
 * inside the sticky scene); the rule line anchors the heading to the grid.
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
      <div className="sc-section-head">
        {index && <span className="sc-section-index">[ {index} ]</span>}
        <p className="sc-eyebrow">{eyebrow}</p>
        <span aria-hidden className="sc-section-rule" />
      </div>
      <h2 className="sc-h2 mt-4">{title}</h2>
      {lede && <p className="sc-lede mt-4 max-w-2xl">{lede}</p>}
      {children}
    </div>
  );
}
