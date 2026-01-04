---
id: dashboard
owner: product-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /dashboard
  collections:
    - dashboard (virtual)
data:
  tables:
    - public.courses
    - public.conversations
    - public.user_collections
    - public.collection_items
    - public.user_progress
  storage: []
backend:
  actions:
    - src/app/actions/courses.ts (fetchCoursesAction)
    - src/app/actions/collections.ts (getCollectionCountsAction)
    - src/app/actions/tools.ts (fetchToolsAction)
ai:
  context_scopes:
    - DASHBOARD
    - PLATFORM
  models:
    - google/gemini-2.0-flash-001
tests:
  local:
    - Load /dashboard; verify courses render, collection counts load, and AI panel responds.
  staging:
    - Switch collections via nav; confirm main canvas updates and counts refresh.
invariants:
  - Dashboard uses MainCanvas with activeCollectionId from query param; selection drives displayed content and AI scope.
  - getCollectionCountsAction must be called with user.id and uses admin client but must scope to that user.
  - ensureSystemCollections must run per user before counts to avoid missing system collections.
---

## Overview
Dashboard is the primary in-app hub that loads courses, collections, counts, and the AI panel. It coordinates navigation state with MainCanvas and NavigationPanel, ensuring system/custom collections exist and counts are accurate.

## User Surfaces
- `/dashboard` main layout with left navigation, MainCanvas content, right AI panel.
- Collection selection via nav or query param switches MainCanvas view.
- Add-to-collection modal and collection surface available from dashboard.

## Core Concepts & Objects
- **Active collection**: selected collection id controls MainCanvas rendering and AI scope.
- **Collection counts**: aggregated counts of items per collection from getCollectionCountsAction.
- **Dashboard widgets**: courses list, prompts, stats depending on active view.

## Data Model
- Courses, conversations, collection_items, user_collections, user_progress are read to populate views.
- Counts computed server-side: courses (collection_items), context items, conversations, certifications, notes.

Write paths:
- None unique to dashboard; delegates to collection/note/conversation actions triggered from UI.

Read paths:
- fetchCoursesAction loads courses; ensureSystemCollections + fetchUserCollections populate navigation; getCollectionCountsAction loads counts; fetchToolsAction loads tools for Tools view.

## Permissions & Security
- All server actions use authenticated user and admin client for counting but filter by user_id; no cross-user data should leak.
- Navigation should hide org/admin/author surfaces unless role/membership permits (checked via profile).

## Integration Points
- Collections: dashboard is host surface for collections feature.
- AI: AIPanel on dashboard uses ContextResolver with DASHBOARD/PLATFORM scope.
- Tools and Courses views are routed via collection selection.

## Invariants
- ensureSystemCollections must run before rendering nav to guarantee system collections exist.
- Collection counts action must resolve duplicate system collections to the oldest row.
- Active collection must be propagated to AIPanel for correct context scope.

## Failure Modes & Recovery
- Counts zero/incorrect: check getCollectionCountsAction user_id parameter and RLS; run cleanupDuplicateCollectionsAction if duplicates.
- Navigation shows missing collections: ensure ensureSystemCollections succeeded; check user_collections rows.
- AI panel irrelevant context: verify ContextResolver receives pageContext type DASHBOARD/PLATFORM.

## Testing Checklist
- Load dashboard as new user: system collections created and visible; counts load without errors.
- Switch to Favorites collection: MainCanvas shows saved courses; counts update.
- Open AI panel and ask a question: response uses platform scope and includes personal context.

## Change Guide
- Changing nav items or collection aliases requires updating constants and collections alias maps.
- Adding widgets that depend on new data: ensure server actions include required tables and respect RLS.
- If adding caching for counts, invalidate on collection:refresh event.

## Related Docs
- docs/features/collections-and-context.md
- docs/features/ai-context-engine.md
