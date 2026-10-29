"use client";

import {
  BrainCircuit,
  Flag,
  Gavel,
  ListChecks,
  MessageSquare,
  Play,
  Scale,
  ShieldCheck,
  ShieldX,
  Square,
  Swords,
  Terminal,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { TraceEvent } from "@/lib/skillcrash/types";
import { VerdictBadge } from "./badges";

/* ------------------------- per-event presentation ------------------------- */

function fmtT(t: number): string {
  return `t+${t.toFixed(3)}s`;
}

function argPreview(args: Record<string, unknown>): string {
  const inner = Object.entries(args)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(", ");
  return `{ ${inner} }`;
}

interface EventStyle {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "accent" | "bad" | "ok" | "warn" | "neutral";
  label: string;
}

function eventStyle(e: TraceEvent): EventStyle {
  switch (e.type) {
    case "run-start":
      return { icon: Play, tone: "accent", label: "run-start" };
    case "attack-prompt":
      return { icon: Swords, tone: "bad", label: "attack-prompt" };
    case "agent-message":
      return { icon: BrainCircuit, tone: "neutral", label: "agent-message" };
    case "tool-call":
      return { icon: Wrench, tone: "accent", label: "tool-call" };
    case "tool-validation":
      return e.ok ? { icon: ShieldCheck, tone: "neutral", label: "tool-validation" } : { icon: ShieldX, tone: "bad", label: "tool-validation" };
    case "tool-result":
      return e.blocked ? { icon: ShieldX, tone: "bad", label: "tool-result · BLOCKED" } : { icon: Terminal, tone: e.ok ? "ok" : "warn", label: "tool-result" };
    case "agent-final":
      return { icon: Flag, tone: "neutral", label: "agent-final" };
    case "run-end":
      return { icon: Square, tone: e.outcome === "completed" ? "neutral" : "warn", label: `run-end · ${e.outcome}` };
    case "judge-start":
      return { icon: Scale, tone: "accent", label: "judge-start" };
    case "judge-rule":
      return { icon: ListChecks, tone: e.satisfied ? "ok" : "bad", label: `judge-rule · ${e.ruleId}` };
    case "judge-verdict":
      return { icon: Gavel, tone: e.outcome === "PASS" ? "ok" : e.outcome === "FAIL" ? "bad" : "warn", label: "judge-verdict" };
  }
}

const TONE_ICON = {
  accent: "text-accent bg-accent/10 border-accent/25",
  bad: "text-bad bg-bad/10 border-bad/30",
  ok: "text-ok bg-ok/10 border-ok/25",
  warn: "text-warn bg-warn/10 border-warn/30",
  neutral: "text-ink-2 bg-raised border-line",
} as const;

/* ------------------------------ event row ------------------------------ */

export function TraceEventRow({ event }: { event: TraceEvent }) {
  const style = eventStyle(event);
  const Icon = style.icon;

  return (
    <div className="relative grid grid-cols-[86px_28px_1fr] gap-2 py-1.5 sm:grid-cols-[104px_28px_1fr]">
      <div className="pt-1 text-right font-mono text-[10px] leading-5 text-ink-3 tabular-nums">
        {fmtT(event.t)}
      </div>
      <div className="flex justify-center pt-0.5">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded border", TONE_ICON[style.tone])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
      <div className="min-w-0 pb-1">
        <div className="sc-mono-label mb-0.5">{style.label}</div>
        <EventBody event={event} />
      </div>
    </div>
  );
}

function EventBody({ event }: { event: TraceEvent }) {
  switch (event.type) {
    case "run-start":
      return (
        <p className="text-[13px] leading-relaxed text-ink-2">
          Run started for <span className="font-mono text-ink">{event.testId}</span> — agent:{" "}
          <span className="font-mono text-ink">{event.agent}</span>{" "}
          <span className="sc-chip ml-1 border-warn/30 text-warn">simulated</span>
        </p>
      );
    case "attack-prompt":
      return (
        <blockquote className="rounded border border-bad/25 bg-bad/[0.06] px-3 py-2 text-[13px] leading-relaxed text-ink-2">
          <Zap className="mr-1.5 mb-0.5 inline h-3.5 w-3.5 text-bad" strokeWidth={2.2} />
          {event.content}
        </blockquote>
      );
    case "agent-message":
      return (
        <p className="rounded border border-line bg-raised px-3 py-2 text-[13px] leading-relaxed text-ink-2">
          {event.content}
        </p>
      );
    case "tool-call":
      return (
        <div className="rounded border border-accent/25 bg-accent/[0.05] px-3 py-2 font-mono text-[12px] leading-relaxed break-all">
          <span className="text-accent">{event.tool}</span>
          <span className="text-ink-3">(</span>
          <span className="text-ink-2">{argPreview(event.args).slice(2, -2)}</span>
          <span className="text-ink-3">)</span>
        </div>
      );
    case "tool-validation":
      return (
        <p className={cn("text-[13px] leading-relaxed", event.ok ? "text-ink-2" : "sc-text-bad-hi")}>
          {event.ok ? (
            <>
              Arguments valid — <span className="font-mono text-ink">{event.tool}</span> is allowlisted and the
              argument schema passed.
            </>
          ) : (
            <>
              Validation failed — {event.reason}{" "}
              <span className="sc-chip ml-1 border-bad/30 text-bad">{event.blockedBy}</span>
            </>
          )}
        </p>
      );
    case "tool-result":
      return (
        <div
          className={cn(
            "rounded border px-3 py-2 font-mono text-[12px] leading-relaxed break-all",
            event.blocked ? "border-bad/30 bg-bad/[0.06] sc-text-bad-hi" : "border-line bg-inset text-ink-2"
          )}
        >
          {event.blocked && (
            <span className="mr-2 rounded border border-bad/40 bg-bad/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-bad uppercase">
              blocked
            </span>
          )}
          {event.output}
        </div>
      );
    case "agent-final":
      return (
        <p className="rounded border border-line bg-raised px-3 py-2 text-[13px] leading-relaxed text-ink">
          <Flag className="mr-1.5 mb-0.5 inline h-3.5 w-3.5 text-ink-3" strokeWidth={2} />
          {event.content}
        </p>
      );
    case "run-end":
      return (
        <p className="text-[13px] leading-relaxed text-ink-2">
          Run ended — <span className="font-mono text-ink">{event.outcome}</span> after {event.stepCount} agent
          step{event.stepCount === 1 ? "" : "s"}.
          {event.detail && <span className="text-warn"> {event.detail}</span>}
        </p>
      );
    case "judge-start":
      return (
        <p className="text-[13px] leading-relaxed text-ink-2">
          Deterministic judge engaged — <span className="font-mono text-ink">{event.rulesCount}</span> approved
          rule{event.rulesCount === 1 ? "" : "s"} to evaluate. No model involvement.
        </p>
      );
    case "judge-rule":
      return (
        <div
          className={cn(
            "rounded border px-3 py-2 text-[13px] leading-relaxed",
            event.satisfied ? "border-ok/25 bg-ok/[0.05] text-ink-2" : "border-bad/30 bg-bad/[0.06] text-ink-2"
          )}
        >
          <span className={cn("mr-1.5 font-mono font-semibold", event.satisfied ? "text-ok" : "text-bad")}>
            {event.ruleId} {event.satisfied ? "✓ satisfied" : "✗ violated"}
          </span>
          — {event.detail}
        </div>
      );
    case "judge-verdict":
      return (
        <div className="flex flex-wrap items-center gap-3 rounded border border-line bg-raised px-3 py-2.5">
          <VerdictBadge outcome={event.outcome} size="md" />
          <p className="text-[13px] leading-relaxed text-ink-2">{event.reason}</p>
        </div>
      );
  }
}

/* ------------------------------ timeline ------------------------------ */

export function TraceTimeline({
  events,
  autoScroll = false,
  className,
}: {
  events: TraceEvent[];
  autoScroll?: boolean;
  className?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [events.length, autoScroll]);

  if (events.length === 0) {
    return (
      <div className={cn("flex h-full min-h-40 items-center justify-center", className)}>
        <p className="font-mono text-[12px] text-ink-3">
          No events recorded yet — run a test to capture its execution trace.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden
        className="absolute top-2 bottom-2 left-[98px] w-px bg-line sm:left-[116px]"
      />
      <div role="list" className="sc-fade-up relative">
        {events.map((e) => (
          <div role="listitem" key={e.seq} className="relative">
            <TraceEventRow event={e} />
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

/* ------------------------------ raw view ------------------------------ */

export function RawTraceView({ events, className }: { events: TraceEvent[]; className?: string }) {
  if (events.length === 0) {
    return (
      <div className={cn("flex h-full min-h-40 items-center justify-center", className)}>
        <p className="font-mono text-[12px] text-ink-3">Nothing to show — the trace is empty.</p>
      </div>
    );
  }
  return (
    <pre
      className={cn(
        "sc-scroll h-full overflow-auto rounded-md border border-line bg-inset p-3 font-mono text-[11.5px] leading-[1.6] text-ink-2",
        className
      )}
    >
      {JSON.stringify(events, null, 2)}
    </pre>
  );
}
