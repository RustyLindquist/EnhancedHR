# Agent Protocol: Multi-Agent Coordination

---

## ⛔ CRITICAL SAFETY RULES — READ FIRST ⛔

**THIS SECTION IS MANDATORY FOR ALL AGENTS. VIOLATION = DATA LOSS.**

### Absolutely Forbidden Commands

You MUST **NEVER** execute these commands under ANY circumstances:

| Command | Why It's Forbidden |
|---------|-------------------|
| `supabase db reset` | **DESTROYS ALL LOCAL DATABASE DATA** |
| `supabase db push` (destructive) | Can drop tables/columns |
| `DROP TABLE` / `DROP DATABASE` / `TRUNCATE` | Direct data destruction |
| `docker volume rm` (supabase volumes) | Destroys database storage |

### If You're Tempted to Run These

**STOP.** Ask yourself:
1. Can this be solved with a targeted SQL statement? → Do that
2. Can this be solved with a migration file? → Do that
3. Can this be solved with a code change? → Do that
4. Is there ANY alternative that preserves data? → Use it

If none of the above work, **TELL THE USER** and let them decide:

> "I was considering running [command] which would destroy all database data. The safer approach is [alternative]. Should I proceed with the safe alternative, or would you like to approve the destructive operation?"

### Safe Alternatives

| Problem | ❌ WRONG | ✅ RIGHT |
|---------|----------|----------|
| RLS policy blocking access | `supabase db reset` | Execute targeted SQL via `docker exec` |
| Permission denied | Reset database | Use `createAdminClient()` in code |
| Need to apply migration | Reset and restart | `supabase migration up` or direct SQL |
| Schema out of sync | Delete volumes | Create incremental migration |

### Historical Context

On 2026-01-05 and 2026-01-06, agents ran `supabase db reset` multiple times while attempting to fix issues. Each time destroyed the entire database including all users, groups, courses, and configurations. The actual fixes required only single SQL statements.

**EVERY destructive database operation so far has had a simple, non-destructive alternative.**

---

This document defines how agents coordinate in the EnhancedHR.ai workspace.

## Agent Types

### 1. Main Agent (Orchestrator)
- Receives user requests
- Decides whether to spawn sub-agents
- Coordinates work across agents
- Makes final decisions

### 2. Documentation Agent (Living Canon)
- Serves as authoritative documentation source
- Lazily loads and retains doc knowledge
- Answers queries from any agent
- Validates plans against constraints
- See: `.claude/agents/doc-agent.md`

### 3. Frontend Agent (Design System Guardian)
- Owns ALL frontend implementation work
- Maintains the style guide and component inventory
- Ensures visual consistency across the platform
- Self-improving: documents patterns as it discovers them
- See: `.claude/agents/frontend-agent.md`

### 4. Implementation Agents (Sub-Agents)
- Spawned for specific backend/logic tasks
- Query the Doc Agent as needed
- Report back to Main Agent
- Do NOT handle frontend work (that's the Frontend Agent's job)

## When to Spawn the Documentation Agent

The Main Agent should spawn a Doc Agent when ANY of these are true:

### Spawn Criteria (ANY = spawn)

| Criterion | Why |
|-----------|-----|
| Task touches server actions | May affect multiple features |
| Task touches database/schema | High-risk, needs invariant check |
| Task touches AI/context/prompts | Platform-wide impact |
| Task is a bug fix (not styling) | Need to understand intended behavior |
| Task spans 2+ features | Coupling analysis needed |
| Task touches auth/RLS/permissions | Security-critical |
| Task touches billing/payments | Business-critical |
| Uncertainty about scope | Doc Agent can clarify |
| **New agent, skill, or command created** | System architecture must be documented |
| **Process or protocol changes** | Workflow changes need documentation |
| **AGENTS.md or agent prompts modified** | Meta-system changes need tracking |
| **Task affects user-facing workflows** | Workflow impact analysis needed |
| **New feature that affects how users accomplish tasks** | Workflow documentation needed |
| **UI/UX changes to existing flows** | Must verify workflow steps still accurate |

### Skip Criteria (ALL must be true to skip)

| Criterion | Example |
|-----------|---------|
| Pure styling/CSS change | "Make the button blue" |
| Single-file, single-feature | "Add a tooltip to X button" |
| No server/DB involvement | Frontend-only presentation |
| No AI behavior changes | No prompts, no context |
| User explicitly says simple | "Quick fix, don't overthink" |

## Spawn Sequence

```
User Request
     │
     ▼
Main Agent Evaluates
     │
     ├─ Simple task? ──────────► Execute directly
     │
     └─ Complex task? ─────────► Spawn Doc Agent
                                      │
                                      ▼
                               Doc Agent loads FEATURE_INDEX
                                      │
                                      ▼
                               Main Agent queries:
                               "What features does this touch?"
                                      │
                                      ▼
                               Doc Agent responds with:
                               - Features involved
                               - Invariants to preserve
                               - Recommended docs to consult
                                      │
                                      ▼
                               Main Agent creates plan
                                      │
                                      ▼
                               [Optional] Main Agent asks:
                               "Does this plan violate anything?"
                                      │
                                      ▼
                               Doc Agent validates ──► PASS or WARN
                                      │
                                      ▼
                               Main Agent executes (or spawns sub-agents)
                                      │
                                      ▼
                               During execution, any agent can query:
                               "What's the expected behavior for X?"
                               "Can I change Y without breaking Z?"
```

## Query Protocol

### Query Format
Agents should query the Doc Agent with clear, specific questions:

```
@doc-agent: What features does the addToCollectionAction touch?
```

```
@doc-agent: What are the invariants for the course-player-and-progress feature?
```

```
@doc-agent: Does this plan violate any constraints?
[paste plan]
```

### Response Expectations
The Doc Agent will respond with structured output including:
- Features involved (with risk levels)
- Key findings
- Invariants to preserve
- Docs it loaded to answer the query

## Coordination Patterns

### Pattern 1: Pre-Planning Consultation
```
Main Agent: @doc-agent What features does "fixing the conversation save bug" touch?
Doc Agent: [loads prometheus-chat.md, collections-and-context.md]
           Primary: prometheus-chat (High risk)
           Impacted: collections-and-context (High risk)
           Key invariants: [list]
Main Agent: [creates informed plan]
```

### Pattern 2: Mid-Implementation Check
```
Sub-Agent: @doc-agent Can I add a new column to conversations without breaking anything?
Doc Agent: [checks prometheus-chat.md data model]
           WARN: conversations table has FK constraints from conversation_messages.
           Invariant: "Delete cascade is enforced by FK on conversation_messages"
           You must also update the migration and provide production SQL.
```

### Pattern 3: Plan Validation
```
Main Agent: @doc-agent Does this plan violate anything?
           [plan details]
Doc Agent: PASS - Plan correctly identifies features and invariants.
           Note: You should also update the Testing Checklist after implementation.
```

### Pattern 4: Workflow Impact Analysis
```
Main Agent: @doc-agent What workflows does this plan affect?
           [plan description]
Doc Agent: [loads WORKFLOW_INDEX.md, relevant workflow docs]
           Affected Workflows:
           - employee-workflows.md: Daily Learning Dashboard (steps 2, 4)
           - org-admin-workflows.md: Progress Monitoring (step 3)
           Workflow Gaps: None identified
           Recommendation: Verify dashboard step 2 still reflects new UI after changes.
```

## Session Lifecycle

### Start of Session
1. User makes request
2. Main Agent evaluates complexity
3. If complex: spawn Doc Agent
4. Doc Agent loads FEATURE_INDEX, announces ready

### During Session
- Doc Agent remains active
- Builds knowledge as queries come in
- Any agent can query at any time
- Context grows but stays focused

### End of Session
- Main Agent runs `/handoff`
- Doc Agent's knowledge doesn't persist to next session
- But the workflow ensures docs are updated, so next session starts fresh

## Anti-Patterns to Avoid

### Don't: Pre-load everything
The Doc Agent should load lazily. Loading all 20+ feature docs upfront wastes context.

### Don't: Bypass the Doc Agent for "quick" changes
If the spawn criteria match, use the Doc Agent. "Quick" changes often have hidden coupling.

### Don't: Ignore Doc Agent warnings
If the Doc Agent says WARN, address the concern before proceeding.

### Don't: Query without context
Bad: "What's the invariant?"
Good: "What are the invariants for the collections-and-context feature?"

---

## CRITICAL: Database Protection Rules

**THIS SECTION IS NON-NEGOTIABLE. VIOLATION RESULTS IN DATA LOSS.**

### Forbidden Commands (require explicit user approval)

```
NEVER RUN WITHOUT USER APPROVAL:
- supabase db reset
- supabase db push (with destructive changes)
- docker volume rm (for supabase volumes)
- DROP TABLE / DROP DATABASE / TRUNCATE
- Any command that wipes, resets, or destroys database data
```

### Why This Rule Exists

On 2026-01-05, an agent ran `supabase db reset` while attempting to fix an RLS policy issue. This destroyed the entire database including all users, groups, courses, and configurations. The actual fix required only a single SQL statement.

### Safe Alternatives for Database Issues

| Problem | WRONG Approach | RIGHT Approach |
|---------|---------------|----------------|
| RLS policy blocking access | `supabase db reset` | Execute targeted SQL via `docker exec` |
| Permission denied errors | Reset database | Use `createAdminClient()` in code |
| Need to apply migration | Reset and restart | `supabase migration up` or direct SQL |
| Schema out of sync | Delete volumes | Create incremental migration |

### Before Running ANY Database Command

Ask yourself these questions:
1. Will this command delete or reset any data? → If yes, STOP
2. Can this be solved with a single SQL statement? → If yes, do that instead
3. Can this be solved with a code change? → If yes, do that instead
4. Is there ANY alternative that preserves data? → If yes, use it

### If Tempted to Reset

**STOP. Tell the user:**

> "I was considering running [command] which would destroy all database data. The safer approach is [alternative]. Should I proceed with the safe alternative?"

---

## When to Spawn the Frontend Agent

The Main Agent should spawn the Frontend Agent for ANY frontend work.

### Spawn Criteria (ANY = spawn Frontend Agent)

| Criterion | Why |
|-----------|-----|
| Creating new UI components | Need design system compliance |
| Modifying component styling | Need consistency check |
| Building new pages/views | Need layout patterns |
| Fixing UI bugs | Need to understand existing patterns |
| Layout changes | Need spacing/structure consistency |

### Skip Criteria (ALL must be true to skip)

| Criterion | Example |
|-----------|---------|
| Pure text change | "Change 'Submit' to 'Save'" |
| Backend-only work | Server actions, API routes |
| Simple typo fix | Fixing a spelling error |

## Frontend Agent Workflow

```
User Request (with frontend work)
            │
            ▼
Main Agent Identifies Frontend Work
            │
            ▼
Spawn Frontend Agent
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│                  FRONTEND AGENT WORKFLOW                       │
│                                                                │
│  1. INVENTORY CHECK                                           │
│     └─► Load STYLE_GUIDE.md + COMPONENT_INDEX.md             │
│     └─► Check if component/pattern exists                     │
│                                                                │
│  2. DISCOVERY (if not in inventory)                          │
│     └─► Search codebase for similar patterns                  │
│     └─► If found: document it first                           │
│                                                                │
│  3. EXECUTE                                                   │
│     └─► Reuse existing OR create new following system         │
│     └─► Apply design tokens strictly                          │
│                                                                │
│  4. VALIDATE                                                  │
│     └─► Check against anti-patterns                           │
│     └─► Verify design token compliance                        │
│                                                                │
│  5. DOCUMENT                                                  │
│     └─► Update COMPONENT_INDEX.md if new                     │
│     └─► Create component doc if new                           │
└───────────────────────────────────────────────────────────────┘
            │
            ▼
Returns completed, validated work to Main Agent
```

## Frontend Agent Query Format

```
@frontend-agent: Build a new collection view for Bookmarks
```

```
@frontend-agent: Fix the hover states on course cards
```

```
@frontend-agent: Create a confirmation modal following the design system
```

## Frontend + Doc Agent Coordination

For complex features touching both frontend and backend:

```
Main Agent: Evaluates task
     │
     ├─► Spawn Doc Agent (for feature/invariant knowledge)
     │
     └─► Spawn Frontend Agent (for UI implementation)

Doc Agent: @frontend-agent What are the UI surfaces for collections?
Frontend Agent: [checks COMPONENT_INDEX, returns component list]

Frontend Agent: @doc-agent What are the invariants for the dashboard?
Doc Agent: [loads dashboard.md, returns invariants]
```

The agents can query each other as needed during implementation.

---

## When to Spawn the Test Agent

The Test Agent handles comprehensive validation work — systematic testing beyond what any single agent should do inline.

### Spawn Criteria (ANY = spawn Test Agent)

| Criterion | Why |
|-----------|-----|
| Multi-feature changes | Need systematic verification across features |
| Workflow-impacting changes | Must verify user journeys still work |
| High-risk areas (auth/billing/AI/schema) | Require thorough validation |
| Pre-PR validation | Comprehensive check before merge |
| User requests thorough testing | Explicit need for validation |
| Complex bug fix | Risk of regressions |

### Skip Criteria (ALL must be true to skip)

| Criterion | Example |
|-----------|---------|
| Single feature, low risk | "Add a tooltip to X" |
| No workflow impact | Styling-only changes |
| Simple verification needed | "Check if build passes" |
| Any agent can test inline | Quick visual check |

For simple tests, use the test skill (`.claude/commands/test.md`) directly.

### Test Agent Workflow

```
Implementation Complete
         │
         ▼
Main Agent Evaluates Test Needs
         │
         ├─ Simple? ──────────► Use test skill inline
         │
         └─ Complex? ─────────► Spawn Test Agent
                                      │
                                      ▼
                               Test Agent analyzes change
                                      │
                                      ▼
                               Consults Doc Agent:
                               "What features/workflows affected?"
                                      │
                                      ▼
                               Creates test plan
                                      │
                                      ▼
                               Executes tests:
                               - Static analysis (build, tests)
                               - Browser verification (Chrome Extension)
                               - Workflow validation
                                      │
                                      ▼
                               Returns test report with evidence
```

### Test Agent Query Format

```
@test-agent: Validate the course enrollment changes
             Files: enrollment.ts, EnrollButton.tsx
             Features: academy, course-player-and-progress
             Risk: Medium
```

### Test Agent Skills

The Test Agent uses:
- **Test Skill** (`.claude/commands/test.md`) — Test patterns and framework
- **Browser Use Skill** (`.claude/commands/browser-use.md`) — Chrome Extension control

### Test + Doc Agent Coordination

Test Agent queries Doc Agent for context:

```
Test Agent: @doc-agent What workflows does the enrollment feature affect?
Doc Agent: [loads workflow docs]
           - individual-user-workflows.md: Course Enrollment (steps 1-6)
           - employee-workflows.md: Course Completion (depends on enrollment)
           Invariants: User must have active subscription OR course must be free

Test Agent: [creates test plan covering those workflows]
```

### Test Report Handoff

Test Agent returns structured report to Main Agent:
- Static analysis results
- Feature testing results
- Workflow testing results
- Console error summary
- Screenshots as evidence
- Issues found (if any)
- Pass/Fail recommendation

---

## Meta-Cognitive Layer: System Self-Optimization

All agents in this system participate in continuous self-improvement. This is not optional — it's a core responsibility.

### The Optimization Loop

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TASK EXECUTION                               │
│                                                                      │
│  User Request → Main Agent → Sub-Agents → Work Complete              │
│                      │                         │                     │
│                      │                         ▼                     │
│                      │              Agents capture optimization      │
│                      │              signals during work              │
│                      │                         │                     │
│                      ▼                         ▼                     │
│              AGENT_PROTOCOL.md    .context/optimizations/pending.yaml│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      OPTIMIZATION CYCLE                              │
│                                                                      │
│  Ops Agent reviews pending optimizations                             │
│         │                                                            │
│         ├─► Impact assessment                                        │
│         │                                                            │
│         ├─► Prioritization                                           │
│         │                                                            │
│         ├─► Proposal to user                                         │
│         │                                                            │
│         └─► On approval: implement change                            │
│                    │                                                 │
│                    ▼                                                 │
│         Update agent prompts, skills, docs, AGENTS.md               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                      System is now improved for next task
```

### Main Agent Meta-Cognitive Responsibilities

As the orchestrator, the Main Agent has the broadest view. Watch for:

| Signal | Optimization Type | Action |
|--------|------------------|--------|
| Same type of task repeatedly spawns same agents | Protocol | Propose workflow optimization |
| User corrects agent behavior with general rule | Rule | Capture for all relevant agents |
| Coordination friction between agents | Protocol | Propose protocol update |
| A task type would benefit from a new agent | Agent | Propose to Ops Agent |
| Same context needed repeatedly | Doc | Propose adding to AGENTS.md |
| User frequently asks for same kind of work | Skill | Propose new skill |
| **Task affects user flow not in workflow docs** | Doc | Document workflow before proceeding |
| **User describes how they use a feature** | Doc | Capture as workflow documentation |
| **Feature change may break user's task path** | Doc | Verify workflow impact, update if needed |

### User Statement Detection (All Agents)

When users make general statements, capture them. These are gold:

**Trigger phrases to watch for:**
- "we always..." / "we never..."
- "the rule is..." / "the pattern is..."
- "this is how we..." / "this isn't how we..."
- "remember to..." / "don't forget to..."
- "from now on..." / "going forward..."
- Any correction that implies a broader principle

**Response pattern:**
1. Complete the immediate task
2. Capture the optimization in `.context/optimizations/pending.yaml`
3. Continue work — don't ask for permission to capture

### Cross-Agent Learning

Agents should be aware that optimizations can benefit other agents:

```
Frontend Agent notices: "User said no backgrounds on pages"
                              │
                              ▼
         Captures optimization with type: "rule"
                              │
                              ▼
         Ops Agent sees it affects: STYLE_GUIDE.md, anti-patterns.md
                              │
                              ▼
         Ops Agent also notices: Doc Agent should know this for plan validation
                              │
                              ▼
         Implements: Update style guide AND add to Doc Agent's validation checks
```

### When to Spawn the Ops Agent

The Ops Agent is spawned for system optimization work, not task work.

**Spawn Triggers:**
- End of significant work session (user requests system review)
- `pending.yaml` has 5+ unreviewed items
- User explicitly asks for system optimization
- Major friction observed that affects multiple agents

**Spawn Command:** `/spawn-ops-agent`

### Optimization Types Reference

| Type | What Changes | Examples |
|------|-------------|----------|
| `skill` | New `.claude/commands/*.md` file | Modal builder skill, API pattern skill |
| `rule` | Update to existing docs | Add to STYLE_GUIDE, anti-patterns |
| `doc` | New or updated documentation | Component doc, feature doc update |
| `protocol` | AGENT_PROTOCOL.md or AGENTS.md | New spawn criterion, workflow change |
| `agent` | New agent or agent prompt update | Testing Agent, agent skill addition |
| `process` | Workflow/tooling change | New validation step, handoff improvement |

### The Goal

The goal is **emergent optimization**: the more we work together, the better the system gets. Each task should:
1. Complete the user's request
2. Leave the system slightly better than before

This isn't overhead — it's how we build a system that continuously improves.

---

## Pre-Task Checkpoint (MANDATORY)

Before implementing ANY task involving code changes, the Main Agent MUST complete this checkpoint.

### When It Applies

This checkpoint is required for:
- Any implementation work (frontend, backend, server actions)
- Bug fixes that involve code changes
- Feature additions or modifications
- Schema/database changes
- Any task matching spawn criteria

### Skip Only When ALL True

- Pure text/content change (no code)
- Single-line typo fix
- User explicitly says "skip the checkpoint"

### The Checkpoint Process

**Step 1: Evaluate Spawn Criteria**

Check each agent type against spawn criteria:

| Agent Type | Check Against | Decision |
|------------|--------------|----------|
| Doc Agent | "When to Spawn the Doc Agent" section | YES/NO + reason |
| Frontend Agent | "When to Spawn the Frontend Agent" section | YES/NO + reason |
| Test Agent | Defer until after implementation | Document for later |

**Step 2: Document Decision**

Output the Pre-Task Acknowledgment Pattern:

```
## Task Analysis

**Spawn Criteria Check:**
- Doc Agent: [YES/NO] - [reason]
- Frontend Agent: [YES/NO] - [reason]
- Test Agent: [NO - will evaluate after implementation]

**Spawning:** [list agents or "None - simple task"]
**Proceeding with:** [approach]
```

**Step 3: Spawn Required Agents**

If any agent evaluation returned YES:
1. Spawn that agent BEFORE proceeding
2. Update session tracking (see below)
3. Query as needed per Coordination Patterns

**Step 4: Proceed**

Only after completing Steps 1-3 should implementation begin.

---

## Session Tracking

To enable resumption and provide audit trails, the Main Agent maintains a session registry.

### Active Agent Registry

Location: `.context/agents/active.yaml`

### Registry Schema

```yaml
session_start: "2026-01-05T10:30:00Z"
session_description: "Brief description of user's request"

agents:
  - id: "abc123"
    type: "doc-agent"
    purpose: "Feature knowledge for collections work"
    spawned_at: "2026-01-05T10:30:15Z"
    status: "active"
    related_tasks:
      - "Query about collections invariants"
      - "Plan validation for context cards"
    notes: "Loaded collections.md, prometheus-chat.md"

  - id: "def456"
    type: "frontend-agent"
    purpose: "UI implementation for context cards"
    spawned_at: "2026-01-05T10:35:00Z"
    status: "completed"
    related_tasks:
      - "Make context cards clickable"
      - "Add drag-and-drop support"
```

### When to Update

**On agent spawn:**
- Add entry with id, type, purpose, timestamp
- Set status to "active"

**During work:**
- Add related_tasks as work progresses
- Add notes for context (docs loaded, etc.)

**On session end:**
- Run `/handoff` which includes agent summary
- Mark agents as completed

### Benefits

| Benefit | How It Helps |
|---------|-------------|
| Resumption | Next session can see what was happening |
| Audit Trail | Clear record of spawn decisions |
| Handoff | Clean context transfer |
| Debugging | If something breaks, see what agents touched it |

---

## Optimization Capture Protocol

All agents participate in the meta-cognitive layer by capturing optimization opportunities during normal work.

### What Each Agent Watches For

| Agent Type | Watch For |
|------------|-----------|
| **Main Agent** | Workflow patterns, coordination friction, missing agents, user statements |
| **Doc Agent** | Documentation gaps, undocumented invariants, coupling patterns |
| **Frontend Agent** | Design system gaps, repeated UI patterns, missing components |
| **Test Agent** | Testing gaps, workflow coverage issues, validation patterns |
| **Ops Agent** | System-wide patterns, optimization effectiveness |

### User Statement Detection (All Agents)

**Trigger phrases to watch for:**
- "we always..." / "we never..."
- "the rule is..." / "the pattern is..."
- "from now on..." / "going forward..."
- Any correction that implies a broader principle

**Response pattern:**
1. Complete the immediate task
2. Capture the optimization in `.context/optimizations/pending.yaml`
3. Continue work — don't ask for permission to capture

### Capture Format

```yaml
- id: "OPT-YYYY-MM-DD-NNN"
  type: skill | rule | doc | protocol | agent | process
  source_agent: main-agent | doc-agent | frontend-agent | test-agent
  timestamp: "ISO-8601"
  trigger: "What prompted this observation"
  observation: "What you noticed"
  proposal: "What should change"
  impact: "Why it matters"
  frequency: one-time | occasional | frequent | constant
  effort: trivial | small | medium | large
  priority: null
  status: pending
```

### When NOT to Capture

Don't capture:
- One-off preferences
- Things already documented
- Speculative ideas without observed need
- Implementation details without broader applicability

**Focus on observed friction and repeated patterns.**
