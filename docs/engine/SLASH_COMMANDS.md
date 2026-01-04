# Slash Commands (Agent Protocol)

These commands are text conventions that work across tools (Conductor, Claude Code, IDE agents, CLI).

## Planning
- `/plan:draft`  
  Produce Gate 1 plan (primary feature, impacted features, invariants, tests).

- `/plan:review`  
  Documentation Agent runs Gate 2 doc review and returns plan annotations.

- `/plan:final`  
  Orchestrator produces Gate 3 revised plan and waits for approval to execute.

## Documentation
- `/docs:find <feature|keyword>`  
  Locate relevant docs (Feature Index → feature docs → workflows/foundation).

- `/docs:update`  
  Update docs after code changes (feature doc + any affected workflow/foundation docs).

- `/docs:new <feature-slug>`  
  Create a new feature doc only if a new end-to-end capability exists.

- `/drift:check`  
  Compare planned changes + modified files to docs; flag mismatches.

## Testing
- `/test:scope`  
  Convert feature/workflow docs into a runnable test checklist.

- `/test:smoke`  
  Provide the single workflow smoke test to run before any GitHub action.

## Handoff
- `/handoff:write`  
  Write `.context/handoff.md`: what changed, what remains, how to verify.
