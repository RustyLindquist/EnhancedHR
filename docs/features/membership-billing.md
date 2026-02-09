---
id: membership-billing
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-02-07
surfaces:
  routes:
    - /settings/billing
    - /login (plan selection during signup mock)
  collections: []
data:
  tables:
    - public.profiles (membership_status, billing_disabled, stripe_customer_id, stripe_subscription_id)
  storage: []
backend:
  actions:
    - src/app/actions/users.ts (updateBillingDisabled — cancels Stripe, converts trial, clears fields)
    - src/app/api/stripe/checkout/route.ts (individual checkout — guards billing_disabled)
    - src/app/api/stripe/checkout-org/route.ts (org checkout — guards billing_disabled)
    - src/lib/membership.ts (updateSubscriptionStatus — respects billing_disabled)
    - src/lib/expert-membership.ts (expert membership upgrade/downgrade)
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Verify profiles has stripe_customer_id/stripe_subscription_id/stripe_price_id fields and membership_status updates as expected after manual changes.
    - Verify billing_disabled=true exempts user from billing.
    - Verify expert membership upgrade sets billing_disabled=true.
    - Verify expert membership downgrade respects Stripe subscription status.
  staging:
    - (When Stripe wired) create checkout, return, and confirm membership_status set to active.
    - Verify hasActiveStripeSubscription() correctly queries Stripe API.
invariants:
  - profiles contains Stripe identifiers and membership_status; these are the single source of truth for access gating.
  - billing_period_end must be maintained on subscription updates to enforce expirations.
  - membership_status enum values: trial, active, inactive, employee, org_admin; UI must gate by these values.
  - billing_disabled=true exempts user from billing regardless of membership_status.
  - When admin disables billing, Stripe subscription is canceled FIRST, then DB is updated (atomic order prevents inconsistency).
  - Checkout routes (/api/stripe/checkout, /api/stripe/checkout-org) reject billing_disabled users with 403.
  - Middleware (proxy.ts) bypasses upgrade redirect for billing_disabled users.
  - Stripe webhook handler (membership.ts) skips status updates when billing_disabled=true.
  - Expert membership changes set billing_disabled but do not cancel Stripe subscriptions.
  - Stripe subscription status is checked via API during expert downgrade to determine if billing resumes.
---

## Overview
Membership & Billing tracks subscription state using fields on `profiles` and Stripe identifiers. While checkout/portal flows are not fully implemented in this repo, membership_status and Stripe IDs gate access to paid features and org roles.

## User Surfaces
- Billing settings page (placeholder) and plan selectors on login/signup.
- Access gating across app surfaces based on profiles.membership_status.

## Core Concepts & Objects
- **Membership status**: enum on profiles controlling access (trial, active, inactive, employee, org_admin).
- **Stripe linkage**: stripe_customer_id, stripe_subscription_id, stripe_price_id, billing_period_end on profiles.
- **Billing disabled**: boolean field that exempts user from billing (used for experts with published courses).

## Data Model
- `profiles`: membership_status, billing_disabled, billing_period_end, stripe_* fields.

Write paths:
- Not fully implemented; expected via Stripe webhooks or server actions to update profile status and billing_period_end.
- Expert membership upgrade/downgrade via `src/lib/expert-membership.ts` (triggered by course publish/unpublish).

Read paths:
- Gating logic in UI/server actions checks membership_status/org role before showing org/admin features (see navigation guards).
- Billing logic checks billing_disabled before charging (true = exempt from billing).

## Permissions & Security
- profiles RLS restricts updates to owner; admin/service_role may perform billing updates.
- Stripe webhooks (when added) must use service_role and filter by user id/email.

## Integration Points
- Auth/signup uses membershipType selection (free/pro) but currently mocks payment.
- Org membership uses membership_status values employee/org_admin to gate org surfaces.
- Expert membership: When experts publish their first course, billing_disabled=true stops billing. When they unpublish their last course, Stripe subscription status determines if billing resumes.

## Invariants
- membership_status must reflect real billing state; do not grant access without updating this field.
- billing_period_end should be set on subscription start/renewal; used to expire access if implemented.
- Stripe IDs must remain consistent per user; do not recreate customer unnecessarily.
- billing_disabled=true exempts user from billing regardless of subscription status.
- Expert publish/unpublish changes billing_disabled but does NOT cancel Stripe subscriptions.
- Org members (org_id set) are exempt from expert membership billing changes.

## Failure Modes & Recovery
- Access granted after expiration: ensure billing_period_end checked where relevant; add cron to set inactive if past due (not present yet).
- Missing Stripe IDs: regenerate customer in Stripe and update profile.
- Incorrect status after webhook failure: reconcile profile status with Stripe subscription manually.
- Expert still billed after course publish: check billing_disabled=true; if false, run upgradeExpertMembership().
- Expert membership not reverting on unpublish: check hasActiveStripeSubscription() result; Stripe API failure defaults to no subscription (trial fallback).

## Expert Membership Integration

Expert membership changes are handled by `src/lib/expert-membership.ts`:

### Upgrade (First Course Published)
| User State | Action |
|------------|--------|
| Trial (`membership_status='trial'`) | Set `membership_status='active'`, `billing_disabled=true` |
| Paid (has Stripe subscription) | Set `billing_disabled=true` (stops billing, keeps subscription) |
| Org member (`org_id` set) | No change |

### Downgrade (Last Course Unpublished)
| User State | Action |
|------------|--------|
| Has active Stripe subscription | Set `billing_disabled=false` (resumes billing) |
| No Stripe subscription | Set `membership_status='trial'`, `billing_disabled=false` |
| Org member (`org_id` set) | No change |

### Key Behaviors
- Stripe subscriptions are NOT cancelled on downgrade; only billing_disabled changes
- Stripe API is queried during downgrade via `hasActiveStripeSubscription()`
- If Stripe API fails, conservative fallback assumes no subscription (returns to trial)
- author_status always stays 'approved'; only membership benefits change

## Testing Checklist
- Manually set membership_status=active; confirm gated surfaces unlock (dashboard, courses).
- Set membership_status=inactive; ensure org/admin features are hidden/blocked.
- Update billing_period_end to past date and simulate expiration logic if implemented.

## Change Guide
- When implementing Stripe webhooks: add secure endpoint, verify signatures, update profiles, and add prod SQL for status changes.
- If adding seats/org billing, extend profiles/org tables and RLS accordingly.
- Keep membership_status enum in sync across schema, UI checks, and docs.

## Implementation Guidance

**Primary Agent**: Backend Agent (Stripe webhooks, profile updates, subscription state)

**Skills to Use**:
- `/doc-discovery` — Load auth-accounts and organization-membership docs before modifying billing logic
- `/plan-lint` — Validate changes to profiles schema or membership_status handling
- `/test-from-docs` — Verify access gating based on membership_status values

**Key Invariants**:
- profiles contains Stripe identifiers and membership_status; these are the single source of truth for access gating
- billing_period_end must be maintained on subscription updates to enforce expirations
- membership_status enum values: trial, active, inactive, employee, org_admin; UI must gate by these values

**Related Workflows**: docs/workflows/subscription-lifecycle.md (if exists)

## Related Docs
- docs/features/auth-accounts.md
- docs/features/organization-membership.md
- docs/features/experts.md (expert membership upgrade/downgrade)
- docs/workflows/Expert_Workflow.md (expert membership state machine)
