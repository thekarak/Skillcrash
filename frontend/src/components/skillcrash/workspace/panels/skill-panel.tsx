"use client";

import { useState } from "react";
import { ChevronDown, FileText, ShieldCheck, TriangleAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSkillCrash } from "@/lib/skillcrash/store";
import { CodeBlock } from "../../shared/code-block";
import { DemoBadge } from "../../shared/badges";
import { SkillInputDialog } from "./skill-input-dialog";
import { cn } from "@/lib/utils";

/** Target skill panel — parsed metadata, safety directives, parse issues. */
export function SkillPanel() {
  const skills = useSkillCrash((s) => s.skills);
  const activeSkillId = useSkillCrash((s) => s.activeSkillId);
  const skill = skills.find((sk) => sk.id === activeSkillId) ?? null;
  const removeSkill = useSkillCrash((s) => s.removeSkill);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  return (
    <section aria-label="Target skill" className="sc-panel flex flex-col p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FileText className="h-4 w-4 text-accent" strokeWidth={2} />
            Target skill
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
            The SKILL.md under test. Parsed locally — YAML frontmatter validated, never executed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {skill && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 border-bad/30 bg-bad/10 text-bad hover:bg-bad/20 hover:text-bad font-medium transition"
              onClick={() => removeSkill(skill.id)}
              title="Delete this skill and its test cases"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete skill
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-line bg-transparent text-ink-2 hover:bg-raised hover:text-ink"
            onClick={() => setDialogOpen(true)}
          >
            Paste / upload
          </Button>
        </div>
      </div>

      {!skill ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line py-8">
          <p className="text-[13px] text-ink-3">No skill loaded.</p>
          <Button
            type="button"
            size="sm"
            className="bg-accent text-primary-foreground hover:bg-accent/85"
            onClick={() => setDialogOpen(true)}
          >
            Load a SKILL.md
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="max-w-full truncate font-mono text-[13px] font-semibold text-ink" title={skill.meta.name}>
              {skill.meta.name || "(unnamed)"}
            </span>
            {skill.meta.version && <span className="sc-chip">v{skill.meta.version}</span>}
            {skill.meta.author && <span className="sc-chip">by {skill.meta.author}</span>}
            {skill.source === "demo" && <DemoBadge />}
            {skill.fileName && (
              <span className="sc-chip max-w-[180px] truncate" title={skill.fileName}>
                {skill.fileName}
              </span>
            )}
          </div>

          <p className="text-[13px] leading-relaxed text-ink-2">
            {skill.meta.description || (
              <span className="text-bad">No description — frontmatter is missing required fields.</span>
            )}
          </p>

          <div>
            <div className="sc-mono-label mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              safety directives ({skill.safetyDirectives.length})
            </div>
            {skill.safetyDirectives.length === 0 ? (
              <p className="rounded-md border border-warn/25 bg-warn/[0.06] px-3 py-2 text-[12px] leading-relaxed text-ink-2">
                None detected — this skill gives the agent no explicit safety rules, which is
                exactly what adversarial tests will probe.
              </p>
            ) : (
              <ul className="space-y-1">
                {skill.safetyDirectives.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-md border border-line bg-raised px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-ink-2"
                  >
                    <span className={cn("mt-px shrink-0", d.source === "frontmatter" ? "text-accent" : "text-ink-3")}>
                      {d.source === "frontmatter" ? "fm" : "md"}
                    </span>
                    {d.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {skill.issues.length > 0 && (
            <div>
              <div className="sc-mono-label mb-1.5">parse &amp; validation</div>
              <ul className="space-y-1">
                {skill.issues.map((issue, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-[11.5px] leading-relaxed",
                      issue.severity === "error"
                        ? "border-bad/30 bg-bad/[0.06] text-ink-2"
                        : "border-warn/25 bg-warn/[0.05] text-ink-2"
                    )}
                  >
                    <TriangleAlert
                      className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", issue.severity === "error" ? "text-bad" : "text-warn")}
                    />
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-line bg-raised px-3 py-2 text-[12px] text-ink-2 hover:text-ink"
              >
                <span className="font-mono text-[11px]">SKILL.md — raw source</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", rawOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CodeBlock code={skill.raw} className="mt-2" label="raw SKILL.md" showLineNumbers maxHeight={280} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      <SkillInputDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}


