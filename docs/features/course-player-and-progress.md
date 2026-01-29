---
id: course-player-and-progress
owner: learning-engineering
status: active
stability: evolving
last_updated: 2026-01-28
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
  - Quiz passing score does NOT gate lesson completion; learners receive credit regardless of score.
  - Quiz explanations are only shown AFTER submission in legacy QuizPlayer. In AssessmentPanel, feedback is shown immediately per question.
  - Each quiz question must have exactly one correct answer marked.
  - Assessment Panel provides immediate per-question feedback (correct/incorrect indicator) unlike the legacy QuizPlayer which showed all feedback after submission.
---

## Overview
Course player surfaces course/module/lesson content, tracks per-lesson progress, and exposes resources and notes within the player. Progress is persisted in Supabase so the dashboard and collections reflect learning state. Assessments (quizzes) are recorded per lesson, providing knowledge checks without gating completion.

## Quiz/Assessment System

### Quiz Data Model
Quiz data is stored in the `lessons.quiz_data` JSONB column with the following structure:

```typescript
interface QuizData {
  questions: QuizQuestion[];
  passingScore: number;  // 0-100 percentage, default 80
}

interface QuizQuestion {
  id: string;           // Unique identifier (q_timestamp_random)
  text: string;         // The question text
  options: QuizOption[];
  explanation?: string; // Optional explanation shown after submission
}

interface QuizOption {
  id: string;           // Unique identifier
  text: string;         // The option text
  isCorrect: boolean;   // Only one option per question should be true
}
```

### Key Behaviors

**Passing Score Does NOT Gate Completion**
- The passing score is purely for learner self-assessment
- Learners receive lesson completion credit regardless of their quiz score
- This supports the recertification model where attempting is what matters, not passing

**Explanations**
- Optional per-question explanations can be added by course creators
- Explanations are shown AFTER the learner submits their answers
- Used to reinforce concepts or explain why the correct answer is right

**Retry Behavior**
- Learners can retry quizzes as many times as they like
- Each attempt is recorded in `user_assessment_attempts`
- Lesson completion is triggered on first submission, regardless of score

### Quiz Builder
Course creators (Admins, Org Admins, and Experts) can build quizzes using the QuizBuilder component:
- **Location**: `src/components/admin/QuizBuilder.tsx`
- **Available in**: Admin Course Builder, Org Course Builder, Expert Course Builder
- **Features**:
  - Set passing score (0-100%)
  - Add/remove questions
  - Add/remove answer options (minimum 2 per question)
  - Mark correct answer (radio behavior - one per question)
  - Helper text "Check the circle next to the correct answer" guides creators
  - Add optional explanations per question
  - Reorder questions with up/down arrows

### Quiz Player (Legacy)
The legacy QuizPlayer component is still available but has been superseded by the Assessment Panel:
- **Location**: `src/components/QuizPlayer.tsx`
- **Features**:
  - Displays questions with selectable options
  - Validates all questions answered before submission
  - Shows score and pass/fail status after submission
  - Displays explanations for each question
  - Retry button to attempt again

### Assessment Panel (Current)
The Assessment Panel is the primary interface for taking quizzes, using a slide-down dropdown UI:
- **Location**: `src/components/assessment/`
- **Components**:
  - `AssessmentPanel.tsx` - Main panel wrapping DropdownPanel with assessment state management
  - `AssessmentPlaceholder.tsx` - Placeholder shown in video player area when quiz lesson is selected
  - `AssessmentQuestionView.tsx` - Single question display with immediate feedback after answer selection
  - `AssessmentProgressDots.tsx` - Clickable navigation dots showing progress through questions
  - `AssessmentCompletionScreen.tsx` - Score display with pass/fail styling, animations, and navigation
  - `AssessmentConfirmDialog.tsx` - Save/discard confirmation when closing mid-assessment
  - `index.ts` - Barrel export for all components

**Key Behaviors**:
- Quiz lessons show `AssessmentPlaceholder` in the video player area instead of a video
- Clicking "Start Assessment" opens `AssessmentPanel` as a slide-down dropdown from the top
- **Immediate Feedback**: Users see correct/incorrect immediately after selecting each answer
- **Progress Persistence**: Closing mid-assessment offers Save/Discard options via confirm dialog
- **Navigation**: Clickable progress dots allow jumping between questions; dots show answered status
- **Completion Screen**: Shows animated score with pass/fail styling (green glow for pass, red for fail)
- **Auto-Open**: When a quiz lesson is selected in CoursePageV2, the assessment panel auto-opens

**Animation Details**:
- Uses `DropdownPanel` which wraps `GlobalTopPanel` for the slide-down animation
- Custom CSS animations in `globals.css`: `scale-in`, `green-glow`, `celebrate`, `count-up`, `dot-pulse`

**Integration with CoursePageV2**:
- State managed in `CoursePageV2.tsx` via `assessmentPanelOpen`, `assessmentProgress`, and `savedAssessmentProgress`
- `LessonPlayerSection.tsx` renders `AssessmentPlaceholder` for quiz lessons instead of video player
- Quiz completion triggers lesson completion and navigation to next lesson

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
- `courses`: id identity PK, title/author/categories (TEXT[])/description/image_url/duration/rating/badges/status/collections. Note: Legacy `category` field deprecated; use `categories` array.
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
- Select a quiz lesson: AssessmentPlaceholder appears instead of video, Assessment Panel auto-opens with slide-down animation.
- Answer a question in Assessment Panel: immediate feedback shows (green check/red X) without needing to submit.
- Close Assessment Panel mid-quiz: confirm dialog appears; Save preserves progress, Discard resets.
- Resume saved assessment: progress dots reflect answered questions, can navigate between questions.
- Complete assessment: completion screen shows animated score, pass/fail styling, and "Continue to Next Lesson" button.

## Change Guide
- Changing progress semantics (per course vs per lesson): adjust unique constraint and update writers/readers accordingly; migration required.
- Adding watch-time tracking (Mux): extend user_progress.view_time_seconds updates; ensure idempotent writes.
- Course schema changes: update fetchers and player components; keep FK cascade behavior intact.
- Integrate progress into course cards: add server/client mapping from user_progress aggregates; document in this feature and Collections doc.

## Implementation Guidance

**Primary Agent**: Backend Agent (progress writes, RLS, Mux tracking)
**Secondary Agent**: Frontend Agent (player UI, progress indicators)

**Skills to Use**:
- `/doc-discovery` — Understand coupling with credits, certificates, collections
- `/plan-lint` — Validate progress model changes
- `/test-from-docs` — Generate regression tests for progress tracking

**Key Invariants**:
- Progress writes are authoritative; never delete without migration plan
- Unique constraint on (user_id, lesson_id) must be respected
- Assessment attempts belong to authenticated user only

**Related Workflows**: `docs/workflows/individual-user-workflows.md` (Course Completion)

## Related Docs
- docs/features/collections-and-context.md
- docs/features/ai-context-engine.md
- docs/features/app-shell.md (portal pattern and GlobalTopPanel for Assessment Panel)
- supabase/migrations/20251230000002_add_module_description.sql (module metadata)
- supabase/migrations/20251227000004_create_notes.sql (notes used in player)
