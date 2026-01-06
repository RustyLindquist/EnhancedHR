---
id: dynamic-groups
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-06
surfaces:
  routes:
    - /dashboard (Users & Groups collection)
    - UsersAndGroupsCanvas
  collections:
    - users-and-groups (org admin only)
data:
  tables:
    - public.employee_groups (extended with dynamic columns)
    - public.profiles
    - public.user_progress
    - public.conversations
    - public.conversation_messages
    - public.user_streaks
    - public.user_credits_ledger
    - public.user_collections
  storage: []
backend:
  actions:
    - src/app/actions/dynamic-groups.ts
    - src/app/actions/dynamic-groups-types.ts
    - src/app/actions/groups.ts (extended)
  api: []
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Login as org admin, navigate to Users & Groups collection
    - Verify 5 default dynamic groups are displayed with purple styling
    - Click a dynamic group; verify members computed and displayed
    - Click "Edit Criteria" on Most Active group; adjust threshold; verify members update
    - Verify dynamic groups do NOT have "Assign Content" option
  staging:
    - Seed dynamic groups for a test org; verify 5 groups created
    - Add user activity; verify dynamic group membership reflects activity
    - Edit criteria via DynamicGroupCriteriaPanel; verify member list updates
invariants:
  - Dynamic group members are NEVER stored in employee_group_members table
  - Dynamic groups are view-only; they do NOT support content assignments
  - Purple styling differentiates dynamic groups from custom groups
  - Criteria panel renders at MainCanvas root level for proper fixed positioning
  - Dynamic groups are org-scoped; RLS and server actions enforce org_id matching
  - Threshold-based scoring uses 0-100 scale
---

## Overview

Dynamic Groups are automatically-populated employee segments based on real-time activity criteria, giving org admins powerful insights into user populations without manual group management.

**Success looks like**: Org admins can instantly identify active users, inactive users, top learners, and high-engagement employees without manually curating group membership.

## User Surfaces

- **Users & Groups Canvas** (`UsersAndGroupsCanvas`): Two-section layout with custom groups and dynamic groups
- **Group Detail Canvas** (`GroupDetailCanvas`): Shows computed members and "Edit Criteria" button
- **Dynamic Group Criteria Panel** (`DynamicGroupCriteriaPanel`): Panel for adjusting criteria

## Core Concepts

- **Dynamic Group**: An `employee_groups` row with `is_dynamic=true` and `dynamic_type` set
- **Dynamic Types** (5 pre-seeded per org):
  1. **Recent Logins**: Users active in last N days (default: 30)
  2. **No Logins**: Users inactive for N+ days (default: 30)
  3. **Most Active**: Top users by combined activity metrics (threshold-based)
  4. **Top Learners**: Top users by learning metrics (threshold-based)
  5. **Most Talkative**: Top users by AI conversation activity (threshold-based)
- **Threshold Scoring**: Each metric normalized 0-100; users with score >= threshold included
- **On-Demand Computation**: `computeDynamicGroupMembers()` queries activity tables

## Data Model

### Schema Extension (Migration 20250106000001)

```sql
ALTER TABLE employee_groups ADD COLUMN is_dynamic BOOLEAN DEFAULT false;
ALTER TABLE employee_groups ADD COLUMN dynamic_type TEXT CHECK (dynamic_type IN (
  'recent_logins', 'no_logins', 'most_active', 'top_learners', 'most_talkative'
));
ALTER TABLE employee_groups ADD COLUMN criteria JSONB DEFAULT '{}';
ALTER TABLE employee_groups ADD COLUMN last_computed_at TIMESTAMPTZ;

CREATE INDEX idx_employee_groups_dynamic ON employee_groups(org_id, is_dynamic) WHERE is_dynamic = true;
```

### Tables Queried

| Dynamic Type | Tables Queried |
|--------------|----------------|
| recent_logins | profiles, user_progress, conversations, user_streaks |
| no_logins | profiles, user_progress, conversations, user_streaks |
| most_active | profiles, user_progress, user_streaks, user_collections |
| top_learners | profiles, user_progress, user_credits_ledger |
| most_talkative | profiles, conversations, conversation_messages |

## Permissions & Security

- Dynamic groups respect existing `employee_groups` RLS policies
- `computeDynamicGroupMembers()` uses `createAdminClient()` for org-scoped queries
- All queries filter by `org_id` to prevent cross-org leakage
- Dynamic groups excluded from content assignment flows

## Integration Points

- **Organization Membership**: Dynamic groups are org-scoped
- **Users & Groups Collection**: Appear alongside custom groups
- **Group Cards**: Purple styling for dynamic groups
- **Panel Management**: Criteria panel hoisted to MainCanvas root

## Invariants

1. Dynamic group members are NEVER written to `employee_group_members`
2. `computeDynamicGroupMembers()` MUST be called for current members
3. Dynamic groups MUST use purple styling
4. Dynamic groups MUST NOT support content assignments
5. All queries MUST filter by `org_id`
6. Threshold-based groups include users with score >= threshold (0-100)
7. `DynamicGroupCriteriaPanel` MUST render at MainCanvas root level

## Change Guide

### Adding a New Dynamic Group Type

1. Add type to `dynamic_type` CHECK constraint
2. Add criteria interface to `dynamic-groups-types.ts`
3. Add query builder in `dynamic-groups.ts`
4. Add case to `computeDynamicGroupMembers()` switch
5. Update `seed_dynamic_groups_for_org()` SQL function
6. Update `DynamicGroupCriteriaPanel` for new type

## Related Docs

- `docs/features/organization-membership.md`
- `docs/features/FEATURE_INDEX.md`
- `docs/workflows/org-admin-workflows.md`
