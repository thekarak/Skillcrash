"use client";

import { useRef, useState } from "react";
import { FileUp, ClipboardPaste, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseSkillMarkdown } from "@/lib/skillcrash/yaml";
import { useSkillCrash } from "@/lib/skillcrash/store";
import { useToast } from "@/hooks/use-toast";

const SAMPLE = `---
name: my-skill
description: What this skill does.
safety:
  - Ask before destructive operations.
---

# Instructions

- ...`;

/**
 * Paste / upload dialog for SKILL.md files.
 * Uploaded content is parsed as data only — nothing inside a skill file is
 * ever executed.
 */
export function SkillInputDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [text, setText] = useState("");
  const addSkill = useSkillCrash((s) => s.addSkill);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (raw: string, source: "paste" | "upload", fileName?: string) => {
    const skill = parseSkillMarkdown(raw, source, fileName);
    addSkill(skill);
    const errors = skill.issues.filter((i) => i.severity === "error");
    toast({
      title: errors.length > 0 ? "Skill loaded with parse errors" : "Skill loaded",
      description:
        errors.length > 0
          ? errors[0].message
          : `${skill.meta.name} · ${skill.safetyDirectives.length} safety directives detected.`,
    });
    setText("");
    onOpenChange(false);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 512 * 1024) {
      toast({ title: "File too large", description: "Skill files are capped at 512 KB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => load(String(reader.result ?? ""), "upload", file.name);
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-line bg-surface sm:max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-ink">Add a SKILL.md</DialogTitle>
          <DialogDescription className="text-ink-2">
            Paste the file contents or upload a <span className="font-mono">.md</span> file. It is
            parsed locally with a YAML frontmatter parser — the content is treated as data and is
            never executed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col my-1">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SAMPLE}
            className="sc-scroll flex-1 max-h-[42vh] min-h-[180px] overflow-y-auto border-line bg-inset font-mono text-[12px] text-ink-2"
            aria-label="SKILL.md contents"
          />
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 sm:flex-row sm:justify-between border-t border-line/40 pt-3">
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".md,.markdown,.txt"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-line bg-transparent text-ink-2 hover:bg-raised hover:text-ink"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp className="h-3.5 w-3.5" /> Upload .md
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={text.trim().length === 0}
            className="bg-accent text-primary-foreground hover:bg-accent/85"
            onClick={() => load(text, "paste")}
          >
            <ClipboardPaste className="h-3.5 w-3.5" /> Parse &amp; load
          </Button>
        </DialogFooter>

        <p className="shrink-0 flex items-start gap-2 rounded-md border border-warn/25 bg-warn/[0.06] px-3 py-2 text-[11px] leading-relaxed text-ink-2 mt-1">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
          Parsing validates YAML frontmatter (name, description) and detects safety directives.
          Errors are shown on the parsed skill — they never block loading, so you can inspect the
          raw file.
        </p>
      </DialogContent>
    </Dialog>
  );
}
