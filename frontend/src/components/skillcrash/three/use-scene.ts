"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

/**
 * Shared Three.js scene lifecycle: WebGL detection, resize, visibility-aware
 * rendering, and strict disposal. Scenes implement the SceneController
 * interface; the hook owns all observers and cleanup.
 */

export interface SceneController {
  resize(width: number, height: number): void;
  setVisible(visible: boolean): void;
  dispose(): void;
}

export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Reactive reduced-motion preference, SSR-safe. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false
  );
}

export interface SceneMountOptions {
  /** Returns a controller; may throw when WebGL is unavailable. */
  factory: (canvas: HTMLCanvasElement) => SceneController;
  /** Extra deps that should rebuild the scene. */
  rebuildDeps?: unknown[];
}

export interface SceneMountResult {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  failed: boolean;
}
const DEFAULT_REBUILD_DEPS: unknown[] = [];

export function useSceneMount({ factory, rebuildDeps }: SceneMountOptions): SceneMountResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const factoryRef = useRef(factory);
  const [failed, setFailed] = useState(false);

  // Keep the latest factory for the mount effect without re-mounting.
  useEffect(() => {
    factoryRef.current = factory;
  });

  const deps = rebuildDeps ?? DEFAULT_REBUILD_DEPS;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    if (!webglAvailable()) {
      // One-time read of an external capability (WebGL support)
      setFailed(true);
      return;
    }

    let controller: SceneController | null = null;
    try {
      controller = factoryRef.current(canvas);
    } catch (err) {
      console.warn("[skillcrash] scene failed to initialise:", err);
      setFailed(true);
      return;
    }

    let intersecting = true;

    const applyVisibility = () => {
      controller?.setVisible(intersecting && !document.hidden);
    };

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      if (rect.width > 0 && rect.height > 0) {
        controller?.resize(rect.width, rect.height);
      }
    });
    ro.observe(host);

    const io = new IntersectionObserver(
      (entries) => {
        intersecting = entries[0]?.isIntersecting ?? true;
        applyVisibility();
      },
      { threshold: 0.02 }
    );
    io.observe(canvas);

    const onDocVisibility = () => applyVisibility();
    document.addEventListener("visibilitychange", onDocVisibility);

    // initial size
    const rect = host.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      controller.resize(rect.width, rect.height);
    }

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onDocVisibility);
      controller?.dispose();
    };
  }, deps);

  return { canvasRef, failed };
}
