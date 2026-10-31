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

/** How long to wait for `/health`. Render free-tier cold starts can exceed 30s. */
export const HEALTH_TIMEOUT_MS = 90_000;
/** Live generation can take 60-90s per model, plus a fallback model attempt. */
export const GENERATION_TIMEOUT_MS = 240_000;

/**
 * Normalise a backend URL. Empty input means "no backend" and returns null.
 * A bare host gets `http://`; trailing slashes are removed.
 */
export function normalizeBackendUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0"
  );
}

/**
 * Explain why a configured URL cannot work from this page, if that is the case.
 *
 * These are the two deployment mistakes that otherwise show up as an opaque
 * "Failed to fetch": a localhost URL shipped to a deployed site, and an HTTP
 * backend called from an HTTPS page (mixed content).
 */
export function getBackendConfigError(url: string | null | undefined): string | null {
  if (!url) return null;
  if (typeof window === "undefined") return null;
  let backend: URL;
  try {
    backend = new URL(url);
  } catch {
    return `"${url}" is not a valid backend URL. Enter an http(s) URL such as https://your-service.onrender.com.`;
  }
  const page = window.location;
  const pageIsLoopback = isLoopbackHost(page.hostname);
  if (isLoopbackHost(backend.hostname) && !pageIsLoopback) {
    return `The configured backend is ${url}, which only exists on your own computer. This page is served from ${page.host}, so the browser cannot reach localhost there. Set NEXT_PUBLIC_SKILLCRASH_API to the public backend URL (for example https://your-service.onrender.com) and redeploy, or enter that URL in Settings.`;
  }
  if (!pageIsLoopback && page.protocol === "https:" && backend.protocol === "http:") {
    return `This page is served over HTTPS but the backend URL is HTTP (${url}). Browsers block that as mixed content. Use the backend's https:// URL.`;
  }
  return null;
}

export function getDefaultBackendUrl(): string {
  // 1. Check user-configured URL stored in local storage
  const stored = normalizeBackendUrl(getStoredBackendUrl());
  if (stored) return stored;

  // 2. Check the build-time environment variable (`next build` inlines it)
  const envUrl = normalizeBackendUrl(process.env.NEXT_PUBLIC_SKILLCRASH_API);
  if (envUrl) return envUrl;

  // 3. Local development defaults to the local FastAPI server
  if (typeof window !== "undefined" && isLoopbackHost(window.location.hostname)) {
    return "http://127.0.0.1:8000";
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:8000";
  }

  // 4. Deployed without configuration: stay offline rather than guessing.
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
  if (
    value.includes("model") ||
    value.includes("live") ||
    value.includes("gemma") ||
    value.includes("gemini")
  ) {
    return "model";
  }
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
  /** `live` only when the backend itself says live inference is configured. */
  mode?: "live" | "demo";
  model?: string;
  keyPresent?: boolean;
  gemmaEnabled?: boolean;
}

/** Raw shape of the backend's `GET /health` payload. */
interface HealthPayload {
  mode?: string;
  model?: string;
  key_present?: boolean;
  gemma_enabled?: boolean;
  max_agent_turns?: number;
  detail?: string;
}

/**
 * Turn a transport failure into an actionable sentence. The browser hides the
 * distinction between "host down", "DNS wrong" and "CORS blocked" behind a
 * single TypeError, so name every plausible cause instead of guessing one.
 */
function describeFetchFailure(err: unknown, url: string, timeoutMs: number): string {
  const name = err instanceof Error ? err.name : "";
  const message = err instanceof Error ? err.message : String(err);
  const origin = typeof window !== "undefined" ? window.location.origin : "this client";
  if (name === "TimeoutError" || name === "AbortError" || /timed?\s*out|timeout/i.test(message)) {
    return `No response from ${url} within ${Math.round(timeoutMs / 1000)}s. A Render free-tier backend cold start can take about a minute: retry once, then check the backend logs if it still does not answer.`;
  }
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(message)) {
    return `Could not reach ${url} from ${origin}. Common causes: the backend is not running or is asleep, the URL is wrong, CORS is blocking this origin (set CORS_ORIGINS on the backend to include ${origin}), or the backend is HTTP while this page is HTTPS.`;
  }
  return `Request to ${url} failed: ${message}`;
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

/** Deterministic fallback payload used when a live request cannot run. */
function fallbackAttacks(notice: string): GeneratedAttacks {
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
    notice,
  };
}

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
    const configError = getBackendConfigError(this.baseUrl);
    if (configError) return { ok: false, detail: configError };
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          ok: false,
          detail: `Backend at ${this.baseUrl} answered HTTP ${res.status} ${res.statusText}. The URL is reachable but does not look like the SkillCrash API — check the host, port and path.`,
        };
      }
      const raw = (await res.json().catch(() => null)) as HealthPayload | null;
      if (!raw || typeof raw !== "object") {
        return {
          ok: false,
          detail: `Backend at ${this.baseUrl} responded but did not return JSON. Is this the SkillCrash API?`,
        };
      }
      const turns = typeof raw.max_agent_turns === "number" ? raw.max_agent_turns : undefined;
      const model = typeof raw.model === "string" && raw.model ? raw.model : undefined;
      const keyPresent = raw.key_present;
      const gemmaEnabled = raw.gemma_enabled;
      const live = raw.mode === "live";
      const demoReason =
        keyPresent === false
          ? "GEMINI_API_KEY is not set on the backend"
          : gemmaEnabled === false
            ? "SKILLCRASH_USE_GEMMA is not 1 on the backend"
            : "the backend did not report live mode";
      const detail = live
        ? `Backend online at ${this.baseUrl}. Live inference is configured for ${model ?? "Gemma 4"}; this endpoint does not probe model connectivity.`
        : `Backend online at ${this.baseUrl}, but it is running in demo mode: ${demoReason}. Attack generation uses built-in templates.`;
      return {
        ok: true,
        detail,
        mode: live ? "live" : "demo",
        ...(turns && turns > 0 ? { maxAgentTurns: turns } : {}),
        ...(model ? { model } : {}),
        ...(typeof keyPresent === "boolean" ? { keyPresent } : {}),
        ...(typeof gemmaEnabled === "boolean" ? { gemmaEnabled } : {}),
      };
    } catch (err) {
      return { ok: false, detail: describeFetchFailure(err, this.baseUrl, HEALTH_TIMEOUT_MS) };
    }
  }

  async generateAttacks(skill: ParsedSkill, useGemma: boolean): Promise<GeneratedAttacks> {
    const configError = getBackendConfigError(this.baseUrl);
    if (configError) {
      console.warn("Backend URL cannot work from this page:", configError);
      return fallbackAttacks(configError);
    }
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
        // Live models can take 60-90s, and a failed primary may be retried.
        signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(
          `Backend at ${this.baseUrl} returned HTTP ${res.status} ${res.statusText}${
            detail ? ` — ${detail.slice(0, 200)}` : ""
          }`
        );
      }
      const data = (await res.json()) as RawGeneratedAttacks;
      if (!Array.isArray(data.tests)) {
        throw new Error("Malformed response: missing tests array");
      }
      const notice = data.notice?.trim();
      const mode = normalizeGenerationMode(data.generation_mode ?? data.generationMode);
      const isGemma =
        mode === "model" &&
        (data.source === "gemma-4" || /gemma/i.test(data.generation_mode ?? ""));
      return {
        tests: data.tests,
        defaultExpectations: data.defaultExpectations ?? {},
        source: isGemma ? "gemma-4" : "demo-generator",
        label:
          data.label ||
          (isGemma
            ? "Generated by Gemma 4 (gemma-4-26b-a4b-it) via FastAPI Backend"
            : "SkillCrash Safety Benchmark Suite (Backend Generator)"),
        generationMode: mode,
        notice: notice || (isGemma ? "Real adversarial vectors synthesized by Gemma 4 (gemma-4-26b-a4b-it)." : undefined),
      };
    } catch (err) {
      console.warn("Backend generateAttacks error, using fallback suite:", err);
      const message = err instanceof Error ? err.message : String(err);
      const reason = message.startsWith("Backend at ")
        ? message
        : describeFetchFailure(err, this.baseUrl, GENERATION_TIMEOUT_MS);
      return fallbackAttacks(`Live generation is unavailable. ${reason}`);
    }
  }

  async runTest(params: {
    skill: ParsedSkill;
    caseId: string;
    approved: boolean;
  }): Promise<BackendRunResult | null> {
    const configError = getBackendConfigError(this.baseUrl);
    if (configError) {
      throw new Error(configError);
    }
    const skillId = await this.uploadSkill(params.skill);
    if (!skillId) {
      throw new Error(
        `Skill upload to ${this.baseUrl}/api/upload failed. Check that the backend is reachable and accepts POST /api/upload.`
      );
    }
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill_id: skillId,
          test_case_id: params.caseId,
          approved_oracle: params.approved,
        }),
        signal: AbortSignal.timeout(300000),
      });
    } catch (err) {
      throw new Error(describeFetchFailure(err, this.baseUrl, 300000));
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Backend at ${this.baseUrl} returned HTTP ${res.status} ${res.statusText}${
          detail ? ` — ${detail.slice(0, 200)}` : ""
        }`
      );
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
  const raw = overrideUrl !== undefined ? overrideUrl : getDefaultBackendUrl();
  const url = normalizeBackendUrl(raw);
  if (url) {
    return new HttpSkillCrashClient(url);
  }
  return new DemoSkillCrashClient("no live backend configured");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
