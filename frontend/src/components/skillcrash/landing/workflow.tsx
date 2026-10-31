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
    body: "The developer uploads SKILL.md. SkillCrash parses the YAML frontmatter, surfaces the skill's metadata, and extracts its safety instructions — the rules the agent is supposed to follow.",
    meta: [
      { label: "name", value: "project-cleanup" },
      { label: "directives", value: "1 explicit + 4 detected" },
      { label: "gaps", value: "upload rule unscoped" },
    ],
  },
  {
    id: "attack",
    num: "02",
    title: "ATTACK",
    body: "Gemma 4 generates adversarial test cases tailored to that skill: prompt injection, unconfirmed destructive actions, secret-file exposure, invalid paths, conflicting instructions. Each case comes with a draft expected-behaviour rule set for you to review.",
    meta: [
      { label: "cases", value: "3–5 per generation" },
      { label: "categories", value: "5 attack classes" },
      { label: "labelling", value: "demo generator — no live call" },
    ],
  },
  {
    id: "execute",
    num: "03",
    title: "EXECUTE",
    body: "The agent under test follows the skill and proposes tool calls. Every call is name-checked against the allowlist, schema-validated, policy-checked and simulated in-memory by the mock sandbox — then recorded, response and all.",
    meta: [
      { label: "tools", value: "6 allowlisted mock tools" },
      { label: "policy", value: "root confinement · secret-file block" },
      { label: "recording", value: "full trace with timestamps" },
    ],
  },
  {
    id: "judge",
    num: "04",
    title: "JUDGE",
    body: "Deterministic assertions compare the recorded behaviour against the expectations you approved — never against the attack text, and never by asking a model. Any violated rule produces FAIL with evidence; an incomplete run produces ERROR, not a guess.",
    meta: [
      { label: "engine", value: "deterministic rules" },
      { label: "semantics", value: "attempt counts, not outcome" },
      { label: "outputs", value: "PASS · FAIL · ERROR" },
    ],
  },
  {
    id: "replay",
    num: "05",
    title: "REPLAY",
    body: "The developer inspects the execution trace event by event — prompts, observable agent output, tool calls with arguments, validation results, mock responses, judge scoring — then reads the evidence-backed verdict and a suggested improvement to the skill.",
    meta: [
      { label: "views", value: "timeline · raw JSON" },
      { label: "evidence", value: "rule-by-rule with trace refs" },
      { label: "output", value: "advisory skill fix" },
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
          eyebrow="How it works"
          title={
            <>
              Five stages between a skill
              <br className="hidden sm:block" /> and a defensible verdict.
            </>
          }
          lede="Scroll to walk the pipeline your agent will walk — every stage below maps to a step you can run yourself in the workspace."
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
                {staticMode ? "pipeline · static" : "pipeline · scroll-driven"}
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
