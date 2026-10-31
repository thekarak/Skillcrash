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
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
        <Gavel className="h-4 w-4 text-accent" strokeWidth={2} />
        Test Verdict &amp; Evidence
      </h2>

      {isRunning ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-line">
          <p className="text-[13.5px] text-ink-3">
            Evaluating safety rules as execution completes…
          </p>
        </div>
      ) : !record ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-line">
          <p className="max-w-xs px-4 text-center text-[13.5px] leading-relaxed text-ink-3">
            No verdict recorded yet. Run the selected test scenario to evaluate rule compliance.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div
            className={cn(
              "flex flex-wrap items-center gap-3.5 rounded-md border px-4 py-3.5",
              record.verdict.outcome === "PASS" && "border-ok/30 bg-ok/[0.06]",
              record.verdict.outcome === "FAIL" && "border-bad/30 bg-bad/[0.06]",
              record.verdict.outcome === "ERROR" && "border-warn/30 bg-warn/[0.06]"
            )}
          >
            <VerdictBadge outcome={record.verdict.outcome} size="lg" />
            <p className="min-w-0 flex-1 text-[14px] font-medium leading-relaxed break-words text-ink">
              {record.verdict.reason}
            </p>
          </div>

          <ul className="space-y-2.5">
            {record.verdict.evidence.map((ev) => (
              <li
                key={ev.ruleId}
                className={cn(
                  "rounded-md border px-3.5 py-3",
                  ev.satisfied ? "border-ok/25 bg-ok/[0.04]" : "border-bad/30 bg-bad/[0.05]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 font-mono text-[12.5px] font-bold text-ink">
                    <span className="break-words">{ev.ruleId} · {ev.description}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[11px] font-bold tracking-wider",
                      ev.satisfied ? "text-ok" : "text-bad"
                    )}
                  >
                    {ev.satisfied ? "SATISFIED" : "POLICY VIOLATION"}
                  </span>
                </div>
                <p className="mt-1 text-[13.5px] leading-relaxed break-words text-ink-2">
                  {ev.detail}
                </p>
                {ev.traceRefs.length > 0 && (
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
                    <Link2 className="h-3.5 w-3.5 text-ink-3" />
                    <span>Verified in trace events:</span>
                    {ev.traceRefs.map((seq) => (
                      <span
                        key={seq}
                        className="rounded border border-line bg-inset px-1.5 py-0.5 font-mono text-[11px] text-ink-2"
                      >
                        #{seq}
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <p className="border-t border-line pt-2.5 text-[12px] leading-relaxed text-ink-3">
            Evaluated by deterministic rule engine • {record.verdict.stepCount} steps analyzed •{" "}
            {record.verdict.durationMs}ms duration • Independent of model subjectivity
          </p>
        </div>
      )}
    </section>
  );
}
