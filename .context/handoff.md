# Session Handoff

<!-- This file is automatically updated at the end of each work session -->
<!-- Use /handoff to generate a new handoff note -->

## Last Session

**Date**: 2026-02-07
**Branch**: RustyLindquist/memphis-v1
**Status**: Complete — All work pushed and merged (PR #271)

## Quick Resume

```
/session-start
```

---

## Summary

Built the Sales Console (new user type, dedicated console, lead claiming with owner filtering), hardened the billing system (Stripe race condition fix, checkout guards, middleware bypass, webhook protection), and performed a 7-item pre-launch security audit with all findings resolved.

## Work Completed

### 1. Billing Disabled Enhancement
- `updateBillingDisabled` in users.ts: Cancels Stripe subscription FIRST, then updates DB in one atomic write (billing_disabled + clear stripe fields + trial→active conversion)
- Checkout routes reject billing_disabled users with 403
- Middleware bypasses upgrade redirect for billing_disabled users
- Webhook handler skips status updates for billing_disabled users

### 2. Sales User Type
- Added `is_sales` boolean to profiles (migration 20260206000001)
- "Sales Account" toggle in Admin Console > Users > Roles & Permissions
- `updateSalesStatus` server action

### 3. Sales Console
- `/sales/*` routes with muted orange sidebar (`from-[#3D2E1A] to-[#1A1208]`)
- Auth: `is_sales` OR `role === 'admin'`
- Profile menu link with amber TrendingUp icon
- Reuses LeadsTable component from admin

### 4. Lead Claiming System
- `claimed_by` UUID FK on demo_leads (migration 20260206000002)
- Auto-claim on status change with optimistic UI update
- Owner filter dropdown: Open Leads (default), All Leads, per-person with tallies
- RLS policies for sales users (SELECT + UPDATE)

### 5. Pre-Launch Audit (7 Fixes)
1. Auth guard on `updateLeadStatus()` — returns error if unauthenticated
2. Optimistic `claimed_by` update in LeadsTable after status change
3. Stripe race condition — cancel before DB update, fail if Stripe fails
4. `billing_disabled` check on both checkout routes
5. Auth guard on `updateLeadNotes()`
6. Middleware fetches `billing_disabled`, bypasses upgrade redirect
7. `is_sales` added to settings/account page profile query

### Files Modified (18)

| File | Change |
|------|--------|
| `src/app/actions/leads.ts` | Lead CRUD with claiming, auth guards, owner queries |
| `src/app/actions/users.ts` | Sales toggle, billing disabled hardening, lazy Stripe import |
| `src/app/admin/leads/LeadsTable.tsx` | Owner filter, optimistic claimed_by update |
| `src/app/admin/leads/page.tsx` | Pass owners prop |
| `src/app/admin/users/UsersTable.tsx` | Sales Account toggle |
| `src/app/api/stripe/checkout/route.ts` | billing_disabled guard |
| `src/app/api/stripe/checkout-org/route.ts` | billing_disabled guard |
| `src/app/settings/account/page.tsx` | is_sales in query |
| `src/components/NavigationPanel.tsx` | Sales Console link |
| `src/components/SalesPageLayout.tsx` | NEW: Sales layout |
| `src/constants.ts` | SALES_NAV_ITEMS |
| `src/lib/membership.ts` | billing_disabled webhook check |
| `src/proxy.ts` | billing_disabled middleware bypass |
| `src/app/sales/layout.tsx` | NEW: Sales auth layout |
| `src/app/sales/page.tsx` | NEW: Redirect to /sales/leads |
| `src/app/sales/leads/page.tsx` | NEW: Sales leads page |
| `supabase/migrations/20260206000001_add_is_sales.sql` | NEW |
| `supabase/migrations/20260206000002_add_leads_claimed_by.sql` | NEW |

## Documentation Updated

| Doc | Change |
|-----|--------|
| `docs/features/sales-console.md` | NEW: Complete Sales Console feature doc |
| `docs/features/FEATURE_INDEX.md` | Added Sales Console entry |
| `docs/features/membership-billing.md` | Added billing hardening invariants and backend actions |
| `docs/features/admin-portal.md` | Added sales toggle, leads management references |
| `MEMORY.md` (auto memory) | Key patterns: Stripe import, console layout, dual client, RLS |

## Context to Remember

- **Lazy Stripe imports**: Never top-level `import stripe` in server actions — crashes Turbopack when env var missing
- **Console layout pattern**: NAV_ITEMS in constants.ts → PageLayout.tsx → layout.tsx → NavigationPanel link
- **Dual client pattern**: `createClient()` for auth, `createAdminClient()` for DB ops in server actions
- **RLS OR semantics**: Multiple policies on same table coexist (admin + sales both work)
- **Dev server freeze**: Clear `.next` cache if Turbopack hangs

## Next Steps

1. Test all features on production after deploy
2. Verify migrations run cleanly on production Supabase
3. Consider adding more Sales Console pages (dashboard, analytics) as needed
4. Consider explicit "unclaim" functionality if sales workflow requires it
