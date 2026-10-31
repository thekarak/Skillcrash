"use client";

import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { useSkillCrash, useBackToLanding } from "@/lib/skillcrash/store";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, MobileNavSheet } from "./workspace-sidebar";
import { DemoBadge, StatusDot } from "../shared/badges";
import { SkillCrashMark } from "../shared/wordmark";

/**
 * Model/backend chip state with clear, human status indicators.
 */
function modelChipState(
  status: "demo" | "unknown" | "checking" | "online" | "offline",
  mode: "live" | "demo" | null
) {
  switch (status) {
    case "online":
      return mode === "demo"
        ? {
            label: "Demo Mode",
            tone: "warn" as const,
            className: "text-warn",
            title:
              "Backend API is online, but it has no live model configured (GEMINI_API_KEY missing or SKILLCRASH_USE_GEMMA not 1). Generation uses built-in templates.",
          }
        : {
            label: "Live API",
            tone: "ok" as const,
            className: "text-ok",
            title: "Backend API is online and live inference is configured.",
          };
    case "offline":
      return {
        label: "Offline",
        tone: "bad" as const,
        className: "text-bad",
        title: "The configured backend API is unreachable. Click to check the URL in Settings.",
      };
    case "checking":
      return {
        label: "Checking connection…",
        tone: "idle" as const,
        className: "text-ink-3",
        title: "Checking backend health endpoint (Render cold starts can take ~60s).",
      };
    case "demo":
      return {
        label: "No Backend",
        tone: "warn" as const,
        className: "text-warn",
        title:
          "No backend URL is configured. Set NEXT_PUBLIC_SKILLCRASH_API at build time, or enter a URL in Settings.",
      };
    default:
      return {
        label: "Ready",
        tone: "idle" as const,
        className: "text-ink-3",
        title: "Test environment is initialized.",
      };
  }
}

export function WorkspaceHeader() {
  const nav = useSkillCrash((s) => s.nav);
  const setNav = useSkillCrash((s) => s.setNav);
  const skills = useSkillCrash((s) => s.skills);
  const activeSkillId = useSkillCrash((s) => s.activeSkillId);
  const clientKind = useSkillCrash((s) => s.client.kind);
  const backendStatus = useSkillCrash((s) => s.backendStatus);
  const backendMode = useSkillCrash((s) => s.backendMode);
  const checkBackendStatus = useSkillCrash((s) => s.checkBackendStatus);
  const skill = skills.find((sk) => sk.id === activeSkillId) ?? null;
  const navLabel = NAV_ITEMS.find((n) => n.key === nav)?.label ?? "";
  const goLanding = useBackToLanding();

  // Probe the configured adapter once. Never substitute a hardcoded localhost
  // URL: on a deployed site that request is doomed and hides configuration
  // errors behind an opaque CORS/mixed-content failure.
  useEffect(() => {
    if (clientKind === "http" && backendStatus === "unknown") {
      void checkBackendStatus();
    }
  }, [clientKind, backendStatus, checkBackendStatus]);

  const model = modelChipState(backendStatus, backendMode);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-base/95 px-4 backdrop-blur sm:px-6">
      <MobileNavSheet />
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={goLanding}
          className="hidden items-center gap-2 text-[13.5px] font-semibold text-ink transition-colors hover:text-accent lg:flex"
          aria-label="Back to landing page"
        >
          <SkillCrashMark className="h-5 w-5" />
          SkillCrash
        </button>
        <ChevronRight className="hidden h-3.5 w-3.5 text-ink-3 lg:block" />
        <span className="text-[13.5px] font-semibold text-ink">{navLabel}</span>
      </div>

      <div className="ml-auto hidden items-center gap-2.5 md:flex">
        {skill && (
          <span className="sc-chip max-w-[240px] truncate text-[12px]" title={skill.meta.description}>
            <span className="text-ink-3">Skill:</span>
            <span className="truncate font-semibold text-ink">{skill.meta.name || "unnamed"}</span>
            {skill.source !== "demo" && <span className="text-ink-3">· {skill.source}</span>}
          </span>
        )}
        <button
          type="button"
          onClick={() => setNav("settings")}
          className="sc-chip text-[12px] hover:border-accent/40 cursor-pointer transition-colors"
          title={`${model.title} — Click to configure backend URL in Settings`}
          data-model-state={backendStatus}
        >
          <StatusDot tone={model.tone} />
          <span className="text-ink-3">Model:</span>
          <span className="font-semibold text-ink">Gemma 4</span>
          <span className={cn("font-medium", model.className)}>· {model.label}</span>
        </button>
        <span className="sc-chip text-[12px] text-ok" title="Safe in-memory execution">
          <StatusDot tone="ok" />
          Virtual Sandbox: In-Memory
        </span>
        {clientKind === "http" ? (
          <span className="sc-chip border-ok/30 bg-ok/10 text-ok text-[12px] font-medium">
            <StatusDot tone={backendStatus === "offline" ? "bad" : "ok"} />
            Cloud API
          </span>
        ) : (
          <DemoBadge label="In-Memory Demo" />
        )}
      </div>
      <div className="ml-auto md:hidden">
        <span className="sc-chip text-[12px]" title={model.title} data-model-state={backendStatus}>
          <StatusDot tone={model.tone} />
          <span className={cn("font-medium", model.className)}>{model.label}</span>
        </span>
      </div>
    </header>
  );
}
