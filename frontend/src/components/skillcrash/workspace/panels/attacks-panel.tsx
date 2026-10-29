"use client";

import { Check, ListChecks, Swords, Zap, Trash2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSkillCrash, expectationsForTest } from "@/lib/skillcrash/store";
import { ATTACK_CATEGORY_LABELS } from "@/lib/skillcrash/types";
import { CATEGORY_BLURBS } from "@/lib/skillcrash/demo-data";
import { VerdictBadge, DemoBadge } from "../../shared/badges";
import { cn } from "@/lib/utils";

/**
 * Adversarial test cases: generation, review, expected-behaviour rule
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

  return (
    <section aria-label="Adversarial test cases" className="sc-panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Swords className="h-4 w-4 text-bad" strokeWidth={2} />
            Adversarial test cases
          </h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-ink-3">
            Generated against the active skill. Each case pairs an attack prompt with a separate,
            developer-approved set of expected-behaviour rules — the judge only reads the approved
            rules. {gemmaEnabled ? "Gemma 4 model generates novel adversarial threat proposals." : "Standard deterministic safety suite benchmark active."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Polished Mode Selector: Standard Benchmark vs Gemma 4 AI */}
          <div className="inline-flex items-center rounded-lg border border-line bg-surface p-1 text-xs shadow-xs">
            <button
              type="button"
              disabled={generating}
              onClick={() => setGemmaEnabled(false)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                !gemmaEnabled
                  ? "bg-raised text-ink font-semibold shadow-xs border border-line/60"
                  : "text-ink-3 hover:text-ink-2 hover:bg-raised/40"
              )}
              title="Deterministic built-in safety benchmark test suite"
            >
              <ShieldCheck className={cn("h-3.5 w-3.5", !gemmaEnabled ? "text-ink" : "text-ink-3")} />
              <span>Standard Suite</span>
            </button>
            <button
              type="button"
              disabled={generating}
              onClick={() => setGemmaEnabled(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                gemmaEnabled
                  ? "bg-accent/15 text-accent font-semibold border border-accent/35 shadow-xs"
                  : "text-ink-3 hover:text-ink-2 hover:bg-raised/40"
              )}
              title="Gemma 4 adversarial AI model reasoning"
            >
              <Sparkles className={cn("h-3.5 w-3.5", gemmaEnabled ? "text-accent" : "text-ink-3")} />
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
              className="border-line bg-transparent text-ink-2 hover:bg-raised hover:text-ink cursor-pointer"
              onClick={approveAll}
            >
              <Check className="h-3.5 w-3.5" /> Approve all
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            disabled={generating}
            className="bg-accent text-primary-foreground hover:bg-accent/85 cursor-pointer font-medium"
            onClick={() => void generateAttacks()}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                Generating…
              </span>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" /> Generate attacks
              </>
            )}
          </Button>
        </div>
      </div>

      {tests.length === 0 && generatorLabel && (
        <p role="status" className="mb-3 rounded-md border border-line bg-raised px-3 py-2 font-mono text-[10.5px] leading-relaxed text-ink-3">
          {generatorLabel}
        </p>
      )}

      {tests.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-10 text-center">
          <p className="text-[13px] font-medium text-ink-2">No test cases generated yet.</p>
          <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-ink-3">
            Choose your generator mode above (Standard Suite or Gemma 4 AI) and click{" "}
            <strong className="text-ink-2">Generate attacks</strong> to synthesize targeted adversarial
            test scenarios against the active skill.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={generating}
            className="mt-4 bg-accent text-primary-foreground hover:bg-accent/85 cursor-pointer font-medium"
            onClick={() => void generateAttacks()}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                Generating…
              </span>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" /> Generate attacks
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Case list */}
          <ul className="space-y-2" role="listbox" aria-label="Test cases">
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
                      "w-full rounded-md border p-3 text-left transition-colors cursor-pointer",
                      active
                        ? "border-accent/50 bg-accent/[0.07]"
                        : "border-line bg-raised hover:border-line-strong"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-accent">{t.id}</span>
                      <div className="flex items-center gap-1.5">
                        {approved && (
                          <span className="sc-chip border-ok/30 text-ok">approved</span>
                        )}
                        {verdict ? <VerdictBadge outcome={verdict.outcome} size="sm" /> : null}
                      </div>
                    </div>
                    <div className="mt-1 text-[13px] leading-snug font-medium text-ink">{t.title}</div>
                    <div className="mt-1 font-mono text-[10.5px] text-ink-3">
                      {ATTACK_CATEGORY_LABELS[t.category]}
                    </div>
                  </button>
                </li>
              );
            })}
            <li className="px-1 pt-1">
              <p className="font-mono text-[10.5px] leading-relaxed text-ink-3">
                {generatorLabel || "Attack cases generated and ready for expectation review."}
              </p>
            </li>
          </ul>

          {/* Review panel */}
          <div className="min-w-0">
            {selected ? (
              <div className="space-y-3">
                <div>
                  <div className="sc-mono-label mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      attack prompt
                      <DemoBadge label={selected.generatedBy} />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 border-bad/30 bg-bad/10 px-2 text-[10.5px] text-bad hover:bg-bad/20 hover:text-bad cursor-pointer"
                      onClick={() => deleteTest(selected.id)}
                      title="Delete this test case"
                    >
                      <Trash2 className="h-3 w-3" /> Delete test
                    </Button>
                  </div>
                  <blockquote className="rounded-md border border-bad/25 bg-bad/[0.05] px-3 py-2.5 text-[12.5px] leading-relaxed break-words text-ink-2">
                    {selected.attackPrompt}
                  </blockquote>
                  <p className="mt-1.5 font-mono text-[10.5px] text-ink-3">
                    {CATEGORY_BLURBS[selected.category]}
                  </p>
                </div>

                <div>
                  <div className="sc-mono-label mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5 text-accent" />
                      expected behaviour{review.approved ? " — approved" : " — draft, review before run"}
                    </span>
                    {!review.approved ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 border-line bg-transparent px-2 text-[10.5px] text-ink-2 hover:bg-raised hover:text-ink cursor-pointer"
                        onClick={() => approveTest(selected.id)}
                      >
                        <Check className="h-3 w-3" /> Approve for judge
                      </Button>
                    ) : (
                      <span className="sc-chip border-ok/30 text-ok">approved by you</span>
                    )}
                  </div>

                  <p className="mb-2 text-[12px] leading-relaxed text-ink-3">
                    Select rules that describe safe behaviour for this attack. The judge only reads
                    these rules — never the attack prompt or skill body.
                  </p>

                  <ul className="space-y-1.5" role="group" aria-label="Expected behaviour rules">
                    {(review.offered.length > 0 ? review.offered : review.rules).map((rule) => {
                      const enabled = review.rules.some((r) => r.id === rule.id);
                      return (
                        <li key={rule.id}>
                          <label
                            className={cn(
                              "flex items-start gap-2.5 rounded-md border px-3 py-2 text-[12px] transition-colors cursor-pointer",
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
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-line text-accent focus:ring-accent"
                              aria-label={`Rule ${rule.id}: ${rule.description}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="font-mono text-[10.5px] font-semibold text-accent">
                                {rule.id}
                              </span>{" "}
                              <span className="text-ink">{rule.description}</span>
                              <span className="mt-0.5 block font-mono text-[10px] text-ink-3">
                                kind: {rule.kind}
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
              <div className="rounded-md border border-dashed border-line p-6 text-center text-[12px] text-ink-3">
                Select an attack case on the left to review its prompt and edit its expected-behaviour
                rules.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
