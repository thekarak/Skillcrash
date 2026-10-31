"use client";

import { Sparkles } from "lucide-react";
import { useSkillCrash, fixForTestId } from "@/lib/skillcrash/store";
import { CodeBlock } from "../../shared/code-block";
import { DemoBadge } from "../../shared/badges";

/**
 * Suggested skill improvement — advisory only. Derived from the
 * failed trace and verified rule violations.
 */
export function ImprovementPanel() {
  const selectedTestId = useSkillCrash((s) => s.selectedTestId);
  const runsByTest = useSkillCrash((s) => s.runsByTest);
  const fix = fixForTestId(selectedTestId);
  const hasRun = selectedTestId ? runsByTest[selectedTestId] !== undefined : false;

  return (
    <section aria-label="Suggested skill improvement" className="sc-panel p-4 sm:p-5">
      <div className="mb-3.5 flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-warn" strokeWidth={2} />
            Remediation Recommendation
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
            Suggested patch derived from violated safety boundaries. Strictly advisory.
          </p>
        </div>
        <DemoBadge label="Advisory Patch" />
      </div>

      {!selectedTestId ? (
        <EmptyState text="Select a test scenario to inspect recommended patches." />
      ) : !hasRun ? (
        <EmptyState text="Run the test scenario first — recommendations are grounded in recorded execution telemetry." />
      ) : !fix ? (
        <EmptyState text="No remediation template matches this scenario yet." />
      ) : (
        <div className="space-y-3.5">
          <div>
            <div className="mb-1.5 text-[12.5px] font-semibold tracking-wider text-bad uppercase">
              Vulnerable Guideline (Current)
            </div>
            <CodeBlock code={fix.originalInstruction} className="border-bad/30" />
          </div>
          <div>
            <div className="mb-1.5 text-[12.5px] font-semibold tracking-wider text-ink-3 uppercase">
              Root Cause of Failure
            </div>
            <p className="rounded-md border border-line bg-raised px-3.5 py-3 text-[13.5px] leading-relaxed text-ink-2">
              {fix.whyInadequate}
            </p>
          </div>
          <div>
            <div className="mb-1.5 text-[12.5px] font-semibold tracking-wider text-ok uppercase">
              Recommended Hardened Guideline
            </div>
            <CodeBlock code={fix.replacement} className="border-ok/30" label="Copy to Skill" />
          </div>
          <p className="rounded-md border border-warn/25 bg-warn/[0.06] px-3.5 py-2.5 text-[12.5px] leading-relaxed break-words text-ink-2">
            {fix.disclaimer} Suggested modifications are strictly isolated from your source SKILL.md until reviewed and committed by your team.
          </p>
        </div>
      )}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-line p-6">
      <p className="max-w-xs text-center text-[13.5px] leading-relaxed text-ink-3">{text}</p>
    </div>
  );
}
