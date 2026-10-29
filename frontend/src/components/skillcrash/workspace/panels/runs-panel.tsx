"use client";

import { BrainCircuit, Boxes, Gauge, ShieldCheck, Timer, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useSkillCrash } from "@/lib/skillcrash/store";
import { MOCK_TOOLS } from "@/lib/skillcrash/sandbox";
import { DemoBadge } from "../../shared/badges";
import { SkillPanel } from "./skill-panel";
import { AttacksPanel } from "./attacks-panel";
import { ReplayPanel } from "./replay-panel";
import { VerdictPanel } from "./verdict-panel";
import { ImprovementPanel } from "./improvement-panel";

/**
 * Test Runs — the core SkillCrash workflow: target skill → attack
 * generation → review & approval → execution replay → verdict →
 * suggested improvement.
 */
export function RunsPanel() {
  const runsByTest = useSkillCrash((s) => s.runsByTest);
  const resetRuns = useSkillCrash((s) => s.resetRuns);
  const hasRuns = Object.keys(runsByTest).length > 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:space-y-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Test Runs</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Load a skill, generate adversarial cases, approve expected behaviour, and replay the
            evidence.
          </p>
        </div>
        {hasRuns && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-bad/30 bg-bad/10 text-bad hover:bg-bad/20 hover:text-bad font-medium transition cursor-pointer"
            onClick={resetRuns}
            title="Reset and clear all test run records"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear all test runs
          </Button>
        )}
      </header>

      {/* skill meta gets the wider share — the execution card only needs a
          readable definition list, and 5/12 keeps its rows on one line at 1366px */}
      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <SkillPanel />
        <ExecutionConfigCard />
      </div>

      <AttacksPanel />
      <ReplayPanel />

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
        <VerdictPanel />
        <ImprovementPanel />
      </div>
    </div>
  );
}

function ExecutionConfigCard() {
  const policy = useSkillCrash((s) => s.policy);
  const setStepLimit = useSkillCrash((s) => s.setStepLimit);
  const clientKind = useSkillCrash((s) => s.client.kind);
  const clientLabel = useSkillCrash((s) => s.client.statusLabel);

  return (
    <section aria-label="Execution configuration" className="sc-panel p-4 sm:p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
        <Gauge className="h-4 w-4 text-accent" strokeWidth={2} />
        Execution configuration
      </h2>
      <p className="mb-4 text-[12px] leading-relaxed text-ink-3">
        How this run executes. Nothing here reaches a real filesystem, credentials or network.
      </p>

      <dl className="space-y-2.5 text-[12px]">
        <div className="flex items-start justify-between gap-3">
          <dt className="flex shrink-0 items-center gap-1.5 text-ink-2">
            <BrainCircuit className="h-3.5 w-3.5 text-ink-3" /> Agent under test
          </dt>
          <dd className="min-w-0 text-right font-mono text-[11px] break-words">
            Gemma 4 <span className="text-accent font-semibold">· active</span>
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex shrink-0 items-center gap-1.5 text-ink-2">
            <Boxes className="h-3.5 w-3.5 text-ink-3" /> Mock tools
          </dt>
          <dd className="min-w-0 text-right font-mono text-[11px] break-words text-ink-2">
            {MOCK_TOOLS.length} allowlisted · in-memory
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex shrink-0 items-center gap-1.5 text-ink-2">
            <ShieldCheck className="h-3.5 w-3.5 text-ink-3" /> Judge
          </dt>
          <dd className="min-w-0 text-right font-mono text-[11px] break-words text-ink-2">
            deterministic · separate from model
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex shrink-0 items-center gap-1.5 text-ink-2">
            <Boxes className="h-3.5 w-3.5 text-ink-3" /> Backend
          </dt>
          <dd className="flex min-w-0 flex-col items-end gap-1">
            {clientKind === "http" ? (
              <span className="sc-chip border-ok/30 bg-ok/10 text-ok font-mono text-[10px]">
                HTTP ADAPTER
              </span>
            ) : (
              <DemoBadge label="demo adapter" />
            )}
            <span className="max-w-[220px] text-right font-mono text-[10px] leading-snug break-words text-ink-3">
              {clientLabel}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-md border border-line bg-raised p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
            <Timer className="h-3.5 w-3.5 text-ink-3" /> Step limit
          </span>
          <span className="font-mono text-[11px] text-accent">{policy.maxSteps} steps</span>
        </div>
        <Slider
          value={[policy.maxSteps]}
          min={2}
          max={16}
          step={1}
          onValueChange={(v) => setStepLimit(v[0] ?? policy.maxSteps)}
          aria-label="Agent step limit"
        />
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-ink-3">
          Runs that exceed the limit end in a controlled ERROR — lower it and re-run a case to see
          that state.
        </p>
      </div>
    </section>
  );
}
