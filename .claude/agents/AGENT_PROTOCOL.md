# Agent Protocol: Multi-Agent Coordination

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
