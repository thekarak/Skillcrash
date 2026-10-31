"use client";

import { SectionHeader } from "../shared/section-header";

/**
 * Scene 5 — Safety boundaries.
 *
 * Technical specification ledger:
 * six numbered boundary clauses with hairline dividers, and an explicit evaluation scope.
 */
const BOUNDARIES = [
  {
    title: "Allowlisted mock tools only",
    body: "The agent is restricted to six safe mock operations: read_file, write_file, delete_path, move_path, list_dir, and upload_file. Any invocation outside this registry is rejected and logged immediately.",
  },
  {
    title: "Strict schema and argument validation",
    body: "Every proposed call is evaluated against formal schema contracts. Malformed payloads and unexpected parameters trigger immediate validation failures before touching the virtual filesystem.",
  },
  {
    title: "Zero host side effects",
    body: "File operations execute strictly inside an ephemeral, in-memory directory tree. No commands or mutations reach your physical disk, operating system, or network.",
  },
  {
    title: "Proactive secret and credential shielding",
    body: "Patterns matching sensitive resources (.env, *.pem, credentials.*) are intercepted before execution. The virtual environment maintains no real credentials or production secrets.",
  },
  {
    title: "Structured, auditable execution traces",
    body: "Prompts, agent reasoning output, tool calls, parameter payloads, and sandbox responses are recorded with millisecond timestamps for compliance auditing and replay.",
  },
  {
    title: "Deterministic rule assertions",
    body: "PASS, FAIL, and ERROR outcomes are produced by formal rule assertions against the recorded trace — deterministic, repeatable, and independent of model subjectivity.",
  },
];

export function Safety() {
  return (
    <section id="safety" className="relative overflow-hidden border-t border-line scroll-mt-16 py-16 sm:py-24">
      <div aria-hidden className="sc-grid-bg absolute inset-0 opacity-40" />
      <span aria-hidden className="sc-ghost bottom-8 -left-3 hidden text-[10rem] xl:block">
        sandbox
      </span>
      <div className="sc-container relative">
        <SectionHeader
          index="04"
          eyebrow="Execution Guardrails & Isolation"
          title={
            <>
              Engineered Isolation.
              <br className="hidden sm:block" /> Strict Execution Guardrails.
            </>
          }
          lede={
            <>
              Adversarial simulation requires rigorous sandboxing. The execution runtime enforces
              deterministic boundary checks, restricted tool schemas, and zero host filesystem access.
            </>
          }
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
          {/* left rail — the standing note */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-sm border border-line bg-raised/60 p-6">
              <p className="font-mono text-[10px] tracking-[0.18em] text-copper uppercase">
                Execution Scope
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                <span className="font-semibold text-ink">Evaluation Scope:</span> SkillCrash
                evaluates agent behaviors against explicitly specified policy rules and adversarial prompts.
                A PASS verdict verifies that the observed execution trace complied with all defined assertions for that test scenario.
                Use SkillCrash as an automated security regression harness during skill development and deployment verification.
              </p>
            </div>
            <div className="mt-6 hidden gap-6 border-t border-line pt-5 sm:grid lg:grid-cols-2">
              <div>
                <p className="font-mono text-[26px] leading-none font-semibold text-ink">0</p>
                <p className="mt-1.5 text-[11.5px] leading-snug text-ink-2">
                  real host files, credentials, or network sockets touched
                </p>
              </div>
              <div>
                <p className="font-mono text-[26px] leading-none font-semibold text-ink">100%</p>
                <p className="mt-1.5 text-[11.5px] leading-snug text-ink-2">
                  tool calls validated against schema contracts before simulation
                </p>
              </div>
            </div>
          </div>

          {/* the ledger */}
          <ol className="relative border-t border-line">
            {BOUNDARIES.map((b, i) => (
              <li
                key={b.title}
                className="group grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 border-b border-line py-5 transition-colors hover:bg-raised/40 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-x-8 sm:py-6"
              >
                <span className="pt-0.5 font-mono text-[13px] font-semibold text-copper tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[16.5px] font-semibold tracking-[-0.01em] text-ink">
                      {b.title}
                    </h3>
                    <span
                      aria-hidden
                      className="hidden h-px w-10 shrink-0 bg-accent/0 transition-colors duration-300 group-hover:bg-accent/60 sm:block"
                    />
                  </div>
                  <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-2">{b.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
