import type { AttackTestCase, ExpectedRule, ParsedSkill } from "./types";
import { DEMO_EXPECTATIONS, DEMO_TESTS } from "./demo-data";

/**
 * SkillCrash API adapter.
 *
 * The production backend is Python / FastAPI + Pydantic. This frontend
 * talks to it through this typed client interface, supporting both live
 * HTTP communication with the FastAPI/Gemma 4 backend and offline fallback.
 */

export const BACKEND_URL_STORAGE_KEY = "skillcrash_backend_url";

export function getStoredBackendUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const val = window.localStorage.getItem(BACKEND_URL_STORAGE_KEY);
    return val && val.trim().length > 0 ? val.trim() : null;
  } catch {
    return null;
  }
}

export function setStoredBackendUrl(url: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (url && url.trim().length > 0) {
      window.localStorage.setItem(BACKEND_URL_STORAGE_KEY, url.trim());
    } else {
      window.localStorage.removeItem(BACKEND_URL_STORAGE_KEY);
    }
  } catch {}
}

export function getDefaultBackendUrl(): string {
  // 1. Check user-configured URL stored in local storage
  const stored = getStoredBackendUrl();
  if (stored && stored.startsWith("http")) return stored;

  // 2. Check build-time environment variable
  const envUrl = process.env.NEXT_PUBLIC_SKILLCRASH_API;
  if (envUrl && envUrl.startsWith("http")) return envUrl;

  // 3. In browser or standard local environment, default to 127.0.0.1:8000
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
  }

  // 4. Default fallback for local environment
  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:8000";
  }

  return "";
}

/**
 * How the returned cases were produced, as reported by the generator.
 *
 * - "simulated" — deterministic / in-browser generation, no model call.
 * - "model"     — the generator reports that a model actually ran.
 * - "unknown"   — the payload carries no mode; the UI must not claim live
 *                 inference in this state.
 */
export type GenerationMode = "simulated" | "model" | "unknown";

export interface GeneratedAttacks {
  tests: AttackTestCase[];
  /** Default expected-behaviour rules per test, offered for approval. */
  defaultExpectations: Record<string, ExpectedRule[]>;
  source: "demo-generator" | "gemma-4";
  label: string;
  /**
   * Authoritative generation mode from the backend (`generation_mode`).
   * Absent on older payloads — treat that as "unknown", never as "model".
   */
  generationMode?: GenerationMode;
  /** Backend-authored caveat, shown verbatim in the UI when present. */
  notice?: string;
}

/** Normalise the backend's `generation_mode` string without over-claiming. */
export function normalizeGenerationMode(raw?: string | null): GenerationMode {
  if (!raw) return "unknown";
  const value = raw.toLowerCase();
  if (value.includes("simul") || value.includes("demo") || value.includes("mock")) return "simulated";
  if (value.includes("model") || value.includes("live") || value.includes("gemma")) return "model";
  return "unknown";
}

export interface SkillCrashClient {
  readonly kind: "demo" | "http";
  readonly statusLabel: string;
  readonly baseUrl?: string;
  /** Probe the backend. Never claims success unless a request succeeds. */
  health(): Promise<HealthReport>;
  generateAttacks(skill: ParsedSkill, useGemma: boolean, categoryHints?: string[]): Promise<GeneratedAttacks>;
  /**
   * Upload the parsed skill so the backend can store it. Returns the backend
   * skill id, or null when this adapter has no backend (demo).
   */
  uploadSkill(skill: ParsedSkill): Promise<string | null>;
  /**
   * Execute one case through the live backend agent. Returns null for the
   * demo adapter, whose runs stay with the local scripted runner.
   */
  runTest(params: {
    skill: ParsedSkill;
    caseId: string;
    approved: boolean;
  }): Promise<BackendRunResult | null>;
}

/* --------------------------- Live run payloads --------------------------- */

/** What `/health` can report. Only fields the backend actually sends are set. */
export interface HealthReport {
  ok: boolean;
  detail: string;
  /** Backend agent turn budget, when the backend reports it. */
  maxAgentTurns?: number;
}

export interface BackendTraceEvent {
  order: number;
  kind: "tool" | "model" | "error" | string;
  toolName?: string | null;
  arguments?: Record<string, unknown> | null;
  allowed?: boolean | null;
  result?: unknown;
  message?: string | null;
  text?: string | null;
}

/** Normalised (camelCase) view of the backend's `RunResult`. */
export interface BackendRunResult {
  traceId: string;
  skillId: string;
  caseId: string;
  verdict: "PASS" | "FAIL" | "ERROR";
  reason: string;
  evidence: string[];
  finalText: string | null;
  modelMode: "gemma" | "demo";
  realSideEffects: boolean;
  trace: BackendTraceEvent[];
}

/* ------------------------------ Demo client ------------------------------ */

export class DemoSkillCrashClient implements SkillCrashClient {
  readonly kind = "demo" as const;
  readonly statusLabel: string;

  constructor(reason: string) {
    this.statusLabel = `Demo adapter — ${reason}`;
  }

  async health(): Promise<HealthReport> {
    return {
      ok: true,
      detail: "Demo mode active (offline). Connect your Render or local backend in Settings for Gemma 4 AI inference.",
    };
  }

  async generateAttacks(_skill: ParsedSkill, _useGemma: boolean): Promise<GeneratedAttacks> {
    // Simulated generation latency for standard benchmark
    await sleep(400 + Math.random() * 200);
    return {
      tests: DEMO_TESTS.map((t) => ({
        ...t,
        generatedBy: "demo-generator",
        createdAt: new Date().toISOString(),
      })),
      defaultExpectations: DEMO_EXPECTATIONS,
      source: "demo-generator",
      label: "SkillCrash Standard Safety Benchmark",
      generationMode: "simulated",
      notice: _useGemma
        ? "Backend connection required for Gemma 4 AI attack generation. Running standard benchmark suite. Enter your Render or local backend URL in Settings to activate real Gemma 4 inference."
        : "Standard deterministic safety benchmark suite loaded.",
    };
  }

  async uploadSkill(_skill: ParsedSkill): Promise<string | null> {
    return null;
  }

  async runTest(_params: {
    skill: ParsedSkill;
    caseId: string;
    approved: boolean;
  }): Promise<BackendRunResult | null> {
    return null;
  }
}

/* ------------------------------ HTTP client ------------------------------ */

/** Raw shape returned by the FastAPI generator, before normalisation. */
interface RawGeneratedAttacks {
  tests?: AttackTestCase[];
  defaultExpectations?: Record<string, ExpectedRule[]>;
  source?: string;
  label?: string;
  generation_mode?: string | null;
  generationMode?: string | null;
  notice?: string | null;
}

/**
 * Real client for the FastAPI backend. Connects to local or Render endpoints.
 */
export class HttpSkillCrashClient implements SkillCrashClient {
  readonly kind = "http" as const;
  readonly statusLabel: string;
  readonly baseUrl: string;
  /** Parsed-skill id → backend skill_id, so a skill is uploaded once. */
  private skillIds = new Map<string, string>();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.statusLabel = `Backend adapter — ${this.baseUrl}`;
  }

  /**
   * POST /api/upload returns the id the backend stores the skill under.
   * POST /api/run needs that id, so upload lazily and cache it.
   */
  async uploadSkill(skill: ParsedSkill): Promise<string | null> {
    const cached = this.skillIds.get(skill.id);
    if (cached) return cached;
    try {
      const res = await fetch(`${this.baseUrl}/api/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: skill.raw }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { skill_id?: unknown };
      if (typeof data.skill_id !== "string" || !data.skill_id) return null;
      this.skillIds.set(skill.id, data.skill_id);
      return data.skill_id;
    } catch {
      return null;
    }
  }

  async health(): Promise<HealthReport> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return { ok: false, detail: `Backend responded ${res.status}` };
      const raw = (await res.json().catch(() => null)) as { max_agent_turns?: unknown } | null;
      const turns = typeof raw?.max_agent_turns === "number" ? raw.max_agent_turns : undefined;
      return {
        ok: true,
        detail: "FastAPI & Gemma 4 backend connected",
        ...(turns && turns > 0 ? { maxAgentTurns: turns } : {}),
      };
    } catch (err) {
      return { ok: false, detail: `Backend unreachable (${(err as Error).message})` };
    }
  }

  async generateAttacks(skill: ParsedSkill, useGemma: boolean): Promise<GeneratedAttacks> {
    try {
      const skillId = await this.uploadSkill(skill);
      const res = await fetch(`${this.baseUrl}/attacks/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          skillId
            ? { skill_id: skillId, use_gemma: useGemma }
            : { skill: { meta: skill.meta, instructions: skill.instructions }, use_gemma: useGemma }
        ),
        // Live Gemma models can take up to ~60-90s
        signal: AbortSignal.timeout(180000),
      });
      if (!res.ok) {
        throw new Error(`Attack generation failed: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as RawGeneratedAttacks;
      if (!Array.isArray(data.tests)) {
        throw new Error("Malformed response: missing tests array");
      }
      const notice = data.notice?.trim();
      const isGemma = data.source === "gemma-4" || (data.generation_mode && data.generation_mode.includes("gemma"));
      return {
        tests: data.tests,
        defaultExpectations: data.defaultExpectations ?? {},
        source: isGemma ? "gemma-4" : "demo-generator",
        label:
          data.label ||
          (isGemma
            ? "Generated by Gemma 4 (gemma-4-26b-a4b-it) via FastAPI Backend"
            : "SkillCrash Safety Benchmark Suite (Backend Generator)"),
        generationMode: normalizeGenerationMode(data.generation_mode ?? data.generationMode),
        notice: notice || (isGemma ? "Real adversarial vectors synthesized by Gemma 4 (gemma-4-26b-a4b-it)." : undefined),
      };
    } catch (err) {
      console.warn("Backend generateAttacks error, using fallback suite:", err);
      return {
        tests: DEMO_TESTS.map((t) => ({
          ...t,
          generatedBy: "demo-generator",
          createdAt: new Date().toISOString(),
        })),
        defaultExpectations: DEMO_EXPECTATIONS,
        source: "demo-generator",
        label: "SkillCrash Standard Benchmark Suite (Fallback)",
        generationMode: "simulated",
        notice: `Backend request failed: ${(err as Error).message}. Check your backend connection in Settings.`,
      };
    }
  }

  async runTest(params: {
    skill: ParsedSkill;
    caseId: string;
    approved: boolean;
  }): Promise<BackendRunResult | null> {
    const skillId = await this.uploadSkill(params.skill);
    if (!skillId) {
      throw new Error("Backend skill upload failed — cannot run a live case.");
    }
    const res = await fetch(`${this.baseUrl}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skill_id: skillId,
        test_case_id: params.caseId,
        approved_oracle: params.approved,
      }),
      signal: AbortSignal.timeout(300000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Live run failed: ${res.status} ${res.statusText}${detail ? ` — ${detail.slice(0, 200)}` : ""}`);
    }
    const raw = (await res.json()) as RawRunResult;
    return {
      traceId: raw.trace_id,
      skillId: raw.skill_id ?? skillId,
      caseId: raw.test_case_id ?? params.caseId,
      verdict: raw.verdict,
      reason: raw.reason ?? "",
      evidence: raw.evidence ?? [],
      finalText: raw.final_text ?? null,
      modelMode: raw.model_mode === "gemma" ? "gemma" : "demo",
      realSideEffects: raw.real_side_effects === true,
      trace: (raw.trace ?? []).map((e) => ({
        order: e.order,
        kind: e.kind,
        toolName: e.tool_name ?? null,
        arguments: e.arguments ?? null,
        allowed: e.allowed ?? null,
        result: e.result ?? null,
        message: e.message ?? e.text ?? null,
        text: e.text ?? null,
      })),
    };
  }
}

/** Raw shape returned by POST /api/run, before normalisation. */
interface RawRunResult {
  trace_id: string;
  skill_id?: string;
  test_case_id?: string;
  verdict: "PASS" | "FAIL" | "ERROR";
  reason?: string;
  evidence?: string[];
  final_text?: string | null;
  model_mode?: "gemma" | "demo";
  real_side_effects?: boolean;
  trace?: Array<{
    order: number;
    kind: string;
    tool_name?: string | null;
    arguments?: Record<string, unknown> | null;
    allowed?: boolean | null;
    result?: unknown;
    message?: string | null;
    text?: string | null;
  }>;
}

/* ------------------------------ Factory ------------------------------ */

export function createSkillCrashClient(overrideUrl?: string | null): SkillCrashClient {
  const url = overrideUrl !== undefined ? overrideUrl : getDefaultBackendUrl();
  if (url && url.startsWith("http")) {
    return new HttpSkillCrashClient(url);
  }
  return new DemoSkillCrashClient("no live backend configured");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
