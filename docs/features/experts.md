---
id: experts
owner: product-engineering
status: active
stability: evolving
last_updated: 2026-01-22
surfaces:
  routes:
    - /experts
    - /experts/[id]
    - /author/* (Expert Console)
  collections: []
data:
  tables:
    - public.profiles (author_status, author_bio, linkedin_url)
    - public.courses (author_id, status)
    - public.expert_credentials
  storage: []
backend:
  actions:
    - src/app/actions/expert-application.ts
    - src/app/actions/course-builder.ts (auto-approval logic)
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Open /experts; verify expert list pulled from profiles with author_status='approved' AND at least one published course.
    - Click "Become an Expert"; verify author_status set to 'pending'.
    - As pending expert, verify access to /author (Expert Console).
  staging:
    - Open expert detail page; courses authored by that expert are listed.
    - Publish a pending expert's first course; verify auto-approval to 'approved'.
invariants:
  - author_status must be 'approved' AND have at least one published course to appear on /experts page.
  - Pending, approved, AND rejected experts can all access the Expert Console (/author/*).
  - Auto-approval triggers when admin publishes an expert's FIRST course (author_status changes from 'pending' to 'approved').
  - Once approved, expert stays approved even if courses are unpublished later.
  - courses.author_id must match profiles.id; profile must exist.
  - expert_credentials tied to user_id for additional detail.
---

## Overview
Experts feature manages the expert registration flow and public expert directory. Experts register via "Become an Expert", start with `author_status='pending'`, can immediately access the Expert Console to build courses, and are automatically approved when their first course is published by an admin. The public /experts page shows only approved experts who have at least one published course.

## User Surfaces
- **Public expert directory** (`/experts`): Cards for approved experts with published courses.
- **Expert detail page** (`/experts/[id]`): Bio/credentials and course list.
- **Expert Console** (`/author/*`): Course building and management (accessible to pending/approved/rejected experts).
- **Account settings**: Shows expert status messaging (pending/approved/rejected).

## Core Concepts & Objects
- **Expert**: A user who has clicked "Become an Expert" (author_status != 'none').
- **Pending Expert**: New expert awaiting first course publication (author_status='pending'). Can access Expert Console.
- **Approved Expert**: Expert whose first course has been published (author_status='approved'). Visible on /experts page.
- **Rejected Expert**: Expert whose application was rejected (author_status='rejected'). Can still access Expert Console to try again.
- **Expert credentials**: Supplemental qualifications in expert_credentials table.
- **Authored courses**: Courses where author_id matches expert profile.

## Data Model
- `profiles`: author_status enum ('none' | 'pending' | 'approved' | 'rejected'), author_bio, linkedin_url fields.
- `courses`: author_id FK profiles, status ('draft' | 'published' | etc).
- `expert_credentials`: id uuid PK, user_id FK profiles, title/org/dates.

Write paths:
- `becomeExpert()` action sets author_status='pending' (in src/app/actions/expert-application.ts).
- Course publish action checks if first published course and auto-approves expert (in src/app/actions/course-builder.ts).
- Admin can manually change author_status.

Read paths:
- /experts page queries profiles WHERE author_status='approved' AND has published courses.
- Expert Console access checks author_status IN ('pending', 'approved', 'rejected').

## Permissions & Security
- Expert Console routes (/author/*) accessible to users with author_status in ('pending', 'approved', 'rejected').
- Public /experts listing shows only approved authors with published courses.
- expert_credentials select limited to relevant experts via RLS.
- Course creation and proposal submission allowed for pending/approved/rejected experts.

## Integration Points
- **Academy**: Shows author info on course cards; links to expert pages.
- **Author portal**: Manages course building, accessible to all expert statuses.
- **Course builder**: Contains auto-approval logic triggered on first course publish.
- **Navigation panel**: Shows Expert Console link for all expert statuses.
- **Account settings**: Displays expert status with appropriate messaging.

## Expert Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXPERT REGISTRATION FLOW (Updated)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. REGISTRATION                                                             │
│     User clicks "Become an Expert" anywhere in app                          │
│     └── author_status set to 'pending' (NOT 'approved')                     │
│     └── User immediately gains Expert Console access                        │
│                                                                              │
│  2. COURSE DEVELOPMENT (Pending State)                                       │
│     Pending expert can:                                                      │
│     └── Access Expert Console (/author/*)                                   │
│     └── Create and build courses                                            │
│     └── Submit course proposals                                              │
│     └── Upload content and manage drafts                                    │
│     Cannot:                                                                  │
│     └── Appear on public /experts page                                      │
│                                                                              │
│  3. AUTO-APPROVAL                                                            │
│     When admin publishes expert's FIRST course:                             │
│     └── System auto-changes author_status from 'pending' to 'approved'      │
│     └── Expert now appears on /experts page                                 │
│     └── No manual admin approval step required                              │
│                                                                              │
│  4. APPROVED STATE                                                           │
│     └── Visible on public /experts page                                     │
│     └── Full Expert Console access continues                                │
│     └── Status persists even if courses later unpublished                   │
│                                                                              │
│  5. REJECTION PATH (Edge Case)                                               │
│     If admin rejects an expert:                                             │
│     └── author_status = 'rejected'                                          │
│     └── Expert CAN still access Expert Console                              │
│     └── Expert can continue building courses and try again                  │
│     └── NOT visible on /experts page                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Invariants
- Only approved authors with published courses appear on /experts page.
- Pending/approved/rejected experts can ALL access Expert Console.
- Auto-approval only triggers on FIRST published course.
- Approved status is permanent (course unpublish doesn't revert to pending).
- Courses must maintain correct author_id; reassignment requires manual update.

## Failure Modes & Recovery
- **Expert missing from /experts list**: Verify author_status='approved' AND has at least one published course.
- **Expert can't access Expert Console**: Check author_status is not 'none'. All other statuses should have access.
- **Auto-approval didn't trigger**: Verify this was the FIRST published course for this expert; check course-builder.ts logic.
- **Course not showing under expert**: Ensure author_id set; course status may be non-published.

## Testing Checklist
- [ ] Click "Become an Expert" → verify author_status='pending' (not 'approved').
- [ ] As pending expert, access /author → should succeed.
- [ ] As pending expert, create course → should succeed.
- [ ] As pending expert, check /experts → should NOT appear in list.
- [ ] Admin publishes pending expert's first course → verify author_status auto-changes to 'approved'.
- [ ] Approved expert with published course → appears on /experts page.
- [ ] Unpublish the expert's only course → expert should remain 'approved'.
- [ ] As rejected expert, access /author → should succeed (can try again).

## Change Guide
- **Changing registration behavior**: Update src/app/actions/expert-application.ts becomeExpert().
- **Changing Expert Console access**: Update route guards in src/app/author/layout.tsx, page.tsx, and courses/[id]/builder/page.tsx.
- **Changing auto-approval logic**: Update src/app/actions/course-builder.ts publish action.
- **Changing public visibility rules**: Update /experts page query and this doc's invariants.

## Related Docs
- docs/features/author-portal.md
- docs/features/academy.md
- docs/workflows/Expert_Workflow.md
- docs/workflows/expert-author-workflows.md
