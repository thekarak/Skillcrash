"use client";

import { Lock, ShieldCheck, Wrench } from "lucide-react";
import { MOCK_TOOLS, DEFAULT_POLICY } from "@/lib/skillcrash/sandbox";
import { useSkillCrash } from "@/lib/skillcrash/store";

/** Mock Tools — the allowlisted, in-memory tool registry and sandbox policy. */
export function ToolsPanel() {
  const policy = useSkillCrash((s) => s.policy);

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Mock Tools</h1>
        <p className="mt-0.5 max-w-2xl text-[13px] leading-relaxed text-ink-2">
          The sandbox exposes a fixed registry of simulated tools. Tool names and arguments are
          validated before execution; every result is in-memory and prefixed with{" "}
          <span className="font-mono text-[11.5px] text-accent">[mock]</span>.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {MOCK_TOOLS.map((tool) => (
          <section key={tool.name} aria-label={`Tool ${tool.name}`} className="sc-panel p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-accent" strokeWidth={2} />
              <span className="font-mono text-[13px] font-semibold text-ink">{tool.name}</span>
              {policy.requireConfirmation.includes(tool.name) && (
                <span className="sc-chip border-warn/35 text-warn">confirmation required</span>
              )}
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{tool.description}</p>
            <div className="mt-3 space-y-1">
              {Object.entries(tool.args).map(([arg, spec]) => (
                <p key={arg} className="font-mono text-[11px] leading-relaxed text-ink-2">
                  <span className="text-accent">{arg}</span>: {spec.type}
                  {spec.required ? <span className="text-ink-3"> · required</span> : null}
                  <span className="text-ink-3"> — {spec.description}</span>
                </p>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-1.5 rounded-md border border-line bg-raised px-2.5 py-2 font-mono text-[10.5px] leading-relaxed text-ink-3">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" />
              {tool.policy}
            </p>
          </section>
        ))}
      </div>

      <section aria-label="Sandbox policy" className="sc-panel p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={2} />
          Sandbox policy (active)
        </h2>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="sc-mono-label mb-1">root confinement</dt>
            <dd className="font-mono text-[12px] text-ink-2">{policy.rootDir}</dd>
          </div>
          <div>
            <dt className="sc-mono-label mb-1">step limit</dt>
            <dd className="font-mono text-[12px] text-ink-2">{policy.maxSteps} agent steps</dd>
          </div>
          <div>
            <dt className="sc-mono-label mb-1">secret-file patterns (rejected before execution)</dt>
            <dd className="flex flex-wrap gap-1.5">
              {policy.secretPatterns.map((p) => (
                <span key={p} className="sc-chip border-bad/30 text-bad">
                  {p}
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className="sc-mono-label mb-1">allowlisted upload destinations</dt>
            <dd className="flex flex-wrap gap-1.5">
              {policy.allowlistedDestinations.map((d) => (
                <span key={d} className="sc-chip">
                  {d}
                </span>
              ))}
            </dd>
          </div>
        </dl>
        <p className="mt-4 rounded-md border border-line bg-raised px-3 py-2.5 font-mono text-[10.5px] leading-relaxed text-ink-3">
          No real filesystem access · no real credential access · no external network access from
          mock tools. Destructive tools require an explicit confirmed=true argument. The live step
          limit is configurable in Settings and applies to every run.
        </p>
      </section>
    </div>
  );
}

export { DEFAULT_POLICY };
