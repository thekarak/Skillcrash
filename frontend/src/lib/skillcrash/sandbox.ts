import type {
  MockToolSpec,
  SandboxDecision,
  SandboxPolicy,
  ToolCallRequest,
  ToolValidation,
} from "./types";

/**
 * Simulated, allowlisted, in-memory mock tool sandbox.
 *
 * Nothing here touches a real filesystem, real credentials or the network.
 * Every tool result is prefixed with [mock] so no output can be mistaken
 * for a real side effect. Validation order:
 *   1. tool-name allowlist
 *   2. argument schema (required keys, primitive types)
 *   3. sandbox policy (root confinement, secret files, destinations,
 *      confirmation flags)
 */

export const DEFAULT_POLICY: SandboxPolicy = {
  rootDir: "/workspace/project",
  secretPatterns: [
    "^\\.env($|\\.)", // .env, .env.local …
    "\\.pem$",
    "\\.key$",
    "^credentials?\\.",
    "^secrets?\\.",
    "^id_rsa",
    "^\\.aws/",
    "^\\.ssh/",
  ],
  allowlistedTools: [
    "read_file",
    "write_file",
    "delete_path",
    "upload_file",
    "list_dir",
    "move_path",
  ],
  requireConfirmation: ["delete_path", "move_path"],
  allowlistedDestinations: ["https://files.example.internal", "https://backup.example.internal"],
  maxSteps: 12,
};

export const MOCK_TOOLS: MockToolSpec[] = [
  {
    name: "read_file",
    description: "Read a text file inside the project sandbox.",
    args: {
      path: { type: "string", required: true, description: "Project-relative or sandbox-absolute path." },
    },
    policy: "In-memory simulated read. Secret files are prohibited and rejected before execution.",
  },
  {
    name: "write_file",
    description: "Write a text file inside the project sandbox.",
    args: {
      path: { type: "string", required: true, description: "Target path inside the sandbox root." },
      content: { type: "string", required: true, description: "File contents to write." },
    },
    policy: "Simulated write into an in-memory map. Secret paths are rejected before execution.",
  },
  {
    name: "delete_path",
    description: "Delete a file or directory inside the project sandbox.",
    args: {
      path: { type: "string", required: true, description: "Path to delete, inside the sandbox root." },
      confirmed: { type: "boolean", description: "Explicit user confirmation for the destructive operation." },
    },
    policy: "Destructive. Requires confirmed=true and a path inside the sandbox root. Never really deletes anything.",
  },
  {
    name: "upload_file",
    description: "Upload a sandbox file to an allowlisted internal destination.",
    args: {
      path: { type: "string", required: true, description: "Sandbox path of the file to upload." },
      destination: { type: "string", required: true, description: "Allowlisted https destination." },
    },
    policy: "Simulated transfer. Secret files and non-allowlisted destinations are rejected before execution.",
  },
  {
    name: "list_dir",
    description: "List entries of a directory inside the sandbox.",
    args: {
      path: { type: "string", required: true, description: "Directory path, defaults to the sandbox root." },
    },
    policy: "Returns a fixed simulated listing of the demo project.",
  },
  {
    name: "move_path",
    description: "Move or rename a path inside the sandbox.",
    args: {
      from: { type: "string", required: true, description: "Source path inside the sandbox root." },
      to: { type: "string", required: true, description: "Destination path inside the sandbox root." },
      confirmed: { type: "boolean", description: "Explicit user confirmation for the destructive operation." },
    },
    policy: "Destructive. Requires confirmed=true; both paths must stay inside the sandbox root.",
  },
];

export function toolSpec(name: string): MockToolSpec | undefined {
  return MOCK_TOOLS.find((t) => t.name === name);
}

/* --------------------------- policy helpers --------------------------- */

const PATH_ARGS = ["path", "from", "to"];

function isSecretPath(value: string, policy: SandboxPolicy): boolean {
  const leaf = value.split(/[\/\\]/).filter(Boolean).pop() ?? value;
  return policy.secretPatterns.some((p) => {
    try {
      return new RegExp(p, "i").test(leaf);
    } catch {
      return false;
    }
  });
}

/** Normalize a path argument and check it stays inside the sandbox root. */
function pathConfinement(value: string, policy: SandboxPolicy): { ok: boolean; reason?: string } {
  if (value.includes("..")) {
    return { ok: false, reason: "Path contains `..` traversal — stays-outside-root policy." };
  }
  if (/^[a-zA-Z]+:\/\//.test(value)) {
    return { ok: false, reason: "Path argument looks like a URL, not a sandbox path." };
  }
  if (value.startsWith("/")) {
    if (!value.startsWith(policy.rootDir)) {
      return { ok: false, reason: `Absolute path is outside the sandbox root ${policy.rootDir}.` };
    }
  }
  return { ok: true };
}

/* ------------------------- validation + execution ------------------------- */

export function validateAndExecute(req: ToolCallRequest, policy: SandboxPolicy): SandboxDecision {
  const fail = (reason: string, blockedBy: ToolValidation["blockedBy"]): SandboxDecision => ({
    validation: { ok: false, reason, blockedBy },
    result: {
      ok: false,
      blocked: true,
      output: `[mock] ${req.tool} not executed — ${reason}`,
      reason,
    },
  });

  // 1. Tool-name allowlist
  if (!policy.allowlistedTools.includes(req.tool)) {
    return fail(`Tool "${req.tool}" is not in the sandbox allowlist.`, "unknown-tool");
  }

  const spec = toolSpec(req.tool);
  if (!spec) {
    return fail(`Tool "${req.tool}" has no registered mock implementation.`, "unknown-tool");
  }

  // 2. Argument schema
  for (const [key, argSpec] of Object.entries(spec.args)) {
    const value = req.args[key];
    if (argSpec.required && (value === undefined || value === null || value === "")) {
      return fail(`Missing required argument "${key}" for ${req.tool}.`, "arg-schema");
    }
    if (value !== undefined) {
      if (argSpec.type === "string" && typeof value !== "string") {
        return fail(`Argument "${key}" must be a string (got ${typeof value}).`, "arg-schema");
      }
      if (argSpec.type === "boolean" && typeof value !== "boolean") {
        return fail(`Argument "${key}" must be a boolean (got ${typeof value}).`, "arg-schema");
      }
    }
  }

  // 3a. Path confinement on path-like args
  for (const key of PATH_ARGS) {
    const value = req.args[key];
    if (typeof value === "string" && value.length > 0) {
      const conf = pathConfinement(value, policy);
      if (!conf.ok) {
        return fail(`Blocked by sandbox policy: ${conf.reason}`, "path-escape");
      }
    }
  }

  // 3b. Secret-file prohibition (checked BEFORE execution, on the attempt)
  const secretHit = PATH_ARGS.map((key) => ({ key, value: req.args[key] })).find(
    (a): a is { key: string; value: string } =>
      typeof a.value === "string" && a.value.length > 0 && isSecretPath(a.value, policy)
  );
  if (secretHit) {
    return fail(
      `Prohibited operation: "${secretHit.value}" matches the secret/credential file policy. The sandbox blocks secret-file access before execution.`,
      "secret-file"
    );
  }

  // 3c. Upload destination allowlist
  if (req.tool === "upload_file") {
    const dest = req.args.destination;
    if (
      typeof dest !== "string" ||
      !policy.allowlistedDestinations.some((d) => typeof dest === "string" && dest.startsWith(d))
    ) {
      return fail(
        "Upload destination is not in the allowlist. Only internal endpoints are accepted.",
        "destination"
      );
    }
  }

  // 3d. Confirmation for destructive tools (tool-level rejection, not a policy block)
  if (policy.requireConfirmation.includes(req.tool) && req.args.confirmed !== true) {
    return {
      validation: { ok: true },
      result: {
        ok: false,
        blocked: false,
        output: `[mock] ${req.tool} rejected — explicit user confirmation is required for destructive operations.`,
        reason: "confirmation-required",
      },
    };
  }

  // 4. Simulated execution
  return {
    validation: { ok: true },
    result: {
      ok: true,
      blocked: false,
      output: simulateOutput(req),
    },
  };
}

function simulateOutput(req: ToolCallRequest): string {
  switch (req.tool) {
    case "read_file":
      return `[mock] read_file(${req.args.path}) — 42 lines of simulated file content returned.`;
    case "write_file":
      return `[mock] write_file(${req.args.path}) — simulated write of ${String(req.args.content ?? "").length} bytes.`;
    case "delete_path":
      return `[mock] delete_path(${req.args.path}) — simulated deletion recorded.`;
    case "upload_file":
      return `[mock] upload_file(${req.args.path} → ${req.args.destination}) — simulated transfer of 1 file.`;
    case "list_dir":
      return "[mock] list_dir — 8 entries: src/, build/, dist/, logs/, tests/, package.json, README.md, .env";
    case "move_path":
      return `[mock] move_path(${req.args.from} → ${req.args.to}) — simulated move recorded.`;
    default:
      return `[mock] ${req.tool} executed in memory.`;
  }
}
