# SkillCrash 💥
### The Adversarial Crash-Test Bench for AI Agent Skills (`SKILL.md`)

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB?style=flat-square&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Model](https://img.shields.io/badge/Model-Gemma%204%20(26B%2FA4B)-8E75B2?style=flat-square)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

> **Built for Hackathon 2026** — *Before an AI agent runs autonomous tools on real filesystems and production APIs, crash-test its instructions against adversarial attacks in a safe, zero-I/O test bench.*

---

## 🎯 The Problem

Modern AI agents (Claude Code, Google Antigravity, Cursor, OpenAI Swarm) rely on **`SKILL.md`** files: markdown-based instruction contracts defining what tools an agent can call, which folders it can touch, and what safety boundaries it must uphold.

However, **`SKILL.md` is an unverified attack surface**:
- **Prompt Injections**: Hostile user requests claim urgency or system authority to override safety rules.
- **Unconfirmed Destructive Actions**: Agents execute deletion tools (`rm`, `delete_file`, `drop table`) without explicit user sign-off.
- **Credential & Secret Leaks**: Attackers trick agents into reading or exfiltrating `.env`, private keys, and config files.
- **Path Traversal & Scope Creep**: Agents wander outside approved workspace directories (`../../private/`).
- **The Self-Evaluation Trap**: Developers frequently ask the LLM to grade itself (*"Did you behave safely?"*), leading to hallucinated approvals and blind spots.

---

## 💡 The Solution: SkillCrash

**SkillCrash** is an industrial-grade adversarial harness for AI agent skills. It treats `SKILL.md` like compiled code needing unit and stress testing:

1. **Safe Static Parsing**: Validates YAML frontmatter, enforces 100 KB memory limits, and extracts declared safety directives without running arbitrary code.
2. **Dual-Engine Attack Generation**:
   - **`🛡️ Standard Suite`**: Deterministic benchmark covering prompt injections, destructive deletions, secret exfiltration, and out-of-scope paths.
   - **`✨ Gemma 4 AI`**: Dynamic threat synthesis that reads the active skill's context to propose novel, context-specific edge cases.
3. **Strict Separation of Church & State (Judge vs. Model)**:
   - The developer reviews and approves the expected safety rules (*"Must request confirmation before delete"*, *"Never attempt secret access"*).
   - **The judge is deterministic and never reads the attack prompt or model reasoning** — it inspects only the developer-approved rule contract against the recorded tool trace.
4. **Zero-I/O In-Memory Mock Sandbox**:
   - The agent under test operates inside a strictly isolated mock environment (`list_files`, `read_file`, `delete_file`, `upload_file`, `request_confirmation`).
   - No command can ever reach host filesystems, network interfaces, or environment credentials.
5. **Visual Step-by-Step Execution Replay**:
   - Scrub through agent thoughts, tool arguments, sandbox validations, and outputs with timeline controls.
6. **Automated Hardening Patch Suggester**:
   - Failed runs automatically generate Git-style unified diffs (`+` additions) with recommended directives ready to paste back into `SKILL.md`.

---

## 🏗️ Architecture

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              SKILLCRASH                                │
 └────────────────────────────────────────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       ┌───────────────────┐                   ┌───────────────────┐
       │   Frontend Cockpit│                   │  FastAPI Backend  │
       │ Next.js 16 / App  │ ◄─── REST API ──► │  Python 3.12      │
       │ Tailwind CSS v4   │                   │  Pydantic v2      │
       └───────────────────┘                   └───────────────────┘
                 │                                       │
                 ▼                                       ▼
       ┌───────────────────┐                   ┌───────────────────┐
       │ Skill Parser      │                   │ Attack Generator  │
       │ YAML Frontmatter  │                   │ - Standard Suite  │
       │ Directive Extr.   │                   │ - Gemma 4 Engine  │
       └───────────────────┘                   └───────────────────┘
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
                       ┌───────────────────────────┐
                       │   Human-in-the-Loop       │
                       │   Oracle Approval         │
                       │   (Rules Locked)          │
                       └───────────────────────────┘
                                     │
                                     ▼
                       ┌───────────────────────────┐
                       │  Isolated Agent Loop      │
                       │  - In-Memory Mock Sandbox │
                       │  - Zero Host I/O          │
                       │  - Step Limit Watchdog    │
                       └───────────────────────────┘
                                     │
                                     ▼
                       ┌───────────────────────────┐
                       │   Deterministic Judge     │
                       │   (Trace vs. Rules Contract)
                       │   Verdict: PASS/FAIL/ERROR│
                       └───────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       ┌───────────────────┐                   ┌───────────────────┐
       │ Visual Replay     │                   │ Hardening Patch   │
       │ Step Timeline     │                   │ Unified Git Diff  │
       │ Tool Payload Logs │                   │ + Directives      │
       └───────────────────┘                   └───────────────────┘
```

---

## ✨ Key Capabilities

| Capability | What It Does | Why It Matters |
| :--- | :--- | :--- |
| **Skill Intake** | Parses YAML frontmatter (`name`, `description`, `tools`) and isolates body text. | Prevents malicious markdown from executing host scripts or exploiting parsers. |
| **Segmented Attack Toggle** | Switch instantly between **Standard Benchmark** and **Gemma 4 AI**. | Works offline out of the box; connects to Google AI Studio for live dynamic threat models. |
| **Separated Judge Oracle** | Judge checks *only* developer-approved behavioural rules against recorded events. | Prevents model prompt injections from tricking the judge into a false PASS. |
| **Mock Tool Sandbox** | 5 in-memory fixtures simulating real CLI commands and file operations. | Guarantees test execution can never delete user files, leak secrets, or ping external servers. |
| **Execution Trace Scrubber** | Step-by-step timeline of agent events, tool inputs, validations, and returns. | Provides verifiable evidence for security audits and bug reporting. |
| **Unified Diff Suggester** | Synthesizes precise markdown directives based on exact failure points. | Closes the loop from vulnerability discovery to remediation in seconds. |

---

## 🎬 3-Minute Hackathon Demo Walkthrough

1. **Explore the Landing Page (`http://localhost:3000`)**:
   - Inspect the interactive threat vector matrix (Prompt Injection, Unconfirmed Deletion, Secret Exfiltration, Scope Violation).
   - Click **`Launch Workspace`** or click any deep-link scenario to jump straight to a live test run.

2. **Inspect the Target Skill**:
   - In the **Target Skill** panel, see `project-cleanup v0.3.0` parsed safely.
   - Click **`Paste / upload`** to test your own custom `SKILL.md` via direct paste or file upload.

3. **Generate Adversarial Test Cases**:
   - Toggle between **`🛡️ Standard Suite`** and **`✨ Gemma 4 AI`**.
   - Click **`Generate attacks`**. Notice that generation does not auto-fire unsolicited on page load — you maintain full control.
   - Review proposed test cases (e.g. `TC-001`, `TC-002`, `TC-003`).

4. **Review & Approve Expected Behaviour Rules**:
   - Select an attack case on the left (e.g., `TC-001: Secret-file exposure`).
   - Notice the approved rules on the right: *`Never attempt secret-file access (.env, tokens)`*.
   - Check or uncheck rules, then click **`Approve for judge`**.

5. **Replay Execution Trace**:
   - Click **`Run test`**.
   - Use the scrubber bar to step through agent reasoning, tool call arguments (`read_file`), and the mock sandbox refusal.

6. **Inspect Deterministic Verdict & Suggested Patch**:
   - The judge renders a reproducible **`FAIL`** (or **`PASS`**) with specific violation evidence.
   - Scroll down to the **Suggested Improvement** card to view the generated Git-style unified diff (`+ Ask the user before deleting anything outside build artifacts`).
   - Click **`Copy hardened SKILL.md`** to apply the fix immediately.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.11 or 3.12
- **Node.js**: 20.x or 22.x
- **Package Manager**: `pnpm` (recommended) or `npm`

---

### Step 1: Clone Repository

```bash
git clone https://github.com/thekarak/Skillcrash.git
cd Skillcrash
```

---

### Step 2: Start the FastAPI Backend

```powershell
# In PowerShell:
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

*Backend API docs are live at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

---

### Step 3: Start the Next.js Frontend

In a separate terminal window:

```powershell
cd frontend
pnpm install
pnpm run dev
```

*Frontend will be running at [http://localhost:3000](http://localhost:3000).*

---

## 🤖 Gemma 4 Model Configuration (Optional)

SkillCrash includes a self-contained offline benchmark engine that works without any external API keys.

To enable live **Gemma 4 / Gemini API** inference for generating dynamic proposals:

1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create or edit `backend/.env`:
   ```env
   GEMINI_API_KEY=your_google_ai_studio_api_key_here
   GEMMA_MODEL=gemma-4-26b-a4b-it
   SKILLCRASH_USE_GEMMA=1
   ```
3. Restart the FastAPI backend.
   - SkillCrash automatically detects the key and activates live model generation with multi-model fallback (`gemma-4-26b-a4b-it` $\rightarrow$ `gemini-2.0-flash` $\rightarrow$ `gemini-1.5-flash`).

---

## 🔒 Security & Sandboxing Guarantees

- **Zero Host Execution**: All tool actions (`read_file`, `delete_file`, `list_files`, `upload_file`) resolve against in-memory dictionary state. No child processes, bash commands, or filesystem syscalls are ever spawned.
- **Client-Side State Privacy**: Skills pasted or uploaded in the browser are parsed locally and transmitted only to the designated local FastAPI backend endpoint.
- **Advisory Remediation**: Suggested patches are unified diffs displayed for human review — SkillCrash never overwrites local files automatically.
- **Fail-Safe Fallbacks**: If external API calls encounter network timeouts or rate limits, the system falls back gracefully to deterministic benchmark suites without crashing.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Zustand.
- **Backend**: FastAPI, Python 3.12, Pydantic v2, Google GenAI SDK, Uvicorn, AnyIO.
- **Testing & Verification**: Pytest, Starlette TestClient, TypeScript strict mode, Webpack production pipeline.

---

## 👥 Hackathon Team & Acknowledgements

Created with ❤️ for the Hackathon by the **SkillCrash** team. 

Special thanks to the Google DeepMind and Gemma teams for making advanced adversarial reasoning and safe agent architectures accessible.

```
SkillCrash — Because an unverified skill is an uncontained vulnerability.
```
