"use client";

import { useEffect } from "react";
import { Play, RotateCcw, ScrollText, TerminalSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSkillCrash } from "@/lib/skillcrash/store";
import { prefersReducedMotion } from "../../three/use-scene";
import { RawTraceView, TraceTimeline } from "../../shared/events";
import { RunStatusChip } from "../../shared/badges";

/**
 * Execution Replay — the centrepiece of the workspace. Live events stream
 * in while a run executes; afterwards the full recorded trace and raw JSON
 * stay inspectable. No fake activity: an empty state is an empty state.
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

  const selected = tests.find((t) => t.id === selectedTestId) ?? null;
  const isSelectedRunning = runningTestId === selectedTestId && selectedTestId !== null;
  const recorded = selectedTestId ? runsByTest[selectedTestId] : undefined;

  const events = isSelectedRunning ? liveTrace : (recorded?.trace ?? []);
  const isLive = isSelectedRunning;

  // keep the newest run visible when switching tabs back
  useEffect(() => {
    /* nothing to do — events are derived */
  }, [selectedTestId]);

  const canRun = selected !== null && runningTestId === null;

  return (
    <div className="sc-ink">
      <section
        aria-label="Execution replay"
        className="sc-panel overflow-hidden border-line shadow-[0_24px_60px_-32px_rgba(23,22,19,0.5)]"
      >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-raised/60 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <TerminalSquare className="h-4 w-4 text-accent" strokeWidth={2} />
            Execution Replay
          </h2>
          <p className="mt-0.5 truncate text-[12px] text-ink-3">
            {selected ? (
              <>
                <span className="font-mono text-accent">{selected.id}</span> — {selected.title}
              </>
            ) : (
              "Select a test case to inspect its run"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RunStatusChip status={isLive ? "running" : runStatus === "idle" ? "idle" : recorded ? "done" : "idle"} />
          
          {recorded && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-bad/30 bg-bad/10 text-bad hover:bg-bad/20 hover:text-bad font-medium transition"
              onClick={() => {
                if (selectedTestId) deleteRun(selectedTestId);
              }}
              title="Delete this test run record"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete run
            </Button>
          )}<Button
            type="button"
            size="sm"
            disabled={!canRun}
            className="bg-accent text-primary-foreground hover:bg-accent/85"
            onClick={() => {
              if (selected) void startRun(selected.id, { instant: prefersReducedMotion() });
            }}
          >
            {recorded ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" /> Re-run {selected?.id}
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Run test
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="timeline" className="gap-0">
        <div className="border-b border-line px-4 pt-3 sm:px-5">
          <TabsList className="bg-inset">
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:bg-surface data-[state=active]:text-ink font-mono text-[11px]"
            >
              <ScrollText className="h-3.5 w-3.5" /> Timeline
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className="data-[state=active]:bg-surface data-[state=active]:text-ink font-mono text-[11px]"
            >
              raw trace · JSON
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="timeline" className="mt-0">
          <div className="sc-scroll max-h-[560px] min-h-[380px] overflow-y-auto px-4 py-4 sm:px-5">
            {isLive && (
              <p className="mb-3 flex items-center gap-2 rounded-md border border-accent/25 bg-accent/[0.06] px-3 py-2 font-mono text-[11px] text-accent">
                <span className="sc-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                recording execution — simulated agent, mock sandbox, deterministic judge
              </p>
            )}
            <TraceTimeline events={events} autoScroll={isLive} />
          </div>
        </TabsContent>

        <TabsContent value="raw" className="mt-0">
          <div className="p-4 sm:p-5">
            <RawTraceView events={events} className="max-h-[560px] min-h-[380px]" />
          </div>
        </TabsContent>
      </Tabs>
      </section>
    </div>
  );
}

