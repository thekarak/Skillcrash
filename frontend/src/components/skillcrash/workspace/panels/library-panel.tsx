"use client";

import { useState } from "react";
import { Check, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSkillCrash } from "@/lib/skillcrash/store";
import { DemoBadge } from "../../shared/badges";
import { SkillInputDialog } from "./skill-input-dialog";
import { cn } from "@/lib/utils";

/** Skill Library — every skill parsed in this session, one active at a time. */
export function LibraryPanel() {
  const skills = useSkillCrash((s) => s.skills);
  const activeSkillId = useSkillCrash((s) => s.activeSkillId);
  const selectSkill = useSkillCrash((s) => s.selectSkill);
  const removeSkill = useSkillCrash((s) => s.removeSkill);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Skill Library</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Skills parsed in this session. The active skill is the target for attack generation.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="bg-accent text-primary-foreground hover:bg-accent/85"
          onClick={() => setDialogOpen(true)}
        >
          Add SKILL.md
        </Button>
      </header>

      {skills.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-10 text-center">
          <p className="text-[13px] text-ink-2">The library is empty.</p>
          <Button
            type="button"
            size="sm"
            className="mt-4 bg-accent text-primary-foreground hover:bg-accent/85"
            onClick={() => setDialogOpen(true)}
          >
            Load a skill
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {skills.map((sk) => {
            const active = sk.id === activeSkillId;
            const errors = sk.issues.filter((i) => i.severity === "error").length;
            return (
              <li
                key={sk.id}
                className={cn(
                  "sc-panel p-4",
                  active && "border-accent/50 bg-accent/[0.05]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 font-mono text-[13px] font-semibold text-ink">
                        <FileText className="h-3.5 w-3.5 text-accent" />
                        {sk.meta.name || "(unnamed)"}
                      </span>
                      {sk.meta.version && <span className="sc-chip">v{sk.meta.version}</span>}
                      {sk.source === "demo" ? <DemoBadge /> : <span className="sc-chip">{sk.source}</span>}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-2">
                      {sk.meta.description || "No description parsed."}
                    </p>
                    <p className="mt-2 font-mono text-[10.5px] text-ink-3">
                      {sk.safetyDirectives.length} directives ·{" "}
                      <span className={errors > 0 ? "text-bad" : "text-ink-3"}>
                        {errors} parse error{errors === 1 ? "" : "s"}
                      </span>
                      {sk.fileName ? ` · ${sk.fileName}` : ""}
                    </p>
                  </div>
                  {active && <span className="sc-chip border-accent/40 text-accent">active</span>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {!active ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 border-line bg-transparent text-[11px] text-ink-2 hover:bg-raised hover:text-ink"
                      onClick={() => selectSkill(sk.id)}
                    >
                      <Check className="h-3 w-3" /> Set active
                    </Button>
                  ) : null}
                  {skills.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px] text-ink-3 hover:bg-bad/10 hover:text-bad"
                      onClick={() => removeSkill(sk.id)}
                      aria-label={`Remove ${sk.meta.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SkillInputDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
