"use client";

import { useEffect } from "react";
import { useSkillCrash, useViewStore } from "@/lib/skillcrash/store";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceHeader } from "./workspace-header";
import { RunsPanel } from "./panels/runs-panel";
import { DashboardPanel } from "./panels/dashboard-panel";
import { LibraryPanel } from "./panels/library-panel";
import { ToolsPanel } from "./panels/tools-panel";
import { RulesPanel } from "./panels/rules-panel";
import { SettingsPanel } from "./panels/settings-panel";

/**
 * The SkillCrash workspace — interactive dashboard with user-directed execution.
 * Only deep-link intents from landing page auto-trigger; dashboard boots cleanly
 * without unsolicited auto-generation.
 */
export function WorkspaceView() {
  const nav = useSkillCrash((s) => s.nav);
  const intent = useViewStore((s) => s.intent);
  const clearIntent = useViewStore((s) => s.clearIntent);
  const tests = useSkillCrash((s) => s.tests);
  const generating = useSkillCrash((s) => s.generating);
  const ensureDemoSkill = useSkillCrash((s) => s.ensureDemoSkill);

  // Always land with a default skill loaded so the interface is never empty.
  useEffect(() => {
    ensureDemoSkill();
  }, [ensureDemoSkill]);

  // Deep-link intents specifically triggered from the landing page:
  useEffect(() => {
    const st = useSkillCrash.getState();
    if (!intent) return;
    if (st.tests.length === 0 && !st.generating) {
      void st.generateAttacks();
      return;
    }
    if (intent.testId && st.tests.some((t) => t.id === intent.testId)) {
      st.selectTest(intent.testId);
      if (intent.autorun && !st.runningTestId && !st.runsByTest[intent.testId]) {
        const reduced =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        void st.startRun(intent.testId, { instant: reduced });
      }
      clearIntent();
    }
  }, [intent, tests, generating, clearIntent]);

  return (
    <div className="sc-light flex h-screen overflow-hidden bg-base text-ink">
      <WorkspaceSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceHeader />
        <main className="sc-scroll flex-1 overflow-y-auto" id="workspace-main">
          {nav === "runs" && <RunsPanel />}
          {nav === "dashboard" && <DashboardPanel />}
          {nav === "library" && <LibraryPanel />}
          {nav === "tools" && <ToolsPanel />}
          {nav === "rules" && <RulesPanel />}
          {nav === "settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}
