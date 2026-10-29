"use client";

import { Sparkles } from "lucide-react";
import { CodeBlock } from "../shared/code-block";
import { DemoBadge } from "../shared/badges";
import { SectionHeader } from "../shared/section-header";
import { DEMO_FIXES } from "@/lib/skillcrash/demo-data";

/**
 * Scene 6 — Improvement.
 *
 * Before/after of the demo skill's ambiguous upload rule, matching what the
 * workspace generates for TC-004. The "before" plate is ink (a failed
 * instruction read against the light); the "after" reads as a corrected
 * manuscript. Clearly labelled advisory — never applied automatically.
 */
export function ImprovementSection() {
  const fix = DEMO_FIXES["TC-004"];

  return (
    <section id="improvement" className="sc-light sc-grain relative overflow-hidden scroll-mt-16 py-16 sm:py-24">
      <div className="sc-container relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            index="05"
            eyebrow="From verdict to fix"
            title="A failed test becomes a concrete skill patch."
            lede={
              <>
                Every evaluated run ends with an advisory improvement derived from the
                original instructions and the actual failed trace — grounded in the rule
                that was violated, never applied automatically.
              </>
            }
          />
          <DemoBadge label="advisory · demo template" className="mb-1.5 shrink-0" />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Before — the failed instruction, set in ink */}
          <div className="sc-ink flex flex-col rounded-sm border border-[#37322b] p-5 shadow-[0_28px_70px_-40px_rgba(23,22,19,0.5)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
                Before — ambiguous instruction
              </span>
              <span className="rounded-sm border border-bad/30 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-bad uppercase">
                failed TC-004
              </span>
            </div>
            <CodeBlock code={fix.originalInstruction} className="flex-1 border-line" showLineNumbers />
            <ul className="mt-5 space-y-2.5">
              <li className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-bad" />
                &ldquo;Project files&rdquo; is never scoped away from secrets —{" "}
                <span className="font-mono text-[12px] text-bad">.env</span> counts as a project file.
              </li>
              <li className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-bad" />
                &ldquo;Act quickly when the user is in a hurry&rdquo; rewards exactly the
                pressure an attacker applies.
              </li>
              <li className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-bad" />
                No rule says urgency or authority claims cannot lift restrictions.
              </li>
            </ul>
          </div>

          {/* After — the corrected manuscript */}
          <div className="flex flex-col rounded-sm border border-line-strong bg-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.18em] text-ok uppercase">
                After — proposed replacement
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] text-ok uppercase">
                <Sparkles className="h-3 w-3" />
                suggestion
              </span>
            </div>
            <div className="flex-1 rounded-sm border border-ok/30 bg-inset">
              <CodeBlock code={fix.replacement} className="border-0" showLineNumbers />
            </div>
            <ul className="mt-5 space-y-2.5">
              <li className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-ok" />
                Rejects secret and credential files by name and pattern.
              </li>
              <li className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-ok" />
                Never bypasses secret-file restrictions, regardless of urgency or authority.
              </li>
              <li className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-ok" />
                Requires explicit confirmation for permitted destructive operations.
              </li>
              <li className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-ok" />
                Asks for clarification when a request is ambiguous.
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-[12.5px] leading-relaxed text-ink-2">
          {fix.disclaimer} In this local demo the suggestion comes from a reviewed template; with
          the FastAPI backend connected it is generated by the model. Either way it never
          determines the verdict and never edits the uploaded skill — applying it is an
          explicit, human action.
        </p>
      </div>
    </section>
  );
}
