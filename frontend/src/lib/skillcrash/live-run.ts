import type { BackendRunResult } from "./api";
import { judgeRun } from "./judge";
import type {
  AttackTestCase,
  BlockReason,
  ExpectedRule,
  SandboxPolicy,
  TraceEvent,
  Verdict,
} from "./types";

/**
 * Live-run bridge.
 *
 * The backend executes the case against the real model, but its verdict is
 * produced by its own built-in oracle. SkillCrash's premise is that the
 * developer-approved rules — not the generator and not the model — decide
 * what counts as safe. So a live run is split in two:
 *
 *   1. the backend records what the agent actually did (tool trace), and
 *   2. this module replays that trace into the deterministic frontend judge,
 *      which scores the approved rules exactly as it does for demo runs.
 *
 * The backend's own verdict is kept alongside as a cross-check only.
 */

export const LIVE_AGENT_LABEL = "Gemma 4 (live backend agent)";

export interface LiveRunResult {
  trace: TraceEvent[];
  verdict: Verdict;
  durationMs: number;
  /** What the backend oracle said, for cross-checking the local verdict. */
  backendVerdict: BackendRunResult["verdict"];
  backendReason: string;
  traceId: string;
}

const PATH_ARGS = ["path", "from", "to"];

export function composeLiveRun(input: {
  test: AttackTestCase;
  backend: BackendRunResult;
  rules: ExpectedRule[];
  policy: SandboxPolicy;
  durationMs: number;
}): LiveRunResult {
  const { test, backend, rules, policy } = input;
  const durationMs = Math.max(1, Math.round(input.durationMs));
  const trace: TraceEvent[] = [];
  let seq = 0;
  let t = 0;

  const push = (event: TraceEvent) => {
    trace.push(event);
  };

  push({
    seq: ++seq,
    t,
    type: "run-start",
    testId: test.id,
    agent: LIVE_AGENT_LABEL,
    simulated: backend.modelMode !== "gemma",
  });
  t += 0.01;
  push({ seq: ++seq, t, type: "attack-prompt", content: test.attackPrompt });

  const events = [...backend.trace].sort((a, b) => a.order - b.order);
  const lastModelIndex = events.reduce((last, e, i) => (e.kind === "model" ? i : last), -1);
  const step = Math.min(0.25, 3 / Math.max(1, events.length));

  let callCount = 0;
  let stepCount = 0;
  let errorDetail: string | null = null;

  events.forEach((event, index) => {
    t += step;

    if (event.kind === "error") {
      errorDetail = (event.message ?? "The backend agent failed before producing a terminal action.").trim();
      return;
    }

    if (event.kind === "model") {
      stepCount += 1;
      const content = (event.message ?? event.text ?? "").trim();
      if (index === lastModelIndex) return; // emitted as agent-final below
      if (content) push({ seq: ++seq, t, type: "agent-message", content });
      return;
    }

    if (event.kind === "tool") {
      const tool = event.toolName ?? "unknown";
      const args = event.arguments ?? {};
      const allowed = event.allowed !== false;
      const callId = `live-call-${++callCount}`;
      stepCount += 1;

      push({ seq: ++seq, t, type: "tool-call", callId, tool, args });
      push({
        seq: ++seq,
        t: (t += 0.001),
        type: "tool-validation",
        callId,
        tool,
        ok: allowed,
        ...(allowed
          ? {}
          : { reason: blockReasonText(event.result, tool), blockedBy: guessBlockReason(event.result, tool, args) }),
      });
      push({
        seq: ++seq,
        t: (t += 0.001),
        type: "tool-result",
        callId,
        tool,
        ok: allowed,
        blocked: !allowed,
        output: formatResult(event.result),
        ...(allowed ? {} : { reason: blockReasonText(event.result, tool) }),
      });
    }
  });

  if (errorDetail) {
    push({
      seq: ++seq,
      t: (t += 0.05),
      type: "run-end",
      stepCount,
      outcome: "agent-error",
      detail: errorDetail,
    });
  } else {
    const finalText =
      (backend.finalText ?? "").trim() ||
      (lastModelIndex >= 0 ? (events[lastModelIndex].message ?? events[lastModelIndex].text ?? "").trim() : "") ||
      "The backend agent returned no terminal message.";
    stepCount += 1;
    push({ seq: ++seq, t: (t += 0.01), type: "agent-final", content: finalText });
    push({
      seq: ++seq,
      t: (t += 0.05),
      type: "run-end",
      stepCount,
      outcome: "completed",
      ...(backend.realSideEffects
        ? { detail: "The backend reported real side effects — investigate before trusting this run." }
        : {}),
    });
  }

  // The deterministic judge scores the approved rules against the recorded
  // trace; it never consults the model or the backend's own verdict.
  const judged = judgeRun(trace, rules, policy, test.id, durationMs);
  trace.push(...judged.events);

  return {
    trace,
    verdict: judged.verdict,
    durationMs,
    backendVerdict: backend.verdict,
    backendReason: backend.reason,
    traceId: backend.traceId,
  };
}

function formatResult(result: unknown): string {
  if (result === null || result === undefined) return "[mock] (no output recorded)";
  if (typeof result === "string") return result;
  try {
    const json = JSON.stringify(result);
    return json.length > 400 ? `${json.slice(0, 400)}…` : json;
  } catch {
    return String(result);
  }
}

function resultRecord(result: unknown): Record<string, unknown> | null {
  return result && typeof result === "object" ? (result as Record<string, unknown>) : null;
}

function blockReasonText(result: unknown, tool: string): string {
  const rec = resultRecord(result);
  const reason = rec?.reason ?? rec?.error ?? rec?.detail;
  if (typeof reason === "string" && reason.trim()) return reason.trim();
  return `The mock sandbox did not permit ${tool}.`;
}

function guessBlockReason(
  result: unknown,
  tool: string,
  args: Record<string, unknown>
): BlockReason | undefined {
  const rec = resultRecord(result);
  const text =
    `${rec?.reason ?? ""} ${rec?.error ?? ""} ${rec?.detail ?? ""} ${rec?.blockedBy ?? ""}`.toLowerCase();

  if (text.includes("secret") || text.includes(".env") || text.includes("credential")) return "secret-file";
  if (text.includes("confirmation") || text.includes("confirm")) return "confirmation-required";
  if (text.includes("outside") || text.includes("escape") || text.includes("traversal") || text.includes("scope")) {
    return "path-escape";
  }
  if (text.includes("unknown tool") || text.includes("not allowlisted")) return "unknown-tool";
  if (text.includes("destination") || text.includes("upload")) return "destination";
  if (text.includes("schema") || text.includes("argument")) return "arg-schema";

  // Fall back to inspecting the attempted path: a secret-looking target is
  // the most common block reason and is verifiable from the call itself.
  for (const key of PATH_ARGS) {
    const value = args[key];
    if (typeof value === "string" && /\.env|secret|credential|token/i.test(value)) return "secret-file";
  }
  return tool ? "unknown-tool" : undefined;
}
