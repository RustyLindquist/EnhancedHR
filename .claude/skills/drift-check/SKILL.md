---
name: drift-check
description: Detect documentation drift (docs out of sync with code). Use after changes, periodically, or when something feels wrong. Returns severity-rated findings with specific fixes.
allowed-tools: Read, Glob, Grep, Bash
---

# Drift Check Skill

## Purpose
Detect documentation rot early by comparing code reality against documented expectations. Documentation drift causes bugs, confusion, and wasted time.

## When to Use
- After completing a feature or bug fix
- Before starting work on an unfamiliar area
- When behavior doesn't match expectations
- Periodically (weekly recommended)
- After merging external contributions

## Drift Categories

| Category | Severity | Description |
|----------|----------|-------------|
| **Critical** | 🔴 | Security/auth docs wrong, data model incorrect |
| **High** | 🟠 | Server action undocumented, invariant violated |
| **Medium** | 🟡 | Route missing from surfaces, stale test checklist |
| **Low** | 🟢 | Minor description inaccuracy, outdated example |

## Detection Process

```
┌─────────────────────────────────────────────────────────────┐
│                    DRIFT DETECTION FLOW                      │
│                                                              │
│  1. SCAN CODE ARTIFACTS                                      │
│     └─► Server actions, routes, components, migrations       │
│                                                              │
│  2. CROSS-REFERENCE DOCS                                     │
│     └─► Feature docs, workflow docs, indexes                 │
│                                                              │
│  3. IDENTIFY GAPS                                            │
│     └─► Code exists but not documented                       │
│     └─► Docs describe things that don't exist                │
│     └─► Docs describe wrong behavior                         │
│                                                              │
│  4. SCORE SEVERITY                                           │
│     └─► Based on risk area and impact                        │
│                                                              │
│  5. GENERATE REMEDIATION                                     │
│     └─► Specific fixes for each drift item                   │
└─────────────────────────────────────────────────────────────┘
```

## Check Categories

### Check 1: Server Actions vs Docs

```bash
# Find all server actions
grep -r "use server" app/actions/ --include="*.ts" -l

# For each action file, verify it's documented
# Cross-reference with feature doc Server Actions tables
```

**Drift indicators:**
- Action exists in code but not in any feature doc
- Action documented but doesn't exist
- Action signature/behavior changed but doc not updated

### Check 2: Routes vs User Surfaces

```bash
# Find all routes (Next.js App Router)
find app -name "page.tsx" -o -name "route.ts"

# Cross-reference with feature doc User Surfaces tables
```

**Drift indicators:**
- Route exists but not in User Surfaces
- Route documented but file doesn't exist
- Route moved but doc shows old path

### Check 3: Schema vs Data Model

```bash
# Get current schema
supabase db dump --schema-only

# Or check migration files
ls supabase/migrations/

# Cross-reference with feature doc Data Model sections
```

**Drift indicators:**
- Table/column exists but not documented
- Documented table/column doesn't exist
- Column type or constraints changed

### Check 4: RLS vs Permissions Docs

```bash
# Check RLS policies
supabase db dump --schema-only | grep -A 10 "CREATE POLICY"

# Cross-reference with Permissions & Security sections
```

**Drift indicators:**
- Policy exists but not documented
- Documented policy doesn't exist
- Policy behavior changed

### Check 5: Invariants vs Reality

For each documented invariant:
- Can you find code that enforces it?
- Are there code paths that violate it?
- Has the business rule changed?

### Check 6: Workflow Steps vs UI

For each workflow doc:
- Do the documented steps still work?
- Are there new steps not documented?
- Have buttons/links/navigation changed?

## Output Format

```markdown
## Drift Check Report

**Scan Date**: [timestamp]
**Scope**: [full / specific feature]

### Summary
| Severity | Count |
|----------|-------|
| 🔴 Critical | [n] |
| 🟠 High | [n] |
| 🟡 Medium | [n] |
| 🟢 Low | [n] |

### Critical Issues (Fix Immediately)

#### DRIFT-001: [Title]
- **Category**: [Server Action / Route / Schema / RLS / Invariant / Workflow]
- **Location**: [file or doc path]
- **Finding**: [What's wrong]
- **Evidence**: [Code snippet or comparison]
- **Remediation**: [Specific fix]
- **Assigned**: [Feature doc to update]

### High Issues (Fix This Session)

#### DRIFT-002: [Title]
...

### Medium Issues (Fix Soon)

#### DRIFT-003: [Title]
...

### Low Issues (Track)

#### DRIFT-004: [Title]
...

### No Drift Found
[List areas checked with no issues]

### Recommendations
1. [Systemic issue observed]
2. [Process improvement suggestion]
```

## Severity Scoring Matrix

| Area | Missing Doc | Wrong Doc | Stale Doc |
|------|-------------|-----------|-----------|
| Auth/RLS | 🔴 Critical | 🔴 Critical | 🟠 High |
| Billing | 🔴 Critical | 🔴 Critical | 🟠 High |
| AI/Prompts | 🟠 High | 🟠 High | 🟡 Medium |
| Server Actions | 🟠 High | 🟠 High | 🟡 Medium |
| Schema | 🟠 High | 🔴 Critical | 🟡 Medium |
| Routes | 🟡 Medium | 🟡 Medium | 🟢 Low |
| Components | 🟢 Low | 🟡 Medium | 🟢 Low |
| Workflows | 🟡 Medium | 🟠 High | 🟡 Medium |

## Quick Checks (Fast Scan)

Run these for a quick health check:

```bash
# 1. Count server actions vs documented actions
echo "Server action files:" && find app/actions -name "*.ts" | wc -l
echo "Check against feature docs Server Actions tables"

# 2. Count routes vs documented surfaces
echo "Route files:" && find app -name "page.tsx" | wc -l
echo "Check against feature docs User Surfaces tables"

# 3. Check for recent migrations without doc updates
echo "Recent migrations:"
ls -lt supabase/migrations/ | head -5
echo "Verify these are reflected in Data Model sections"
```

## Deep Checks (Thorough Scan)

For comprehensive drift detection:

### 1. Action Audit
```
For each file in app/actions/:
  - Extract exported functions
  - Find which feature doc should own it
  - Verify it's in the Server Actions table
  - Verify signature matches
```

### 2. Route Audit
```
For each page.tsx in app/:
  - Extract the route path
  - Find which feature doc should own it
  - Verify it's in User Surfaces
  - Verify description is accurate
```

### 3. Schema Audit
```
For each table in database:
  - Find which feature doc(s) reference it
  - Verify columns match Data Model
  - Verify RLS policies documented
```

### 4. Invariant Audit
```
For each documented invariant:
  - Search code for enforcement
  - Search for violations
  - Flag if can't find enforcement
```

## Remediation Templates

### Missing Server Action Doc
```markdown
Add to [feature].md → Server Actions:

| Action | Purpose | Tables | Auth |
|--------|---------|--------|------|
| [name] | [what it does] | [tables] | [auth level] |
```

### Missing Route Doc
```markdown
Add to [feature].md → User Surfaces:

| Surface | Route | Description |
|---------|-------|-------------|
| [name] | [path] | [what user does here] |
```

### Schema Drift
```markdown
Update [feature].md → Data Model:

### Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| [table] | [purpose] | [actual columns] |
```

### Stale Workflow
```markdown
Update [role]-workflows.md → [Workflow Name]:

### Steps
1. [Current step 1]
2. [Current step 2] ← was: [old step]
3. [New step 3]
```

## Integration with Doc Agent

For complex drift scenarios:

```
@doc-agent: Drift check found these issues. Please help remediate:

1. [drift item 1]
2. [drift item 2]

Which feature docs need updating and what should change?
```

## Anti-Patterns

❌ **Don't ignore "minor" drift**
Minor drift accumulates into major confusion.

❌ **Don't fix code to match wrong docs**
Docs follow code, not vice versa (unless it's a bug).

❌ **Don't run drift-check without time to fix**
Detecting drift without fixing it is worse than not checking.

❌ **Don't skip workflow checks**
User journey drift causes the most real-world pain.
