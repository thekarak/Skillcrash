import { AlertTriangle, CheckCircle2, CircleSlash, Loader2, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunStatus, VerdictOutcome } from "@/lib/skillcrash/types";

/** Verdict chip — PASS / FAIL / ERROR with restrained, semantic colour. */
export function VerdictBadge({
  outcome,
  size = "md",
  className,
}: {
  outcome: VerdictOutcome;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const cfg = {
    PASS: { icon: CheckCircle2, cls: "text-ok border-ok/35 bg-ok/10", dot: "bg-ok" },
    FAIL: { icon: CircleSlash, cls: "text-bad border-bad/40 bg-bad/10", dot: "bg-bad" },
    ERROR: { icon: AlertTriangle, cls: "text-warn border-warn/40 bg-warn/10", dot: "bg-warn" },
  }[outcome];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border font-mono font-medium tracking-[0.1em] uppercase",
        cfg.cls,
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        size === "md" && "px-2 py-1 text-[11px]",
        size === "lg" && "px-3 py-1.5 text-sm",
        className
      )}
    >
      <Icon className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={2.2} />
      {outcome}
    </span>
  );
}

/** Status dot for live indicators. */
export function StatusDot({
  tone = "accent",
  pulse = false,
  className,
}: {
  tone?: "accent" | "ok" | "bad" | "warn" | "idle";
  pulse?: boolean;
  className?: string;
}) {
  const color = {
    accent: "bg-accent",
    ok: "bg-ok",
    bad: "bg-bad",
    warn: "bg-warn",
    idle: "bg-ink-3",
  }[tone];
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", color, pulse && "sc-pulse-dot", className)} />;
}

export function RunStatusChip({ status, className }: { status: RunStatus; className?: string }) {
  if (status === "running") {
    return (
      <span className={cn("sc-chip text-accent", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        running
      </span>
    );
  }
  const map: Record<RunStatus, string> = {
    idle: "text-ink-3",
    running: "",
    done: "text-ok",
    error: "text-warn",
  };
  return (
    <span className={cn("sc-chip", map[status], className)}>
      <MinusCircle className="h-3 w-3" />
      {status}
    </span>
  );
}

/** Persistent, honest demo-mode badge. */
export function DemoBadge({
  label = "demo",
  title = "Local demo data — no live backend call",
  className,
}: {
  label?: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded border border-warn/35 bg-warn/10 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-warn",
        className
      )}
    >
      {label}
    </span>
  );
}
