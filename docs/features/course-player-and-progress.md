---
id: course-player-and-progress
owner: learning-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /dashboard?collection=academy
    - /courses/[id] (CoursePageV2 within MainCanvas)
    - In-player right panel (notes, AI)
  collections:
    - academy
data:
  tables:
    - public.courses
    - public.modules
    - public.lessons
    - public.user_progress
    - public.user_assessment_attempts
    - public.resources
  storage: []
backend:
  actions:
    - src/lib/courses.ts
    - src/app/actions/courses.ts (searchLessonsAction)
    - src/app/actions/notes.ts (notes in player)
ai:
  context_scopes:
    - COURSE
    - PERSONAL_CONTEXT
  models: []
tests:
  local:
    - Open a course, play a lesson, mark progress; verify UI updates and user_progress row exists/updates.
  staging:
    - Complete a lesson and reload; progress should persist, and course card should reflect saved state.
invariants:
  - user_progress uniqueness on (user_id, lesson_id) enforced by constraint; writes must respect this.
  - lessons.module_id and modules.course_id FKs must be intact; deleting course cascades to modules/lessons.
  - Course player saves progress per lesson (is_completed/last_accessed/view_time_seconds); course card is_saved depends on collections, not progress.
  - user_assessment_attempts rows are owned by user_id; insert only by owner.
---

## Overview
Course player surfaces course/module/lesson content, tracks per-lesson progress, and exposes resources and notes within the player. Progress is persisted in Supabase so the dashboard and collections reflect learning state. Assessments are recorded per lesson.

## User Surfaces
- Academy collection view (course cards show saved state and ratings).
- Course detail/player inside MainCanvas (legacy CourseHomePage/CoursePlayer or CoursePageV2).
- In-player panels for notes and AI assistant/tutor.

## Core Concepts & Objects
- **Course**: `courses` row with modules/lessons/resources.
- **Module/Lesson**: hierarchical content; lesson is the unit of progress.
- **Progress**: `user_progress` row per (user, lesson) storing completion, last_accessed, view_time_seconds.
- **Assessment attempt**: `user_assessment_attempts` rows track quiz/assessment per lesson.

## Data Model
- `courses`: id identity PK, title/author/category/description/image_url/duration/rating/badges/status/collections.
- `modules`: uuid PK, course_id FK, order/title/duration.
- `lessons`: uuid PK, module_id FK, order/title/type/video_url/content/quiz_data.
- `user_progress`: uuid PK, user_id (profiles) FK, course_id FK, lesson_id FK, is_completed bool, last_accessed timestamptz, view_time_seconds int; unique (user_id, lesson_id).
- `resources`: course resources list.
- `user_assessment_attempts`: per user/lesson scores + responses.

Write paths:
- Progress updates occur via client actions (legacy fetchCourseModules or course player logic) writing to user_progress (insert/update).
- Assessments insert rows into user_assessment_attempts.

Read paths:
- fetchCourses (src/lib/courses.ts) fetches courses; progress integration pending (progress default 0).
- searchLessonsAction searches lessons.
- MainCanvas course render uses course data and progress placeholders.

## Permissions & Security
- RLS: courses/modules/lessons are public SELECT; user_progress/assessment_attempts enforce auth.uid() = user_id for SELECT/INSERT/UPDATE.
- Any server action updating progress must use auth client and user_id filter; admin client should not bypass ownership.

## Integration Points
- Collections: course save state (isSaved) driven by collection_items, not progress; course cards may show saved badge independently.
- AI course assistant/tutor uses ContextResolver COURSE scope to retrieve embeddings for the active course plus personal context.
- Notes: course player allows note creation linked to course_id; stored in notes table and can be added to collections.

## Invariants
- Do not create multiple user_progress rows for the same (user, lesson); honor unique constraint.
- course_id on progress must match lesson.module.course_id; keep consistency when moving lessons across modules.
- Progress writes should update last_accessed and optionally view_time_seconds; missing updates lead to stale dashboards.
- Assessment attempts belong to the authenticated user; never insert for another user.

## Failure Modes & Recovery
- Duplicate progress rows error 23505: upsert with user_id+lesson_id to merge; clean duplicates manually if already present.
- Stale progress after course edit: verify lesson_id continuity; if lessons were replaced, consider migrating progress rows.
- Progress not visible: ensure RLS not blocking (auth session present) and user_progress row exists; check Supabase logs.

## Testing Checklist
- Play a lesson (or trigger progress save): verify user_progress row created/updated with last_accessed timestamp.
- Mark lesson complete and reload course: lesson should appear completed; row is_completed=true.
- Submit an assessment: ensure user_assessment_attempts row inserted with score/passed flags.
- Add a note in player: note appears in notes table and can be added to a collection.

## Change Guide
- Changing progress semantics (per course vs per lesson): adjust unique constraint and update writers/readers accordingly; migration required.
- Adding watch-time tracking (Mux): extend user_progress.view_time_seconds updates; ensure idempotent writes.
- Course schema changes: update fetchers and player components; keep FK cascade behavior intact.
- Integrate progress into course cards: add server/client mapping from user_progress aggregates; document in this feature and Collections doc.

## Related Docs
- docs/features/collections-and-context.md
- docs/features/ai-context-engine.md
- supabase/migrations/20251230000002_add_module_description.sql (module metadata)
- supabase/migrations/20251227000004_create_notes.sql (notes used in player)
