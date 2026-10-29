"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Monospace code block with copy button — used for prompts, JSON, diffs. */
export function CodeBlock({
  code,
  className,
  label,
  maxHeight,
  showLineNumbers = false,
}: {
  code: string;
  className?: string;
  label?: string;
  maxHeight?: number;
  showLineNumbers?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const lines = code.split("\n");

  return (
    <div className={cn("group relative overflow-hidden rounded-md border border-line bg-inset", className)}>
      {label && (
        <div className="flex items-center justify-between border-b border-line bg-raised px-3 py-1.5">
          <span className="sc-mono-label">{label}</span>
        </div>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy to clipboard"
        className="absolute top-2 right-2 z-10 rounded border border-line bg-surface/90 p-1.5 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:text-ink"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre
        className="sc-scroll overflow-auto p-3 font-mono text-[12px] leading-[1.65] text-ink-2"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <code>
          {showLineNumbers
            ? lines.map((l, i) => (
                <span key={i} className="grid grid-cols-[3ch_1fr] gap-3">
                  <span className="select-none text-right text-ink-3/60">{i + 1}</span>
                  <span className="whitespace-pre-wrap break-words text-ink-2">{l || " "}</span>
                </span>
              ))
            : code}
        </code>
      </pre>
    </div>
  );
}
