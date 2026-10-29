"use client";

import { ChevronRight } from "lucide-react";
import { useSkillCrash, useBackToLanding } from "@/lib/skillcrash/store";
import { NAV_ITEMS, MobileNavSheet } from "./workspace-sidebar";
import { DemoBadge, StatusDot } from "../shared/badges";
import { SkillCrashMark } from "../shared/wordmark";

export function WorkspaceHeader() {
  const nav = useSkillCrash((s) => s.nav);
  const skills = useSkillCrash((s) => s.skills);
  const activeSkillId = useSkillCrash((s) => s.activeSkillId);
  const clientKind = useSkillCrash((s) => s.client.kind);
  const skill = skills.find((sk) => sk.id === activeSkillId) ?? null;
  const navLabel = NAV_ITEMS.find((n) => n.key === nav)?.label ?? "";
  const goLanding = useBackToLanding();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-base/95 px-4 backdrop-blur sm:px-6">
      <MobileNavSheet />
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          onClick={goLanding}
          className="hidden items-center gap-1.5 font-mono text-[11px] text-ink-3 transition-colors hover:text-ink-2 lg:flex"
          aria-label="Back to landing page"
        >
          <SkillCrashMark className="h-4 w-4" />
          SkillCrash
        </button>
        <ChevronRight className="hidden h-3 w-3 text-ink-3 lg:block" />
        <span className="font-mono text-[11px] text-ink">{navLabel}</span>
      </div>

      <div className="ml-auto hidden items-center gap-2 md:flex">
        {skill && (
          <span className="sc-chip max-w-[220px] truncate" title={skill.meta.description}>
            <span className="text-ink-3">skill:</span>
            <span className="truncate text-ink">{skill.meta.name || "unnamed"}</span>
            {skill.source !== "demo" && <span className="text-ink-3">· {skill.source}</span>}
          </span>
        )}
        <span className="sc-chip" title="Agent model under test">
          <span className="text-ink-3">model:</span> Gemma 4
          <span className="text-accent font-mono text-[10px]">· active</span>
        </span>
        <span className="sc-chip text-ok" title="All tool execution is safe in-memory">
          <StatusDot tone="ok" />
          mock sandbox · active
        </span>
        {clientKind === "http" ? (
          <span className="sc-chip border-ok/30 bg-ok/10 text-ok font-mono text-[10px]">
            <StatusDot tone="ok" />
            live api
          </span>
        ) : (
          <DemoBadge label="demo mode" />
        )}
      </div>
      <div className="ml-auto md:hidden">
        {clientKind === "http" ? (
          <span className="sc-chip border-ok/30 bg-ok/10 text-ok font-mono text-[10px]">
            live api
          </span>
        ) : (
          <DemoBadge label="demo" />
        )}
      </div>
    </header>
  );
}
