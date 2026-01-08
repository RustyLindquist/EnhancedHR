---
description: Capture optimization opportunities for system improvement review by the Ops Agent
---

# Capture Optimization

Structured template for capturing optimization opportunities during work. This skill ensures observations about system improvements are properly recorded for review by the Ops Agent.

**When to Use:**
- After noticing repeated patterns or friction
- When user makes statements implying rules ("we always...", "we never...")
- When you discover undocumented behavior
- Before ending a work session (review for any uncaptured signals)

## Steps

### 1. Identify the Signal Type

What triggered this observation?

| Signal | Type | Examples |
|--------|------|----------|
| User says "we always/never..." | `rule` | "we never put backgrounds on pages" |
| Same pattern used 3+ times | `skill` | Building modals repeatedly |
| Query returned UNDOCUMENTED | `doc` | Feature behavior not in docs |
| Agent coordination friction | `protocol` | Spawn criteria unclear |
| Same work type repeated | `agent` | Need a specialized bug-fix agent |
| Process step frequently skipped | `process` | Handoff notes incomplete |

### 2. Fill Out the Template

Copy and complete this YAML entry:

```yaml
- id: "OPT-YYYY-MM-DD-NNN"  # Today's date + sequence number
  type: skill | rule | doc | protocol | agent | process
  source_agent: main-agent | doc-agent | frontend-agent | test-agent
  timestamp: "YYYY-MM-DDTHH:MM:SSZ"
  trigger: "What prompted this observation"
  observation: |
    Detailed description of what you noticed.
    Be specific about:
    - What happened
    - How often it happens
    - Who/what is affected
  proposal: |
    What should change to address this.
    Be specific about:
    - Which files to create/update
    - What content to add
    - Expected outcome
  impact: "Why this matters - expected benefit"
  frequency: one-time | occasional | frequent | constant
  effort: trivial | small | medium | large
  priority: null  # Set by Ops Agent during review
  status: pending
```

### 3. Add to pending.yaml

Open `.context/optimizations/pending.yaml` and append your entry to the `optimizations:` list.

### 4. Continue Work

**DO NOT** ask for permission to capture. Just add the entry and continue working.

## Example Entries

### Example 1: Rule from User Statement

User said: "We never put backgrounds on pages so the platform gradient shows."

```yaml
- id: "OPT-2026-01-05-001"
  type: rule
  source_agent: frontend-agent
  timestamp: "2026-01-05T14:30:00Z"
  trigger: "User corrected a background usage and stated a general rule"
  observation: |
    User explicitly stated that pages should never have backgrounds.
    The platform gradient should always show through.
    This rule was not in the style guide.
  proposal: |
    Update docs/frontend/STYLE_GUIDE.md:
    Add under "Layout Principles":
    ## Page Backgrounds
    NEVER add backgrounds to page-level containers.
    The platform gradient must always show through.
    Only cards, panels, and specific UI elements get background treatment.

    Also update docs/frontend/anti-patterns.md with this as a critical pattern.
  impact: "Prevents future violations, establishes clear design rule"
  frequency: occasional
  effort: trivial
  priority: null
  status: pending
```

### Example 2: Missing Documentation

Query about feature returned "UNDOCUMENTED".

```yaml
- id: "OPT-2026-01-05-002"
  type: doc
  source_agent: doc-agent
  timestamp: "2026-01-05T15:45:00Z"
  trigger: "Agent asked about course enrollment behavior, no doc existed"
  observation: |
    The course enrollment flow involves:
    - Checking subscription status
    - Validating seat availability
    - Creating enrollment record
    - Triggering welcome email

    None of this is documented in feature docs.
    Had to read code to answer query.
  proposal: |
    Create docs/features/course-enrollment.md with:
    - Enrollment flow diagram
    - Subscription check logic
    - Seat validation rules
    - Email trigger conditions
    - Invariants to preserve
  impact: "Prevents future agents from having to read code for basic enrollment questions"
  frequency: frequent
  effort: medium
  priority: null
  status: pending
```

### Example 3: New Skill Needed

Same pattern used multiple times.

```yaml
- id: "OPT-2026-01-05-003"
  type: skill
  source_agent: main-agent
  timestamp: "2026-01-05T16:20:00Z"
  trigger: "Built confirmation modals 3 times this session with same pattern"
  observation: |
    Pattern for confirmation modals:
    1. Create modal state
    2. Add confirm/cancel handlers
    3. Use standard styling
    4. Handle loading state

    This was repeated for delete, archive, and publish actions.
  proposal: |
    Create .claude/commands/frontend/confirmation-modal.md:
    - Standard modal structure
    - Required props
    - State management pattern
    - Loading state handling
    - Styling tokens to use
  impact: "Reduces time building confirmation modals, ensures consistency"
  frequency: frequent
  effort: small
  priority: null
  status: pending
```

### Example 4: Protocol Improvement

Agent coordination friction observed.

```yaml
- id: "OPT-2026-01-05-004"
  type: protocol
  source_agent: main-agent
  timestamp: "2026-01-05T17:00:00Z"
  trigger: "Forgot to spawn Frontend Agent for UI bug fix"
  observation: |
    The spawn criteria for Frontend Agent includes "Fixing UI bugs"
    but Main Agent overlooked this because thinking in "bug fix" mode,
    not "frontend work" mode.

    The criteria exist but aren't evaluated consistently.
  proposal: |
    Add /check-spawn-criteria skill that:
    - Forces explicit evaluation of ALL spawn criteria
    - Outputs decision for audit trail
    - Makes spawn decisions visible and deliberate

    Update CLAUDE.md to require running this skill
    before starting any task.
  impact: "Ensures spawn criteria are always evaluated, not accidentally skipped"
  frequency: frequent
  effort: medium
  priority: null
  status: pending
```

## What NOT to Capture

**Skip capturing if:**
- One-time, context-specific decision
- Already documented somewhere
- Minor preference that doesn't affect quality
- Speculative "might be useful someday" idea
- You can fix it immediately yourself

**Focus on:**
- Observed friction
- Repeated patterns
- User-stated rules
- Documentation gaps
- Process failures

## Critical Reminders

1. **Capture immediately** - Don't wait until end of session
2. **Be specific** - Vague proposals can't be implemented
3. **Don't ask permission** - Just capture and continue
4. **Include context** - Future Ops Agent needs to understand
5. **Frequency matters** - "Constant" issues get higher priority
