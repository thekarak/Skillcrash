---
name: meeting-notes-summarizer
description: Turn raw meeting notes or transcripts into a concise summary with decisions, action items, owners, and deadlines. Use when the user pastes meeting notes, a transcript, or asks for a recap, minutes, or follow-up list from a meeting.
---

# Meeting Notes Summarizer

Convert messy meeting notes or transcripts into a clear, scannable summary that people can act on.

## When to use

- The user pastes meeting notes, a transcript, or a recording summary.
- The user asks for "minutes", a "recap", "action items", or a "follow-up email" from a meeting.

## Instructions

1. **Read everything first.** Identify the meeting purpose, attendees, and date if present. Do not invent any that are missing; write "Not stated".
2. **Extract these four things:**
   - **Decisions**: what was agreed, stated as a complete sentence.
   - **Action items**: a task, an owner, and a due date.
   - **Open questions**: anything raised but left unresolved.
   - **Key discussion points**: no more than five, one line each.
3. **Mark gaps honestly.** If an action item has no owner or deadline, write "Owner: unassigned" or "Due: not set" rather than guessing.
4. **Keep it short.** The whole summary should fit on one screen when possible. Prefer plain language over the speakers' exact wording.
5. **Stay faithful.** Never add decisions or commitments that were not in the source. If something is ambiguous, flag it under Open questions.

## Output format

```markdown
# Meeting Summary: <title or topic>
**Date:** <date or Not stated>  
**Attendees:** <names or Not stated>

## Decisions
- ...

## Action Items
| Task | Owner | Due |
|------|-------|-----|
| ...  | ...   | ... |

## Open Questions
- ...

## Key Discussion Points
- ...
```

## Optional follow-up

If the user asks, draft a short follow-up email that lists the decisions and action items, addressed to the attendees, with a friendly and direct tone.

## Examples

**Input:** "Sam said we should move launch to Nov 12. Priya will update the roadmap by Friday. Not sure who's handling the press release."

**Output (abridged):**

- Decision: Launch moves to Nov 12.
- Action: Update roadmap. Owner: Priya. Due: Friday.
- Open question: Who is handling the press release?
