---
id: course-ai
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - Course player right AI panel
    - Course assistant/tutor modes in MainCanvas
  collections: []
data:
  tables:
    - public.ai_system_prompts
    - public.course_embeddings (legacy)
    - public.unified_embeddings
  storage: []
backend:
  actions:
    - src/lib/ai/context-resolver.ts
    - src/lib/ai/context.ts
    - src/app/api/chat/route.ts
    - src/app/api/chat/stream/route.ts
ai:
  context_scopes:
    - COURSE
    - PERSONAL_CONTEXT
  models:
    - google/gemini-2.0-flash-001
tests:
  local:
    - Open a course, ask assistant a question; response should reference course content.
  staging:
    - Switch to tutor mode (if UI toggle present), ask skill-building question; confirm course_id used in scope (check logs).
invariants:
  - ai_system_prompts must contain agent_type entries for course_assistant and course_tutor; uniqueness enforced.
  - ContextResolver COURSE scope sets allowedCourseIds=[course_id] and includePersonalContext=true by default.
  - match_unified_embeddings must filter to course content via allowedCourseIds; course_id must be set on embeddings.
---

## Overview
Course AI provides course-aware Assistant and Tutor modes that answer questions using the active course content plus the user’s personal context. It relies on course-specific RAG scope and dedicated system prompts.

## User Surfaces
- Right-side AI panel inside course player.
- Tutor/Assistant mode toggle (where implemented) within course view.

## Core Concepts & Objects
- **Course Assistant/Tutor**: agents defined in ai_system_prompts with tailored prompts/models.
- **Course scope**: RAG scope restricted to the active course and personal context.

## Data Model
- `ai_system_prompts`: agent_type entries (course_assistant, course_tutor) with system_instruction/model.
- `unified_embeddings`: course embeddings (migrated from course_embeddings) with course_id set.
- `course_embeddings` (legacy) used by context.ts for match_course_embeddings fallback.

Write paths:
- None unique; prompts edited via admin portal; embeddings generated via course ingestion/migration.

Read paths:
- Chat endpoints load prompts by agent_type, resolve COURSE scope, call match_unified_embeddings or match_course_embeddings (legacy).

## Permissions & Security
- Prompts editable by admin only; RLS enforces admin role.
- Chat endpoints require authenticated user; scope includes userId for personal context.

## Integration Points
- Course-player-and-progress supplies course id to AI panel.
- Personal context is always included; insights may be saved via chat stream pipeline.
- Collections: saving conversations to collections uses collections feature.

## Invariants
- COURSE scope must include allowedCourseIds; without it, AI may pull unrelated content.
- course embeddings must have course_id set; otherwise scope filter fails.
- Personal context inclusion should remain default to personalize responses.

## Failure Modes & Recovery
- Responses ignore course: check allowedCourseIds passed to match_unified_embeddings; ensure course embeddings exist.
- Tutor/Assistant prompt wrong: verify ai_system_prompts rows and agent_type mapping in UI.
- Missing embeddings: run ingestion to populate unified_embeddings/course_embeddings for the course.

## Testing Checklist
- Ask “What did this course say about X?” inside course; response cites course content.
- Toggle modes (assistant/tutor) and observe tone/behavior change per prompts.
- Save conversation to collection; ensure conversation saved with context for later resume.

## Change Guide
- Changing models/prompts: update ai_system_prompts rows; ensure agentType mapping in UI and chat endpoints.
- Migrating fully to unified_embeddings: remove match_course_embeddings usage once all courses embedded.
- Adding tutor diagnostics: extend metadata in chat request and prompts; keep scope logic unchanged.

## Related Docs
- docs/features/course-player-and-progress.md
- docs/features/ai-context-engine.md
