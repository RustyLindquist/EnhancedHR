---
description: Validate that a plan is doc-consistent before coding begins
---

# Plan Lint

Validate that a plan is doc-consistent before coding begins. This skill checks that the plan correctly incorporates documentation constraints.

## Checks

Run these validations against the proposed plan:

1. **Feature identification**: Does the plan name the primary feature and all impacted features (from FEATURE_INDEX.md coupling notes)?

2. **Invariants listed**: Does the plan explicitly list the invariants from each relevant feature doc that must be preserved?

3. **Data impact documented**: If tables/columns/permissions are touched, are they listed with their expected changes?

4. **Test plan included**: Does the plan include:
   - Local verification steps (from feature doc Testing Checklist)
   - At least one workflow smoke test

5. **High-risk system awareness**: If the change touches Auth/RLS, AI context, billing, or schema migrations, does the plan acknowledge the elevated risk and include appropriate safeguards?

6. **Doc update scope**: Does the plan identify which docs will need updating after execution?

## Output

Return an annotated plan with:
- Corrections or additions needed
- A **blast radius warning** if high-risk systems are touched
- Confirmation that the plan is ready for execution (or what's missing)

## Plan Size Guidance

- **Small change** (1 file, low risk): 5-8 bullets is sufficient
- **Medium change** (2-6 files, one feature): Include invariants + rollback note
- **Large change** (multi-feature / schema changes): Include staged rollout and backfill strategy
