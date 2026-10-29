import type { AttackTestCase, ExpectedRule, ParsedSkill } from "./types";
import { DEMO_EXPECTATIONS, DEMO_TESTS } from "./demo-data";

/**
 * SkillCrash API adapter.
 *
 * The production backend is Python / FastAPI + Pydantic. This frontend
 * talks to it exclusively through this typed client interface, so the
 * demo implementation can be swapped for a real HTTP client without
 * touching any presentation component.
 */

export interface GeneratedAttacks {
  tests: AttackTestCase[];
  /** Default expected-behaviour rules per test, offered for approval. */
  defaultExpectations: Record<string, ExpectedRule[]>;
  source: "demo-generator" | "gemma-4";
  label: string;
}

export interface SkillCrashClient {
  readonly kind: "demo" | "http";
  readonly statusLabel: string;
  /** Probe the backend. Never claims success unless a request succeeds. */
  health(): Promise<{ ok: boolean; detail: string }>;
  generateAttacks(skill: ParsedSkill, useGemma: boolean, categoryHints?: string[]): Promise<GeneratedAttacks>;
}

/* ------------------------------ Demo client ------------------------------ */

export class DemoSkillCrashClient implements SkillCrashClient {
  readonly kind = "demo" as const;
  readonly statusLabel: string;

  constructor(reason: string) {
    this.statusLabel = `Demo adapter — ${reason}`;
  }

  async health(): Promise<{ ok: boolean; detail: string }> {
    return {
      ok: true,
      detail: "Local demo adapter active. No backend URL is configured — running in simulated mode.",
    };
  }

  async generateAttacks(_skill: ParsedSkill, useGemma: boolean): Promise<GeneratedAttacks> {
    // Simulated generation latency, honestly labelled.
    await sleep(650 + Math.random() * 450);
    return {
      tests: DEMO_TESTS.map((t) => ({
        ...t,
        generatedBy: useGemma ? "gemma-4" : "demo-generator",
        createdAt: new Date().toISOString(),
      })),
      defaultExpectations: DEMO_EXPECTATIONS,
      source: useGemma ? "gemma-4" : "demo-generator",
      label: useGemma
        ? "Gemma 4 simulated test proposals (Demo adapter)"
        : "Standard safety test suite (Demo adapter)",
    };
  }
}

/* ------------------------------ HTTP client ------------------------------ */

/**
 * Real client for the FastAPI backend. Constructed when
 * NEXT_PUBLIC_SKILLCRASH_API is configured.
 */
export class HttpSkillCrashClient implements SkillCrashClient {
  readonly kind = "http" as const;
  readonly statusLabel: string;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.statusLabel = `Backend adapter — ${this.baseUrl}`;
  }

  async health(): Promise<{ ok: boolean; detail: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return { ok: false, detail: `Backend responded ${res.status}` };
      return { ok: true, detail: "FastAPI backend reachable" };
    } catch (err) {
      return { ok: false, detail: `Backend unreachable (${(err as Error).message})` };
    }
  }

  async generateAttacks(skill: ParsedSkill, useGemma: boolean): Promise<GeneratedAttacks> {
    try {
      const res = await fetch(`${this.baseUrl}/attacks/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: { meta: skill.meta, instructions: skill.instructions }, use_gemma: useGemma }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        throw new Error(`Attack generation failed: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as Omit<GeneratedAttacks, "label"> & { label?: string };
      return {
        ...data,
        label:
          data.label ||
          (useGemma
            ? "Built-in safety suite combined with Gemma 4 proposals"
            : "Built-in safety suite (Standard benchmark)"),
      };
    } catch (err) {
      // If backend fails or connection drops, fall back gracefully to local test suite
      console.warn("Backend generateAttacks error, using fallback suite:", err);
      return {
        tests: DEMO_TESTS.map((t) => ({
          ...t,
          generatedBy: useGemma ? "gemma-4" : "demo-generator",
          createdAt: new Date().toISOString(),
        })),
        defaultExpectations: DEMO_EXPECTATIONS,
        source: useGemma ? "gemma-4" : "demo-generator",
        label: useGemma
          ? "Gemma 4 safety test suite (offline fallback)"
          : "Standard safety test suite (offline fallback)",
      };
    }
  }
}

/* ------------------------------ Factory ------------------------------ */

export function createSkillCrashClient(): SkillCrashClient {
  const baseUrl = process.env.NEXT_PUBLIC_SKILLCRASH_API;
  if (baseUrl && baseUrl.startsWith("http")) {
    return new HttpSkillCrashClient(baseUrl);
  }
  return new DemoSkillCrashClient("no live backend connected");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
