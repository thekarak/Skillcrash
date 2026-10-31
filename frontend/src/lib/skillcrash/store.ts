"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import type {
  ApprovedExpectation,
  AttackTestCase,
  ExpectedRule,
  ParsedSkill,
  RunStatus,
  SandboxPolicy,
  TestRunRecord,
  TraceEvent,
  Verdict,
  WorkspaceNavKey,
} from "./types";
import { DEFAULT_POLICY } from "./sandbox";
import { DEMO_FIXES, getDemoSkill } from "./demo-data";
import { computeRunSync, replayRun } from "./agent-runner";
import { composeLiveRun } from "./live-run";
import { judgeRun } from "./judge";
import {
  createSkillCrashClient,
  getDefaultBackendUrl,
  setStoredBackendUrl,
  type GenerationMode,
  type SkillCrashClient,
} from "./api";

/* ------------------------------ View state ------------------------------ */

export type AppView = "landing" | "workspace";

export interface WorkspaceIntent {
  testId?: string;
  autorun?: boolean;
}

interface ViewState {
  view: AppView;
  intent: WorkspaceIntent | null;
  openWorkspace: (intent?: WorkspaceIntent) => void;
  goLanding: () => void;
  clearIntent: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  view: "landing",
  intent: null,
  openWorkspace: (intent) => set({ view: "workspace", intent: intent ?? null }),
  goLanding: () => set({ view: "landing", intent: null }),
  clearIntent: () => set({ intent: null }),
}));

/* --------------------------- Route navigation --------------------------- */

/**
 * Open the workspace at the real /workspace route, optionally targeting a
 * test case (and auto-running it). Sets the intent first so the workspace
 * route consumes it on mount, then navigates.
 */
export function useOpenWorkspace() {
  const router = useRouter();
  return useCallback(
    (intent?: WorkspaceIntent | null) => {
      useViewStore.getState().openWorkspace(intent ?? undefined);
      // Encode the intent in the URL so the destination is shareable and the
      // workspace route can re-apply it after a reload.
      const params = new URLSearchParams();
      if (intent?.testId && intent.testId.startsWith("TC-")) {
        params.set("test", intent.testId);
        if (intent.autorun) params.set("run", "1");
      }
      const qs = params.toString();
      router.push(qs ? `/workspace?${qs}` : "/workspace");
    },
    [router]
  );
}

/** Leave the workspace and return to the landing experience. */
export function useBackToLanding() {
  const router = useRouter();
  return useCallback(() => {
    useViewStore.getState().goLanding();
    router.push("/");
  }, [router]);
}

/* ---------------------------- Workspace state ---------------------------- */

/**
 * Truthful adapter/backend status. "demo" means no backend URL is configured,
 * "unknown" means an HTTP adapter exists but /health has not answered yet.
 * The UI must never render "live" for any state other than "online".
 */
export type BackendStatus = "demo" | "unknown" | "checking" | "online" | "offline";

interface WorkspaceState {
  nav: WorkspaceNavKey;
  setNav: (nav: WorkspaceNavKey) => void;

  skills: ParsedSkill[];
  activeSkillId: string | null;

  client: SkillCrashClient;
  backendStatus: BackendStatus;
  backendDetail: string;
  /** Agent turn budget reported by the backend, when it reports one. */
  backendUrl: string;
  backendTurnBudget: number | null;
  /** Probe the configured adapter. Resolves to the human-readable detail. */
  checkBackendStatus: () => Promise<string>;
  setBackendUrl: (url: string) => Promise<{ ok: boolean; detail: string }>;
  gemmaEnabled: boolean;
  setGemmaEnabled: (enabled: boolean) => void;

  tests: AttackTestCase[];
  /** Full set of expected-behaviour rules offered by the generator. */
  offeredExpectations: Record<string, ExpectedRule[]>;
  /** Working selection the developer reviews before approving. */
  selectedExpectations: Record<string, ExpectedRule[]>;
  approvals: Record<string, ApprovedExpectation>;
  selectedTestId: string | null;

  generating: boolean;
  generatorLabel: string;
  generatorMode: GenerationMode;
  generatorNotice: string;
  runStatus: RunStatus;
  runningTestId: string | null;
  /** How the in-flight run executes: live backend model or scripted replay. */
  runExecutionMode: "live" | "simulated" | null;
  liveTrace: TraceEvent[];
  runsByTest: Record<string, TestRunRecord>;
  runHistory: TestRunRecord[];

  policy: SandboxPolicy;

  ensureDemoSkill: () => void;
  addSkill: (skill: ParsedSkill) => void;
  selectSkill: (id: string) => void;
  removeSkill: (id: string) => void;
  clearActiveSkill: () => void;
  deleteRun: (testId: string) => void;
  deleteTest: (testId: string) => void;

  generateAttacks: (useGemma?: boolean) => Promise<void>;
  selectTest: (id: string | null) => void;
  toggleRule: (testId: string, ruleId: string) => void;
  approveTest: (testId: string) => void;
  approveAll: () => void;
  revokeApproval: (testId: string) => void;

  startRun: (testId: string, opts?: { instant?: boolean }) => Promise<void>;
  setStepLimit: (n: number) => void;
  resetRuns: () => void;
}

/* ------------------------------- Helpers ------------------------------- */

let runToken = 0;

function rulesForRun(
  testId: string,
  approvals: Record<string, ApprovedExpectation>,
  selected: Record<string, ExpectedRule[]>
): ExpectedRule[] {
  const approved = approvals[testId];
  if (approved) return approved.rules;
  // Unapproved tests still run against the current selection so behaviour
  // can be previewed — the UI marks the expectations as not yet approved.
  return selected[testId] ?? [];
}

const DEMO_SKILL_ID = "skill-demo-project-cleanup";

/** One client instance for the whole session — its kind defines demo vs HTTP. */
const initialClient = createSkillCrashClient();

/* -------------------------------- Store -------------------------------- */

export const useSkillCrash = create<WorkspaceState>((set, get) => ({
  nav: "runs",
  setNav: (nav) => set({ nav }),

  skills: [],
  activeSkillId: null,

  client: initialClient,
  backendStatus: initialClient.kind === "demo" ? "demo" : "unknown",
  backendDetail: initialClient.statusLabel,
  backendUrl: initialClient.baseUrl ?? getDefaultBackendUrl(),
  backendTurnBudget: null,
  setBackendUrl: async (url: string) => {
    const trimmed = url.trim();
    setStoredBackendUrl(trimmed || null);
    const newClient = createSkillCrashClient(trimmed || null);
    set({
      client: newClient,
      backendUrl: trimmed,
      backendStatus: newClient.kind === "demo" ? "demo" : "checking",
      backendDetail: newClient.statusLabel,
    });
    if (newClient.kind === "demo") {
      return { ok: true, detail: "Switched to offline benchmark mode." };
    }
    const health = await newClient.health();
    set({
      backendStatus: health.ok ? "online" : "offline",
      backendDetail: health.detail,
      backendTurnBudget: health.maxAgentTurns ?? null,
    });
    return health;
  },
  checkBackendStatus: async () => {
    const { client } = get();
    const current = get().backendStatus;
    if (client.kind === "demo") {
      set({ backendStatus: "demo", backendDetail: client.statusLabel, backendTurnBudget: null });
      return client.statusLabel;
    }
    if (current === "checking") return get().backendDetail;
    set({ backendStatus: "checking" });
    const result = await client.health();
    set({
      backendStatus: result.ok ? "online" : "offline",
      backendDetail: result.detail,
      backendTurnBudget: result.maxAgentTurns ?? null,
    });
    return result.detail;
  },
  gemmaEnabled: true,
  setGemmaEnabled: (enabled) => set({ gemmaEnabled: enabled }),

  tests: [],
  offeredExpectations: {},
  selectedExpectations: {},
  approvals: {},
  selectedTestId: null,

  generating: false,
  generatorLabel: "",
  generatorMode: "unknown",
  generatorNotice: "",
  runStatus: "idle",
  runningTestId: null,
  runExecutionMode: null,
  liveTrace: [],
  runsByTest: {},
  runHistory: [],

  policy: DEFAULT_POLICY,

  ensureDemoSkill: () => {
    const s = get();
    if (s.skills.length === 0) {
      const skill = { ...getDemoSkill(), id: DEMO_SKILL_ID };
      set({ skills: [skill], activeSkillId: skill.id });
    }
  },

  addSkill: (skill) => set((s) => ({ skills: [skill, ...s.skills], activeSkillId: skill.id })),

  selectSkill: (id) => set({ activeSkillId: id }),

  removeSkill: (id) =>
    set((s) => {
      const skills = s.skills.filter((sk) => sk.id !== id);
      const activeSkillId =
        s.activeSkillId === id ? (skills.length > 0 ? skills[0].id : null) : s.activeSkillId;
      return { skills, activeSkillId };
    }),

  clearActiveSkill: () => set({ activeSkillId: null }),

  deleteRun: (testId) => {
    if (get().runningTestId === testId) runToken += 1;
    set((s) => {
      const { [testId]: _removed, ...runsByTest } = s.runsByTest;
      void _removed;
      return {
        runsByTest,
        runHistory: s.runHistory.filter((run) => run.testId !== testId),
        liveTrace: s.runningTestId === testId ? [] : s.liveTrace,
        runningTestId: s.runningTestId === testId ? null : s.runningTestId,
        runStatus: s.runningTestId === testId ? "idle" : s.runStatus,
      };
    });
  },

  deleteTest: (testId) => {
    if (get().runningTestId === testId) runToken += 1;
    set((s) => {
      const tests = s.tests.filter((test) => test.id !== testId);
      const { [testId]: _offered, ...offeredExpectations } = s.offeredExpectations;
      const { [testId]: _selected, ...selectedExpectations } = s.selectedExpectations;
      const { [testId]: _approval, ...approvals } = s.approvals;
      const { [testId]: _run, ...runsByTest } = s.runsByTest;
      void _offered;
      void _selected;
      void _approval;
      void _run;
      const running = s.runningTestId === testId;
      return {
        tests,
        offeredExpectations,
        selectedExpectations,
        approvals,
        runsByTest,
        runHistory: s.runHistory.filter((run) => run.testId !== testId),
        selectedTestId: s.selectedTestId === testId ? null : s.selectedTestId,
        liveTrace: running ? [] : s.liveTrace,
        runningTestId: running ? null : s.runningTestId,
        runStatus: running ? "idle" : s.runStatus,
      };
    });
  },

  generateAttacks: async (useGemma) => {
    const { client, activeSkillId, skills, gemmaEnabled } = get();
    const skill = skills.find((sk) => sk.id === activeSkillId);
    if (!skill) return;
    const shouldUseGemma = useGemma ?? gemmaEnabled;
    set({ generating: true });
    try {
      const generated = await client.generateAttacks(skill, shouldUseGemma);
      set({
        tests: generated.tests,
        offeredExpectations: generated.defaultExpectations,
        selectedExpectations: generated.defaultExpectations,
        approvals: {},
        selectedTestId: generated.tests[0]?.id ?? null,
        runsByTest: {},
        runHistory: [],
        generatorLabel: generated.label,
        // Never infer a model run from `source` — only generation_mode counts.
        generatorMode: generated.generationMode ?? "unknown",
        generatorNotice: generated.notice ?? "",
        generating: false,
      });
    } catch (err) {
      set({
        generating: false,
        generatorMode: "unknown",
        generatorNotice: "",
        generatorLabel: `Attack generation failed: ${(err as Error).message}`,
      });
    }
  },

  selectTest: (id) => set({ selectedTestId: id }),

  toggleRule: (testId, ruleId) =>
    set((s) => {
      const offered = s.offeredExpectations[testId] ?? [];
      const current = s.selectedExpectations[testId] ?? [];
      const has = current.some((r) => r.id === ruleId);
      const next = has
        ? current.filter((r) => r.id !== ruleId)
        : [...current, offered.find((r) => r.id === ruleId)].filter(Boolean) as ExpectedRule[];
      return {
        selectedExpectations: { ...s.selectedExpectations, [testId]: next },
        approvals: (() => {
          const { [testId]: _removed, ...rest } = s.approvals;
          void _removed;
          return rest;
        })(),
      };
    }),

  approveTest: (testId) =>
    set((s) => ({
      approvals: {
        ...s.approvals,
        [testId]: {
          testId,
          rules: s.selectedExpectations[testId] ?? [],
          approvedBy: "developer",
          approvedAt: new Date().toISOString(),
        },
      },
    })),

  approveAll: () =>
    set((s) => {
      const approvals: Record<string, ApprovedExpectation> = { ...s.approvals };
      for (const t of s.tests) {
        approvals[t.id] = {
          testId: t.id,
          rules: s.selectedExpectations[t.id] ?? [],
          approvedBy: "developer",
          approvedAt: new Date().toISOString(),
        };
      }
      return { approvals };
    }),

  revokeApproval: (testId) =>
    set((s) => {
      const next = { ...s.approvals };
      delete next[testId];
      return { approvals: next };
    }),

  startRun: async (testId, opts) => {
    const state = get();
    if (state.runningTestId) return; // one run at a time
    const test = state.tests.find((t) => t.id === testId);
    if (!test) return;

    const token = ++runToken;
    const shouldAbort = () => token !== runToken;

    const rules = rulesForRun(testId, state.approvals, state.selectedExpectations);
    const policy = state.policy;
    const skill = state.skills.find((s) => s.id === state.activeSkillId) ?? null;

    // A live run needs an HTTP adapter, a backend case id and the uploaded
    // skill; otherwise the deterministic scripted runner is the only option.
    const canRunLive = state.client.kind === "http" && !!test.caseId && !!skill;
    const startedAt = Date.now();

    set({
      runStatus: "running",
      runningTestId: testId,
      liveTrace: [],
      runExecutionMode: canRunLive ? "live" : "simulated",
    });

    if (canRunLive && skill && test.caseId) {
      let backend;
      try {
        backend = await state.client.runTest({
          skill,
          caseId: test.caseId,
          approved: state.approvals[testId] !== undefined,
        });
      } catch (err) {
        backend = null;
        const detail = (err as Error).message || "The backend run failed.";
        // Never dress a failed live run up as a simulated success: record an
        // ERROR run that states exactly what happened.
        const trace: TraceEvent[] = [
          {
            seq: 1,
            t: 0,
            type: "run-start",
            testId,
            agent: "Gemma 4 (live backend agent)",
            simulated: false,
          },
          { seq: 2, t: 0.01, type: "attack-prompt", content: test.attackPrompt },
          {
            seq: 3,
            t: 0.02,
            type: "run-end",
            stepCount: 0,
            outcome: "agent-error",
            detail: `Live backend run failed: ${detail}`,
          },
        ];
        const judged = judgeRun(trace, rules, policy, testId, Date.now() - startedAt);
        trace.push(...judged.events);
        if (shouldAbort()) return;
        const failed: TestRunRecord = {
          testId,
          startedAt: new Date(startedAt).toISOString(),
          durationMs: Date.now() - startedAt,
          verdict: judged.verdict,
          trace,
          executionMode: "live",
        };
        set((s) => ({
          runStatus: "error",
          runningTestId: null,
          runExecutionMode: null,
          runsByTest: { ...s.runsByTest, [testId]: failed },
          runHistory: [failed, ...s.runHistory],
        }));
        return;
      }

      if (shouldAbort()) return;

      if (!backend) {
        set({ runStatus: "error", runningTestId: null, runExecutionMode: null });
        return;
      }

      const composed = composeLiveRun({
        test,
        backend,
        rules,
        policy,
        durationMs: Date.now() - startedAt,
      });

      await replayRun(
        {
          test,
          trace: composed.trace,
          verdict: composed.verdict,
          durationMs: composed.durationMs,
        },
        {
          instant: opts?.instant ?? false,
          shouldAbort,
          onEvent: (event) => {
            if (shouldAbort()) return;
            set((s) => ({ liveTrace: [...s.liveTrace, event] }));
          },
        }
      );

      if (shouldAbort()) return;

      const record: TestRunRecord = {
        testId,
        startedAt: new Date(startedAt).toISOString(),
        durationMs: composed.durationMs,
        verdict: composed.verdict,
        trace: composed.trace,
        executionMode: "live",
        backendVerdict: composed.backendVerdict,
        backendTraceId: composed.traceId,
      };

      set((s) => ({
        runStatus: composed.verdict.outcome === "ERROR" ? "error" : "done",
        runningTestId: null,
        runExecutionMode: null,
        runsByTest: { ...s.runsByTest, [testId]: record },
        runHistory: [record, ...s.runHistory],
      }));
      return;
    }

    const computed = computeRunSync(test, policy, rules);

    await replayRun(computed, {
      instant: opts?.instant ?? false,
      shouldAbort,
      onEvent: (event) => {
        if (shouldAbort()) return;
        set((s) => ({ liveTrace: [...s.liveTrace, event] }));
      },
    });

    if (shouldAbort()) return;

    const record: TestRunRecord = {
      testId,
      startedAt: new Date().toISOString(),
      durationMs: computed.durationMs,
      verdict: computed.verdict,
      trace: computed.trace,
      executionMode: "simulated",
    };

    set((s) => ({
      runStatus: computed.verdict.outcome === "ERROR" ? "error" : "done",
      runningTestId: null,
      runExecutionMode: null,
      runsByTest: { ...s.runsByTest, [testId]: record },
      runHistory: [record, ...s.runHistory],
    }));
  },

  setStepLimit: (n) => set((s) => ({ policy: { ...s.policy, maxSteps: n } })),

  resetRuns: () =>
    set({
      runsByTest: {},
      runHistory: [],
      liveTrace: [],
      runStatus: "idle",
      runningTestId: null,
      runExecutionMode: null,
    }),
}));

/* ------------------------------ Selectors ------------------------------ */

export function activeSkill(s: Pick<WorkspaceState, "skills" | "activeSkillId">): ParsedSkill | null {
  return s.skills.find((sk) => sk.id === s.activeSkillId) ?? null;
}

export function expectationsForTest(
  s: Pick<WorkspaceState, "approvals" | "selectedExpectations" | "offeredExpectations">,
  testId: string | null
): { rules: ExpectedRule[]; offered: ExpectedRule[]; approved: boolean } {
  if (!testId) return { rules: [], offered: [], approved: false };
  const approved = s.approvals[testId];
  if (approved) return { rules: approved.rules, offered: s.offeredExpectations[testId] ?? [], approved: true };
  return {
    rules: s.selectedExpectations[testId] ?? [],
    offered: s.offeredExpectations[testId] ?? [],
    approved: false,
  };
}

export function verdictForTest(
  s: Pick<WorkspaceState, "runsByTest" | "runHistory">,
  testId: string | null
): Verdict | null {
  if (!testId) return null;
  return s.runsByTest[testId]?.verdict ?? null;
}

export function fixForTestId(testId: string | null) {
  if (!testId) return null;
  return DEMO_FIXES[testId] ?? null;
}

