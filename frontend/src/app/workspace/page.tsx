"use client";

import { useEffect, useRef } from "react";
import { useViewStore } from "@/lib/skillcrash/store";
import { WorkspaceView } from "@/components/skillcrash/workspace/workspace-view";

/**
 * /workspace — the SkillCrash testing workspace as a real route.
 *
 * Deep links are supported through the URL search params:
 *   /workspace                     open the workspace
 *   /workspace?test=TC-004         select a case
 *   /workspace?test=TC-004&run=1   select and auto-run it
 *
 * The URL intent is applied exactly once per navigation (tracked by ref) so it
 * never fights the workspace, which clears the intent after consuming it.
 * Client-side navigations from the landing page carry their intent through
 * the store instead, so nothing is overwritten here.
 */
export default function WorkspacePage() {
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const key = window.location.search;
    if (appliedRef.current === key) return;
    appliedRef.current = key;

    const params = new URLSearchParams(key);
    const testId = params.get("test");
    if (testId && testId.startsWith("TC-")) {
      const autorun = params.get("run") === "1";
      useViewStore.getState().openWorkspace({ testId, autorun });
    }
  }, []);

  return <WorkspaceView />;
}
