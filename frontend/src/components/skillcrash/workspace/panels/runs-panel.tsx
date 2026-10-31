"use client";

import { BrainCircuit, Boxes, Gauge, ShieldCheck, Trash2 } from "lucide-react";
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
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 sm:space-y-6 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Adversarial Test Runs</h1>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">
            Load an agent skill, generate targeted attack scenarios, approve expected safety rules, and inspect execution evidence.
          </p>
        </div>
        {hasRuns && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-bad/30 bg-bad/10 text-bad hover:bg-bad/20 hover:text-bad font-medium transition cursor-pointer text-[13px]"
            onClick={resetRuns}
            title="Reset and clear all test run records"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Clear All Test Runs
          </Button>
        )}
      </header>

      {/* skill meta + execution config */}
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
  const clientKind = useSkillCrash((s) => s.client.kind);
  const clientLabel = useSkillCrash((s) => s.client.statusLabel);

  return (
    <section aria-label="Runtime and safety environment" className="sc-panel p-4 sm:p-5">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-ink">
        <Gauge className="h-4 w-4 text-accent" strokeWidth={2} />
        Runtime &amp; Safety Environment
      </h2>
      <p className="mb-4 text-[13px] leading-relaxed text-ink-3">
        {clientKind === "http"
          ? "Approved scenarios are evaluated by the backend agent in an in-memory mock sandbox with deterministic scoring."
          : "Safe execution environment. No actions affect your real disk, system files, credentials, or network."}
      </p>

      <dl className="space-y-3 text-[13px]">
        <div className="flex items-start justify-between gap-3">
          <dt className="flex shrink-0 items-center gap-1.5 text-ink-2 font-medium">
            <BrainCircuit className="h-4 w-4 text-ink-3" /> Agent Under Test
          </dt>
          <dd className="min-w-0 text-right text-[12.5px] break-words font-medium">
            Gemma 4{" "}
            {clientKind === "http" ? (
              <span className="text-ok font-semibold">· Live Backend</span>
            ) : (
              <span className="text-warn font-semibold">· In-Browser Simulation</span>
            )}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex shrink-0 items-center gap-1.5 text-ink-2 font-medium">
            <Boxes className="h-4 w-4 text-ink-3" /> Virtual Tools
          </dt>
          <dd className="min-w-0 text-right text-[12.5px] break-words text-ink-2 font-medium">
            {MOCK_TOOLS.length} Safe Tools (In-Memory)
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex shrink-0 items-center gap-1.5 text-ink-2 font-medium">
            <ShieldCheck className="h-4 w-4 text-ink-3" /> Verification Engine
          </dt>
          <dd className="min-w-0 text-right text-[12.5px] break-words text-ink-2 font-medium">
            Deterministic Rule Assertions
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex shrink-0 items-center gap-1.5 text-ink-2 font-medium">
            <Boxes className="h-4 w-4 text-ink-3" /> Active Adapter
          </dt>
          <dd className="flex min-w-0 flex-col items-end gap-1">
            {clientKind === "http" ? (
              <span className="sc-chip border-ok/30 bg-ok/10 text-ok font-semibold text-[11px]">
                Cloud API Adapter
              </span>
            ) : (
              <DemoBadge label="In-Memory Demo Engine" />
            )}
            <span className="max-w-[240px] text-right text-[11px] leading-snug break-words text-ink-3">
              {clientLabel}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
