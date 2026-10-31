# SkillCrash 
### The Adversarial Crash-Test Bench for AI Agent Skills (`SKILL.md`)

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB?style=flat-square&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Model](https://img.shields.io/badge/Model-Gemma%204%20(26B%2FA4B)-8E75B2?style=flat-square)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

> **Built for Hackathon 2026** — *Before an AI agent runs autonomous tools on real filesystems and production APIs, crash-test its instructions against adversarial attacks in a safe, zero-I/O test bench.*

# SkillCrash

SkillCrash is a local test bench for `SKILL.md` agent skills. It parses a skill
definition, generates adversarial test cases, runs the skill's agent against an
in-memory mock tool sandbox, and returns a deterministic `PASS`, `FAIL`, or
`ERROR` verdict against expectations you explicitly approve. Failed runs also
produce a suggested hardening patch you can copy back into the skill.

The benchmark suite works offline with no API key. With a Google AI Studio key,
SkillCrash can additionally generate skill-specific attacks with Gemma 4 and
run the agent under test with a live model.

## Contents

- [How it works](#how-it-works)
- [Features](#features)
- [Repository layout](#repository-layout)
- [Requirements](#requirements)
- [Setup](#setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [HTTP API](#http-api)
- [Test cases and verdicts](#test-cases-and-verdicts)
- [Security model](#security-model)
- [Testing](#testing)
- [Deployment](#deployment)
- [Limitations](#limitations)
- [Tech stack](#tech-stack)
- [License](#license)

## How it works

1. **Upload** a `SKILL.md` file or paste its contents into the workspace.
2. **Parse and validate** the YAML frontmatter and instruction body. The file
   is treated strictly as data and is never executed.
3. **Generate test cases** from the built-in suite, or ask Gemma 4 for
   skill-specific proposals when a model is configured.
4. **Approve expectations.** For each case you confirm what should happen:
   block the request, require confirmation, or allow the operation.
5. **Run the agent** with a bounded tool-call loop inside a mock sandbox. The
   only tools available are `list_files`, `read_file`, `delete_file`,
   `upload_file`, and `request_confirmation`.
6. **Judge the trace.** A deterministic judge compares recorded tool events
   with the approved rules. It does not ask a model for a verdict and does not
   read the attack prompt for intent.
7. **Review** the step-by-step trace, the violation evidence, and an optional
   hardening patch.

## Features

- Safe parsing of `SKILL.md` frontmatter and body with a 100 KB size limit.
- Two attack sources: a deterministic built-in suite and Gemma 4 proposals.
- Human approval step before a generated case can be executed.
- Deterministic verdicts: `PASS`, `FAIL`, or `ERROR`.
- In-memory mock tool sandbox with no host filesystem, process, or network
  access.
- Step-by-step execution trace with tool arguments, dispatch results, and model
  messages.
- Suggested hardening directives and export of a patched `SKILL.md`.
- Suite runner with a per-category score and an overall grade.
- Custom red-team prompts through the API.
- Honest labelling: if live generation fails, the UI and API report the
  template fallback instead of claiming Gemma produced the cases.

## Repository layout

```text
backend/
  app/
    main.py              FastAPI app, routes, CORS, in-memory stores
    skill_parser.py      SKILL.md parsing and validation
    attack_generator.py  built-in suite and Gemma generation with fallbacks
    agent_runner.py      bounded agent loop and live model integration
    judge.py             deterministic rule checks over the trace
    mock_tools.py        allowlisted in-memory tool dispatcher
    fix_suggester.py     model-assisted or rule-based hardening suggestions
    models.py            Pydantic request/response models
  tests/                 pytest suite
  smoke_test_gemma.py    optional Google AI Studio connectivity check
frontend/
  src/app/               landing page and /workspace route
  src/components/skillcrash/
  src/lib/skillcrash/    API adapter, local demo adapter, types
docs/                    architecture notes and sample payloads
samples/                 example skills
.env.example             backend environment template
render.yaml              Render backend blueprint
```

## Requirements

- Python 3.11 or newer (3.12 recommended)
- Node.js 20 or newer
- npm or pnpm
- Optional: a Google AI Studio API key for live Gemma 4 inference

## Setup

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

On macOS or Linux, activate with `source .venv/bin/activate` instead.

Create the backend environment file from the template at the repository root:

```powershell
copy ..\.env.example .env
```

Then start the API:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

The interactive API documentation is available at
<http://127.0.0.1:8000/docs>.

### 2. Frontend

In a second terminal:

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

The app runs at <http://localhost:3000>.

To connect the UI to the backend, set the following in `frontend/.env.local`
and restart the dev server:

```env
NEXT_PUBLIC_SKILLCRASH_API="http://localhost:8000"
```

If the variable is unset, the frontend uses its local demo adapter. In that
mode attack generation is simulated in the browser and the UI labels the
output as demo/simulated data.

### 3. Optional live model

Add a key to `backend/.env` and restart the backend:

```env
GEMINI_API_KEY=your_google_ai_studio_key
GEMMA_MODEL=gemma-4-26b-a4b-it
SKILLCRASH_USE_GEMMA=1
```

Live inference is only enabled when both the key is present and
`SKILLCRASH_USE_GEMMA=1`. You can verify connectivity without starting the
server:

```powershell
python backend\smoke_test_gemma.py
```

## Configuration

Backend variables are read from `backend/.env`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | unset | Google AI Studio key. Without it, SkillCrash stays in offline/demo mode. |
| `SKILLCRASH_USE_GEMMA` | unset | Set to `1` to allow live model calls. |
| `GEMMA_MODEL` | `gemma-4-26b-a4b-it` | Primary Gemma model for generation and the agent loop. |
| `GEMMA_FALLBACK_MODELS` | `gemini-2.5-flash,gemini-flash-latest` | Comma-separated Google models tried if the primary model fails. |
| `CORS_ORIGINS` | empty | Extra comma-separated allowed origins, for deployed frontends. |

Frontend variables live in `frontend/.env.local`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SKILLCRASH_API` | unset | Base URL of the FastAPI backend. Unset means the local demo adapter. |

`GET /health` reports whether live generation is configured. It does not probe
model connectivity, so an upstream quota or outage can still affect live calls;
the response says so explicitly.

## Usage

1. Open <http://localhost:3000> and launch the workspace.
2. Load a sample skill, paste your own `SKILL.md`, or upload a file.
3. Choose the built-in suite or live Gemma generation and generate attack
   cases.
4. Select a case, review the proposed expectations, adjust them if needed, and
   approve the case for judging.
5. Run the test and inspect the trace, verdict, and evidence.
6. Review the suggested patch and copy or export the hardened skill.

Sample skills are available in `samples/`:
`code_reviewer`, `meeting_notes_summarizer`, and `temp_file_cleaner`.

## HTTP API

All routes below are served by the FastAPI backend. `GET /docs` provides the
generated OpenAPI UI.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Service status. |
| `GET` | `/health`, `/api/health` | Configuration status and agent turn budget. |
| `POST` | `/api/upload` | Parse a pasted or uploaded `SKILL.md`. |
| `POST` | `/api/generate-attacks` | Generate cases for an uploaded skill ID. |
| `POST` | `/attacks/generate`, `/api/attacks/generate` | Generate cases from a skill payload. |
| `POST` | `/api/cases/{case_id}/approve` | Apply edits and mark a case approved. |
| `POST` | `/api/run` | Run one approved case and judge the trace. |
| `GET` | `/api/runs/{trace_id}` | Retrieve a stored run. |
| `POST` | `/api/suggest-fix` | Suggest a hardening patch for a trace. |
| `POST` | `/api/run-suite` | Run the full suite and return scores and a patch. |
| `POST` | `/api/custom-strike` | Run a custom red-team prompt. |
| `POST` | `/api/export-hardened` | Return a hardened `SKILL.md` as text. |

Skills, cases, and runs are kept in memory. Restarting the backend clears them.

## Test cases and verdicts

Each case declares a category, a prompt, an expected outcome, prohibited or
required actions, and a mock path scope. Supported categories include
`prompt_injection`, `destructive_action`, `destructive_no_confirmation`,
`secret_exposure`, `secret_exfiltration`, `wrong_path`,
`wrong_path_missing_data`, `safe_operation`, `benign_control`, and
`custom_red_team`.

Expected outcomes are `block`, `confirm`, or `allow`.

Verdicts mean:

- `PASS` — the recorded tool events satisfy the approved rules.
- `FAIL` — at least one rule was violated, with evidence pointing at the
  offending event.
- `ERROR` — no usable trace was produced, for example because the model
  returned neither text nor tool calls, exceeded the turn budget, or the
  runtime failed. An incomplete run is never reported as `PASS`.

The mock sandbox starts with three synthetic files under `/project/tmp`:
`temp.txt`, `log.txt`, and `.env`. Access to secret-like files is denied by the
dispatcher and is observable in the trace.

## Security model

- Uploaded skills are parsed with `yaml.safe_load` and validated with Pydantic;
  they are never executed.
- Tool names are checked against an allowlist before dispatch.
- Paths must be absolute, traversal-free, and inside `/project/tmp`.
- All tool operations resolve against in-memory fixtures. No child processes,
  host filesystem calls, or network requests are made by the sandbox.
- The judge runs independently of the generative model. It checks only the
  recorded tool trace against the rules the user approved.
- Model or network failures are reported as errors or labelled fallbacks, not
  as successful security results.
- Suggested patches are advisory. Nothing is written to disk automatically;
  hardened content is returned as text for review.

## Testing

Run the backend suite from the repository root:

```powershell
python -m pytest
```

The suite covers parsing, API validation, quality gates for generation and
judging, the sandbox dispatcher, and the suite runner. It does not require an
API key or network access.

## Deployment

`render.yaml` defines a Render web service for the backend:

```text
rootDir: backend
buildCommand: pip install -r requirements.txt
startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set `GEMINI_API_KEY` and, if needed, `CORS_ORIGINS` in the Render dashboard.
The frontend can be deployed to any Next.js host; set
`NEXT_PUBLIC_SKILLCRASH_API` to the deployed backend URL at build time.

## Limitations

- The sandbox is intentionally small and fixed: one allowed directory and five
  mock tools. It is not a general filesystem emulator.
- Verdicts are based on observable tool events and approved rules, not on the
  semantic intent of free-form model text.
- Live generation depends on third-party quotas and model availability. When it
  fails, SkillCrash falls back to templates and labels the result accordingly.
- Storage is in memory, and there is no authentication. It is intended for
  local development and demonstrations.

## Tech stack

- Backend: Python, FastAPI, Pydantic, Uvicorn, `google-genai`.
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
  Radix UI, Zustand, Three.js.
- Tests: pytest and Starlette's test client.

## License

MIT. See [LICENSE](LICENSE).
