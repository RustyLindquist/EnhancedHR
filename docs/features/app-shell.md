---
id: app-shell
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /dashboard (layout)
  collections: []
data:
  tables:
    - public.user_collections
    - public.collection_items
  storage: []
backend:
  actions:
    - src/components/MainCanvas.tsx
    - src/components/NavigationPanel.tsx
    - src/lib/collection-events.ts
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Navigate between collections via nav; confirm MainCanvas switches views and collection surface drag/drop works.
  staging:
    - Trigger collection:refresh event (e.g., save item); nav counts update without reload.
invariants:
  - MainCanvas is the hub rendering collection views; activeCollectionId must be propagated from nav/query.
  - NavigationPanel expects system/custom collections with stable labels; counts map alias keys.
  - collection:refresh event must be listened to for count updates; ensure listeners cleaned on unmount.
---

## Overview
The App Shell provides the persistent layout, navigation, and main content canvas for the in-app experience. It coordinates collection selection, drag-and-drop saving, and hosts global panels (AI, help, onboarding).

## User Surfaces
- Left NavigationPanel listing collections, tools, help.
- MainCanvas central area rendering the active collection/course/tool view.
- Global panels (AI panel, help panel, onboarding modal).

## Core Concepts & Objects
- **Active collection id**: drives what MainCanvas renders and AI context scope.
- **Collection surface**: bottom portals for drag/drop saving.
- **Collection refresh events**: broadcast updates to counts/nav.

## Data Model
- user_collections and collection_items provide data for nav lists and counts (via collection counts action).

Write paths:
- Drag/drop or add-to-collection actions invoked from MainCanvas/CollectionSurface.
- collection-events dispatch refresh events after mutations.

Read paths:
- NavigationPanel and MainCanvas fetch collections, items, and counts via actions/hooks.

## Permissions & Security
- All data fetches respect RLS through auth client; admin client used in counts action with user_id scoping.
- UI should hide org/admin entries unless permitted (profile role/org membership).

## Integration Points
- Collections feature for saving items.
- AI panel uses active collection to set ContextResolver scope.
- Help panel/help collection accessible from nav.

## Invariants
- System collection aliases must stay in sync with collections feature.
  - Changing labels requires updates in NavigationPanel/MainCanvas/collections utilities.
- collection:refresh must be fired after any collection mutation to keep nav counts correct.
- Drag/drop must supply correct item type for collection actions.

## Failure Modes & Recovery
- Nav counts stale: ensure collection:refresh dispatched; verify getCollectionCountsAction runs.
- Wrong view rendered: check activeCollectionId propagation from query/nav click.
- Drag/drop no-op: ensure onDrop handlers call addToCollection with correct ids.

## Testing Checklist
- Switch between Academy, Favorites, Conversations, Tools, Help; views render correctly and AI panel context changes.
- Drag a course card to Favorites portal; course saved and appears in Favorites view; counts update.
- Fire collection:refresh (e.g., after AI save); nav counts refresh without reload.

## Change Guide
-.adding new nav items: update constants and ensure MainCanvas handles the collection id.
- Modifying drag/drop: keep onDrop handlers consistent with collection action signatures.
- If refactoring layout, preserve event wiring for collection refresh and active collection state.

## Related Docs
- docs/features/collections-and-context.md
- docs/features/dashboard.md
