"use client";

import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { useSkillCrash, useBackToLanding } from "@/lib/skillcrash/store";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, MobileNavSheet } from "./workspace-sidebar";
import { DemoBadge, StatusDot } from "../shared/badges";
import { SkillCrashMark } from "../shared/wordmark";

/**
 * Model/backend chip state. "live" is only ever shown after the configured
 * HTTP adapter's /health probe succeeds; the demo adapter is never "live".
 */
function modelChipState(status: "demo" | "unknown" | "checking" | "online" | "offline") {
  switch (status) {
    case "online":
      return {
        label: "live",
        tone: "ok" as const,
        className: "text-ok",
        title: "Backend /health responded. Gemma 4 is the configured agent under test.",
      };
    case "offline":
      return {
        label: "offline",
        tone: "bad" as const,
        className: "text-bad",
        title: "The configured backend is unreachable — no model call can succeed.",
      };
    case "checking":
      return {
        label: "checking…",
        tone: "idle" as const,
        className: "text-ink-3",
        title: "Probing the configured backend /health endpoint.",
      };
    case "demo":
      return {
        label: "demo adapter",
        tone: "warn" as const,
        className: "text-warn",
        title: "No backend configured. Cases are simulated in-browser — no model is running.",
      };
    default:
      return {
        label: "unverified",
        tone: "idle" as const,
        className: "text-ink-3",
        title: "Backend health has not been confirmed yet — no live model is claimed.",
      };
  }
}

export function WorkspaceHeader() {
  const nav = useSkillCrash((s) => s.nav);
  const skills = useSkillCrash((s) => s.skills);
  const activeSkillId = useSkillCrash((s) => s.activeSkillId);
  const clientKind = useSkillCrash((s) => s.client.kind);
  const backendStatus = useSkillCrash((s) => s.backendStatus);
  const checkBackendStatus = useSkillCrash((s) => s.checkBackendStatus);
  const skill = skills.find((sk) => sk.id === activeSkillId) ?? null;
  const navLabel = NAV_ITEMS.find((n) => n.key === nav)?.label ?? "";
  const goLanding = useBackToLanding();

  // Probe a configured backend once so the model chip reflects reality.
  useEffect(() => {
    if (clientKind === "http" && backendStatus === "unknown") {
      void checkBackendStatus();
    }
  }, [clientKind, backendStatus, checkBackendStatus]);

  const model = modelChipState(backendStatus);

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
        <span className="sc-chip" title={model.title} data-model-state={backendStatus}>
          <StatusDot tone={model.tone} />
          <span className="text-ink-3">model:</span>
          <span className="text-ink">Gemma 4</span>
          <span className={cn("font-mono text-[10px]", model.className)}>· {model.label}</span>
        </span>
        <span className="sc-chip text-ok" title="All tool execution is safe in-memory">
          <StatusDot tone="ok" />
          mock sandbox · in-memory
        </span>
        {clientKind === "http" ? (
          <span className="sc-chip border-ok/30 bg-ok/10 text-ok font-mono text-[10px]">
            <StatusDot tone={backendStatus === "offline" ? "bad" : "ok"} />
            api adapter
          </span>
        ) : (
          <DemoBadge label="demo mode" />
        )}
      </div>
      <div className="ml-auto md:hidden">
        <span className="sc-chip" title={model.title} data-model-state={backendStatus}>
          <StatusDot tone={model.tone} />
          <span className={cn("font-mono text-[10px]", model.className)}>{model.label}</span>
        </span>
      </div>
    </header>
  );
}
