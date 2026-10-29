"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpenWorkspace } from "@/lib/skillcrash/store";
import { HeroSceneCanvas } from "../three/hero-canvas";

/**
 * Scene 1 — Hero.
 *
 * Editorial plate composition: masthead rule, oversized left-aligned
 * headline, and the Attack Path — a live Three.js scene of the execution
 * pipeline — staged opposite the copy inside a framed plate with a caption.
 */
export function Hero() {
  const openWorkspace = useOpenWorkspace();

  return (
    <section id="top" className="relative overflow-hidden">
      {/* ink environment with a warm vignette */}
      <div aria-hidden className="sc-grid-bg sc-grid-bg-fade absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(165,111,80,0.07), transparent 60%), radial-gradient(ellipse 90% 70% at 20% 90%, rgba(224,35,28,0.05), transparent 55%)",
        }}
      />

      {/* masthead — printed-page metadata row */}
      <div aria-hidden className="absolute inset-x-0 top-16 hidden lg:block">
        <div className="sc-container-wide">
          <div className="flex items-center justify-between border-t border-line pt-2.5 font-mono text-[9.5px] tracking-[0.22em] text-ink-3 uppercase">
            <span>SkillCrash — adversarial skill testing</span>
            <span className="hidden xl:block">failure as a first-class artifact</span>
            <span>Plate 01 · The Attack Path</span>
          </div>
        </div>
      </div>

      <div className="sc-container-wide relative grid gap-10 pt-28 pb-16 sm:pt-32 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)] lg:gap-10 lg:pt-40 lg:pb-24">
        {/* Copy — editorial column */}
        <div className="flex max-w-xl flex-col justify-center">
          <p className="sc-fade-up sc-eyebrow flex items-center gap-2.5">
            <span aria-hidden className="inline-block h-[3px] w-8 bg-accent" />
            Adversarial crash-testing for agent skills
          </p>

          <h1 className="sc-fade-up mt-6 text-[2.9rem] leading-[0.98] font-semibold tracking-[-0.03em] text-ink [animation-delay:80ms] sm:text-[3.9rem] lg:text-[4.6rem]">
            Find the failure path before your agent{" "}
            <span className="relative whitespace-nowrap text-accent">
              ships.
              <svg
                aria-hidden
                viewBox="0 0 200 9"
                className="absolute -bottom-2 left-0 w-full"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 6 C 60 2, 140 2, 198 5"
                  fill="none"
                  stroke="#A56F50"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </svg>
            </span>
          </h1>

          <p className="sc-fade-up mt-7 max-w-md text-[16px] leading-relaxed text-ink-2 [animation-delay:160ms]">
            Stress-test AI Agent Skills through adversarial prompts, safe simulated
            execution, and evidence-backed verdicts.
          </p>

          <div className="sc-fade-up mt-9 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
            <Button
              type="button"
              size="lg"
              className="h-12 bg-accent px-6 text-[15px] font-semibold text-primary-foreground shadow-[0_18px_40px_-16px_rgba(224,35,28,0.55)] hover:bg-accent/90"
              onClick={() => openWorkspace({ testId: "TC-004", autorun: true })}
            >
              Open Workspace <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12 border-line-strong bg-raised/60 px-6 text-[15px] font-medium text-ink shadow-[inset_0_0_0_1px_rgba(238,232,220,0.06)] hover:bg-raised hover:text-ink"
              asChild
            >
              <a href="#workflow">
                Explore the System <ArrowDown className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <p className="sc-fade-up mt-5 font-mono text-[10.5px] leading-relaxed text-ink-3 [animation-delay:320ms]">
            The workspace opens on demo case TC-004 — an emergency-framed attempt to
            upload <span className="text-copper">.env</span> — and runs it end to end.
          </p>
        </div>

        {/* The Attack Path — live Three.js plate */}
        <div className="sc-fade-up relative [animation-delay:200ms]">
          <div className="relative h-[420px] overflow-hidden rounded-sm border border-line bg-inset sm:h-[500px] lg:h-[620px]">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 90% 80% at 50% 40%, rgba(23,22,19,0) 40%, rgba(16,14,12,0.85) 100%)",
              }}
            />
            <div className="absolute inset-0">
              <HeroSceneCanvas />
            </div>
            {/* plate frame */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <span className="absolute top-3 left-3 h-4 w-4 border-t border-l border-copper/60" />
              <span className="absolute top-3 right-3 h-4 w-4 border-t border-r border-copper/60" />
              <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-copper/60" />
              <span className="absolute right-3 bottom-3 h-4 w-4 border-b border-r border-copper/60" />
              <div className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-sm border border-line bg-base/80 px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-ink-3 uppercase backdrop-blur-sm">
                <span className="sc-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                Execution graph — live render
              </div>
            </div>
          </div>
          {/* plate caption */}
          <div className="mt-3 flex items-start justify-between gap-4 border-t border-line pt-2.5">
            <p className="max-w-lg font-mono text-[10px] leading-relaxed text-ink-2">
              SKILL.md → attack prompt → agent → mock sandbox → deterministic judge.
              The vermilion signal is the hostile path: the agent attempts{" "}
              <span className="text-copper">upload_file(&quot;.env&quot;)</span>, the sandbox gate
              blocks it — and the judge still returns FAIL, because the attempt itself
              violated the approved rule.
            </p>
            <span className="hidden shrink-0 font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase sm:block">
              fig. 01 — renders locally
            </span>
          </div>
        </div>
      </div>

      {/* proof strip */}
      <div className="relative border-t border-line bg-raised/40">
        <div className="sc-container-wide flex flex-wrap items-center gap-x-8 gap-y-2 py-4" role="list" aria-label="Product facts">
          {[
            ["05", "attack classes"],
            ["06", "allowlisted mock tools"],
            ["3-state", "deterministic verdicts"],
            ["00", "real executions — ever"],
          ].map(([value, label], i) => (
            <span key={label} role="listitem" className="flex items-baseline gap-2">
              {i > 0 && <span aria-hidden className="mr-4 text-ink-3/40">/</span>}
              <span className="font-mono text-[14px] font-semibold text-copper">{value}</span>
              <span className="text-[12px] text-ink-3">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
