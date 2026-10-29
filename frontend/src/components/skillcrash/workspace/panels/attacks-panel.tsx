"use client";

import { Check, ListChecks, Swords, Zap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSkillCrash, expectationsForTest } from "@/lib/skillcrash/store";
import { ATTACK_CATEGORY_LABELS } from "@/lib/skillcrash/types";
import { CATEGORY_BLURBS } from "@/lib/skillcrash/demo-data";
import { VerdictBadge, DemoBadge } from "../../shared/badges";
import { cn } from "@/lib/utils";

/**
 * Adversarial test cases: generation (honestly labelled demo generator),
 * review, expected-behaviour rule approval, and selection. Approved
 * expectations are kept separate from the generated attack text.
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
            rules. With Gemma on, its proposals are combined with the built-in safety suite.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={gemmaEnabled}
            aria-label="Use Gemma 4 to generate attack cases"
            disabled={generating}
            onClick={() => setGemmaEnabled(!gemmaEnabled)}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-line bg-raised px-2.5 text-[11px] text-ink-2 transition-colors hover:border-line-strong disabled:opacity-50"
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative h-4 w-7 rounded-full transition-colors",
                gemmaEnabled ? "bg-accent" : "bg-line-strong"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
                  gemmaEnabled ? "translate-x-3.5" : "translate-x-0.5"
                )}
              />
            </span>
            <span>Gemma 4 {gemmaEnabled ? "on" : "off"}</span>
          </button>
          {tests.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-line bg-transparent text-ink-2 hover:bg-raised hover:text-ink"
              onClick={approveAll}
            >
              <Check className="h-3.5 w-3.5" /> Approve all
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={generating}
            className="bg-accent text-primary-foreground hover:bg-accent/85"
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
          <p className="text-[13px] text-ink-2">No test cases yet.</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-ink-3">
            Generate attacks to get 3–5 candidate scenarios across prompt injection, unconfirmed
            destructive actions, secret-file exposure, invalid paths and conflicting instructions.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={generating}
            className="mt-4 bg-accent text-primary-foreground hover:bg-accent/85"
            onClick={() => void generateAttacks()}
          >
            <Zap className="h-3.5 w-3.5" /> Generate attacks
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
                      "w-full rounded-md border p-3 text-left transition-colors",
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
                {generatorLabel || "Attack text comes from the local demo generator; expectations are reviewed here."}
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
                      <DemoBadge label="generated" />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 border-bad/30 bg-bad/10 px-2 text-[10.5px] text-bad hover:bg-bad/20 hover:text-bad"
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
                        className="h-7 border-ok/40 bg-ok/10 px-2.5 text-[11px] text-ok hover:bg-ok/20 hover:text-ok"
                        onClick={() => approveTest(selected.id)}
                        disabled={review.rules.length === 0}
                      >
                        <Check className="h-3 w-3" /> Approve {review.rules.length} rule
                        {review.rules.length === 1 ? "" : "s"}
                      </Button>
                    ) : (
                      <span className="font-mono text-[10px] text-ok">
                        locked for the judge · {approvals[selected.id]?.rules.length} rules
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {review.offered.map((rule) => {
                      const enabled = review.rules.some((r) => r.id === rule.id);
                      return (
                        <li key={rule.id}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2 transition-colors",
                              enabled
                                ? review.approved
                                  ? "border-ok/30 bg-ok/[0.05]"
                                  : "border-accent/30 bg-accent/[0.05]"
                                : "border-line bg-raised opacity-55"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={enabled}
                              disabled={review.approved}
                              onChange={() => toggleRule(selected.id, rule.id)}
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-copper"
                              aria-label={`Rule ${rule.id}: ${rule.description}`}
                            />
                            <span className="min-w-0">
                              <span className="font-mono text-[11px] font-semibold text-ink">
                                {rule.id}
                              </span>{" "}
                              <span className="text-[12.5px] leading-relaxed text-ink-2">
                                {rule.description}
                              </span>
                              <span className="mt-0.5 block font-mono text-[10px] text-ink-3">
                                kind: {rule.kind}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
                    These rules — not the attack text — are what the deterministic judge asserts
                    against the recorded trace. Uncheck a rule to exclude it from judging.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[180px] items-center justify-center rounded-md border border-dashed border-line">
                <p className="px-4 text-center text-[12.5px] text-ink-3">
                  Select a case to review its attack prompt and expected behaviour.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

