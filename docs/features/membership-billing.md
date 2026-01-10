---
id: membership-billing
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /settings/billing
    - /login (plan selection during signup mock)
  collections: []
data:
  tables:
    - public.profiles
  storage: []
backend:
  actions:
    - (payments handled via Stripe client/server integration; not yet implemented in repo code)
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Verify profiles has stripe_customer_id/stripe_subscription_id/stripe_price_id fields and membership_status updates as expected after manual changes.
  staging:
    - (When Stripe wired) create checkout, return, and confirm membership_status set to active.
invariants:
  - profiles contains Stripe identifiers and membership_status; these are the single source of truth for access gating.
  - billing_period_end must be maintained on subscription updates to enforce expirations.
  - membership_status enum values: trial, active, inactive, employee, org_admin; UI must gate by these values.
---

## Overview
Membership & Billing tracks subscription state using fields on `profiles` and Stripe identifiers. While checkout/portal flows are not fully implemented in this repo, membership_status and Stripe IDs gate access to paid features and org roles.

## User Surfaces
- Billing settings page (placeholder) and plan selectors on login/signup.
- Access gating across app surfaces based on profiles.membership_status.

## Core Concepts & Objects
- **Membership status**: enum on profiles controlling access (trial, active, inactive, employee, org_admin).
- **Stripe linkage**: stripe_customer_id, stripe_subscription_id, stripe_price_id, billing_period_end on profiles.

## Data Model
- `profiles`: membership_status, billing_period_end, stripe_* fields.

Write paths:
- Not fully implemented; expected via Stripe webhooks or server actions to update profile status and billing_period_end.

Read paths:
- Gating logic in UI/server actions checks membership_status/org role before showing org/admin features (see navigation guards).

## Permissions & Security
- profiles RLS restricts updates to owner; admin/service_role may perform billing updates.
- Stripe webhooks (when added) must use service_role and filter by user id/email.

## Integration Points
- Auth/signup uses membershipType selection (free/pro) but currently mocks payment.
- Org membership uses membership_status values employee/org_admin to gate org surfaces.

## Invariants
- membership_status must reflect real billing state; do not grant access without updating this field.
- billing_period_end should be set on subscription start/renewal; used to expire access if implemented.
- Stripe IDs must remain consistent per user; do not recreate customer unnecessarily.

## Failure Modes & Recovery
- Access granted after expiration: ensure billing_period_end checked where relevant; add cron to set inactive if past due (not present yet).
- Missing Stripe IDs: regenerate customer in Stripe and update profile.
- Incorrect status after webhook failure: reconcile profile status with Stripe subscription manually.

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
