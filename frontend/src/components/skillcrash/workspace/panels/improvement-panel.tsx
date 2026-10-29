"use client";

import { Sparkles } from "lucide-react";
import { useSkillCrash, fixForTestId } from "@/lib/skillcrash/store";
import { CodeBlock } from "../../shared/code-block";
import { DemoBadge } from "../../shared/badges";

/**
 * Suggested skill improvement — advisory only. It is derived from the
 * failed trace + the original instructions, never edits the skill, and
 * never influences the verdict.
 */
export function ImprovementPanel() {
  const selectedTestId = useSkillCrash((s) => s.selectedTestId);
  const runsByTest = useSkillCrash((s) => s.runsByTest);
  const fix = fixForTestId(selectedTestId);
  const hasRun = selectedTestId ? runsByTest[selectedTestId] !== undefined : false;

  return (
    <section aria-label="Suggested skill improvement" className="sc-panel p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-warn" strokeWidth={2} />
            Suggested skill improvement
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
            Derived from the original instructions and the recorded trace. Advisory only.
          </p>
        </div>
        <DemoBadge label="advisory · demo template" />
      </div>

      {!selectedTestId ? (
        <EmptyState text="Select a test case to see a suggestion." />
      ) : !hasRun ? (
        <EmptyState text="Run the test first — the suggestion is grounded in its actual trace." />
      ) : !fix ? (
        <EmptyState text="No template matches this case yet." />
      ) : (
        <div className="space-y-3">
          <div>
            <div className="sc-mono-label mb-1.5">current instruction (inadequate)</div>
            <CodeBlock code={fix.originalInstruction} className="border-bad/25" />
          </div>
          <div>
            <div className="sc-mono-label mb-1.5">why it failed the test</div>
            <p className="rounded-md border border-line bg-raised px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-2">
              {fix.whyInadequate}
            </p>
          </div>
          <div>
            <div className="sc-mono-label mb-1.5">proposed replacement</div>
            <CodeBlock code={fix.replacement} className="border-ok/25" label="copy-ready" />
          </div>
          <p className="rounded-md border border-warn/25 bg-warn/[0.06] px-3 py-2 text-[11.5px] leading-relaxed break-words text-ink-2">
            {fix.disclaimer} In this local demo the suggestion comes from a reviewed template —
            with the backend connected it is model-generated. Either way it is advisory: it does
            not affect the verdict and never modifies the uploaded skill without an explicit
            action from you.
          </p>
        </div>
      )}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-line">
      <p className="max-w-xs px-4 text-center text-[12.5px] leading-relaxed text-ink-3">{text}</p>
    </div>
  );
}
