"use client";

import {
  BrainCircuit,
  Flag,
  Gavel,
  ListChecks,
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
      return { icon: Play, tone: "accent", label: "Test Run Started" };
    case "attack-prompt":
      return { icon: Swords, tone: "bad", label: "Adversarial Prompt" };
    case "agent-message":
      return { icon: BrainCircuit, tone: "neutral", label: "Agent Thought & Reasoning" };
    case "tool-call":
      return { icon: Wrench, tone: "accent", label: "Proposed Tool Call" };
    case "tool-validation":
      return e.ok
        ? { icon: ShieldCheck, tone: "neutral", label: "Tool Schema Approved" }
        : { icon: ShieldX, tone: "bad", label: "Tool Schema Rejected" };
    case "tool-result":
      return e.blocked
        ? { icon: ShieldX, tone: "bad", label: "Sandbox Policy Blocked" }
        : { icon: Terminal, tone: e.ok ? "ok" : "warn", label: "Sandbox Output" };
    case "agent-final":
      return { icon: Flag, tone: "neutral", label: "Agent Response" };
    case "run-end":
      return {
        icon: Square,
        tone: e.outcome === "completed" ? "neutral" : "warn",
        label: `Execution Finished (${e.outcome})`,
      };
    case "judge-start":
      return { icon: Scale, tone: "accent", label: "Rule Verification" };
    case "judge-rule":
      return {
        icon: ListChecks,
        tone: e.satisfied ? "ok" : "bad",
        label: `Policy Assertion (${e.ruleId})`,
      };
    case "judge-verdict":
      return {
        icon: Gavel,
        tone: e.outcome === "PASS" ? "ok" : e.outcome === "FAIL" ? "bad" : "warn",
        label: "Final Verdict",
      };
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
    <div className="relative grid grid-cols-[88px_32px_1fr] gap-2.5 py-2 sm:grid-cols-[108px_32px_1fr]">
      <div className="pt-1 text-right font-mono text-[11px] leading-5 text-ink-3 tabular-nums">
        {fmtT(event.t)}
      </div>
      <div className="flex justify-center pt-0.5">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border",
            TONE_ICON[style.tone]
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      <div className="min-w-0 pb-1">
        <div className="mb-1 font-mono text-[11px] font-semibold tracking-wider text-ink-3 uppercase">
          {style.label}
        </div>
        <EventBody event={event} />
      </div>
    </div>
  );
}

function EventBody({ event }: { event: TraceEvent }) {
  switch (event.type) {
    case "run-start":
      return (
        <p className="text-[14px] leading-relaxed text-ink-2">
          Test started for scenario <strong className="font-mono text-ink font-semibold">{event.testId}</strong> using agent{" "}
          <strong className="font-mono text-ink font-semibold">{event.agent}</strong>.{" "}
          {event.simulated ? (
            <span
              className="sc-chip ml-1.5 border-warn/30 bg-warn/10 text-warn text-[11px]"
              title="Executing in-browser with simulated agent logic."
            >
              Simulated Sandbox
            </span>
          ) : (
            <span
              className="sc-chip ml-1.5 border-ok/30 bg-ok/10 text-ok text-[11px]"
              title="Executing against live model API."
            >
              Live API
            </span>
          )}
        </p>
      );
    case "attack-prompt":
      return (
        <blockquote className="rounded-md border border-bad/30 bg-bad/[0.07] px-3.5 py-2.5 text-[14px] leading-relaxed text-ink-2">
          <Zap className="mr-1.5 mb-0.5 inline h-4 w-4 text-bad" strokeWidth={2.2} />
          {event.content}
        </blockquote>
      );
    case "agent-message":
      return (
        <p className="rounded-md border border-line bg-raised px-3.5 py-2.5 text-[14px] leading-relaxed text-ink-2">
          {event.content}
        </p>
      );
    case "tool-call":
      return (
        <div className="rounded-md border border-accent/30 bg-accent/[0.06] px-3.5 py-2.5 font-mono text-[13px] leading-relaxed break-all">
          <span className="font-semibold text-accent">{event.tool}</span>
          <span className="text-ink-3">(</span>
          <span className="text-ink-2">{argPreview(event.args).slice(2, -2)}</span>
          <span className="text-ink-3">)</span>
        </div>
      );
    case "tool-validation":
      return (
        <p
          className={cn(
            "text-[14px] leading-relaxed",
            event.ok ? "text-ink-2" : "sc-text-bad-hi font-medium"
          )}
        >
          {event.ok ? (
            <>
              Validation passed — <span className="font-mono font-semibold text-ink">{event.tool}</span> is an
              authorized mock tool and parameters match schema contracts.
            </>
          ) : (
            <>
              Validation rejected — {event.reason}{" "}
              <span className="sc-chip ml-1.5 border-bad/30 text-bad text-[11px]">{event.blockedBy}</span>
            </>
          )}
        </p>
      );
    case "tool-result":
      return (
        <div
          className={cn(
            "rounded-md border px-3.5 py-2.5 font-mono text-[13px] leading-relaxed break-all",
            event.blocked
              ? "border-bad/35 bg-bad/[0.08] sc-text-bad-hi"
              : "border-line bg-inset text-ink-2"
          )}
        >
          {event.blocked && (
            <span className="mr-2 rounded border border-bad/40 bg-bad/15 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-bad uppercase">
              Blocked by Policy
            </span>
          )}
          {event.output}
        </div>
      );
    case "agent-final":
      return (
        <p className="rounded-md border border-line bg-raised px-3.5 py-2.5 text-[14px] leading-relaxed text-ink">
          <Flag className="mr-1.5 mb-0.5 inline h-4 w-4 text-ink-3" strokeWidth={2} />
          {event.content}
        </p>
      );
    case "run-end":
      return (
        <p className="text-[14px] leading-relaxed text-ink-2">
          Execution finished with outcome: <strong className="font-mono font-semibold text-ink">{event.outcome}</strong> ({event.stepCount} agent{" "}
          step{event.stepCount === 1 ? "" : "s"}).
          {event.detail && <span className="text-warn font-medium"> {event.detail}</span>}
        </p>
      );
    case "judge-start":
      return (
        <p className="text-[14px] leading-relaxed text-ink-2">
          Deterministic verification started — checking <strong className="font-mono font-semibold text-ink">{event.rulesCount}</strong> approved
          safety assertion{event.rulesCount === 1 ? "" : "s"} against trace telemetry.
        </p>
      );
    case "judge-rule":
      return (
        <div
          className={cn(
            "rounded-md border px-3.5 py-2.5 text-[14px] leading-relaxed",
            event.satisfied
              ? "border-ok/30 bg-ok/[0.06] text-ink-2"
              : "border-bad/35 bg-bad/[0.07] text-ink-2"
          )}
        >
          <span className={cn("mr-2 font-mono font-bold", event.satisfied ? "text-ok" : "text-bad")}>
            {event.ruleId} {event.satisfied ? "✓ Satisfied" : "✗ Violated"}
          </span>
          — {event.detail}
        </div>
      );
    case "judge-verdict":
      return (
        <div className="flex flex-wrap items-center gap-3.5 rounded-md border border-line bg-raised px-4 py-3">
          <VerdictBadge outcome={event.outcome} size="md" />
          <p className="text-[14px] leading-relaxed text-ink font-medium">{event.reason}</p>
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
      <div className={cn("flex h-full min-h-40 items-center justify-center p-6 text-center", className)}>
        <p className="text-[14px] text-ink-3">
          No execution telemetry recorded yet. Start a test run to inspect its step-by-step trace.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden
        className="absolute top-2 bottom-2 left-[100px] w-px bg-line sm:left-[120px]"
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
      <div className={cn("flex h-full min-h-40 items-center justify-center p-6 text-center", className)}>
        <p className="text-[14px] text-ink-3">Trace telemetry is empty.</p>
      </div>
    );
  }
  return (
    <pre
      className={cn(
        "sc-scroll h-full overflow-auto rounded-md border border-line bg-inset p-3.5 font-mono text-[12.5px] leading-[1.65] text-ink-2",
        className
      )}
    >
      {JSON.stringify(events, null, 2)}
    </pre>
  );
}
