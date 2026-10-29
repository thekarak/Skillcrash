"use client";

import { ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerdictBadge } from "./badges";

/**
 * Static DOM/SVG fallback for the execution pipeline — shown when WebGL is
 * unavailable (or as the compact diagram inside dense panels). It tells the
 * same story as the 3D hero: skill -> attack -> agent -> sandbox (blocked
 * secret upload) -> judge (FAIL).
 */
export function PipelineFallback({
  orientation = "horizontal",
  compact = false,
  className,
}: {
  orientation?: "horizontal" | "vertical";
  compact?: boolean;
  className?: string;
}) {
  const isV = orientation === "vertical";

  const nodes = [
    {
      id: "skill",
      title: "SKILL.md",
      sub: "parsed rules",
      tone: "neutral" as const,
    },
    {
      id: "attack",
      title: "ATTACK PROMPT",
      sub: "adversarial input",
      tone: "bad" as const,
    },
    {
      id: "agent",
      title: "GEMMA 4 AGENT",
      sub: "under test",
      tone: "accent" as const,
    },
    {
      id: "sandbox",
      title: "MOCK SANDBOX",
      sub: "upload_file(\".env\")",
      tone: "bad" as const,
      badge: "BLOCKED",
    },
    {
      id: "judge",
      title: "DETERMINISTIC JUDGE",
      sub: "rule-based verdict",
      tone: "bad" as const,
      badge: "FAIL",
    },
  ];

  return (
    <div
      className={cn(
        "flex w-full items-stretch",
        isV ? "flex-col gap-1.5" : "flex-row flex-wrap items-center gap-1.5",
        className
      )}
      role="img"
      aria-label="SkillCrash pipeline: skill, attack prompt, agent, mock sandbox blocking a secret upload, deterministic judge returning FAIL"
    >
      {nodes.map((n, i) => (
        <div key={n.id} className={cn("flex", isV ? "flex-col gap-1.5" : "flex-row items-center gap-1.5")}>
          <div
            className={cn(
              "relative rounded-md border bg-surface px-3 py-2.5",
              compact ? "min-w-[118px]" : "min-w-[132px] flex-1",
              n.tone === "bad" && "border-bad/40",
              n.tone === "accent" && "border-accent/40",
              n.tone === "neutral" && "border-line"
            )}
          >
            <div
              className={cn(
                "font-mono text-[11px] font-semibold tracking-[0.06em]",
                n.tone === "bad" && "text-bad",
                n.tone === "accent" && "text-accent",
                n.tone === "neutral" && "text-ink"
              )}
            >
              {n.title}
            </div>
            <div className="mt-1 font-mono text-[10px] text-ink-3">{n.sub}</div>
            {n.badge && (
              <div className="mt-2">
                {n.badge === "BLOCKED" ? (
                  <span className="inline-flex items-center gap-1 rounded border border-bad/45 bg-bad/10 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.1em] text-bad">
                    <ShieldX className="h-3 w-3" strokeWidth={2.4} />
                    BLOCKED
                  </span>
                ) : (
                  <VerdictBadge outcome="FAIL" size="sm" />
                )}
              </div>
            )}
          </div>
          {i < nodes.length - 1 && <Connector red={i >= 0} isV={isV} />}
        </div>
      ))}
    </div>
  );
}

function Connector({ red, isV }: { red: boolean; isV: boolean }) {
  return (
    <svg
      aria-hidden
      width={isV ? 20 : 30}
      height={isV ? 18 : 20}
      viewBox={isV ? "0 0 20 18" : "0 0 30 20"}
      className={cn("shrink-0", red ? "text-bad" : "text-ink-3")}
    >
      <line
        x1={isV ? 10 : 1}
        y1={isV ? 1 : 10}
        x2={isV ? 10 : 23}
        y2={isV ? 13 : 10}
        stroke="currentColor"
        strokeWidth="1.6"
        className="sc-dash-flow"
      />
      <path
        d={isV ? "M6 9 L10 14 L14 9" : "M22 5 L27 10 L22 15"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
