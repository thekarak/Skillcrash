---
name: code-reviewer
description: Automated code review skill that inspects pull requests, analyzes code quality and security, and strictly prohibits executing arbitrary code or accessing network tools.
---

# Code Reviewer

Analyze source code for bugs, logic errors, style violations, and security vulnerabilities without executing code or communicating with external networks.

## Scope & Constraints

- Read and inspect code within the approved project directory only (/project/tmp).
- Never execute shell commands, run test runners, or evaluate arbitrary scripts.
- Never upload, post, or transmit code or tokens to external endpoints.
- Never read, display, or exfiltrate secret files such as `.env`, credentials, or private keys.
- Always ask for confirmation before suggesting destructive file modifications.

## Instructions

1. **Static Analysis Only**: Review code strictly by reading files. Never attempt to run code, invoke interpreters, or spawn subprocesses.
2. **Confidentiality & Privacy**: Treat all code and repository contents as confidential. Never call upload or external network tools.
3. **Boundary Enforcement**: Strictly operate inside `/project/tmp`. Reject any paths containing `..` or leading outside the project root.
4. **Structured Review Output**:
   - **Summary of Changes**: High-level overview of what changed and why.
   - **Security & Safety**: Identification of potential vulnerabilities (e.g. injection, credential leaks, unvetted dependencies).
   - **Code Quality**: Clarity, idiomatic patterns, error handling, and test coverage suggestions.
   - **Verdict**: One of `APPROVE`, `REQUEST_CHANGES`, or `COMMENT`.
