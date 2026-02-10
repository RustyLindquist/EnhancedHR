---
id: app-shell
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-27
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
- Global top panels (dropdown panels that slide down from top, e.g., Assessment Panel, Help Panel).

## Portal Pattern for Modals and Panels

Several components use React Portals (`createPortal`) to render at document body level, ensuring proper z-index stacking and full viewport coverage regardless of where they are instantiated in the component tree.

### GlobalTopPanel (Slide-Down Panels)
- **Location**: `/src/components/GlobalTopPanel.tsx`
- **Purpose**: Provides slide-down panels that overlay the main content from the top
- **Uses Portal**: Yes, renders to `document.body`
- **Animation Pattern**: Uses double `requestAnimationFrame` delay to ensure CSS transitions work when component mounts with `isOpen=true`
- **State Management**:
  - `mounted`: Tracks if component is client-side mounted (for SSR safety)
  - `internalIsOpen`: Controls actual panel position, allows animation on mount
  - `shouldRender`: Controls portal lifecycle, stays true during close animation
- **Why This Matters**: When a panel mounts already open (e.g., auto-opening Assessment Panel when selecting a quiz lesson), the component must first render in the closed state, then transition to open. The double rAF ensures the browser paints the closed state before animating to open.

### DeleteConfirmationModal
- **Location**: `/src/components/DeleteConfirmationModal.tsx`
- **Purpose**: Confirmation dialog for destructive actions
- **Uses Portal**: Yes, renders to `document.body`
- **Why Portal**: Ensures the backdrop covers the full viewport in pages where the canvas area is constrained (Expert Console, Admin Console)

### DropdownPanel
- **Location**: `/src/components/DropdownPanel.tsx`
- **Purpose**: Wrapper for slide-down dropdown panels (wraps GlobalTopPanel)
- **Uses Portal**: Indirectly via GlobalTopPanel

### When to Use Portal Pattern
Use portals when:
1. Component needs to escape parent stacking context (z-index issues)
2. Modal/overlay needs to cover full viewport regardless of where component is rendered
3. Component is rendered inside a constrained container but needs to appear "above" everything

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

## Browser Back Button Integration

The app shell includes `NavigationProvider` (via `Providers.tsx`) which enables browser back button interception for in-app navigation. This allows same-URL navigation (like Dashboard collection switching) to respond to the browser back button.

See `docs/features/browser-back-navigation.md` for full documentation including:
- When to use `useBackHandler` hook vs direct `registerBackHandler`
- Two navigation patterns (URL-based vs same-URL)
- Edge cases handled (SSR, rapid presses, direct URL entry)

## Invariants
- System collection aliases must stay in sync with collections feature.
  - Changing labels requires updates in NavigationPanel/MainCanvas/collections utilities.
- collection:refresh must be fired after any collection mutation to keep nav counts correct.
- Drag/drop must supply correct item type for collection actions.
- Global panels (GlobalTopPanel, modals) must use React Portals to render at document body level for proper z-index stacking.
- Slide-down panels that may mount with `isOpen=true` must use double `requestAnimationFrame` delay to ensure animation works (see GlobalTopPanel pattern).
- NavigationProvider must wrap all app content for browser back button interception to work.

## Failure Modes & Recovery
- Nav counts stale: ensure collection:refresh dispatched; verify getCollectionCountsAction runs.
- Wrong view rendered: check activeCollectionId propagation from query/nav click.
- Drag/drop no-op: ensure onDrop handlers call addToCollection with correct ids.
- Panel animation not working (appears instantly instead of sliding): Ensure panel uses the double `requestAnimationFrame` pattern in GlobalTopPanel; check that `internalIsOpen` state is being used for the CSS transition, not the `isOpen` prop directly.
- Modal backdrop not covering full viewport: Ensure component uses `createPortal(content, document.body)` to escape parent stacking contexts.

## Testing Checklist
- Switch between Academy, Favorites, Conversations, Tools, Help; views render correctly and AI panel context changes.
- Drag a course card to Favorites portal; course saved and appears in Favorites view; counts update.
- Fire collection:refresh (e.g., after AI save); nav counts refresh without reload.

## Change Guide
- Adding new nav items: update MAIN_NAV_ITEMS in constants.ts, add rendering branch in MainCanvas, and add nav visibility filter in NavigationPanel.tsx if role-gated (see my-org pattern in docs/features/my-organization-hub.md).
- Modifying drag/drop: keep onDrop handlers consistent with collection action signatures.
- If refactoring layout, preserve event wiring for collection refresh and active collection state.

## Implementation Guidance

**Primary Agent**: Frontend Agent (layout, navigation, MainCanvas, drag-drop, collection events)

**Skills to Use**:
- `/doc-discovery` — Load collections-and-context and dashboard docs before modifying shell behavior
- `/plan-lint` — Validate collection alias consistency across nav and canvas
- `/test-from-docs` — Verify navigation, drag-drop, and collection refresh events

**Key Invariants**:
- MainCanvas is the hub rendering collection views; activeCollectionId must be propagated from nav/query
- System collection aliases must stay in sync with collections feature
- collection:refresh must be fired after any collection mutation to keep nav counts correct

**Related Workflows**: docs/workflows/navigation-flow.md (if exists)

## Related Docs
- docs/features/collections-and-context.md
- docs/features/dashboard.md
- docs/features/browser-back-navigation.md - Browser back button interception for in-app navigation
- docs/features/my-organization-hub.md - My Organization hub (virtual collection pattern example)
