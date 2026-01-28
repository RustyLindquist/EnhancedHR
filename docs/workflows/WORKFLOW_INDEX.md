# Workflow Index

This directory contains **user workflow documentation** — how different user roles actually use the platform to accomplish their goals.

> **Purpose**: Features are building blocks; workflows are the experience. This documentation ensures changes don't break user journeys and new features fit naturally into existing patterns.

## Why Workflow Documentation Matters

- **Feature docs** tell us what the system does
- **Workflow docs** tell us how users experience it
- A feature change can be "correct" but still break a workflow
- New features need to fit into existing user mental models

## User Roles

| Role | Description | Workflow Doc |
|------|-------------|--------------|
| **Platform Administrator** | Manages the entire platform: users, courses, billing, AI | [platform-admin-workflows.md](./platform-admin-workflows.md) |
| **Organization Admin** | Manages their organization: team members, content assignments, analytics | [org-admin-workflows.md](./org-admin-workflows.md) |
| **Employee** | Organization member consuming assigned content | [employee-workflows.md](./employee-workflows.md) |
| **Individual User** | Self-directed learner with personal subscription | [individual-user-workflows.md](./individual-user-workflows.md) |
| **Expert/Author** | Creates and manages course content | [expert-author-workflows.md](./expert-author-workflows.md) |

## Workflow Documentation Schema

Each workflow doc follows this structure:

```markdown
# [Role] Workflows

## Role Overview
Brief description of this user type and their primary goals.

## Primary Workflows

### [Workflow Name]
**Goal**: What the user is trying to accomplish
**Frequency**: Daily | Weekly | Monthly | One-time
**Features Involved**: List of feature-ids from FEATURE_INDEX

#### Steps
1. [Entry point — where does the user start?]
2. [Action — what do they do?]
3. [System response — what happens?]
4. [Next action...]
5. [Exit point — where do they end up?]

#### Variations
- [Common variation and how it differs]

#### Success Criteria
- [How does the user know they succeeded?]

#### Related Workflows
- [Other workflows that connect to this one]
```

## How Agents Use Workflow Docs

### During Planning
Doc Agent checks workflow docs to:
- Identify which workflows a change affects
- Flag potential workflow breaks
- Suggest workflow considerations for new features

### During Validation
```
@doc-agent: What workflows does this plan affect?

Response:
## Workflow Impact Analysis

### Affected Workflows
- employee-workflows.md: Team Dashboard (steps 2, 4)
- org-admin-workflows.md: Add Team Member (step 3)

### Impact Assessment
- Team Dashboard: Step 2 references collections sidebar, which this change modifies
- Add Team Member: No direct impact, but step 3's "assign content" flow may need UI update

### Recommendation
Review employee Team Dashboard workflow before implementing.
```

### Meta-Cognition: Workflow Gap Detection

All agents watch for workflow gaps:

| Signal | Action |
|--------|--------|
| User describes a task flow not in workflow docs | Capture as optimization, propose documenting |
| Feature change affects undocumented workflow | Flag and document before proceeding |
| New feature needs workflow integration | Doc Agent proposes workflow updates |
| Bug report reveals workflow not documented | Document the workflow as part of fix |

## Workflow Impact Spawn Criterion

Doc Agent MUST be spawned when:
- Task may affect a documented user workflow
- New feature needs workflow integration points
- Bug fix reveals undocumented workflow
- User describes a workflow that should be documented

## Developer / Ops Workflows

These workflows are for developers and operations, not end users.

| Workflow | Description | Doc |
|----------|-------------|-----|
| **Database Course Building** | Bulk course creation via direct database insertion | [database-course-building.md](./database-course-building.md) |

## Cross-References

- **Feature docs**: `docs/features/*.md` — what features do
- **Workflow docs**: `docs/workflows/*.md` — how users use features
- **FEATURE_INDEX.md**: Lists features and their coupling
- **WORKFLOW_INDEX.md**: Lists roles and their workflows (this file)

## Maintaining Workflow Docs

### When to Update
- New feature added that affects a workflow
- Workflow steps change due to UI/UX updates
- New workflow discovered through user feedback
- Bug fix reveals workflow gap

### Who Updates
- Doc Agent (when spawned for workflow-impacting changes)
- Ops Agent (when implementing workflow-related optimizations)
- Any agent that discovers a workflow gap (via meta-cognition)

### Update Process
1. Identify affected workflow(s)
2. Update steps to reflect current behavior
3. Update "Features Involved" if changed
4. Verify related workflows still accurate
5. Update WORKFLOW_INDEX.md if new workflow added
