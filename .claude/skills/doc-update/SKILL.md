---
name: doc-update
description: Update documentation after code changes. Use AFTER implementation is complete. Ensures docs stay in sync with code reality.
allowed-tools: Read, Write, Glob, Grep
---

# Doc Update Skill

## Purpose
Keep documentation evergreen by updating it immediately after code changes. This skill ensures docs reflect current code reality, not historical intent.

## When to Use
- Immediately after completing any code change
- After fixing a bug
- After adding a feature
- Before running /handoff
- When drift-check identifies stale docs

## Documentation Hierarchy

Updates flow from most specific to most general:

```
1. Feature Docs (most specific)
   docs/features/{feature}.md
            │
            ▼
2. Workflow Docs
   docs/workflows/{role}-workflows.md
            │
            ▼
3. Index Files
   docs/features/FEATURE_INDEX.md
   docs/workflows/WORKFLOW_INDEX.md
            │
            ▼
4. Architecture Docs (if patterns changed)
   docs/engine/*.md
```

## Update Process

### Step 1: Identify Affected Docs

```
Files Changed          →    Docs to Update
────────────────────────────────────────────
app/actions/*.ts       →    Feature doc (Server Actions section)
app/(routes)/**        →    Feature doc (User Surfaces section)
components/**          →    Feature doc (User Surfaces) + Component Index
supabase/migrations/*  →    Feature doc (Data Model) + provide prod SQL
lib/ai/**              →    AI context docs + affected feature docs
```

Run this check:
```bash
# For each changed file, find its feature owner
grep -l "[filename]" docs/features/*.md
```

### Step 2: Update Feature Docs

For each affected feature doc, update these sections:

#### User Surfaces
Update if routes/UI changed:
```markdown
## User Surfaces

| Surface | Route/Location | Description |
|---------|---------------|-------------|
| [New/Modified] | /path/to/route | [What it does] |
```

#### Data Model
Update if table usage changed:
```markdown
## Data Model

### Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| [table] | [purpose] | [columns] |

### New/Modified Columns
- `column_name`: [type] - [purpose]
```

#### Server Actions
Update if actions changed:
```markdown
## Server Actions

| Action | Purpose | Tables | Auth |
|--------|---------|--------|------|
| [action] | [what it does] | [tables touched] | [auth required] |
```

#### Permissions & Security
Update if auth/RLS/admin-client changed:
```markdown
## Permissions & Security

### RLS Policies
- [policy_name]: [what it allows/denies]

### Admin Client Usage
- [action]: [why admin client needed]
```

#### Invariants
Add new invariants if discovered:
```markdown
## Invariants

1. [Existing invariant]
2. [NEW] [Newly discovered invariant from this change]
```

#### Testing Checklist
Update to match new reality:
```markdown
## Testing Checklist

### Local Verification
- [ ] [Updated step based on change]
- [ ] [New verification step]

### Regression Checks
- [ ] [Area that might break]
```

### Step 3: Update Workflow Docs

If change affects user journeys:

```markdown
## [Workflow Name]

### Steps
1. [Step - unchanged]
2. [Step - UPDATED: now includes X]  ← Mark changes
3. [Step - NEW]  ← Mark additions
```

Check these workflow docs:
- `docs/workflows/employee-workflows.md`
- `docs/workflows/org-admin-workflows.md`
- `docs/workflows/platform-admin-workflows.md`
- `docs/workflows/individual-user-workflows.md`
- `docs/workflows/expert-author-workflows.md`

### Step 4: Update Index Files

#### FEATURE_INDEX.md
Update coupling notes if new dependencies emerged:
```markdown
### [feature-name]
- **Couples with**: [existing], [NEW: new-coupling]
- **Risk**: [level]
```

#### WORKFLOW_INDEX.md
Update if new workflows added or steps changed significantly.

### Step 5: Provide Production SQL

If migrations were created, provide production-safe SQL:

```markdown
## Production SQL

⚠️ Review before running on production

```sql
-- Migration: [migration_name]
-- Purpose: [what it does]
-- Rollback: [how to undo]

[SQL statements]
```
```

## Output Format

After completing updates, report:

```markdown
## Doc Update Complete

### Feature Docs Updated
| Doc | Sections Changed |
|-----|-----------------|
| [feature].md | User Surfaces, Data Model |
| [feature].md | Invariants |

### Workflow Docs Updated
| Doc | Changes |
|-----|---------|
| [role]-workflows.md | [workflow]: Step 3 updated |

### Index Updates
- [ ] FEATURE_INDEX.md: [Updated coupling for X]
- [ ] WORKFLOW_INDEX.md: [No changes needed]

### Production SQL
- [ ] Provided: [Yes/No]
- [ ] Location: [file path or inline]

### Verification
Run `/drift-check` to confirm no remaining drift.
```

## Checklist Format

Use this checklist for each change:

```markdown
## Doc Update Checklist

### Files Changed
- [ ] List all modified files

### Feature Docs
- [ ] Identified primary feature doc
- [ ] Updated User Surfaces (if routes changed)
- [ ] Updated Data Model (if schema changed)
- [ ] Updated Server Actions (if actions changed)
- [ ] Updated Permissions (if auth changed)
- [ ] Added new Invariants (if discovered)
- [ ] Updated Testing Checklist

### Workflow Docs
- [ ] Identified affected workflows
- [ ] Updated workflow steps
- [ ] Marked changes clearly

### Index Files
- [ ] Updated FEATURE_INDEX coupling notes
- [ ] Updated WORKFLOW_INDEX (if needed)

### Production Artifacts
- [ ] Provided production SQL (if migration)
- [ ] Noted rollback procedure

### Validation
- [ ] Ran /drift-check
- [ ] No remaining drift
```

## Common Update Patterns

### Pattern: New Server Action
```
Update: Feature doc → Server Actions table
Update: Feature doc → Data Model (if new table access)
Update: Feature doc → Testing Checklist
Check: FEATURE_INDEX coupling (if crosses features)
```

### Pattern: New Route/Page
```
Update: Feature doc → User Surfaces table
Update: Workflow docs → Add step for new page
Check: Component Index (if new components)
```

### Pattern: Schema Migration
```
Update: Feature doc → Data Model section
Update: Feature doc → Testing Checklist
Provide: Production SQL with rollback
Update: FEATURE_INDEX (if new coupling)
```

### Pattern: Bug Fix
```
Update: Feature doc → Invariants (add rule that was violated)
Update: Feature doc → Testing Checklist (add regression test)
Consider: Was this a workflow gap? Update workflow docs.
```

## Anti-Patterns

❌ **Don't skip doc updates for "small" changes**
Small changes accumulate into drift.

❌ **Don't update docs before code is working**
Document reality, not intent.

❌ **Don't forget workflow docs**
Feature docs explain "what", workflow docs explain "how users use it".

❌ **Don't provide production SQL without rollback**
Every migration needs an escape hatch.

## Integration Points

After doc-update, typically run:
- `/drift-check` - Verify no remaining drift
- `/handoff` - Prepare session summary
