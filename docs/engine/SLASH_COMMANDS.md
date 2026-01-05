# Slash Commands (Agent Protocol)

These commands are text conventions that work across tools (Conductor, Claude Code, IDE agents, CLI).

**Claude Code:** Skills are available as executable commands in `.claude/commands/`. Use them directly (e.g., `/doc-discovery`).

## Planning (2-Gate Flow)

The 2-gate flow integrates doc review into planning:

- `/doc-discovery`
  Load relevant docs before planning (FEATURE_INDEX → feature docs → foundation docs).

- `/plan-lint`
  Validate plan against doc constraints (features, invariants, tests, high-risk awareness).

## Documentation
- `/doc-update`
  Update docs after code changes (feature doc + any affected workflow/foundation docs).

- `/drift-check`
  Compare modified files to docs; flag mismatches and stale paths.

- `/docs:find <feature|keyword>`
  Locate relevant docs (Feature Index → feature docs → workflows/foundation).

- `/docs:new <feature-slug>`
  Create a new feature doc only if a new end-to-end capability exists.

## Testing
- `/test-from-docs`
  Convert feature/workflow docs into a runnable test checklist with smoke test.

## Handoff
- `/handoff`
  Write `.context/handoff.md`: what changed, what remains, how to verify.

## Minimum Expected Workflow

```
/doc-discovery → Plan → /plan-lint → Execute → /doc-update → /test-from-docs → /handoff
```
