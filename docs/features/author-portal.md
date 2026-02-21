---
id: author-portal
owner: learning-engineering
status: active
stability: evolving
last_updated: 2026-01-27
surfaces:
  routes:
    - /author/*
    - /author/resources (Expert Resources - see expert-resources.md)
    - /teach
  collections:
    - expert-resources (platform-wide, managed by platform admins)
data:
  tables:
    - public.profiles (author_status, author_bio)
    - public.courses
    - public.course_proposals
    - public.expert_credentials
  storage: []
backend:
  actions:
    - src/app/actions/expert-application.ts
    - src/app/actions/expert-course-builder.ts
    - src/app/actions/proposals.ts
    - src/app/actions/course-builder.ts
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Access /author as pending expert; verify Expert Console access granted.
    - Access /author as rejected expert; verify Expert Console access granted.
    - Create course as pending expert; verify course creation succeeds.
  staging:
    - Submit course proposal as pending expert; confirm row inserted.
    - Admin publishes first course for pending expert; verify auto-approval to 'approved'.
invariants:
  - profiles.author_status enum (none/pending/approved/rejected) governs visibility, NOT access.
  - Pending, approved, AND rejected experts can all access the Expert Console (/author/*).
  - Pending, approved, AND rejected experts can all create courses and submit proposals.
  - Auto-approval triggers when first course is published (pending → approved).
  - course_proposals/expert_credentials tied to profile id; authors can manage only their own data.
  - Courses authored by any expert (regardless of status) should reference author_id = profiles.id.
---

## Overview
Author Portal (Expert Console) supports course creation and management for all experts regardless of approval status. Pending, approved, and rejected experts can all access the portal and build courses. The key distinction is visibility: only approved experts with published courses appear on the public /experts page. Approval happens automatically when an admin publishes the expert's first course.

## User Surfaces
- `/teach` landing to start becoming an expert.
- `/author/*` pages (Expert Console) for managing proposals, credentials, and authored courses.
- Accessible to ALL expert statuses: pending, approved, and rejected.

## Course Building Features

### Quiz Builder
Experts can create quiz assessments for lessons using the integrated Quiz Builder:
- **Location**: Expert Lesson Editor Panel (ExpertLessonEditorPanel.tsx)
- **Access**: Select "Quiz" as the lesson type to reveal the Quiz Builder UI
- **Features**:
  - Set passing score (0-100%, optional) - note: this does NOT gate lesson completion
  - **Import Questions from Excel**: Upload .xlsx/.xls spreadsheet to bulk-add questions (see `docs/features/quiz-import.md`)
  - Add/remove questions with text input
  - Add/remove answer options per question (minimum 2)
  - Mark correct answer (one per question)
  - Add optional explanation per question (shown after submission)
  - Reorder questions with up/down arrows

See `docs/features/course-player-and-progress.md` for quiz data model and behavior details.
See `docs/features/quiz-import.md` for quiz import feature details.

### Drag-and-Drop Lesson Reordering
Experts can reorder lessons within and between modules using drag-and-drop:
- **Location**: Expert Course Builder (ExpertCourseBuilderClient.tsx)
- **Library**: @dnd-kit (core, sortable, utilities)
- **Features**:
  - **Drag Handle**: Full-width blue bar at top of lesson cards, appears on hover, shows "Drag to Reorder" text with grip icons
  - **Within-Module Reorder**: Drag lessons to reposition within the same module
  - **Cross-Module Move**: Drag lessons between different expanded modules
  - **Empty Module Drop**: Empty modules accept drops via the "Add Lesson" button which transforms into a drop target during drag
  - **Optimistic Updates**: UI updates immediately during drag; reverts on error
- **Server Actions** (with permission checks via `checkExpertCourseAccess()`):
  - `reorderExpertLessons(lessonIds: string[], courseId: number)` - Batch reorder lessons within a module
  - `moveExpertLessonToModule(lessonId, targetModuleId, courseId, newOrder?)` - Move lesson to different module
  - `reorderExpertModules(moduleIds: string[], courseId: number)` - Batch reorder modules within a course
- **Technical Details**:
  - Custom collision detection prioritizes add-lesson buttons, then module zones, then closest-center for lesson-to-lesson
  - Unique drop zone IDs: `add-lesson-drop-${moduleId}` vs `module-drop-${moduleId}` to avoid conflicts
  - Components: `SortableLessonCard`, `LessonDragOverlay`, `DroppableModuleZone`, `DroppableAddLessonButton`

## Core Concepts & Objects
- **Expert Console**: The /author/* routes where experts build and manage courses.
- **Pending Expert**: New expert who clicked "Become an Expert" but doesn't have a published course yet.
- **Approved Expert**: Expert whose first course has been published by admin.
- **Rejected Expert**: Expert whose application was rejected; can still access Expert Console.
- **Author application/proposal**: course_proposals rows keyed to profile.
- **Expert credentials**: expert_credentials rows storing author qualifications.

## Data Model
- `profiles`: author_status enum ('none' | 'pending' | 'approved' | 'rejected'), author_bio, linkedin_url.
- `course_proposals`: id uuid PK, user_id FK profiles, course details fields, created_at.
- `expert_credentials`: id uuid PK, user_id FK profiles, credential fields.
- `courses`: author_id FK profiles; status text (draft/published etc).

Write paths:
- `becomeExpert()` sets author_status='pending' (NOT 'approved').
- Pending/approved/rejected experts can create courses and submit proposals.
- Course publish action auto-approves expert on first published course.

Read paths:
- Expert Console pages list proposals and authored courses; filter by user_id.
- Route guards check author_status IN ('pending', 'approved', 'rejected').

## Permissions & Security
- Expert Console access: author_status must be 'pending', 'approved', OR 'rejected' (NOT 'none').
- RLS on proposals/credentials restricts to owner; admin may have elevated access.
- Course creation allowed for ALL expert statuses (pending/approved/rejected).
- Proposal submission allowed for ALL expert statuses.

## Integration Points
- Academy uses courses authored by approved authors with published courses.
- Payout reporting references courses.author_id and profiles.author_status.
- Course builder contains auto-approval logic for first course publish.
- Navigation panel shows Expert Console link for all expert statuses.

## Expert Console Access Rules

```
┌─────────────────────────────────────────────────────────────────┐
│                   EXPERT CONSOLE ACCESS                         │
├─────────────────────────────────────────────────────────────────┤
│  author_status  │  Can Access   │  Can Create   │  On /experts  │
│                 │  Expert Console  Courses       │  Page         │
├─────────────────┼───────────────┼───────────────┼───────────────┤
│  'none'         │      NO       │      NO       │      NO       │
│  'pending'      │     YES       │     YES       │      NO       │
│  'approved'     │     YES       │     YES       │  YES (if pub) │
│  'rejected'     │     YES       │     YES       │      NO       │
└─────────────────────────────────────────────────────────────────┘
```

## Invariants
- Expert Console access requires author_status != 'none' (pending/approved/rejected all allowed).
- Course creation and proposal submission allowed for all expert statuses except 'none'.
- Auto-approval: First course publish changes pending → approved automatically.
- Approval is permanent: course unpublish doesn't revert approved → pending.
- course_proposals and expert_credentials must reference the same user_id as profiles.id.
- Course author_id should remain stable; reassigning requires business approval.

## Failure Modes & Recovery
- **Expert cannot access portal**: Check author_status is not 'none'. Any other status should grant access.
- **Pending expert can't create course**: Verify route guards allow pending status; check expert-course-builder.ts.
- **Auto-approval didn't trigger**: Verify this was the FIRST published course; check course-builder.ts.
- **Proposal not visible**: Verify user_id matches auth.uid() and row exists.
- **Course missing author info**: Ensure author_id set and profile exists.

## Testing Checklist
- [ ] As user with author_status='none', /author → should redirect/block.
- [ ] Click "Become an Expert" → author_status='pending'.
- [ ] As pending expert, access /author → should succeed.
- [ ] As pending expert, create course → should succeed.
- [ ] As pending expert, submit proposal → should succeed.
- [ ] As rejected expert, access /author → should succeed.
- [ ] As rejected expert, create course → should succeed.
- [ ] Admin publishes pending expert's first course → author_status auto-changes to 'approved'.
- [ ] Unpublish approved expert's only course → should remain 'approved'.

## Change Guide
- **Changing Expert Console access**: Update route guards in src/app/author/layout.tsx, page.tsx, and courses/[id]/builder/page.tsx.
- **Changing course creation permissions**: Update src/app/actions/expert-course-builder.ts.
- **Changing proposal permissions**: Update src/app/actions/proposals.ts.
- **Changing auto-approval logic**: Update src/app/actions/course-builder.ts publish action.
- **Adding approval workflow**: Modify auto-approval or add manual approval step.

## Related Docs
- docs/features/academy.md
- docs/features/experts.md
- docs/features/expert-resources.md
- docs/features/admin-portal.md
- docs/workflows/Expert_Workflow.md
- docs/workflows/expert-author-workflows.md
