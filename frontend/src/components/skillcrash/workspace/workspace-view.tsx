"use client";

import { useEffect, useRef } from "react";
import { useSkillCrash, useViewStore } from "@/lib/skillcrash/store";
import { WorkspaceSidebar, NAV_ITEMS } from "./workspace-sidebar";
import { WorkspaceHeader } from "./workspace-header";
import { RunsPanel } from "./panels/runs-panel";
import { DashboardPanel } from "./panels/dashboard-panel";
import { LibraryPanel } from "./panels/library-panel";
import { ToolsPanel } from "./panels/tools-panel";
import { RulesPanel } from "./panels/rules-panel";
import { SettingsPanel } from "./panels/settings-panel";

/**
 * The SkillCrash workspace — a real product interface with functional
 * controls and shared state. Everything deep-links from the landing page
 * via intent (e.g. open TC-004 and auto-run it).
 */
export function WorkspaceView() {
  const nav = useSkillCrash((s) => s.nav);
  const intent = useViewStore((s) => s.intent);
  const clearIntent = useViewStore((s) => s.clearIntent);
  const tests = useSkillCrash((s) => s.tests);
  const generating = useSkillCrash((s) => s.generating);
  const ensureDemoSkill = useSkillCrash((s) => s.ensureDemoSkill);

  // Always land with a skill loaded so the interface is never empty.
  useEffect(() => {
    ensureDemoSkill();
  }, [ensureDemoSkill]);

  // Deep-link intents from the landing page: generate attacks if needed,
  // select the target case, optionally auto-run it.
  useEffect(() => {
    const st = useSkillCrash.getState();
    if (!intent) return;
    if (st.tests.length === 0 && !st.generating) {
      void st.generateAttacks();
      return; // this effect re-runs once tests arrive
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
  }, [intent, tests, generating]);

  // Useful initial state: even without a deep link, the workspace boots with
  // the demo skill parsed, cases generated, TC-004 selected and run once —
 // so the replay, verdict and evidence panels all have real content.
  const bootedRef = useRef(false);
  useEffect(() => {
    if (intent || bootedRef.current) return;
    const st = useSkillCrash.getState();
    if (st.tests.length === 0 && !st.generating) {
      void st.generateAttacks();
      return; // re-runs when tests arrive
    }
    if (st.tests.length > 0) {
      bootedRef.current = true;
      const demo = st.tests.find((t) => t.id === "TC-004") ?? st.tests[0];
      if (!st.selectedTestId) st.selectTest(demo.id);
      if (!st.runsByTest[demo.id] && !st.runningTestId) {
        const reduced =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        void st.startRun(demo.id, { instant: reduced });
      }
    }
  }, [intent, tests, generating]);

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

export { NAV_ITEMS };
