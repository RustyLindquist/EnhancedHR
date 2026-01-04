---
id: auth-accounts
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /login
    - /auth/callback
    - /auth/join-org
    - /verify
data:
  tables:
    - auth.users
    - public.profiles
  storage: []
backend:
  actions:
    - src/app/login/actions.ts
    - src/app/auth/callback/route.ts
    - supabase/functions/handle_new_user (trigger in schema)
ai:
  context_scopes: []
  models: []
tests:
  local:
    - From /login, sign up with email/password; confirm profile row created and session established.
  staging:
    - OAuth sign-in (Google) succeeds and redirects to dashboard; profile created via handle_new_user trigger.
invariants:
  - profiles row must exist for every auth.user; handle_new_user trigger inserts on new auth user.
  - RLS on profiles allows user to select/update only their own row (auth.uid()=id); writes must filter by auth user.
  - auth flows must capture org membership and membership_status from profiles when gating surfaces.
---

## Overview
Auth Accounts handles login/signup/password reset/OAuth and ensures each authenticated user has a corresponding `profiles` row. It establishes sessions used across all server/client Supabase calls and seeds basic profile fields via the handle_new_user trigger.

## User Surfaces
- `/login` multi-view form for login, signup, verify, forgot password, OAuth.
- `/auth/callback` for OAuth provider redirects.
- `/auth/join-org` for organization invite acceptance (uses existing session).

## Core Concepts & Objects
- **Auth user**: Supabase `auth.users`.
- **Profile**: `public.profiles` row keyed to auth user id; stores role, membership_status, org_id, stripe ids.
- **Session**: stored in Supabase client/server helpers; required for RLS access.

## Data Model
- `profiles`: id uuid PK references auth.users, full_name, avatar_url, org_id, membership_status enum, role, stripe_customer_id/subscription_id/price_id, billing_period_end, author_status, trial_minutes_used, auto_insights.
- Trigger `handle_new_user` inserts profile with full_name/avatar_url from auth metadata.

Write paths:
- login/signup/reset/verify in `src/app/login/actions.ts` call Supabase auth APIs; signup sets accountType/membershipType in metadata; handle_new_user creates profile row.
- join-org flow updates profiles.org_id/membership_status (see join-org route).

Read paths:
- Session retrieval via createClient/createServerClient; profile fetched for role/org gating.

## Permissions & Security
- profiles RLS: user can view/update own row; admin/org_admin may have elevated policies (see schema).
- Auth actions run with public anon key on server; never expose service_role.
- Redirects must occur server-side to avoid leaking tokens; ensure cookies are set.

## Integration Points
- Membership/billing uses stripe fields on profiles.
- Organization membership uses org_id/membership_status set post-auth.
- AI personalization uses profiles.ai_insights and role data.

## Invariants
- Every auth.user must have a matching profiles row (trigger-backed); missing rows indicate trigger failure.
- profile updates must filter by auth user to satisfy RLS.
- OAuth providers must include email; login actions should handle error states gracefully.

## Failure Modes & Recovery
- Profile missing after signup: rerun handle_new_user logic or insert manually with id=auth user id.
- RLS blocking profile read: ensure createClient uses authenticated session, not service_role.
- OAuth redirect loop: check callback route env and Supabase settings.

## Testing Checklist
- Signup -> check profiles row created with matching id.
- OAuth Google -> redirected to dashboard; profiles row present.
- Password reset -> receive email (if configured); reset success allows login.
- Join-org link -> updates org_id/membership_status; can access org surfaces.

## Change Guide
- If adding roles: update profiles role enum and RLS policies; migrate existing rows.
- Changing signup metadata: adjust login actions; ensure handle_new_user reads new fields if needed.
- Any auth provider additions require Supabase config and actions update.

## Related Docs
- docs/features/membership-billing.md
- docs/features/organization-membership.md
