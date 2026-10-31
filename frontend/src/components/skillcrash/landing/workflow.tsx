"use client";

import { useEffect, useRef, useState } from "react";
import { WorkflowScene } from "../three/workflow-scene";
import { prefersReducedMotion, usePrefersReducedMotion, useSceneMount } from "../three/use-scene";
import { PipelineFallback } from "../shared/pipeline-fallback";
import { SectionHeader } from "../shared/section-header";
import { cn } from "@/lib/utils";

/**
 * Scroll-driven workflow — five stages (LOAD, ATTACK, EXECUTE, JUDGE,
 * REPLAY) presented as a sticky cinematic scene. The 3D camera flies along
 * the pipeline as the user scrolls; text, scene and progress rail stay in
 * sync. Reduced motion and no-WebGL devices get a readable static layout.
 */

interface StageDef {
  id: string;
  num: string;
  title: string;
  body: string;
  meta: { label: string; value: string }[];
}

const STAGES: StageDef[] = [
  {
    id: "load",
    num: "01",
    title: "LOAD",
    body: "Upload or select a SKILL.md specification. SkillCrash parses frontmatter metadata, extracts system guidelines, and identifies implicit operational constraints and gaps.",
    meta: [
      { label: "target", value: "project-cleanup" },
      { label: "directives", value: "1 explicit + 4 detected" },
      { label: "boundaries", value: "unscoped file permissions" },
    ],
  },
  {
    id: "attack",
    num: "02",
    title: "ATTACK",
    body: "The test generator synthesizes targeted adversarial vectors against the parsed specification: indirect prompt injection, unauthorized exfiltration, unconfirmed destructive calls, path traversal, and constraint override attempts.",
    meta: [
      { label: "cases", value: "3–5 generated suite" },
      { label: "categories", value: "5 attack vectors" },
      { label: "engine", value: "Gemma 4 adversarial generation" },
    ],
  },
  {
    id: "execute",
    num: "03",
    title: "EXECUTE",
    body: "The agent under test processes the adversarial challenge and proposes tool invocations. Every invocation is schema-validated, evaluated against runtime policy gates, executed in an isolated mock filesystem, and streamed to the trace recorder.",
    meta: [
      { label: "tools", value: "6 allowlisted mock tools" },
      { label: "isolation", value: "in-memory filesystem sandbox" },
      { label: "telemetry", value: "full execution trace" },
    ],
  },
  {
    id: "judge",
    num: "04",
    title: "JUDGE",
    body: "The deterministic rule engine evaluates the execution trace against explicit safety assertions. Out-of-bounds invocations yield immediate FAIL verdicts with precise trace references, ensuring objective, reproducible evaluation.",
    meta: [
      { label: "engine", value: "deterministic rule engine" },
      { label: "evaluation", value: "invocation intent & boundaries" },
      { label: "verdicts", value: "PASS · FAIL · ERROR" },
    ],
  },
  {
    id: "replay",
    num: "05",
    title: "REPLAY",
    body: "Inspect the end-to-end execution timeline: prompts, agent outputs, tool call arguments, sandbox interceptions, and rule violations. Review the generated advisory patch to harden the skill against future regressions.",
    meta: [
      { label: "inspection", value: "event timeline · JSON export" },
      { label: "audit", value: "rule-by-rule trace evidence" },
      { label: "remediation", value: "advisory guideline patch" },
    ],
  },
];

const SECTION_VH = 110; // scroll length per stage

export function Workflow() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<WorkflowScene | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const prefersReduced = usePrefersReducedMotion();

  const { canvasRef, failed } = useSceneMount({
    factory: (canvas) => {
      const scene = new WorkflowScene(canvas, { reducedMotion: prefersReducedMotion() });
      sceneRef.current = scene;
      return scene;
    },
  });

  const staticMode = prefersReduced || failed;

  const activeIndex = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length));
  const active = STAGES[activeIndex];
  const activeId = active.id;

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
        setProgress(p);
        sceneRef.current?.setProgress(p);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // report the overlay card's right edge to the scene so stage labels fade
  // out before passing underneath it (canvas spans the full sticky width).
  // the card remounts per stage (key=active.id), so re-attach per stage.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const report = () => {
      const rect = card.getBoundingClientRect();
      if (rect.width > 0) sceneRef.current?.setOverlayRightPx(rect.right);
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(card);
    window.addEventListener("resize", report);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", report);
    };
  }, [activeId]);

  return (
    <section id="workflow" ref={sectionRef} className="relative scroll-mt-16 border-t border-line">
      <div className="sc-container pt-16 pb-8 sm:pt-24 sm:pb-10">
        <SectionHeader
          index="02"
          eyebrow="System Architecture"
          title={
            <>
              Five stages between a skill
              <br className="hidden sm:block" /> and a defensible verdict.
            </>
          }
          lede="Step through the automated testing lifecycle: from parsing skill boundaries to generating attack vectors, sandbox interception, and deterministic scoring."
        />
      </div>

      <div style={{ height: `${SECTION_VH * STAGES.length}vh` }} className="relative">
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
          {/* stage scene */}
          <div className="relative min-h-0 flex-1">
            {failed ? (
              <div className="flex h-full items-center justify-center px-6">
                <div className="w-full max-w-4xl">
                  <PipelineFallback compact />
                </div>
              </div>
            ) : (
              <canvas ref={canvasRef} className="h-full w-full" aria-hidden role="presentation" />
            )}

            {/* stage text overlay */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 sm:inset-y-0 sm:flex sm:items-center">
              <div className="pointer-events-auto w-full px-5 sm:px-8">
                <div
                  ref={cardRef}
                  className="sc-fade-up max-w-[340px] rounded-sm border border-line bg-base/88 p-5 backdrop-blur-md sm:max-w-[380px] sm:p-6 2xl:max-w-md"
                  key={active.id}
                >
                  <div className="flex items-baseline gap-3.5">
                    <span className="font-mono text-[30px] leading-none font-semibold text-copper">
                      {active.num}
                    </span>
                    <h3 className="font-mono text-[13px] font-semibold tracking-[0.2em] text-ink">
                      {active.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{active.body}</p>
                  <dl className="mt-4 space-y-1.5 border-t border-line pt-3">
                    {active.meta.map((m) => (
                      <div key={m.label} className="flex items-baseline justify-between gap-4">
                        <dt className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
                          {m.label}
                        </dt>
                        <dd className="text-right font-mono text-[11px] text-ink-2">{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* progress rail */}
          <div className="relative z-10 border-t border-line bg-base/90 backdrop-blur">
            <div className="flex w-full items-center gap-4 px-5 py-3.5 sm:px-8">
              <span className="sc-mono-label hidden shrink-0 sm:block">
                {staticMode ? "pipeline · static" : "pipeline · interactive"}
              </span>
              <ol className="flex flex-1 items-center gap-1.5 sm:gap-3" aria-label="Workflow stages">
                {STAGES.map((s, i) => {
                  const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "todo";
                  return (
                    <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
                      <span
                        className={cn(
                          "font-mono text-[10px] font-semibold tracking-[0.08em] whitespace-nowrap",
                          state === "active" && "text-copper",
                          state === "done" && "text-ink-3",
                          state === "todo" && "text-ink-3/50"
                        )}
                      >
                        {s.num} {s.title}
                      </span>
                      <span className="h-px flex-1 overflow-hidden bg-line">
                        <span
                          className={cn(
                            "block h-px transition-all duration-500",
                            state === "active" ? "w-full bg-accent" : state === "done" ? "w-full bg-ink-3/50" : "w-0"
                          )}
                        />
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Static, no-JS-3D fallback content for screen readers / SEO */}
      <div className="sr-only">
        {STAGES.map((s) => (
          <div key={s.id}>
            <h3>
              {s.num} — {s.title}
            </h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
