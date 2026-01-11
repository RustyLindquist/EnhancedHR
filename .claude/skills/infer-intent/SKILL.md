# Intent Inference Skill

<!-- Version: 1.0.0 | Last Updated: 2026-01-11 -->

> **Cost**: Minimal (inline analysis, no agent spawn)

## Purpose

Analyze user requests to extract structured intent, reducing clarification cycles and improving agent routing accuracy.

## When to Use

- **Automatically**: Before delegating complex or ambiguous tasks
- **Manually**: When user request is unclear or multi-faceted
- **Proactively**: For any non-trivial implementation request

## Intent Analysis Framework

### Step 1: Extract Primary Intent

Classify the request into one of these categories:

| Intent Type | Indicators | Example |
|-------------|------------|---------|
| **Create** | "add", "new", "implement", "build" | "Add a dark mode toggle" |
| **Fix** | "bug", "broken", "not working", "error" | "The login button doesn't work" |
| **Modify** | "change", "update", "refactor", "improve" | "Make the header sticky" |
| **Explore** | "how", "why", "what", "where", "find" | "How does auth work?" |
| **Delete** | "remove", "delete", "drop" | "Remove the legacy API" |
| **Test** | "test", "verify", "check", "validate" | "Test the checkout flow" |
| **Document** | "document", "explain", "describe" | "Document the API" |
| **Deploy** | "deploy", "push", "release", "ship" | "Deploy to production" |

### Step 2: Identify Scope

| Scope | Characteristics | Agent Implications |
|-------|-----------------|-------------------|
| **Single Component** | One file, isolated change | Single agent, quick |
| **Feature** | Multiple files, one feature | Single agent or sequential |
| **Cross-Cutting** | Multiple features affected | Multiple agents, coordination |
| **System** | Architecture, infrastructure | Architect agent required |

### Step 3: Assess Complexity

Score 1-5 based on:

```
Complexity Score = Sum of applicable factors

+1  Single file change
+2  Multiple files in same domain
+3  Cross-domain changes (frontend + backend)
+4  Database schema changes
+5  External service integration
+1  Existing patterns to follow
+2  New patterns needed
+1  Clear requirements
+2  Requirements need clarification
```

| Score | Complexity | Approach |
|-------|------------|----------|
| 1-3 | Low | Direct delegation |
| 4-6 | Medium | Doc discovery first |
| 7-9 | High | Full 2-gate flow |
| 10+ | Very High | Architecture review |

### Step 4: Detect Implicit Requirements

Look for unstated but likely requirements:

| If Request Mentions | Also Consider |
|--------------------|---------------|
| UI change | Mobile responsiveness, accessibility |
| Database change | Migration, RLS policies, indexes |
| API endpoint | Authentication, rate limiting, validation |
| User-facing feature | Loading states, error handling, analytics |
| Delete/remove | Cascade effects, foreign keys, cleanup |

### Step 5: Generate Intent Summary

Output format:

```yaml
intent:
  primary: create|fix|modify|explore|delete|test|document|deploy
  secondary: [list of secondary intents if multi-faceted]

scope:
  level: component|feature|cross-cutting|system
  domains: [frontend, backend, database, etc.]

complexity:
  score: 1-10
  factors: [list of contributing factors]

agents:
  primary: recommended agent
  supporting: [other agents that may be needed]
  parallel_possible: true|false

requirements:
  explicit: [stated requirements]
  implicit: [inferred requirements]
  clarification_needed: [questions if ambiguous]

routing:
  recommended_flow: direct|sequential|parallel|2-gate
  first_action: specific next step
```

## Examples

### Example 1: Simple Fix

**Request**: "The submit button on the contact form is not responding"

```yaml
intent:
  primary: fix
  secondary: []

scope:
  level: component
  domains: [frontend]

complexity:
  score: 2
  factors: [single file likely, existing patterns]

agents:
  primary: frontend-agent
  supporting: []
  parallel_possible: false

requirements:
  explicit: [fix submit button click handler]
  implicit: [check form validation, check console errors]
  clarification_needed: []

routing:
  recommended_flow: direct
  first_action: Spawn frontend-agent to investigate and fix
```

### Example 2: Complex Feature

**Request**: "Add subscription billing with monthly and annual plans"

```yaml
intent:
  primary: create
  secondary: [modify]

scope:
  level: cross-cutting
  domains: [frontend, backend, database]

complexity:
  score: 9
  factors: [multiple files, cross-domain, database schema, external service (Stripe)]

agents:
  primary: architect-agent
  supporting: [backend-agent, frontend-agent, security-agent]
  parallel_possible: false (sequential needed)

requirements:
  explicit: [subscription system, monthly/annual plans]
  implicit: [
    Stripe integration,
    subscription management UI,
    billing history,
    plan upgrades/downgrades,
    webhook handling,
    RLS for subscription data
  ]
  clarification_needed: [
    "Should users be able to switch plans mid-cycle?",
    "Do you need a free trial period?",
    "Should billing be per-user or per-organization?"
  ]

routing:
  recommended_flow: 2-gate
  first_action: Run /doc-discovery to understand existing billing patterns
```

### Example 3: Exploratory Request

**Request**: "How does the video processing work?"

```yaml
intent:
  primary: explore
  secondary: []

scope:
  level: feature
  domains: [backend, external-services]

complexity:
  score: 1
  factors: [read-only, existing code]

agents:
  primary: research-agent
  supporting: [doc-agent]
  parallel_possible: true

requirements:
  explicit: [explain video processing]
  implicit: [Mux integration, upload flow, playback]
  clarification_needed: []

routing:
  recommended_flow: direct
  first_action: Spawn research-agent to explore video processing code
```

## Integration with Task Router

After intent inference, pass the summary to task-router for final routing:

```
User Request
    │
    ▼
/infer-intent ──► Intent Summary
    │
    ▼
/task-router ──► Agent Selection + Execution Plan
    │
    ▼
Execute (delegate, spawn, or inline)
```

## Quick Decision Tree

```
Is the request clear?
├─ No → Ask clarifying questions from intent.clarification_needed
└─ Yes → Continue

Is complexity score >= 7?
├─ Yes → Use 2-gate flow (/doc-discovery → /plan-lint)
└─ No → Continue

Does scope cross domains?
├─ Yes → Consider parallel dispatch or sequential agents
└─ No → Direct delegation to primary agent

Is this exploratory?
├─ Yes → Research agent (haiku model for cost efficiency)
└─ No → Implementation agent (appropriate model tier)
```

## Output to User

When using this skill, briefly communicate:

```markdown
**Understanding**: [1-sentence summary of interpreted request]
**Approach**: [routing decision and why]
**Next Step**: [specific action being taken]
```

Example:
> **Understanding**: You want to fix a non-responsive submit button on the contact form.
> **Approach**: This is a focused frontend fix. Delegating to frontend-agent.
> **Next Step**: Spawning frontend-agent to investigate the issue.

## When NOT to Use

- Trivial requests ("run the tests", "format the code")
- Explicit agent requests ("use the backend agent to...")
- Continuation of existing work in progress
- User has already provided structured requirements
