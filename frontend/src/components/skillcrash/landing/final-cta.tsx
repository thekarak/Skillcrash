"use client";

import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpenWorkspace } from "@/lib/skillcrash/store";
import { SkillCrashWordmark } from "../shared/wordmark";

/**
 * Scene 7 — Final CTA + concise footer.
 *
 * The closing ink plate: the three-beat headline, the single action, and a
 * quiet honesty strip. No repository URL is configured in this deployment,
 * so no source link is faked.
 */
export function FinalCta() {
  const openWorkspace = useOpenWorkspace();

  return (
    <section className="relative overflow-hidden border-t border-line">
      <div aria-hidden className="sc-grid-bg sc-grid-bg-fade absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(224,35,28,0.07), transparent 65%)",
        }}
      />
      {/* oversized plate numeral */}
      <span aria-hidden className="sc-ghost -top-10 right-4 hidden text-[16rem] leading-none lg:block">
        07
      </span>

      <div className="sc-container relative py-28 sm:py-36">
        <p className="sc-fade-up sc-eyebrow flex items-center gap-2.5">
          <span aria-hidden className="inline-block h-[3px] w-8 bg-accent" />
          SkillCrash
        </p>
        <h2 className="sc-fade-up mt-6 max-w-3xl text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.03em] text-ink [animation-delay:80ms] sm:text-[3.4rem]">
          Test the edge case. Inspect the evidence.{" "}
          <span className="text-accent">Fix the skill.</span>
        </h2>

        <div className="sc-fade-up mt-9 [animation-delay:160ms]">
          <Button
            type="button"
            size="lg"
            className="h-12 bg-accent px-7 text-[15px] font-semibold text-primary-foreground shadow-[0_18px_44px_-16px_rgba(224,35,28,0.6)] hover:bg-accent/90"
            onClick={() => openWorkspace({ testId: "TC-004", autorun: true })}
          >
            Open SkillCrash Workspace <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>

        <p id="open-source" className="sc-fade-up mt-8 font-mono text-[10.5px] tracking-[0.14em] text-ink-3 uppercase [animation-delay:240ms]">
          Built by Redtoken · MVP status: mock-only execution, Gemma 4 agent under test · not a security certification
        </p>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const openWorkspace = useOpenWorkspace();

  return (
    <footer className="mt-auto border-t border-line bg-raised/30">
      <div className="sc-container flex flex-col gap-8 py-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm">
          <SkillCrashWordmark withTag />
          <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
            Adversarial crash-testing for AI Agent Skills. SkillCrash simulates tool execution in
            its MVP — mock tools only, no real filesystem, credential or network access — and
            tests a Gemma 4 agent against the supplied skill.
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-14 gap-y-2 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="sc-mono-label mb-1">Product</span>
            <a href="#product" className="text-[13px] text-ink-2 transition-colors hover:text-ink">
              The failure
            </a>
            <a href="#workflow" className="text-[13px] text-ink-2 transition-colors hover:text-ink">
              How it works
            </a>
            <a href="#safety" className="text-[13px] text-ink-2 transition-colors hover:text-ink">
              Safety boundaries
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="sc-mono-label mb-1">Workspace</span>
            <button
              type="button"
              onClick={() => openWorkspace()}
              className="text-left text-[13px] text-ink-2 transition-colors hover:text-ink"
            >
              Test runs
            </button>
            <button
              type="button"
              onClick={() => openWorkspace({ testId: "TC-004", autorun: true })}
              className="text-left text-[13px] text-ink-2 transition-colors hover:text-ink"
            >
              Demo case TC-004
            </button>
            <button
              type="button"
              onClick={() => openWorkspace()}
              className="text-left text-[13px] text-ink-2 transition-colors hover:text-ink"
            >
              Skill library
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <span className="sc-mono-label mb-1">Project</span>
            <span className="text-[13px] text-ink-3">Open source — repository URL pending</span>
            <span className="text-[13px] text-ink-3">Team Redtoken</span>
          </div>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="sc-container flex flex-wrap items-center justify-between gap-2 py-4">
          <p className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
            SkillCrash — simulates tool execution · mock-only in MVP
          </p>
          <p className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
            not a security certification
          </p>
        </div>
      </div>
    </footer>
  );
}
