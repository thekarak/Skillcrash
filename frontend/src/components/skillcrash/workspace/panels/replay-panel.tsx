"use client";

import { Play, RotateCcw, ScrollText, ShieldAlert, TerminalSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSkillCrash } from "@/lib/skillcrash/store";
import { prefersReducedMotion } from "../../three/use-scene";
import { RawTraceView, TraceTimeline } from "../../shared/events";
import { RunStatusChip } from "../../shared/badges";

/**
 * Execution Replay — live event telemetry streaming and post-run inspection.
 */
export function ReplayPanel() {
  const tests = useSkillCrash((s) => s.tests);
  const selectedTestId = useSkillCrash((s) => s.selectedTestId);
  const runningTestId = useSkillCrash((s) => s.runningTestId);
  const runStatus = useSkillCrash((s) => s.runStatus);
  const liveTrace = useSkillCrash((s) => s.liveTrace);
  const runsByTest = useSkillCrash((s) => s.runsByTest);
  const startRun = useSkillCrash((s) => s.startRun);
  const deleteRun = useSkillCrash((s) => s.deleteRun);
  const clientKind = useSkillCrash((s) => s.client.kind);
  const approvals = useSkillCrash((s) => s.approvals);

  const selected = tests.find((t) => t.id === selectedTestId) ?? null;
  const isSelectedRunning = runningTestId === selectedTestId && selectedTestId !== null;
  const recorded = selectedTestId ? runsByTest[selectedTestId] : undefined;

  const events = isSelectedRunning ? liveTrace : (recorded?.trace ?? []);
  const isLive = isSelectedRunning;

  const needsApproval = clientKind === "http" && !!selected?.caseId;
  const approved = selectedTestId ? approvals[selectedTestId] !== undefined : false;
  const canRun = selected !== null && runningTestId === null && (!needsApproval || approved);

  return (
    <div className="sc-ink">
      <section
        aria-label="Execution replay"
        className="sc-panel overflow-hidden border-line shadow-[0_24px_60px_-32px_rgba(23,22,19,0.5)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-raised/60 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <TerminalSquare className="h-4 w-4 text-accent" strokeWidth={2} />
              Execution Trace &amp; Replay
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-ink-3">
              {selected ? (
                <>
                  <span className="font-mono font-semibold text-accent">{selected.id}</span> — {selected.title}
                </>
              ) : (
                "Select a test scenario above to inspect its execution telemetry"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <RunStatusChip status={isLive ? "running" : runStatus === "idle" ? "idle" : recorded ? "done" : "idle"} />

            {recorded?.executionMode && !isLive && (
              <span
                className={`sc-chip font-mono text-[11px] font-semibold ${
                  recorded.executionMode === "live"
                    ? "border-ok/30 bg-ok/10 text-ok"
                    : "border-line bg-inset text-ink-3"
                }`}
                title={
                  recorded.executionMode === "live"
                    ? "Executed by the live backend agent."
                    : "Replayed by the local in-memory agent."
                }
              >
                {recorded.executionMode === "live" ? "LIVE API" : "SIMULATED"}
              </span>
            )}

            {recorded && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-bad/30 bg-bad/10 text-bad hover:bg-bad/20 hover:text-bad font-medium transition text-[12.5px]"
                onClick={() => {
                  if (selectedTestId) deleteRun(selectedTestId);
                }}
                title="Delete this test run record"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove Run
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={!canRun}
              title={
                needsApproval && !approved
                  ? "Approve safety rules for this test first."
                  : undefined
              }
              className="bg-accent text-primary-foreground hover:bg-accent/85 font-semibold text-[13px] cursor-pointer"
              onClick={() => {
                if (selected) void startRun(selected.id, { instant: prefersReducedMotion() });
              }}
            >
              {recorded ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Re-run Scenario
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1.5" /> Run Scenario
                </>
              )}
            </Button>
          </div>
        </div>

        {needsApproval && !approved && (
          <p className="flex items-start gap-2.5 border-b border-warn/25 bg-warn/[0.07] px-4 py-2.5 text-[12.5px] leading-relaxed text-warn sm:px-6">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Please approve this scenario&apos;s expected safety rules first using <span className="font-semibold text-ink">&ldquo;Approve Safety Rules&rdquo;</span> above before initiating live execution.
            </span>
          </p>
        )}

        <Tabs defaultValue="timeline" className="gap-0">
          <div className="border-b border-line px-4 pt-3 sm:px-6">
            <TabsList className="bg-inset">
              <TabsTrigger
                value="timeline"
                className="data-[state=active]:bg-surface data-[state=active]:text-ink text-[12.5px] font-medium"
              >
                <ScrollText className="h-3.5 w-3.5 mr-1.5" /> Event Timeline
              </TabsTrigger>
              <TabsTrigger
                value="raw"
                className="data-[state=active]:bg-surface data-[state=active]:text-ink text-[12.5px] font-medium"
              >
                Raw Trace (JSON)
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="timeline" className="mt-0">
            <div className="sc-scroll max-h-[580px] min-h-[380px] overflow-y-auto px-4 py-4 sm:px-6">
              {isLive && (
                <p className="mb-3.5 flex items-center gap-2 rounded-md border border-accent/25 bg-accent/[0.06] px-3.5 py-2 text-[12.5px] text-accent font-medium">
                  <span className="sc-pulse-dot inline-block h-2 w-2 rounded-full bg-accent" />
                  Recording live execution telemetry — monitoring tool invocations and checking safety rules.
                </p>
              )}
              <TraceTimeline events={events} autoScroll={isLive} />
            </div>
          </TabsContent>

          <TabsContent value="raw" className="mt-0">
            <div className="p-4 sm:p-6">
              <RawTraceView events={events} className="max-h-[580px] min-h-[380px]" />
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
