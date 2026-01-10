---
id: organization-membership
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /org/*
    - /auth/join-org
    - Org collection editors
  collections:
    - org-collections (virtual)
data:
  tables:
    - public.organizations
    - public.profiles
    - public.user_collections (is_org_collection)
    - public.employee_groups
    - public.employee_group_members
    - public.content_assignments
  storage: []
backend:
  actions:
    - src/app/org/*
    - src/components/org/OrgCollectionEditor.tsx
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Create org collections via OrgCollectionEditor; verify user_collections rows with org_id/is_org_collection=true.
  staging:
    - Join org flow updates profiles.org_id and membership_status=employee; org collections become visible.
invariants:
  - profiles.org_id and membership_status drive org scoping; RLS on org collections and groups requires org match.
  - Org collections flagged by is_org_collection=true; policies permit org_admin manage, members view.
  - employee_groups and content_assignments are org-scoped; assignee lookups must respect org_id.
---

## Overview
Organization Membership manages multi-tenant access, org-scoped collections, teams/groups, and content assignments. A user’s `profiles.org_id` and `membership_status` determine visibility and permissions for org resources.

## User Surfaces
- `/org/collections` and `/org/collections/[id]` for creating/editing org collections.
- Org dashboards/pages under `/org/*`.
- Join-org acceptance flow.

## Core Concepts & Objects
- **Organization**: `organizations` row; slug used for invites.
- **Org member**: profile with org_id set and membership_status employee/org_admin.
- **Org collection**: user_collections row with org_id and is_org_collection=true.
- **Employee group**: grouping of org members (`employee_groups`, `employee_group_members`).
- **Assignment**: content_assignments rows targeting user/group/org.

## Data Model
- `organizations`: id, slug unique, name, created_at.
- `profiles`: org_id FK, membership_status enum, role.
- `user_collections`: org_id nullable, is_org_collection bool; RLS allows org_admin manage, members view.
- `employee_groups`: org_id FK; RLS allows org_admin manage.
- `employee_group_members`: group_id/user_id; RLS enforces org membership via join.
- `content_assignments`: org_id, assignee_type(user|group|org), assignee_id, content_type/id, assignment_type(required/recommended); RLS allows org_admin manage; members view own assignments.

Write paths:
- OrgCollectionEditor upserts user_collections with org_id/is_org_collection.
- Group creation/membership and assignments via org actions (when implemented).
- Join-org flow updates profiles.org_id/membership_status.

Read paths:
- MainCanvas shows org collections when activeCollectionId=org-collections.
- RLS enables org members to select org collections/items.

## Permissions & Security
- RLS: org collections view/manage limited to matching org_id and membership_status employee/org_admin; groups/assignments similarly scoped.
- Service-role should not be used without org filters; prefer auth client to avoid leakage.

## Integration Points
- Billing: org_admin membership_status ties to org subscription (when billing implemented).
- Collections: org collections behave like user collections but scoped to org_id; collection_items inherit via FK.
- Assignments may drive required learning lists in dashboards.

## Invariants
- org_id consistency across profiles, collections, groups, and assignments; cross-org access must not be allowed.
- is_org_collection must be set for org-scoped collections; otherwise RLS may block members.
- membership_status must be set to employee/org_admin for org access; trial/active individual should not see org collections.

## Failure Modes & Recovery
- Member cannot see org collections: verify profiles.org_id matches collection org_id and membership_status is employee/org_admin.
- Org collection edit denied: ensure user is org_admin per profiles.membership_status.
- Assignment visibility missing: check RLS filters and assignee_type/id correctness.

## Testing Checklist
- Update profile to org_admin, create org collection via editor; confirm row has org_id/is_org_collection and is visible to employee member.
- Add employee to group; ensure employee_group_members row exists and matches org.
- Create content_assignment targeting a group; verify org_admin can read, employee in group can read.

## Change Guide
- Adding org roles: extend membership_status/role enums and update RLS policies accordingly.
- Changing collection RLS: adjust policies in schema and mirror in docs; regression-test org vs personal collections.
- If adding org-level billing, ensure org_id is enforced in all admin/service-role operations.

## Implementation Guidance

**Primary Agent**: Backend Agent (org RLS, profiles.org_id, org collections, groups, assignments)
**Secondary Agent**: Frontend Agent (org UI, collection editors, join flow)

**Skills to Use**:
- `/doc-discovery` — Load membership-billing and collections-and-context docs before modifying org access
- `/plan-lint` — Validate RLS policies for org_id scoping and membership_status checks
- `/test-from-docs` — Verify org collection visibility and cross-org isolation

**Key Invariants**:
- org_id consistency across profiles, collections, groups, and assignments; cross-org access must not be allowed
- is_org_collection must be set for org-scoped collections; otherwise RLS may block members
- membership_status must be set to employee/org_admin for org access

**Related Workflows**: docs/workflows/org-onboarding.md (if exists)

## Related Docs
- docs/features/membership-billing.md
- docs/features/collections-and-context.md
- docs/features/dashboard.md
