import yaml from "js-yaml";
import { z } from "zod";
import type {
  ParsedSkill,
  SafetyDirective,
  SkillParseIssue,
  SkillSource,
} from "./types";

/**
 * YAML frontmatter parsing + validation for SKILL.md files.
 *
 * Parsing is real (js-yaml) and validation is real (zod) — a TypeScript
 * interface alone is never treated as "parsing". Skill file content is
 * data, never code: nothing in an uploaded skill is executed anywhere.
 */

const FrontmatterSchema = z.object({
  name: z.string().min(1, "frontmatter: `name` is required and must be a non-empty string"),
  description: z.string().min(1, "frontmatter: `description` is required and must be a non-empty string"),
  version: z.string().optional(),
  author: z.string().optional(),
  safety: z.array(z.string()).optional(),
  "allowed-tools": z.array(z.string()).optional(),
});

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Lines in the instruction body that read like safety directives. */
const DIRECTIVE_RE =
  /^\s*(?:[-*+]\s*)?(?:NEVER|ALWAYS|DO NOT|DON'T|MUST NOT|SHALL NOT|REQUIRED|REQUIRE[SD]?|ASK (?:THE USER )?BEFORE|CONFIRM)\b/i;

let idCounter = 0;
function nextSkillId(): string {
  idCounter += 1;
  return `skill-${Date.now().toString(36)}-${idCounter}`;
}

export function parseSkillMarkdown(
  raw: string,
  source: SkillSource = "paste",
  fileName?: string
): ParsedSkill {
  const issues: SkillParseIssue[] = [];
  const text = (typeof raw === "string" ? raw : "").replace(/^\uFEFF/, "");

  if (text.trim().length === 0) {
    return {
      id: nextSkillId(),
      meta: { name: "", description: "" },
      instructions: "",
      frontmatterRaw: null,
      safetyDirectives: [],
      issues: [{ severity: "error", message: "Skill file is empty — nothing to parse." }],
      raw: text,
      source,
      fileName,
    };
  }

  const match = FRONTMATTER_RE.exec(text);
  let frontmatterRaw: string | null = null;
  let body = text;

  if (match) {
    frontmatterRaw = match[1];
    body = text.slice(match[0].length);
  } else if (/^---\s*$/m.test(text)) {
    issues.push({
      severity: "warning",
      message:
        "Found `---` delimiter but no valid closing delimiter — frontmatter was not parsed. Expected `---` on the first line and a closing `---`.",
      line: 1,
    });
  } else {
    issues.push({
      severity: "warning",
      message:
        "No YAML frontmatter found — skill loaded without metadata. Add a `---` block with `name` and `description`.",
      line: 1,
    });
  }

  // --- Parse frontmatter with js-yaml, then validate with zod ---
  let meta: ParsedSkill["meta"] = { name: "", description: "" };
  let fmSafety: string[] = [];

  if (frontmatterRaw !== null) {
    try {
      const loaded = yaml.load(frontmatterRaw);
      if (loaded == null) {
        issues.push({ severity: "warning", message: "Frontmatter block is empty.", line: 2 });
      } else if (typeof loaded !== "object") {
        issues.push({
          severity: "error",
          message: `Frontmatter must be a YAML mapping — got ${typeof loaded}.`,
          line: 2,
        });
      } else {
        const parsed = FrontmatterSchema.safeParse(loaded);
        if (parsed.success) {
          meta = {
            name: parsed.data.name,
            description: parsed.data.description,
            version: parsed.data.version,
            author: parsed.data.author,
            allowedTools: parsed.data["allowed-tools"],
          };
          fmSafety = parsed.data.safety ?? [];
        } else {
          for (const issue of parsed.error.issues) {
            issues.push({
              severity: "error",
              message: issue.message,
              line: findFrontmatterLine(frontmatterRaw, issue.path[0]),
            });
          }
        }
      }
    } catch (err) {
      issues.push({
        severity: "error",
        message: `Invalid YAML in frontmatter: ${(err as Error).message.split("\n")[0]}`,
        line: 2,
      });
    }
  }

  if (frontmatterRaw !== null && !meta.name && !issues.some((i) => i.severity === "error")) {
    issues.push({ severity: "error", message: "Frontmatter is missing required field `name`." });
  }

  // --- Extract safety directives from the instruction body ---
  const directives: SafetyDirective[] = [];
  const seen = new Set<string>();
  for (const fm of fmSafety) {
    const key = fm.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      directives.push({ text: fm.trim(), source: "frontmatter" });
    }
  }
  const fromBody: SafetyDirective[] = [];
  body.split(/\r?\n/).forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.length > 8 && DIRECTIVE_RE.test(trimmed)) {
      const cleaned = trimmed.replace(/^[-*+]\s*/, "");
      const key = cleaned.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        fromBody.push({ text: cleaned, source: "instructions" });
      }
    }
    void i;
  });
  directives.push(...fromBody);

  if (directives.length === 0) {
    issues.push({
      severity: "warning",
      message:
        "No safety directives detected — neither a `safety:` list in frontmatter nor imperative safety lines in the instructions.",
    });
  }

  return {
    id: nextSkillId(),
    meta,
    instructions: body.trim(),
    frontmatterRaw,
    safetyDirectives: directives,
    issues,
    raw: text,
    source,
    fileName,
  };
}

function findFrontmatterLine(fm: string, key: unknown): number | undefined {
  if (typeof key !== "string") return undefined;
  const lines = fm.split(/\r?\n/);
  const idx = lines.findIndex((l) => l.trimStart().startsWith(key));
  return idx >= 0 ? idx + 2 : undefined; // +2: frontmatter starts at file line 2
}

export function skillSummary(skill: ParsedSkill): string {
  const hasErrors = skill.issues.some((i) => i.severity === "error");
  if (hasErrors) return `${skill.meta.name || "unnamed"} (with parse errors)`;
  return skill.meta.name || "unnamed skill";
}
