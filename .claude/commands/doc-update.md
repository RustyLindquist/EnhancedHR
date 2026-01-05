# Doc Update

Keep documentation evergreen after code changes. Run this skill after completing implementation.

## Steps

1. **Identify affected docs**: Determine which feature docs are affected by the files/routes/actions/tables you modified.

2. **For each affected feature doc**, check and update:

   - **User Surfaces**: Did routes or UI entry points change? Update the list.

   - **Data Model**: Did table usage change (new columns, different read/write paths)? Update the section.

   - **Permissions & Security**: Did auth/RLS patterns or `createAdminClient()` usage change? Document why and update.

   - **Invariants**: Did a new non-negotiable rule emerge? Add it to the invariants list.

   - **Testing Checklist**: Does the checklist still match reality? Add/remove steps as needed.

   - **Front-matter**: Update `last_updated` date, and adjust `surfaces`, `data`, `backend`, `ai` fields if paths changed.

3. **If the change spans multiple features** and represents a workflow:
   - Create or update a workflow doc under `docs/workflows/`

4. **Update FEATURE_INDEX.md** if:
   - A new coupling/dependency emerged
   - Doc status changed (e.g., from "Missing" to "Exists")
   - Risk level should be adjusted

## Output

Return a summary of:
- Docs updated (with specific sections changed)
- New docs created (if any)
- FEATURE_INDEX.md changes (if any)
