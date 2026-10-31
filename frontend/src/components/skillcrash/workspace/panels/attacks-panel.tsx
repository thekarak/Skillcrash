"use client";

import { Check, ListChecks, Swords, Zap, Trash2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSkillCrash, expectationsForTest } from "@/lib/skillcrash/store";
import { ATTACK_CATEGORY_LABELS } from "@/lib/skillcrash/types";
import { CATEGORY_BLURBS } from "@/lib/skillcrash/demo-data";
import { VerdictBadge, DemoBadge } from "../../shared/badges";
import { cn } from "@/lib/utils";

/**
 * Adversarial test scenarios: generation, review, expected-behaviour rule
 * approval, and selection. Approved expectations are kept separate from
 * the generated attack text.
 */
export function AttacksPanel() {
  const tests = useSkillCrash((s) => s.tests);
  const selectedTestId = useSkillCrash((s) => s.selectedTestId);
  const generating = useSkillCrash((s) => s.generating);
  const gemmaEnabled = useSkillCrash((s) => s.gemmaEnabled);
  const setGemmaEnabled = useSkillCrash((s) => s.setGemmaEnabled);
  const generatorLabel = useSkillCrash((s) => s.generatorLabel);
  const generatorMode = useSkillCrash((s) => s.generatorMode);
  const generatorNotice = useSkillCrash((s) => s.generatorNotice);
  const clientKind = useSkillCrash((s) => s.client.kind);
  const approvals = useSkillCrash((s) => s.approvals);
  const selectedExpectations = useSkillCrash((s) => s.selectedExpectations);
  const offeredExpectations = useSkillCrash((s) => s.offeredExpectations);
  const runsByTest = useSkillCrash((s) => s.runsByTest);
  const generateAttacks = useSkillCrash((s) => s.generateAttacks);
  const selectTest = useSkillCrash((s) => s.selectTest);
  const toggleRule = useSkillCrash((s) => s.toggleRule);
  const approveTest = useSkillCrash((s) => s.approveTest);
  const approveAll = useSkillCrash((s) => s.approveAll);
  const deleteTest = useSkillCrash((s) => s.deleteTest);

  const selected = tests.find((t) => t.id === selectedTestId) ?? null;
  const review = expectationsForTest(
    { approvals, selectedExpectations, offeredExpectations },
    selectedTestId
  );

  const modelReported = clientKind === "http" && generatorMode === "model";
  const simulated =
    !modelReported && (clientKind === "demo" || generatorMode === "simulated");
  const modeLabel = modelReported
    ? "Model Generated"
    : simulated
      ? "Simulated Generator"
      : "Standard Suite";

  return (
    <section aria-label="Adversarial test scenarios" className="sc-panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Swords className="h-4 w-4 text-bad" strokeWidth={2} />
            Adversarial Test Scenarios
          </h2>
          <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-ink-3">
            Targeted security challenges created for your active skill. Review the attack prompt and
            approve expected safety rules before running.{" "}
            {gemmaEnabled
              ? clientKind === "http"
                ? "Gemma 4 is synthesizing adversarial vectors via the backend API."
                : "Gemma mode is selected with local in-browser simulation."
              : "Standard deterministic safety benchmark selected."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Selector */}
          <div className="inline-flex items-center rounded-lg border border-line bg-surface p-1 text-xs shadow-xs">
            <button
              type="button"
              disabled={generating}
              onClick={() => setGemmaEnabled(false)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-all cursor-pointer",
                !gemmaEnabled
                  ? "bg-raised text-ink font-semibold shadow-xs border border-line/60"
                  : "text-ink-3 hover:text-ink-2 hover:bg-raised/40"
              )}
              title="Deterministic built-in safety benchmark test suite"
            >
              <ShieldCheck className={cn("h-4 w-4", !gemmaEnabled ? "text-ink" : "text-ink-3")} />
              <span>Standard Suite</span>
            </button>
            <button
              type="button"
              disabled={generating}
              onClick={() => setGemmaEnabled(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-all cursor-pointer",
                gemmaEnabled
                  ? "bg-accent/15 text-accent font-semibold border border-accent/35 shadow-xs"
                  : "text-ink-3 hover:text-ink-2 hover:bg-raised/40"
              )}
              title="Request Gemma 4 proposals from the backend generator (simulated in demo mode)"
            >
              <Sparkles className={cn("h-4 w-4", gemmaEnabled ? "text-accent" : "text-ink-3")} />
              <span>Gemma 4 AI</span>
              {gemmaEnabled && (
                <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              )}
            </button>
          </div>

          {tests.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-line bg-transparent text-ink-2 hover:bg-raised hover:text-ink cursor-pointer text-[13px]"
              onClick={approveAll}
            >
              <Check className="h-4 w-4 mr-1" /> Approve All Rules
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            disabled={generating}
            className="bg-accent text-primary-foreground hover:bg-accent/85 cursor-pointer font-medium text-[13px]"
            onClick={() => void generateAttacks()}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                Generating Scenarios…
              </span>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-1" /> Generate Scenarios
              </>
            )}
          </Button>
        </div>
      </div>

      {(generatorLabel || generatorNotice) && (
        <div
          role="status"
          className="mb-3 space-y-1.5 rounded-md border border-line bg-raised px-3.5 py-2.5"
        >
          {generatorLabel && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded border px-2 py-0.5 font-medium text-[11px]",
                  modelReported
                    ? "border-ok/35 bg-ok/10 text-ok"
                    : "border-warn/35 bg-warn/10 text-warn"
                )}
              >
                {modeLabel}
              </span>
            </div>
          )}
          {generatorNotice && (
            <p className="text-[12.5px] leading-relaxed text-ink-3">{generatorNotice}</p>
          )}
        </div>
      )}

      {tests.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-12 text-center">
          <p className="text-[14.5px] font-semibold text-ink">No test scenarios created yet.</p>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-3">
            Select your generator mode above (Standard Suite or Gemma 4 AI) and click{" "}
            <strong className="text-ink font-semibold">Generate Scenarios</strong> to synthesize targeted security challenges against the active skill.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={generating}
            className="mt-4 bg-accent text-primary-foreground hover:bg-accent/85 cursor-pointer font-medium text-[13px]"
            onClick={() => void generateAttacks()}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                Generating…
              </span>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-1" /> Generate Scenarios
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Case list */}
          <ul className="space-y-2.5" role="listbox" aria-label="Test scenarios">
            {tests.map((t) => {
              const active = t.id === selectedTestId;
              const approved = approvals[t.id] !== undefined;
              const verdict = runsByTest[t.id]?.verdict;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectTest(active ? null : t.id)}
                    className={cn(
                      "w-full rounded-md border p-3.5 text-left transition-colors cursor-pointer",
                      active
                        ? "border-accent/50 bg-accent/[0.07]"
                        : "border-line bg-raised hover:border-line-strong"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] font-bold text-accent">{t.id}</span>
                      <div className="flex items-center gap-1.5">
                        {approved && (
                          <span className="sc-chip border-ok/30 text-ok text-[11px] font-medium">
                            Approved
                          </span>
                        )}
                        {verdict ? <VerdictBadge outcome={verdict.outcome} size="sm" /> : null}
                      </div>
                    </div>
                    <div className="mt-1 text-[14px] leading-snug font-semibold text-ink">{t.title}</div>
                    <div className="mt-1 text-[12px] text-ink-3 font-medium">
                      {ATTACK_CATEGORY_LABELS[t.category]}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Review panel */}
          <div className="min-w-0">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                      <span>Simulated Attack Prompt</span>
                      {modelReported ? (
                        <span className="sc-chip text-[11px]" title="Generated by backend model">
                          {selected.generatedBy}
                        </span>
                      ) : (
                        <DemoBadge
                          label={simulated ? "Simulated Scenario" : "Benchmark Case"}
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 border-bad/30 bg-bad/10 px-2.5 text-[11.5px] text-bad hover:bg-bad/20 hover:text-bad cursor-pointer font-medium"
                      onClick={() => deleteTest(selected.id)}
                      title="Delete this test case"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                  <blockquote className="rounded-md border border-bad/25 bg-bad/[0.06] px-3.5 py-3 text-[14px] leading-relaxed break-words text-ink-2">
                    {selected.attackPrompt}
                  </blockquote>
                  <p className="mt-1.5 text-[12.5px] text-ink-3">
                    {CATEGORY_BLURBS[selected.category]}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                      <ListChecks className="h-4 w-4 text-accent" />
                      Expected Safety Rules {review.approved ? "(Approved)" : "(Draft — Review & Approve)"}
                    </span>
                    {!review.approved ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 border-line bg-transparent px-2.5 text-[11.5px] text-ink-2 hover:bg-raised hover:text-ink cursor-pointer font-medium"
                        onClick={() => approveTest(selected.id)}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve Safety Rules
                      </Button>
                    ) : (
                      <span className="sc-chip border-ok/30 text-ok text-[11px] font-medium">
                        Approved by You
                      </span>
                    )}
                  </div>

                  <p className="mb-2.5 text-[13px] leading-relaxed text-ink-3">
                    Choose the safety boundaries that govern this scenario. The verification engine checks these rules against recorded tool executions.
                  </p>

                  <ul className="space-y-2" role="group" aria-label="Expected safety rules">
                    {(review.offered.length > 0 ? review.offered : review.rules).map((rule) => {
                      const enabled = review.rules.some((r) => r.id === rule.id);
                      return (
                        <li key={rule.id}>
                          <label
                            className={cn(
                              "flex items-start gap-3 rounded-md border px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer",
                              enabled
                                ? review.approved
                                  ? "border-ok/30 bg-ok/[0.05]"
                                  : "border-accent/40 bg-accent/[0.05]"
                                : "border-line bg-raised/50 opacity-60"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={enabled}
                              disabled={review.approved}
                              onChange={() => toggleRule(selected.id, rule.id)}
                              className="mt-1 h-4 w-4 shrink-0 rounded border-line text-accent focus:ring-accent"
                              aria-label={`Rule ${rule.id}: ${rule.description}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="font-mono text-[11.5px] font-bold text-accent">
                                {rule.id}
                              </span>{" "}
                              <span className="text-[13.5px] font-medium text-ink">{rule.description}</span>
                              <span className="mt-0.5 block text-[11.5px] text-ink-3">
                                Evaluation Type: {rule.kind}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-line p-8 text-center text-[13.5px] text-ink-3">
                Select an attack scenario on the left to review its prompt and configure its safety rules.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
