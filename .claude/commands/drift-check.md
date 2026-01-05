# Drift Check

Detect documentation drift early by comparing code changes to documented behavior. Run this skill when changes touch multiple files or after significant refactoring.

## Steps

1. **Identify modified files**: List all files changed in the current work session or commit.

2. **Cross-reference with feature docs**: For each modified file, check if it's listed in the front-matter of the corresponding feature doc(s):
   - Server actions → `backend.actions`
   - API routes → `backend.api`
   - Routes → `surfaces.routes`

3. **Validate data model accuracy**: If a new table is added or a write-path changes:
   - Verify the table is listed in the feature doc's `data.tables`
   - Verify the "Data Model" section describes the new/changed usage
   - Verify "Testing Checklist" includes verification steps

4. **Check feature boundaries**: If a change seems to belong to a different feature than documented:
   - Update FEATURE_INDEX.md coupling notes
   - Consider splitting or merging feature docs per DOC_UPDATE_POLICY.md

5. **Verify invariants still hold**: Compare the code behavior to documented invariants. Flag any that may be violated or need updating.

## Output

Return a drift report:
- **Files not in docs**: List of modified files not referenced in any feature doc front-matter
- **Stale paths in docs**: Paths listed in docs that no longer exist in code
- **Boundary issues**: Features that seem misattributed or need coupling updates
- **Invariant concerns**: Any documented invariants that may no longer hold
- **Recommended fixes**: Specific doc updates needed to resolve drift
