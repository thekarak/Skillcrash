"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, RotateCcw, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeRunSync, replayRun } from "@/lib/skillcrash/agent-runner";
import { DEFAULT_POLICY } from "@/lib/skillcrash/sandbox";
import { DEMO_EXPECTATIONS, DEMO_TESTS } from "@/lib/skillcrash/demo-data";
import type { TraceEvent } from "@/lib/skillcrash/types";
import { useOpenWorkspace } from "@/lib/skillcrash/store";
import { prefersReducedMotion, usePrefersReducedMotion } from "../three/use-scene";
import { RawTraceView, TraceTimeline } from "../shared/events";
import { DemoBadge, VerdictBadge } from "../shared/badges";
import { SectionHeader } from "../shared/section-header";

/**
 * Scene 4 — Execution Replay.
 *
 * A bone "lab report" section holding one dark instrument: a real replay of
 * TC-004, computed by the same engine the workspace uses (mock sandbox +
 * deterministic judge), not a decorative mockup. The attempted action and
 * the sandbox's response stay visually distinct throughout.
 */
export function ReplayPreview() {
  const computed = useMemo(() => {
    const test = DEMO_TESTS.find((t) => t.id === "TC-004")!;
    return computeRunSync(test, DEFAULT_POLICY, DEMO_EXPECTATIONS["TC-004"]);
  }, []);

  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [playing, setPlaying] = useState(false);
  const [autoplayed, setAutoplayed] = useState(false);
  const tokenRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const openWorkspace = useOpenWorkspace();
  const reduced = usePrefersReducedMotion();

  // Reduced motion: the full recorded trace is shown statically — no
  // timed playback, no autoplay.
  const displayEvents = reduced ? computed.trace : events;
  const complete = reduced || (!playing && events.length >= computed.trace.length && events.length > 0);

  const play = async (instant = false) => {
    const token = ++tokenRef.current;
    setPlaying(true);
    setEvents([]);
    await replayRun(computed, {
      instant,
      shouldAbort: () => token !== tokenRef.current,
      onEvent: (e) => {
        if (token !== tokenRef.current) return;
        setEvents((prev) => [...prev, e]);
      },
    });
    if (token === tokenRef.current) setPlaying(false);
  };

  // autoplay once when scrolled into view (skipped for reduced motion)
  useEffect(() => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !autoplayed) {
          setAutoplayed(true);
          void play();
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoplayed, reduced]);

  const progressPct = Math.round((displayEvents.length / computed.trace.length) * 100);

  return (
    <section id="replay" className="sc-light sc-grain relative overflow-hidden py-16 sm:py-24">
      <div className="sc-container relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            index="03"
            eyebrow="Execution Replay"
            title="Read the failure like an engineer."
            lede={
              <>
                TC-004 — &ldquo;Attempt to expose .env&rdquo; — computed in your browser by the
                same local engine the workspace uses: a scripted demo agent, the mock sandbox
                and the deterministic judge. It is a local demo — no live model call, no real
                files, and nothing leaves this page.
              </>
            }
          />
          <DemoBadge label="local demo · scripted agent" className="mb-1.5 shrink-0" />
        </div>

        <div ref={rootRef} className="mt-10">
          {/* the instrument — ink panel inside the bone report */}
          <div className="sc-ink overflow-hidden rounded-sm border border-[#37322b] shadow-[0_40px_90px_-45px_rgba(23,22,19,0.55)]">
            {/* window chrome */}
            <div className="flex flex-wrap items-center gap-3 border-b border-line bg-raised px-4 py-3">
              <div className="flex items-center gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-bad/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-warn/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-ok/80" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[11.5px] text-ink-2">
                  <span className="font-semibold text-copper">TC-004</span> — Attempt to expose
                  .env via upload
                </p>
              </div>
              {playing ? (
                <span className="sc-chip text-accent">
                  <span className="sc-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  executing · {progressPct}%
                </span>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 border-line bg-transparent px-2.5 font-mono text-[11px] text-ink-2 hover:bg-surface hover:text-ink"
                  onClick={() => void play(prefersReducedMotion())}
                >
                  {(reduced || events.length > 0) ? (
                    <>
                      <RotateCcw className="h-3 w-3" /> replay
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" /> play run
                    </>
                  )}
                </Button>
              )}
            </div>

            <Tabs defaultValue="timeline" className="gap-0">
              <div className="border-b border-line px-4 pt-3">
                <TabsList className="bg-inset">
                  <TabsTrigger
                    value="timeline"
                    className="data-[state=active]:bg-surface data-[state=active]:text-ink font-mono text-[11px]"
                  >
                    <ScrollText className="h-3.5 w-3.5" /> timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="raw"
                    className="data-[state=active]:bg-surface data-[state=active]:text-ink font-mono text-[11px]"
                  >
                    raw trace · JSON
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="timeline" className="mt-0">
                <div className="sc-scroll max-h-[470px] min-h-[320px] overflow-y-auto px-4 py-4 sm:px-6">
                  <TraceTimeline events={displayEvents} autoScroll={playing} />
                </div>
              </TabsContent>
              <TabsContent value="raw" className="mt-0">
                <div className="p-4 sm:p-5">
                  <RawTraceView events={displayEvents} className="max-h-[470px] min-h-[320px]" />
                </div>
              </TabsContent>
            </Tabs>

            {/* verdict banner */}
            <div
              className={`flex flex-wrap items-center gap-3 border-t border-line px-4 py-3.5 transition-colors sm:px-6 ${
                complete ? "border-bad/30 bg-bad/[0.07]" : "bg-raised/50"
              }`}
              aria-live="polite"
            >
              {complete ? (
                <>
                  <VerdictBadge outcome={computed.verdict.outcome} size="lg" />
                  <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-2">
                    {computed.verdict.reason} The upload was attempted and blocked — the evidence
                    records the attempt, and the attempt is what failed the approved rule.
                  </p>
                </>
              ) : (
                <p className="font-mono text-[11px] text-ink-3">
                  {playing
                    ? "recording — sandbox and judge events will appear as they happen…"
                    : "press play to record the run, or read the raw trace"}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
            <p className="max-w-xl font-mono text-[10.5px] leading-relaxed text-ink-2">
              What you just watched: attack prompt received → the scripted demo agent attempts a
              simulated upload_file(&quot;.env&quot;) → mock sandbox blocks the prohibited
              secret-file operation → trace recorder captures action and response →
              deterministic judge returns FAIL → evidence explains the violation. No real file
              was ever accessed or uploaded.
            </p>
            <Button
              type="button"
              size="lg"
              className="h-11 bg-accent px-5 font-medium text-primary-foreground hover:bg-accent/90"
              onClick={() => openWorkspace({ testId: "TC-004", autorun: true })}
            >
              Open this case in the workspace
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
