---
description: Resume work with full context from previous sessions at the start of a new session
---

# Session Start

Resume work with full context from previous sessions. Run this skill at the beginning of a new work session to load relevant context and understand what remains to be done.

## When to Use

- Starting a new work session after a break
- Picking up work from a previous agent or developer
- Resuming interrupted work
- Any time you need to understand the current state of work

## Steps

### 1. Load Previous Session Context

Read these files in order (if they exist):

```
.context/handoff.md          # What was done, what remains
.context/session-summary.md  # Compacted context from multiple sessions
.context/checkpoint.md       # Mid-session state (if session was interrupted)
.context/agents/active.yaml  # Agent states and work items
```

### 2. Evaluate Context State

Based on what you found:

| Found | Meaning | Action |
|-------|---------|--------|
| `handoff.md` exists, recent | Previous session completed cleanly | Load remaining work from handoff |
| `checkpoint.md` exists, newer than handoff | Session was interrupted mid-work | Resume from checkpoint state |
| `session-summary.md` exists | Multiple sessions of accumulated context | Load summary for broader context |
| `agents/active.yaml` exists | Sub-agents were spawned | Check if any need to be resumed |
| Nothing exists | Fresh start | Skip to Step 5 |

### 3. Load Relevant Documentation

Based on the work remaining, identify what docs to load:

**If the handoff mentions specific features:**
- Open `docs/features/FEATURE_INDEX.md`
- Identify the primary feature(s)
- Open the feature doc(s) for context
- Check coupling notes for dependencies

**If the handoff mentions incomplete work on:**
- **Schema/DB**: Load `docs/foundation/supabase-schema-and-migrations.md`
- **Auth/RLS**: Load `docs/foundation/auth-roles-rls.md`
- **AI/Context**: Load `docs/features/ai-context-engine.md`
- **Billing**: Load `docs/features/membership-billing.md`
- **Frontend**: Load `docs/frontend/STYLE_GUIDE.md`

**When to spawn Doc Agent:**
If the remaining work is complex (touches multiple features, high-risk areas, or unclear scope), spawn the Doc Agent:
```
/spawn-doc-agent
@doc-agent: I'm resuming work on [brief description from handoff]. What features are involved and what invariants should I preserve?
```

### 4. Identify Next Actions

From the context loaded, extract:
- **What was completed** (from handoff summary)
- **What remains** (from handoff "What Remains" section or checkpoint state)
- **Active blockers** (from notes)
- **Verification needed** (from handoff "How to Verify" if work needs validation)
- **Docs to update** (if execution completed but docs weren't updated)

### 5. Announce Session Context to User

Provide a structured summary:

```markdown
## Session Resume Summary

**Previous work**: [Brief summary of what was done]

**Session state**: [Clean handoff | Mid-work checkpoint | Fresh start]

**What remains**:
- [ ] [Item 1 from handoff/checkpoint]
- [ ] [Item 2]
- [ ] [Item 3]

**Context loaded**:
- Handoff: [Yes/No, date if yes]
- Checkpoint: [Yes/No, date if yes]
- Feature docs: [list]
- Active agents: [list or "none"]

**Ready to proceed with**: [The next logical task to work on]

**Need clarification on**: [Any ambiguities or questions]
```

### 6. Handle Special Cases

**If checkpoint exists but is older than handoff:**
- The checkpoint is stale
- Delete or archive it: `mv .context/checkpoint.md .context/checkpoint.old.md`
- Proceed with handoff context

**If multiple handoff notes exist (handoff-1.md, handoff-2.md, etc.):**
- Read all of them in sequence
- Understand the progression of work
- Use the most recent for current state

**If handoff mentions spawned agents that should be resumed:**
- Check `.context/agents/active.yaml`
- Determine if agents need to continue work or if their tasks are complete
- Update active.yaml accordingly

**If no context exists (fresh start):**
```markdown
## Session Start - Fresh Session

No previous context found. This is a clean start.

**Ready to**: Receive task from user

**Will follow**: Standard 2-gate flow (plan → execute)
```

## Output Template

Use this template for your session start announcement:

```markdown
## Session Started

**State**: [Resuming from handoff | Resuming from checkpoint | Fresh start]

**Previous Session**: [Date of last session, brief summary]

**Completed**:
- [Key accomplishment 1]
- [Key accomplishment 2]

**In Progress**:
- [ ] [Current task or next task from handoff]

**Remaining Work**:
- [ ] [Item 1]
- [ ] [Item 2]

**Context Loaded**:
- Documentation: [features/components consulted]
- Agent states: [if any active]

**Next Action**: [What you plan to do first]

**Questions**: [Any clarifications needed from user]
```

## Integration with Other Skills

**After session-start, commonly run:**
- `/doc-discovery` if starting new work on a feature
- `/spawn-doc-agent` if resuming complex multi-feature work
- `/spawn-frontend-agent` if UI work remains
- `/spawn-test-agent` if verification work remains

**If resuming from interrupted checkpoint:**
1. Run `/session-start` to load state
2. Verify the checkpoint is valid (files mentioned still exist)
3. Continue execution from where checkpoint left off
4. When complete, run `/handoff` to create clean handoff note
5. Delete the checkpoint: `rm .context/checkpoint.md`

## Critical Reminders

1. **Always check for checkpoint first** - it may be newer than handoff
2. **Don't assume context** - explicitly load and verify what was done
3. **Ask for clarification** - if handoff is ambiguous or incomplete
4. **Update agent registry** - if agents need to be resumed or marked complete
5. **Spawn Doc Agent for complex work** - don't proceed blind on multi-feature tasks
