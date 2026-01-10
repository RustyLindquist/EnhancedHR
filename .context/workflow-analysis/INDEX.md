# Workflow Analysis Index

This directory contains session-by-session workflow analysis documents created by the Workflow Analysis Agent.

## Purpose

Track and document continuous process improvements across sessions:
- **Analysis**: What worked, what didn't, friction points observed
- **Plans**: Proposed improvements with rationale
- **Implementations**: Changes made and their outcomes

## Directory Structure

```
.context/workflow-analysis/
├── INDEX.md                           ← This file
├── YYYY-MM-DD-session-N.md           ← Individual session analyses
└── patterns/
    └── recurring-issues.md            ← Cross-session patterns
```

## Session Analysis Template

Each session analysis document follows this structure:

```markdown
# Workflow Analysis: [Date] Session [N]

## Session Summary
- **Duration**: [approx time]
- **Primary Task**: [what was being worked on]
- **Agents Spawned**: [list]
- **Outcome**: [success/partial/blocked]

## Performance Analysis

### What Worked Well
- [observation 1]
- [observation 2]

### Friction Points Identified
| Area | Friction | Impact | Frequency |
|------|----------|--------|-----------|
| [area] | [description] | [High/Med/Low] | [One-time/Recurring] |

### Missed Opportunities
- [things that could have been done better]

## Improvement Plan

### Proposed Changes
| Priority | Change | Type | Rationale |
|----------|--------|------|-----------|
| P0 | [change] | [skill/agent/protocol/doc] | [why] |

### Implementation Steps
1. [step 1]
2. [step 2]

## User Decision
- **Status**: [Pending/Approved/Rejected/Modified]
- **User Notes**: [any modifications requested]

## Implementation Record
- **Implemented**: [Yes/No/Partial]
- **Changes Made**:
  - [file]: [change description]
- **Verification**: [how verified]
```

## Cross-Session Analysis

Periodically, the Workflow Analysis Agent reviews multiple sessions to identify:
- Recurring friction patterns
- Successful improvements that should be reinforced
- Emerging needs for new agents or skills
- Documentation gaps

## Metrics Tracked

Over time, track:
- Number of sessions analyzed
- Improvements proposed vs implemented
- Recurring issue resolution
- Agent spawn efficiency
- Context management effectiveness

## Sessions

<!-- New sessions are added below -->

| Date | Session | Primary Task | Improvements | Status |
|------|---------|--------------|--------------|--------|
| | | | | |
