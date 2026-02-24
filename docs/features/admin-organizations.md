# Admin Organizations

## Overview

Platform admins can view, create, and manage organizations from the Admin Console at `/admin/organizations`. The feature includes a list view, create org flow, and per-org detail page that embeds the existing org portal via iframe.

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/admin/organizations` | List | All orgs with member counts |
| `/admin/organizations/[id]` | Detail | Admin header + embedded org portal |

All routes inherit the platform admin check from `/admin/layout.tsx`.

## Key Components

| Component | Path | Role |
|-----------|------|------|
| `OrganizationsList` | `src/components/admin/OrganizationsList.tsx` | Table of orgs (name, type, counts, date) |
| `OrgAdminHeader` | `src/components/admin/OrgAdminHeader.tsx` | Back button, org name/badge, action buttons |
| `CreateOrgModal` | `src/components/admin/CreateOrgModal.tsx` | Form: name, account type, owner search |
| `TransferOwnershipModal` | `src/components/admin/TransferOwnershipModal.tsx` | Search org members, select new owner |
| `OrganizationsListPage` | `src/app/admin/organizations/OrganizationsListPage.tsx` | Client wrapper for list + create modal state |
| `OrgDetailPage` | `src/app/admin/organizations/[id]/OrgDetailPage.tsx` | Client wrapper for header + portal + delete/transfer modals |

## Server Actions (`src/app/actions/admin-orgs.ts`)

All actions call `requirePlatformAdmin()` which checks `profiles.role === 'admin'`.

| Action | Purpose |
|--------|---------|
| `fetchAllOrgs()` | List all orgs with admin/employee counts and owner names |
| `fetchOrgById(orgId)` | Single org detail |
| `createOrganization({name, account_type, owner_id})` | Create org + assign owner (validates owner has no existing org) |
| `updateOrgAccountType(orgId, accountType)` | Toggle trial/paid (validates input) |
| `deleteOrganization(orgId)` | Reset member profiles, then delete org (FK cascades handle related data) |
| `transferOrgOwnership(orgId, newOwnerId)` | Update owner_id, validates new owner is org member |
| `fetchUsersWithoutOrg()` | Users with no org (for owner picker in create flow) |
| `fetchOrgMembers(orgId)` | Org members with emails (for transfer picker) |

## Database Changes

Migration `20260224000001_add_org_account_type.sql`:
- Adds `account_type text NOT NULL DEFAULT 'trial'` to `organizations`
- Check constraint: `account_type IN ('trial', 'paid')`

## Access Control

- Routes: Guarded by `/admin/layout.tsx` (redirects non-admins to `/dashboard`)
- Server actions: Each calls `requirePlatformAdmin()` before executing
- Uses `createAdminClient()` (service role key) to bypass RLS

## Org Detail — Embedded Portal

The detail page sets `platform_admin_selected_org` cookie to the URL param org ID, then renders an iframe to `/org?embedded=true`. This reuses the entire org portal without component extraction.

## Known Limitations

- `listUsers()` in `fetchUsersWithoutOrg` and `fetchOrgMembers` has default pagination (~50 users). For larger user bases, emails may be missing for some users.
- The iframe approach provides clean isolation but does not update the browser URL on internal navigation.
- `fetchAllOrgs` loads all profiles to count members (O(n) on total org users). An aggregate RPC would scale better.

## Related Files

- `src/constants.ts` — `ADMIN_NAV_ITEMS` array (Organizations entry)
- `src/app/admin/layout.tsx` — Admin auth guard
- `src/lib/supabase/admin.ts` — `createAdminClient()` for RLS bypass
- `src/lib/org-context.ts` — `getOrgContext()` reads the `platform_admin_selected_org` cookie
- Design doc: `docs/plans/2026-02-24-admin-organizations-design.md`
- Implementation plan: `docs/plans/2026-02-24-admin-organizations-plan.md`
