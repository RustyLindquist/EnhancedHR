---
description: Load necessary documentation with minimal context bloat before planning or coding
---

# Doc Discovery

Load only the necessary documentation with minimal context bloat before planning or coding.

## Steps

1. Open `docs/features/FEATURE_INDEX.md` and identify the **primary feature** you're changing (the row that best matches the user-facing behavior).

2. Read the **Coupling Notes** for that row to identify **secondary/impacted features**.

3. Open each feature doc for primary + impacted features:
   - `docs/features/<feature-slug>.md`

4. If the change touches any of these cross-cutting concerns, also open the relevant foundation docs:
   - **Auth/RLS**: `docs/foundation/auth-roles-rls.md` (or create stub if missing)
   - **AI context**: `docs/features/ai-context-engine.md`
   - **Billing/membership**: `docs/features/membership-billing.md`
   - **Supabase migrations**: `docs/foundation/supabase-schema-and-migrations.md` (or create stub if missing)

5. Extract and record:
   - **Invariants** from each relevant doc (the non-negotiable truths)
   - **Data paths** (tables/columns/permissions affected)
   - **Integration points** that may be impacted

## Output

Return a structured summary:
- Primary feature: `<feature-id>`
- Impacted features: `[list]`
- Key invariants to preserve: `[bullets]`
- Docs consulted: `[file paths]`
- Foundation concerns: `[auth/ai/billing/schema if applicable]`
