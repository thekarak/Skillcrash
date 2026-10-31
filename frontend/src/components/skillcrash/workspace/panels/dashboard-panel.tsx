"use client";

import { ArrowRight, CheckCircle2, FlaskConical, Gavel, Play, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSkillCrash } from "@/lib/skillcrash/store";
import { VerdictBadge } from "../../shared/badges";
import { cn } from "@/lib/utils";

/** Dashboard — an honest overview computed from real session state. */
export function DashboardPanel() {
  const skills = useSkillCrash((s) => s.skills);
  const tests = useSkillCrash((s) => s.tests);
  const approvals = useSkillCrash((s) => s.approvals);
  const runHistory = useSkillCrash((s) => s.runHistory);
  const setNav = useSkillCrash((s) => s.setNav);
  const selectTest = useSkillCrash((s) => s.selectTest);

  const counts = {
    pass: runHistory.filter((r) => r.verdict.outcome === "PASS").length,
    fail: runHistory.filter((r) => r.verdict.outcome === "FAIL").length,
    error: runHistory.filter((r) => r.verdict.outcome === "ERROR").length,
  };
  const latest = runHistory[0];
  const latestTest = latest ? tests.find((t) => t.id === latest.testId) : undefined;

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Security Dashboard</h1>
        <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">
          Overview of evaluated skills, generated attack scenarios, and deterministic compliance records.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Loaded Skills" value={skills.length} />
        <Stat label="Scenarios Created" value={tests.length} />
        <Stat
          label="Approved Tests"
          value={`${Object.keys(approvals).length} of ${tests.length || 0}`}
        />
        <Stat label="Recorded Runs" value={runHistory.length} />
        <Stat label="Test Outcomes (P/F/E)" value={`${counts.pass} / ${counts.fail} / ${counts.error}`} accent />
      </div>

      {/* Latest verdict */}
      {latest && (
        <section aria-label="Latest verdict" className="sc-panel p-4 sm:p-5">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <Gavel className="h-4 w-4 text-accent" strokeWidth={2} />
              Latest Test Evaluation
            </h2>
            <button
              type="button"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-accent transition-colors hover:text-accent/80 cursor-pointer"
              onClick={() => {
                selectTest(latest.testId);
                setNav("runs");
              }}
            >
              View Full Evaluation Report <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div
            className={cn(
              "flex flex-wrap items-center gap-3.5 rounded-md border px-4 py-3.5",
              latest.verdict.outcome === "PASS" && "border-ok/30 bg-ok/[0.06]",
              latest.verdict.outcome === "FAIL" && "border-bad/30 bg-bad/[0.06]",
              latest.verdict.outcome === "ERROR" && "border-warn/30 bg-warn/[0.06]"
            )}
          >
            <VerdictBadge outcome={latest.verdict.outcome} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium leading-relaxed break-words text-ink">
                {latest.verdict.reason}
              </p>
              <p className="mt-1 text-[12px] text-ink-3">
                <span className="font-mono font-bold text-accent">{latest.testId}</span>
                {latestTest ? ` — ${latestTest.title}` : ""} • {latest.verdict.stepCount} steps •{" "}
                {latest.durationMs}ms duration
              </p>
            </div>
          </div>
          <ul className="mt-3.5 grid gap-2.5 md:grid-cols-2">
            {latest.verdict.evidence.map((ev) => (
              <li
                key={ev.ruleId}
                className={cn(
                  "rounded-md border px-3.5 py-2.5",
                  ev.satisfied ? "border-ok/25 bg-ok/[0.04]" : "border-bad/30 bg-bad/[0.05]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 font-mono text-[11.5px] font-bold text-ink">{ev.ruleId}</span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[10.5px] font-bold tracking-wider",
                      ev.satisfied ? "text-ok" : "text-bad"
                    )}
                  >
                    {ev.satisfied ? "SATISFIED" : "POLICY VIOLATION"}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed break-words text-ink-2">{ev.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Recent runs */}
        <section aria-label="Recent runs" className="sc-panel p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
            <FlaskConical className="h-4 w-4 text-accent" strokeWidth={2} />
            Recent Executions
          </h2>
          {runHistory.length === 0 ? (
            <div className="rounded-md border border-dashed border-line px-4 py-10 text-center">
              <p className="text-[14px] font-semibold text-ink">No test runs recorded in this session.</p>
              <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-ink-3">
                Generate attack scenarios and execute a test to view replay traces, compliance verdicts, and remediation suggestions.
              </p>
              <div className="mt-4 flex justify-center gap-2.5">
                <Button
                  type="button"
                  size="sm"
                  className="bg-accent text-primary-foreground hover:bg-accent/85 font-medium text-[13px]"
                  onClick={() => setNav("runs")}
                >
                  Go to Test Runs
                </Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {runHistory.map((run) => {
                const test = tests.find((t) => t.id === run.testId);
                return (
                  <li key={run.testId + run.startedAt}>
                    <button
                      type="button"
                      onClick={() => {
                        selectTest(run.testId);
                        setNav("runs");
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-md border border-line bg-raised p-3 text-left transition-colors hover:border-line-strong cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-bold text-accent">{run.testId}</span>
                          <span className="truncate text-[13.5px] font-semibold text-ink">
                            {test?.title || run.testId}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-ink-3">
                          {run.verdict.reason}
                        </p>
                      </div>
                      <VerdictBadge outcome={run.verdict.outcome} size="sm" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Quick summary */}
        <section aria-label="Environment overview" className="sc-panel p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
            <Swords className="h-4 w-4 text-accent" strokeWidth={2} />
            Testing Environment
          </h2>
          <div className="space-y-3 text-[13.5px]">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-ink-3 font-medium">Isolation Sandbox</span>
              <span className="font-semibold text-ok">In-Memory Mock</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-ink-3 font-medium">Evaluation Method</span>
              <span className="font-semibold text-ink">Deterministic Rules</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-ink-3 font-medium">Host Impact</span>
              <span className="font-semibold text-ok">Zero (Isolated)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-3 font-medium">Model Testing Mode</span>
              <span className="font-semibold text-ink">Gemma 4 Benchmarks</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-raised p-3.5">
      <p className="text-[12px] font-medium text-ink-3">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-xl font-bold tracking-tight",
          accent ? "text-accent" : "text-ink"
        )}
      >
        {value}
      </p>
    </div>
  );
}
