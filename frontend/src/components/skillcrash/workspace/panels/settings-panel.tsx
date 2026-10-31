"use client";
import { useState } from "react";
import { Activity, BrainCircuit, Globe, RefreshCw, RotateCcw, Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useSkillCrash, useViewStore } from "@/lib/skillcrash/store";
import { useToast } from "@/hooks/use-toast";
import { DemoBadge, StatusDot } from "../../shared/badges";
import { usePrefersReducedMotion } from "../../three/use-scene";

/** Settings — model config, backend endpoint config, step limit, motion, reset. */
export function SettingsPanel() {
  const policy = useSkillCrash((s) => s.policy);
  const setStepLimit = useSkillCrash((s) => s.setStepLimit);
  const resetRuns = useSkillCrash((s) => s.resetRuns);
  const client = useSkillCrash((s) => s.client);
  const backendStatus = useSkillCrash((s) => s.backendStatus);
  const backendDetail = useSkillCrash((s) => s.backendDetail);
  const backendUrl = useSkillCrash((s) => s.backendUrl);
  const setBackendUrl = useSkillCrash((s) => s.setBackendUrl);
  const checkBackendStatus = useSkillCrash((s) => s.checkBackendStatus);
  const ensureDemoSkill = useSkillCrash((s) => s.ensureDemoSkill);
  const clearIntent = useViewStore((s) => s.clearIntent);
  const { toast } = useToast();

  const [inputUrl, setInputUrl] = useState(backendUrl || "");
  const [connecting, setConnecting] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const handleConnect = async (urlToUse?: string) => {
    const target = urlToUse !== undefined ? urlToUse : inputUrl;
    setConnecting(true);
    try {
      const res = await setBackendUrl(target);
      toast({
        title: res.ok ? "Backend Connected" : "Connection Notice",
        description: res.detail,
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleLocalhost = () => {
    const url = "http://127.0.0.1:8000";
    setInputUrl(url);
    void handleConnect(url);
  };

  const handleDisconnect = () => {
    setInputUrl("");
    void handleConnect("");
  };

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-0.5 text-[13px] text-ink-2">
          Model configuration, execution limits and backend connectivity.
        </p>
      </header>

      {/* Backend API Connection */}
      <section aria-label="Backend API Connection" className="sc-panel p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Globe className="h-4 w-4 text-accent" strokeWidth={2} />
            FastAPI &amp; Gemma 4 Backend Connection
          </h2>
          <div className="flex items-center gap-2">
            {backendStatus === "online" ? (
              <span className="sc-chip border-ok/40 bg-ok/10 text-ok font-medium text-[11px]">
                ● Live Gemma 4 Connected
              </span>
            ) : client.kind === "http" ? (
              <span className="sc-chip border-bad/40 bg-bad/10 text-bad font-medium text-[11px]">
                ● Backend Offline
              </span>
            ) : (
              <DemoBadge label="Offline Demo" />
            )}
          </div>
        </div>

        <p className="text-[12.5px] leading-relaxed text-ink-2 mb-3">
          Connect your deployed Render backend or local FastAPI instance. When connected, SkillCrash
          runs real adversarial attack generation with <strong>Gemma 4 (gemma-4-26b-a4b-it)</strong> and
          executes live agent safety evaluations.
        </p>

        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="url"
              placeholder="e.g. https://skillcrash-backend.onrender.com or http://127.0.0.1:8000"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-surface font-mono text-[12.5px]"
            />
            <Button
              type="button"
              size="sm"
              className="bg-accent text-primary-foreground hover:bg-accent/85 text-[12px] font-medium shrink-0 cursor-pointer"
              onClick={() => void handleConnect()}
              disabled={connecting}
            >
              {connecting ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Connecting…
                </span>
              ) : (
                "Save & Connect"
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <span className="text-ink-3">Quick presets:</span>
            <button
              type="button"
              onClick={handleLocalhost}
              className="rounded border border-line bg-surface px-2 py-0.5 text-ink-2 hover:bg-raised hover:text-ink cursor-pointer"
            >
              Localhost (http://127.0.0.1:8000)
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="rounded border border-line bg-surface px-2 py-0.5 text-ink-3 hover:bg-raised hover:text-bad cursor-pointer"
            >
              Disconnect (Demo Mode)
            </button>
          </div>

          <div className="rounded-md border border-line bg-raised px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-ink-3 space-y-1">
            <div className="flex items-center gap-2">
              <StatusDot
                tone={backendStatus === "online" ? "ok" : backendStatus === "demo" ? "warn" : "bad"}
              />
              <span className="text-ink-2 font-medium">Status:</span>
              <span>{backendDetail || client.statusLabel}</span>
            </div>
            {backendStatus === "online" && (
              <p className="text-ok text-[11px]">
                ✓ Ready: Real Gemma 4 model inference enabled for attack generation and agent runs.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Model */}
      <section aria-label="Model configuration" className="sc-panel p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <BrainCircuit className="h-4 w-4 text-accent" strokeWidth={2} />
          Model Architecture
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="sc-chip border-accent/35 text-accent flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Gemma 4: gemma-4-26b-a4b-it
          </span>
          <span className="sc-chip text-ok">Google GenAI Live Inference</span>
          <span className="sc-chip text-ink-3">Deterministic Safety Guardrails</span>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
          When the Gemma 4 toggle is enabled, SkillCrash sends the skill specification to Google&apos;s
          Gemma 4 model to synthesize novel adversarial attack vectors across four threat categories:
          Prompt Injection, Destructive Operations, Secret Exposure, and Path Traversal.
        </p>
      </section>

      {/* Execution limits */}
      <section aria-label="Execution limits" className="sc-panel p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Timer className="h-4 w-4 text-accent" strokeWidth={2} />
          Execution Limits
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink-2">Agent step limit per run</span>
          <span className="font-mono text-[12px] text-accent font-semibold">{policy.maxSteps}</span>
        </div>
        <Slider
          className="mt-2"
          value={[policy.maxSteps]}
          min={2}
          max={16}
          step={1}
          onValueChange={(v) => setStepLimit(v[0] ?? policy.maxSteps)}
          aria-label="Agent step limit"
        />
        <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
          Applies to each evaluation run. If an agent loops or exceeds this limit without completing its task, the runner issues an ERROR verdict.
        </p>
      </section>

      {/* Accessibility */}
      <section aria-label="Motion preferences" className="sc-panel p-4 sm:p-5">
        <h2 className="mb-2 text-sm font-semibold text-ink">Motion &amp; Accessibility</h2>
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          Reduced motion is currently{" "}
          <span className={reducedMotion ? "text-ok" : "text-ink-3"}>
            {reducedMotion ? "enabled" : "not enabled"}
          </span>{" "}
          on this device.
        </p>
      </section>

      {/* Reset */}
      <section aria-label="Session reset" className="sc-panel p-4 sm:p-5">
        <h2 className="mb-2 text-sm font-semibold text-ink">Session Management</h2>
        <p className="mb-3 text-[12.5px] leading-relaxed text-ink-2">
          Reset all recorded test execution history or reload the standard demo project.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-line bg-transparent text-ink-2 hover:bg-raised hover:text-ink cursor-pointer"
            onClick={() => {
              resetRuns();
              clearIntent();
              toast({ title: "Runs cleared", description: "All recorded runs and verdicts were removed." });
            }}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear Runs
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-line bg-transparent text-ink-2 hover:bg-raised hover:text-ink cursor-pointer"
            onClick={() => {
              ensureDemoSkill();
              toast({ title: "Demo skill restored", description: "project-cleanup is active again." });
            }}
          >
            Restore Default Skill
          </Button>
        </div>
      </section>
    </div>
  );
}
