# GitHub Safety Policy (No Autonomous Submissions)

## Rule
Agents MUST NOT push, open PRs, merge, tag releases, or modify GitHub settings without explicit confirmation **in the same turn**.

## Allowed without confirmation
- local commits
- local branches
- preparing a PR title/body
- listing exact commands the user should run

## Required confirmation script
If the user asks for a push/PR/merge, the agent must:
1) summarize what it intends to do (1–2 lines)
2) ask: “Do you want me to proceed with the GitHub action now?”
3) proceed only after the user says yes

## Rationale
Agentic tools sometimes “carry forward” prior routines. This policy prevents accidental remote writes and preserves user control.
