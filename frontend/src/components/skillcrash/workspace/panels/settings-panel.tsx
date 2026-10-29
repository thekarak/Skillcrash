"use client";
import { useState } from "react";
import { Activity, BrainCircuit, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSkillCrash, useViewStore } from "@/lib/skillcrash/store";
import { useToast } from "@/hooks/use-toast";
import { DemoBadge, StatusDot } from "../../shared/badges";
import { usePrefersReducedMotion } from "../../three/use-scene";

/** Settings — model config, adapter status, step limit, motion, reset. */
export function SettingsPanel() {
  const policy = useSkillCrash((s) => s.policy);
  const setStepLimit = useSkillCrash((s) => s.setStepLimit);
  const resetRuns = useSkillCrash((s) => s.resetRuns);
  const client = useSkillCrash((s) => s.client);
  const ensureDemoSkill = useSkillCrash((s) => s.ensureDemoSkill);
  const clearIntent = useViewStore((s) => s.clearIntent);
  const { toast } = useToast();
  const [health, setHealth] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const checkHealth = async () => {
    const result = await client.health();
    setHealth(result.detail);
    toast({ title: "Adapter health", description: result.detail });
  };

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-0.5 text-[13px] text-ink-2">
          Model configuration, execution limits and adapter status.
        </p>
      </header>

      {/* Model */}
      <section aria-label="Model configuration" className="sc-panel p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <BrainCircuit className="h-4 w-4 text-accent" strokeWidth={2} />
          Model configuration
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="sc-chip border-accent/35 text-accent">Gemma 4 attack generation: optional</span>
          <span className="sc-chip text-warn">test runs: scripted simulation</span>
          <span className="sc-chip text-ink-3">mock sandbox · no real side effects</span>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
          Turn Gemma on in the attack panel to add live model proposals to the built-in suite.
          Running a test currently replays a scripted demo agent through the local mock sandbox;
          it does not send the test prompt to Gemma. SkillCrash does not claim to have tested every
          model, and it does not guarantee security.
        </p>
      </section>

      {/* Backend adapter */}
      <section aria-label="Backend adapter" className="sc-panel p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Activity className="h-4 w-4 text-accent" strokeWidth={2} />
            Backend adapter
          </h2>
          <div className="flex items-center gap-2">
            <DemoBadge label={client.kind} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-line bg-transparent text-[11px] text-ink-2 hover:bg-raised hover:text-ink"
              onClick={() => void checkHealth()}
            >
              Check health
            </Button>
          </div>
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-2">{client.statusLabel}</p>
        {health && (
          <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-ink-3">
            <StatusDot tone={client.kind === "demo" ? "warn" : "ok"} />
            {health}
          </p>
        )}
        <p className="mt-3 rounded-md border border-line bg-raised px-3 py-2.5 font-mono text-[10.5px] leading-relaxed text-ink-3">
          To connect the real FastAPI backend, set{" "}
          <span className="text-ink-2">NEXT_PUBLIC_SKILLCRASH_API</span> to its base URL (e.g.
          https://api.skillcrash.internal). The HTTP adapter then probes{" "}
          <span className="text-ink-2">/health</span> and posts attack generation to{" "}
          <span className="text-ink-2">/attacks/generate</span>. No credentials live in client
          code.
        </p>
      </section>

      {/* Execution */}
      <section aria-label="Execution limits" className="sc-panel p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Timer className="h-4 w-4 text-accent" strokeWidth={2} />
          Execution limits
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink-2">Agent step limit</span>
          <span className="font-mono text-[12px] text-accent">{policy.maxSteps}</span>
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
        <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-ink-3">
          Applies to the next run. Exceeding the limit ends the run in a controlled ERROR — the
          judge will report that evaluation was incomplete.
        </p>
      </section>

      {/* Accessibility */}
      <section aria-label="Motion preferences" className="sc-panel p-4 sm:p-5">
        <h2 className="mb-2 text-sm font-semibold text-ink">Motion &amp; accessibility</h2>
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          Reduced motion is currently{" "}
          <span className={reducedMotion ? "text-ok" : "text-ink-3"}>
            {reducedMotion ? "enabled" : "not enabled"}
          </span>{" "}
          on this device. When enabled, the landing 3D scenes render as static composed frames,
          scroll transitions snap instead of gliding, and test runs replay instantly.
        </p>
      </section>

      {/* Reset */}
      <section aria-label="Session reset" className="sc-panel p-4 sm:p-5">
        <h2 className="mb-2 text-sm font-semibold text-ink">Session</h2>
        <p className="mb-3 text-[12.5px] leading-relaxed text-ink-2">
          Clear recorded runs and re-load the demo skill. This does not touch uploaded skills.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-line bg-transparent text-ink-2 hover:bg-raised hover:text-ink"
            onClick={() => {
              resetRuns();
              clearIntent();
              toast({ title: "Runs cleared", description: "All recorded runs and verdicts were removed." });
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear runs
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-line bg-transparent text-ink-2 hover:bg-raised hover:text-ink"
            onClick={() => {
              ensureDemoSkill();
              toast({ title: "Demo skill restored", description: "project-cleanup is active again." });
            }}
          >
            Restore demo skill
          </Button>
        </div>
      </section>
    </div>
  );
}
