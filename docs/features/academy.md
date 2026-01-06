---
id: academy
owner: product-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /dashboard?collection=academy
    - Course list/search within MainCanvas
  collections:
    - academy
data:
  tables:
    - public.courses
    - public.modules
    - public.lessons
  storage: []
backend:
  actions:
    - src/app/actions/courses.ts (fetchCoursesAction, searchLessonsAction)
ai:
  context_scopes:
    - PLATFORM
    - COURSE (when selected)
  models: []
tests:
  local:
    - Load Academy view; confirm courses list renders and filters/search respond.
  staging:
    - Search lesson via searchLessonsAction; results include matching lessons and navigate correctly.
invariants:
  - fetchCoursesAction must ensure system collections exist and map saved state via collection_items.
  - Courses table is public read; status field may be used to filter (draft vs published).
  - searchLessonsAction should respect auth session and RLS when accessing lessons.
---

## Overview
Academy provides course discovery, search, and entry into course players. It lists courses with metadata, saved state, and supports lesson search.

## User Surfaces
- Academy collection in MainCanvas showing course cards with categories, ratings, badges.
- Search/filter controls, including lesson search via searchLessonsAction.
- Course selection opens course detail/player.

## Core Concepts & Objects
- **Course**: row in `courses` with metadata and badges.
- **Saved state**: course.isSaved and collections derived from collection_items.
- **Lesson search**: server action searching lessons to jump into specific lessons.

## Data Model
- `courses`: id, title, author, category, description, image_url, duration, rating, badges, status, created_at, collections (legacy).
- `modules` and `lessons`: course content structure.

Write paths:
- Courses seeded and managed via admin/author flows; Academy itself is read-only.

Read paths:
- fetchCoursesAction selects courses ordered by created_at; maps saved state via collection_items.
- searchLessonsAction queries lessons by title/content and returns matches.

## Permissions & Security
- RLS: courses/lessons/modules are public select; write restricted to admins.
- fetchCoursesAction uses auth client; saved state mapping joins collection_items via user_id.

## Integration Points
- Collections: course cards indicate isSaved and allow add/remove; collection actions update collection_items.
- Course player: selecting a course navigates to course-player-and-progress feature.
- AI: Platform/Course assistants use courses data for context.

## Invariants
- Saved state must rely on collection_items; courses.collections legacy array should not be source of truth.
- searchLessonsAction must not leak unpublished content; consider filtering status if draft should be hidden.
- Course id identity must remain stable; collection_items references course_id.

## Failure Modes & Recovery
- Courses not showing as saved: ensure collection_items rows exist and alias mapping in fetchCoursesAction is correct.
- Lesson search empty: check lessons table population and status filters.
- Draft courses visible unintentionally: apply status filter in fetchCoursesAction/UI.

## Testing Checklist
- View Academy, confirm list sorted by created_at and saved badges correct.
- Add course to Favorites; reload and ensure isSaved and collections include favorites.
- Run lesson search; clicking result opens corresponding lesson/course.

## Change Guide
- Adding categories/filters: extend query parameters and UI; ensure data present in courses.
- Changing course status semantics: update fetchCoursesAction to filter appropriately and adjust docs.
- If adding pagination, update tests and saved-state mapping.

## Related Docs
- docs/features/course-player-and-progress.md
- docs/features/collections-and-context.md
