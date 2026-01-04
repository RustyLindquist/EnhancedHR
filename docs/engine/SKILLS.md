# Skills (Playbooks)

Skills are short playbooks. Agents invoke them explicitly to ensure consistent behavior.

## SKILL: Doc Discovery
Goal: Load only the necessary docs with minimal context bloat.
Steps:
1) Open `docs/features/FEATURE_INDEX.md` and identify the primary feature.
2) Read coupling notes and list secondary impacted features.
3) Open each feature doc for primary + impacted features.
4) If change touches Auth/RLS, AI context, billing, migrations, open the relevant foundation docs (or create stubs).

## SKILL: Plan Lint (Gate 1 → Gate 2)
Goal: Ensure plan is doc-consistent before coding.
Checks:
- Plan names primary + impacted features.
- Plan lists the invariants from each relevant feature doc.
- Plan includes tables/permissions touched (if any).
- Plan includes local verification + one workflow smoke test.

Output:
- Annotated plan with corrections.
- A short “blast radius” warning if high-risk systems are touched.

## SKILL: Doc Update (After Coding)
Goal: Keep docs evergreen without oversight.
Steps:
1) Identify which feature docs are affected by modified files/routes/actions/tables.
2) For each affected feature doc:
   - update “User Surfaces” if routes/UI changed
   - update “Data Model” if table usage changed
   - update “Permissions & Security” if auth/RLS/admin-client patterns changed
   - update “Invariants” if a new non-negotiable rule emerged
   - update “Testing Checklist” to match reality
3) If change spans multiple features and represents a workflow:
   - create/update a workflow doc under `docs/workflows/`
4) Update `FEATURE_INDEX.md` coupling notes if a new dependency emerged.

## SKILL: Drift Check (Docs vs Code Reality)
Goal: Detect doc rot early.
Steps:
- If a PR/commit touches server actions, API routes, AI context, DB migrations:
  - verify those paths are listed in front-matter of the corresponding feature doc(s)
- If a new table is added or a write-path changes:
  - verify “Data Model” and “Testing Checklist” include it
- If a feature boundary seems wrong:
  - update Feature Index coupling notes and/or split/merge docs per policy

## SKILL: Testing from Docs
Goal: Use documentation as the test blueprint.
Steps:
1) From the primary feature doc, run its local checklist.
2) From any impacted feature docs, run their minimal checks.
3) Run exactly one workflow smoke test (from the most relevant workflow doc, or the primary feature doc if none exist).
4) Confirm expected DB mutations (tables/rows) where applicable.

## SKILL: Handoff Note
Goal: Make work portable across tools/workspaces.
Write `.context/handoff.md` containing:
- Summary of change
- Files changed
- Docs updated
- How to verify (commands + UI steps)
- What remains / known issues
