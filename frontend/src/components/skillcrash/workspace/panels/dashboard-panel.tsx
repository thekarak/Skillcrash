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
  const generateAttacks = useSkillCrash((s) => s.generateAttacks);

  const counts = {
    pass: runHistory.filter((r) => r.verdict.outcome === "PASS").length,
    fail: runHistory.filter((r) => r.verdict.outcome === "FAIL").length,
    error: runHistory.filter((r) => r.verdict.outcome === "ERROR").length,
  };
  const latest = runHistory[0];
  const latestTest = latest ? tests.find((t) => t.id === latest.testId) : undefined;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-0.5 text-[13px] text-ink-2">
          Session overview — computed from this workspace&rsquo;s real session state. Local demo:
          the agent and the attack generator are simulated in-browser.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="skills loaded" value={skills.length} />
        <Stat label="cases generated" value={tests.length} />
        <Stat
          label="approved cases"
          value={`${Object.keys(approvals).length}/${tests.length || 0}`}
        />
        <Stat label="runs recorded" value={runHistory.length} />
        <Stat label="pass / fail / error" value={`${counts.pass} / ${counts.fail} / ${counts.error}`} accent />
      </div>

      {/* Latest verdict — the evidence panel for the most recent run */}
      {latest && (
        <section aria-label="Latest verdict" className="sc-panel p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Gavel className="h-4 w-4 text-accent" strokeWidth={2} />
              Latest verdict
            </h2>
            <button
              type="button"
              className="flex items-center gap-1 font-mono text-[11px] text-ink-2 transition-colors hover:text-accent"
              onClick={() => {
                selectTest(latest.testId);
                setNav("runs");
              }}
            >
              open full evidence <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-md border px-3.5 py-3",
              latest.verdict.outcome === "PASS" && "border-ok/30 bg-ok/[0.06]",
              latest.verdict.outcome === "FAIL" && "border-bad/30 bg-bad/[0.06]",
              latest.verdict.outcome === "ERROR" && "border-warn/30 bg-warn/[0.06]"
            )}
          >
            <VerdictBadge outcome={latest.verdict.outcome} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-relaxed break-words text-ink-2">{latest.verdict.reason}</p>
              <p className="mt-1 font-mono text-[10px] text-ink-3">
                <span className="text-accent">{latest.testId}</span>
                {latestTest ? ` — ${latestTest.title}` : ""} · {latest.verdict.stepCount} steps ·{" "}
                {latest.durationMs} ms · deterministic judge
              </p>
            </div>
          </div>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {latest.verdict.evidence.map((ev) => (
              <li
                key={ev.ruleId}
                className={cn(
                  "rounded-md border px-3 py-2",
                  ev.satisfied ? "border-ok/25 bg-ok/[0.04]" : "border-bad/30 bg-bad/[0.05]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 font-mono text-[10.5px] font-semibold text-ink">{ev.ruleId}</span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[9.5px] font-bold",
                      ev.satisfied ? "text-ok" : "text-bad"
                    )}
                  >
                    {ev.satisfied ? "SATISFIED" : "VIOLATED"}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed break-words text-ink-2">{ev.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Recent runs */}
        <section aria-label="Recent runs" className="sc-panel p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <FlaskConical className="h-4 w-4 text-accent" strokeWidth={2} />
            Recent runs
          </h2>
          {runHistory.length === 0 ? (
            <div className="rounded-md border border-dashed border-line px-4 py-8 text-center">
              <p className="text-[13px] text-ink-2">No runs recorded in this session.</p>
              <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-ink-3">
                Generate attack cases and run one — the replay, verdict and suggested fix will
                appear across the workspace.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-line bg-transparent text-ink-2 hover:bg-raised hover:text-ink"
                  onClick={() => setNav("runs")}
                >
                  Open Test Runs
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-accent text-primary-foreground hover:bg-accent/85"
                  onClick={() => {
                    setNav("runs");
                    if (tests.length === 0) void generateAttacks();
                  }}
                >
                  <Swords className="h-3.5 w-3.5" /> Generate cases
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {runHistory.slice(0, 6).map((r) => {
                const test = tests.find((t) => t.id === r.testId);
                return (
                  <li key={`${r.testId}-${r.startedAt}`}>
                    <button
                      type="button"
                      className="group flex w-full items-center gap-3 py-2.5 text-left"
                      onClick={() => {
                        selectTest(r.testId);
                        setNav("runs");
                      }}
                    >
                      <VerdictBadge outcome={r.verdict.outcome} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink group-hover:text-accent">
                          <span className="font-mono text-[11px] text-accent">{r.testId}</span>{" "}
                          {test?.title ?? "case"}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-ink-3">
                          {r.verdict.stepCount} steps · {r.durationMs} ms ·{" "}
                          {new Date(r.startedAt).toLocaleTimeString()}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Getting started / honest state */}
        <section aria-label="Workspace status" className="sc-panel p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink">Workspace status</h2>
          <ul className="space-y-2.5 text-[12.5px] leading-relaxed text-ink-2">
            <StatusRow done={skills.length > 0}>
              A SKILL.md is loaded and parsed{skills.length > 0 ? ` (${skills.length} in library)` : ""}.
            </StatusRow>
            <StatusRow done={tests.length > 0}>
              {tests.length > 0 ? `${tests.length} adversarial cases generated.` : "No attack cases generated yet."}
            </StatusRow>
            <StatusRow done={Object.keys(approvals).length > 0}>
              {Object.keys(approvals).length > 0
                ? `${Object.keys(approvals).length} case(s) with approved expectations.`
                : "Expected-behaviour rules not approved yet."}
            </StatusRow>
            <StatusRow done={runHistory.length > 0}>
              {runHistory.length > 0
                ? `${runHistory.length} run(s) replayed with evidence.`
                : "No execution replays yet."}
            </StatusRow>
          </ul>
          <div className="mt-4 rounded-md border border-line bg-raised p-3">
            <p className="flex items-start gap-2 font-mono text-[10.5px] leading-relaxed break-words text-ink-3">
              <Play className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
              Demo adapter active: attack generation and agent execution are simulated locally and
              clearly labelled. No live model call is made. Connect the FastAPI backend via{" "}
              <span className="text-ink-2">NEXT_PUBLIC_SKILLCRASH_API</span> to go live.
            </p>
          </div>
          {tests.some((t) => t.id === "TC-004") && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 w-full border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 hover:text-accent"
              onClick={() => {
                selectTest("TC-004");
                setNav("runs");
              }}
            >
              Jump to the demo case TC-004
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="sc-panel px-3.5 py-3">
      <div
        className={cn(
          "font-mono text-xl font-semibold tabular-nums",
          accent ? "text-accent" : "text-ink"
        )}
      >
        {value}
      </div>
      <div className="sc-mono-label mt-1">{label}</div>
    </div>
  );
}

function StatusRow({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2
        className={cn("mt-0.5 h-4 w-4 shrink-0", done ? "text-ok" : "text-ink-3")}
        strokeWidth={2}
      />
      <span className={done ? "text-ink-2" : "text-ink-3"}>{children}</span>
    </li>
  );
}
