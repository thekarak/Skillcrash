"use client";

import { SectionHeader } from "../shared/section-header";

/**
 * Scene 5 — Safety boundaries.
 *
 * Written as a technical specification ledger rather than marketing cards:
 * six numbered boundary clauses with hairline dividers, plus the honest
 * "what this is not" note. These are the MVP's actual constraints.
 */
const BOUNDARIES = [
  {
    title: "Allowlisted mock tools only",
    body: "The agent can call six tools — read_file, write_file, delete_path, move_path, list_dir, upload_file — and nothing else. Unknown tools are rejected and recorded before any simulation runs.",
  },
  {
    title: "Tool names and arguments validated",
    body: "Every proposed call is schema-checked first. Malformed arguments and unknown tool names never reach the simulated filesystem; they surface as validation events in the trace.",
  },
  {
    title: "No real destructive operations",
    body: "Delete, overwrite and move are simulated in memory. The mock sandbox holds an invented directory tree — a [mock] response is synthesized, and your disk is never touched.",
  },
  {
    title: "No real credential or filesystem access",
    body: "Secret and credential files (.env, *.pem, credentials.*) are rejected by policy before execution. The sandbox has no secrets to leak because it never had any.",
  },
  {
    title: "Recorded execution traces",
    body: "Prompts, observable agent output, tool calls with arguments, validation results and mock responses are captured with timestamps. Private chain-of-thought is never recorded or displayed.",
  },
  {
    title: "Deterministic evaluation against explicit rules",
    body: "PASS, FAIL and ERROR come from the expected-behaviour rules you approve — the same trace always yields the same verdict. No model scoring, no vibes.",
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
          eyebrow="Safety boundaries"
          title={
            <>
              A laboratory, not
              <br className="hidden sm:block" /> a playground.
            </>
          }
          lede={
            <>
              SkillCrash deliberately runs hostile prompts against your skills — so the
              environment they run in is constrained by design. These are the MVP&rsquo;s
              actual boundaries, stated as a specification.
            </>
          }
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
          {/* left rail — the standing note */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-sm border border-line bg-raised/60 p-6">
              <p className="font-mono text-[10px] tracking-[0.18em] text-copper uppercase">
                Standing note
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                <span className="font-semibold text-ink">What this is not:</span> SkillCrash
                is not a security certification, an audit, or a guarantee that an agent is
                safe. The MVP tests a{" "}
                <span className="font-mono text-[12.5px] text-copper">Gemma 4</span> agent
                against the skill you supply, under the rules you approve. A PASS means the
                recorded behaviour satisfied those rules — nothing more. Treat it as
                crash-testing, not as proof.
              </p>
            </div>
            <div className="mt-6 hidden gap-6 border-t border-line pt-5 sm:grid lg:grid-cols-2">
              <div>
                <p className="font-mono text-[26px] leading-none font-semibold text-ink">0</p>
                <p className="mt-1.5 text-[11.5px] leading-snug text-ink-2">
                  real files, credentials or endpoints touched by mock tools
                </p>
              </div>
              <div>
                <p className="font-mono text-[26px] leading-none font-semibold text-ink">100%</p>
                <p className="mt-1.5 text-[11.5px] leading-snug text-ink-2">
                  of tool calls name-checked and schema-validated before simulation
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
