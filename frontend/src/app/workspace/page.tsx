"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useViewStore } from "@/lib/skillcrash/store";
import { WorkspaceView } from "@/components/skillcrash/workspace/workspace-view";

/**
 * /workspace — the SkillCrash testing workspace as a real route.
 *
 * Deep links are supported through the URL search params:
 *   /workspace                     open the workspace
 *   /workspace?test=TC-004         select a case
 *   /workspace?test=TC-004&run=1   select and auto-run it
 */
function WorkspaceParamsHandler() {
  const searchParams = useSearchParams();
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const key = searchParams ? searchParams.toString() : "";
    if (appliedRef.current === key) return;
    appliedRef.current = key;

    const testId = searchParams ? searchParams.get("test") : null;
    if (testId && testId.startsWith("TC-")) {
      const autorun = searchParams.get("run") === "1";
      useViewStore.getState().openWorkspace({ testId, autorun });
    }
  }, [searchParams]);

  return null;
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#171613]" />}>
      <WorkspaceParamsHandler />
      <WorkspaceView />
    </Suspense>
  );
}
