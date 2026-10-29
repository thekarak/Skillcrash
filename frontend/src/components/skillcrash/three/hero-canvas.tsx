"use client";

import { useEffect, useRef } from "react";
import { HeroScene } from "./hero-scene";
import { prefersReducedMotion, useSceneMount } from "./use-scene";
import { PipelineFallback } from "../shared/pipeline-fallback";

/**
 * Hero canvas wrapper: mounts HeroScene, feeds it scroll progress, and
 * degrades to the static pipeline diagram when WebGL is unavailable.
 */
export function HeroSceneCanvas() {
  const sceneRef = useRef<HeroScene | null>(null);

  const { canvasRef, failed } = useSceneMount({
    factory: (canvas) => {
      const scene = new HeroScene(canvas, { reducedMotion: prefersReducedMotion() });
      sceneRef.current = scene;
      return scene;
    },
  });

  // scroll progress: 0 while hero fills the viewport, 1 as it leaves.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas || !sceneRef.current) return;
        const rect = canvas.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
        sceneRef.current.setScrollProgress(p * 0.9);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [canvasRef]);

  if (failed) {
    return (
      <div className="sc-panel relative flex h-full w-full items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <p className="sc-mono-label mb-4 text-center">3D view unavailable — static pipeline diagram</p>
          <PipelineFallback />
          <p className="mt-4 text-center font-mono text-[11px] leading-relaxed text-ink-3">
            upload_file(&quot;.env&quot;) blocked by the secret-file policy — attempt recorded,
            deterministic judge returns FAIL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-label="Animated SkillCrash execution pipeline: a hostile prompt drives the agent to attempt uploading .env, the sandbox blocks it, and the judge returns FAIL"
      role="img"
    />
  );
}
