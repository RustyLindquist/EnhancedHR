---
id: my-organization-hub
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-02-09
surfaces:
  routes:
    - /dashboard?collection=my-org
  collections:
    - my-org (virtual)
data:
  tables:
    - public.profiles (org_id, membership_status, role)
    - public.organizations
    - public.user_collections (is_org_collection -- for collection count)
    - public.courses (org_id -- for hasOrgCourses check)
  storage: []
backend:
  actions:
    - src/components/org/MyOrganizationHub.tsx (hub component)
    - src/components/MainCanvas.tsx (virtual collection routing)
    - src/components/NavigationPanel.tsx (nav visibility filter)
    - src/app/actions/org-courses.ts (hasPublishedOrgCourses)
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Click My Organization in left nav; hub page renders with visible cards based on role.
    - As employee, verify Analytics card is hidden; Users & Groups, Org Collections, and Assigned Learning visible.
    - As org_admin, verify all 5 cards visible including Analytics and Organization Courses.
    - Click a hub card; verify navigation to the correct collection or route.
  staging:
    - Verify my-org nav item hidden for individual users (no org_id).
    - Verify org-courses card hidden for employees when no published courses exist.
invariants:
  - my-org is a virtual collection; MainCanvas renders MyOrganizationHub directly (no collection_items fetch).
  - Nav visibility for my-org requires employee, org_admin, or admin role/membership_status on profiles.
  - Hub card visibility is computed per-render from isOrgAdmin and hasOrgCourses props; no server-side gating.
  - All org hub card types must use the glassy transparent style and be included in the isOrgHubCard array in UniversalCard.tsx.
---

## Overview

The My Organization Hub is a centralized landing page for all organization-scoped features. It replaces the previous expandable "My Organization" section in the left navigation sidebar with a single top-level nav item (`my-org`) that renders an interactive card grid inside MainCanvas.

## User Surfaces

- **Left nav**: "My Organization" item (Building icon) appears after Dashboard, before Academy. Visible only to org members.
- **MainCanvas**: When `activeCollectionId === 'my-org'`, renders `MyOrganizationHub` component.
- **Hub cards**: 5 feature cards displayed as a responsive grid or list depending on `viewMode`.

## Core Concepts & Objects

### Virtual Collection Pattern

`my-org` follows the same "virtual collection" pattern used by `dashboard`, `tools`, `help`, and `academy`. These are nav items that:

1. Are defined in `MAIN_NAV_ITEMS` in `src/constants.ts`
2. Have a dedicated rendering branch in MainCanvas
3. Do not fetch `collection_items` from the database
4. Render a custom component instead of the standard card grid

### Hub Card Types

| Card | CardType | Accent Color | Icon | Visibility Rule |
|------|----------|-------------|------|----------------|
| Users and Groups | `USERS_GROUPS` | Cyan | `Users` | All org members |
| Analytics | `ORG_ANALYTICS` | Purple | `TrendingUp` | `isOrgAdmin` only |
| Organization Courses | `ORG_COURSE` | Amber | `BookOpen` | `isOrgAdmin` OR `hasOrgCourses` |
| Org Collections | `ORG_COLLECTION` | Blue | `Building` | All org members |
| My Assigned Learning | `ASSIGNED_LEARNING` | Emerald | `ClipboardList` | All org members |

### Hub Card Navigation

Cards navigate in two ways:

1. **Collection selection** (most cards): Calls `onSelectCollection(collectionId)`. Used by: `users-groups`, `org-analytics`, `org-collections`, `assigned-learning`.
2. **Route navigation** (Organization Courses): `window.location.href = '/org-courses'` for full page navigation.

### isOrgHubCard Flag (UniversalCard)

In `UniversalCard.tsx`, `isOrgHubCard` controls two behaviors:

1. **Glassy background**: `bg-white/[0.03] backdrop-blur-xl` instead of standard gradient backgrounds.
2. **Hidden type label header**: The card type pill is hidden via `{!isOrgHubCard && (...)}`.

### Glassy Card Styling

All 5 org hub card types share this style in `cardTypeConfigs.ts`:

- `headerColor: 'bg-transparent'`
- `bodyColor: 'bg-black/25'`
- `barColor: 'bg-transparent'`
- Unique `borderColor` and `labelColor` per card for accent differentiation

## Data Model

The hub stores no data. It aggregates from other features:

| Data | Source | Passed As |
|------|--------|-----------|
| Org member count | `getOrgMemberCountAction()` in dashboard page.tsx | `orgMemberCount` prop |
| Org collection count | `orgCollections.length` from MainCanvas state | `orgCollectionsCount` prop |
| Is org admin | `checkIsOrgAdmin()` in dashboard page.tsx | `isOrgAdmin` prop |
| Has published org courses | `hasPublishedOrgCourses(orgId)` in dashboard page.tsx | `hasOrgCourses` prop |

## Permissions & Security

### Nav Visibility

In `NavigationPanel.tsx`, `my-org` is filtered to require `employee`, `org_admin`, or `admin` role/membership_status.

### Card Visibility

Client-side, computed per-render in `MyOrganizationHub.tsx`:

- **Users & Groups**: All org members
- **Analytics**: `isOrgAdmin` only
- **Organization Courses**: `isOrgAdmin || hasOrgCourses`
- **Org Collections**: All org members
- **Assigned Learning**: All org members

## Change Guide

### Adding a New Hub Card

1. Add the new type to `CardType` union in `cardTypeConfigs.ts`
2. Add config to `CARD_TYPE_CONFIGS` with glassy style (transparent header/bar, `bg-black/25` body)
3. Update `getTypeDisplayLabel`, `getTypeIcon`, `getTypeGlowColor` helper maps
4. Add the type to `isOrgHubCard`, `isTextHeavy`, and `isClickableCard` arrays in `UniversalCard.tsx`
5. Add item to `allItems` in `MyOrganizationHub.tsx` with visibility logic
6. Wire navigation (collection-based or route-based)
7. If dynamic data needed, add props through `dashboard/page.tsx` → `MainCanvas` → `MyOrganizationHub`

### Changing Card Visibility

Modify the `visible` property in `MyOrganizationHub.tsx`'s `allItems` array.

### Changing Card Styling

- Single card accent: modify `borderColor` and `labelColor` in `cardTypeConfigs.ts`
- Shared glassy style: modify the `isOrgHubCard` conditional in `UniversalCard.tsx`

## Related Docs
- docs/features/app-shell.md
- docs/features/organization-membership.md
- docs/features/org-courses.md
- docs/features/collections-and-context.md
- docs/features/dynamic-groups.md
