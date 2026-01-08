---
name: doc-discovery
description: Load relevant docs before planning any task. Use at the START of complex tasks to understand feature scope, invariants, and coupling. Essential before any code changes.
allowed-tools: Read, Glob, Grep
---

# Doc Discovery Skill

## Purpose
Load only the necessary documentation with minimal context bloat. This skill ensures you understand the feature landscape BEFORE planning or coding.

## When to Use
- Starting any task that touches server actions, database, or AI
- Before creating a plan for any non-trivial change
- When uncertain about feature boundaries or coupling
- After user describes a bug or feature request

## Decision Tree

```
User Request Received
        │
        ▼
┌───────────────────────────────────────┐
│ 1. IDENTIFY PRIMARY FEATURE           │
│    Read: docs/features/FEATURE_INDEX.md│
│    Find: Which feature owns this work? │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ 2. CHECK COUPLING NOTES               │
│    In FEATURE_INDEX, find:            │
│    - "Couples with" entries           │
│    - "Impacted by" notes              │
│    List: Secondary features           │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ 3. LOAD FEATURE DOCS                  │
│    Read: docs/features/{primary}.md   │
│    Read: docs/features/{secondary}.md │
│    Extract: Invariants, data model    │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ 4. CHECK HIGH-RISK AREAS              │
│    If task touches:                   │
│    □ Auth/RLS → load auth patterns    │
│    □ AI/prompts → load AI context docs│
│    □ Billing → load entitlements docs │
│    □ Schema → load migration guides   │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ 5. CHECK WORKFLOW IMPACT              │
│    Read: docs/workflows/WORKFLOW_INDEX│
│    Find: Which user journeys affected?│
└───────────────────────────────────────┘
```

## Steps

### Step 1: Identify Primary Feature
```
Read: docs/features/FEATURE_INDEX.md
Find: The feature that "owns" this task
Note: Feature name, risk level, key files
```

### Step 2: Map Coupling
From FEATURE_INDEX.md, extract:
- Direct dependencies (features this one calls)
- Reverse dependencies (features that call this one)
- Shared data (tables used by multiple features)

### Step 3: Load Feature Documentation
For primary feature + each coupled feature:
```
Read: docs/features/{feature-name}.md
Extract:
- Invariants (non-negotiable rules)
- Data model (tables, columns, relationships)
- User surfaces (routes, components)
- Testing checklist (verification steps)
```

### Step 4: High-Risk Area Check
| If Task Touches... | Load... |
|-------------------|---------|
| Auth, RLS, permissions | Auth patterns doc, RLS policies |
| AI, prompts, context | AI context assembly docs |
| Billing, credits, entitlements | Stripe integration, entitlements |
| Schema, migrations | Migration safety guide |
| User workflows | Relevant workflow docs |

### Step 5: Workflow Impact Assessment
```
Read: docs/workflows/WORKFLOW_INDEX.md
Find: User journeys that include affected features
Note: Which workflow steps might change
```

## Output Format

After completing discovery, report:

```markdown
## Doc Discovery Complete

### Primary Feature
- **Name**: [feature-name]
- **Risk Level**: [low/medium/high/critical]
- **Doc**: docs/features/[feature-name].md

### Coupled Features
| Feature | Coupling Type | Risk |
|---------|--------------|------|
| [name] | [data/API/UI] | [level] |

### Key Invariants
1. [Invariant from primary feature]
2. [Invariant from coupled feature]
3. [Invariant from coupled feature]

### High-Risk Areas Touched
- [ ] Auth/RLS: [yes/no]
- [ ] AI/Prompts: [yes/no]
- [ ] Billing: [yes/no]
- [ ] Schema: [yes/no]

### Workflows Affected
- [workflow-name]: Steps [X, Y, Z]

### Docs Loaded
- docs/features/[primary].md
- docs/features/[secondary].md
- [other docs]

### Ready for Planning
[Yes / No - missing: X, Y, Z]
```

## Validation Checklist

Before proceeding to planning, confirm:
- [ ] Primary feature identified and doc loaded
- [ ] All coupled features identified
- [ ] Invariants extracted (minimum 3)
- [ ] High-risk areas checked
- [ ] Workflow impact assessed

## Examples

**Example 1: Bug in course progress**
```
User: "Course progress isn't saving correctly"

Discovery:
- Primary: course-player-and-progress (High risk)
- Coupled: collections-and-context, dashboard
- Invariants: 
  - Progress must persist across sessions
  - Watch time triggers credit accrual
  - Progress is scoped to user + course
- High-risk: Yes (data integrity)
- Workflows: employee-workflows.md (Learning Journey)
```

**Example 2: Add new filter to dashboard**
```
User: "Add a date filter to the learning dashboard"

Discovery:
- Primary: dashboard (Medium risk)
- Coupled: course-player-and-progress (read-only)
- Invariants:
  - Dashboard must load < 2s
  - Filters persist in URL params
- High-risk: No
- Workflows: employee-workflows.md (Dashboard Overview)
```

## Anti-Patterns

❌ **Don't skip discovery for "simple" tasks**
Simple tasks often have hidden coupling.

❌ **Don't load all docs upfront**
Load lazily based on actual coupling, not speculation.

❌ **Don't ignore workflow docs**
Feature changes often break user journeys.

❌ **Don't proceed without invariants**
If you can't find at least 3 invariants, the docs may need updating first.
