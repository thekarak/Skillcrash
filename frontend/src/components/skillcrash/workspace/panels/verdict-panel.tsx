"use client";

import { Gavel, Link2 } from "lucide-react";
import { useSkillCrash } from "@/lib/skillcrash/store";
import { VerdictBadge } from "../../shared/badges";
import { cn } from "@/lib/utils";

/** Verdict panel — outcome, reason and per-rule evidence with trace refs. */
export function VerdictPanel() {
  const selectedTestId = useSkillCrash((s) => s.selectedTestId);
  const runsByTest = useSkillCrash((s) => s.runsByTest);
  const runningTestId = useSkillCrash((s) => s.runningTestId);

  const record = selectedTestId ? runsByTest[selectedTestId] : undefined;
  const isRunning = runningTestId === selectedTestId && selectedTestId !== null;

  return (
    <section aria-label="Test verdict" className="sc-panel p-4 sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Gavel className="h-4 w-4 text-accent" strokeWidth={2} />
        Verdict &amp; evidence
      </h2>

      {isRunning ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-line">
          <p className="font-mono text-[12px] text-ink-3">judging happens when the run completes…</p>
        </div>
      ) : !record ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-line">
          <p className="max-w-xs px-4 text-center text-[12.5px] leading-relaxed text-ink-3">
            No verdict yet. Run the selected test — the deterministic judge will score the recorded
            trace against the approved rules.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-md border px-3.5 py-3",
              record.verdict.outcome === "PASS" && "border-ok/30 bg-ok/[0.06]",
              record.verdict.outcome === "FAIL" && "border-bad/30 bg-bad/[0.06]",
              record.verdict.outcome === "ERROR" && "border-warn/30 bg-warn/[0.06]"
            )}
          >
            <VerdictBadge outcome={record.verdict.outcome} size="lg" />
            <p className="min-w-0 flex-1 text-[13px] leading-relaxed break-words text-ink-2">
              {record.verdict.reason}
            </p>
          </div>

          <ul className="space-y-2">
            {record.verdict.evidence.map((ev) => (
              <li
                key={ev.ruleId}
                className={cn(
                  "rounded-md border px-3 py-2.5",
                  ev.satisfied ? "border-ok/25 bg-ok/[0.04]" : "border-bad/30 bg-bad/[0.05]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 font-mono text-[11px] font-semibold text-ink">
                    <span className="break-words">{ev.ruleId} · {ev.description}</span>
                  </span>
                  <span className={cn("shrink-0 font-mono text-[10px] font-bold", ev.satisfied ? "text-ok" : "text-bad")}>
                    {ev.satisfied ? "SATISFIED" : "VIOLATED"}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed break-words text-ink-2">{ev.detail}</p>
                {ev.traceRefs.length > 0 && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-ink-3">
                    <Link2 className="h-3 w-3" />
                    trace refs:
                    {ev.traceRefs.map((seq) => (
                      <span key={seq} className="rounded border border-line bg-inset px-1 py-px text-ink-2">
                        #{seq}
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <p className="border-t border-line pt-2.5 font-mono text-[10.5px] leading-relaxed text-ink-3">
            judged by {record.verdict.judgedBy} · {record.verdict.stepCount} steps ·{" "}
            {record.verdict.durationMs} ms · {new Date(record.verdict.evaluatedAt).toLocaleTimeString()}
            {" · "}deterministic — no model involvement in the verdict
          </p>
        </div>
      )}
    </section>
  );
}
