---
id: sales-console
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-02-07
surfaces:
  routes:
    - /sales/*
    - /sales/leads
  collections: []
data:
  tables:
    - public.profiles (is_sales boolean)
    - public.demo_leads (claimed_by UUID FK to profiles)
  storage: []
backend:
  actions:
    - src/app/actions/leads.ts (getLeads, updateLeadStatus, updateLeadNotes, getLeadOwners)
    - src/app/actions/users.ts (updateSalesStatus)
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Toggle is_sales=true on a profile, verify /sales route is accessible.
    - Toggle is_sales=false, verify redirect to /dashboard.
    - As admin (role='admin'), verify /sales is accessible regardless of is_sales.
    - Submit a demo lead via the marketing form, verify it appears in /sales/leads with status='new'.
    - Change a lead's status, verify claimed_by is set to the current user's ID.
    - Verify lead owner filter shows correct tallies and filters leads.
    - Verify admin_notes can be saved and persist across reload.
  staging:
    - Verify RLS policies allow sales users to SELECT and UPDATE demo_leads.
    - Verify non-sales, non-admin users cannot access demo_leads data.
invariants:
  - Sales Console access requires is_sales=true OR profiles.role='admin'.
  - Changing a lead's status always sets claimed_by to the current user (auto-claiming).
  - updateLeadStatus and updateLeadNotes require authentication (auth guard).
  - Lead data is fetched via createAdminClient() to bypass RLS; auth is checked separately via createClient().
  - SALES_NAV_ITEMS in constants.ts is the single source of truth for Sales Console navigation.
  - Sales Console reuses the same LeadsTable component as Admin Console (/admin/leads).
---

## Overview

The Sales Console is a dedicated workspace for sales team members to manage demo request leads. It provides a muted orange-themed sidebar and lead management tools. Access is gated by the `is_sales` boolean on profiles or by admin role.

## User Surfaces

- `/sales` -- Redirects to `/sales/leads`
- `/sales/leads` -- Lead management table with status tracking, notes, claiming, and owner filtering
- Profile menu in NavigationPanel shows "Sales Console" link with amber TrendingUp icon (visible only to sales users and admins)

## Core Concepts

### Sales User
A user with `profiles.is_sales = true`. Toggled via Admin Console > Users > Roles & Permissions panel.

### Lead Claiming
When any user (sales or admin) changes a lead's status, `claimed_by` is automatically set to that user's ID. There is no explicit "claim" button -- claiming happens implicitly through status changes. The server action returns `claimed_by` + `claimed_by_name` for optimistic UI update.

### Lead Owner Filtering
The leads table provides a filter dropdown with:
- "Open Leads" (default) -- shows unclaimed leads (claimed_by IS NULL)
- "All Leads" -- shows all leads
- Per-owner entries with live tally counts (e.g., "Jane Smith (5)")

## Data Model

### profiles additions
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| is_sales | boolean | false | Grants access to Sales Console |

Migration: `supabase/migrations/20260206000001_add_is_sales.sql`

### demo_leads additions
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| claimed_by | UUID (FK profiles) | null | The user who owns this lead |

Migration: `supabase/migrations/20260206000002_add_leads_claimed_by.sql`

### RLS Policies
- "Sales users can view all leads" -- SELECT for profiles.is_sales=true
- "Sales users can update leads" -- UPDATE for profiles.is_sales=true
- Admin policies already exist; PostgreSQL RLS uses OR semantics so they coexist.

## Architecture

### Layout Pattern
```
/sales/layout.tsx         -- Server: auth check (is_sales || admin), wraps in SalesPageLayout
  SalesPageLayout.tsx     -- Client: NavigationPanel + CanvasHeader + content
    NavigationPanel.tsx   -- Receives customNavItems={SALES_NAV_ITEMS}
```

### Sidebar Theme
Gradient: `from-[#3D2E1A] to-[#1A1208]` (muted orange/brown), passed as className to NavigationPanel.

### Server Action Pattern (Dual Client)
Server actions use `createClient()` for auth verification and `createAdminClient()` for DB operations:
```typescript
const authClient = await createClient();
const { data: { user } } = await authClient.auth.getUser();
if (!user) return { success: false, error: 'Authentication required' };
const supabase = createAdminClient(); // bypasses RLS for DB ops
```

## Change Guide

- **Adding Sales Console pages**: Add route under `/sales/`, add nav item to `SALES_NAV_ITEMS` in constants.ts
- **Changing access control**: Update `/sales/layout.tsx` AND NavigationPanel profile menu condition
- **Adding lead fields**: Update demo_leads schema (migration), DemoLead interface in leads.ts, LeadsTable component
- **Changing claiming behavior**: Modify `updateLeadStatus()` in leads.ts

## Related Docs

- docs/features/admin-portal.md (Admin Users table, sales toggle)
- docs/features/membership-billing.md (billing_disabled, profile fields)
- docs/features/app-shell.md (NavigationPanel, layout patterns)
