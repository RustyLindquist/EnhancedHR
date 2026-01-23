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
    - public.profiles (author_status, author_bio, linkedin_url, membership_status, billing_disabled)
    - public.courses (author_id, status)
    - public.expert_credentials
  storage: []
backend:
  actions:
    - src/app/actions/expert-application.ts
    - src/app/actions/course-builder.ts (auto-approval + membership upgrade/downgrade logic)
    - src/app/actions/org-courses.ts (membership downgrade on org course unpublish)
    - src/lib/expert-membership.ts (membership change utilities)
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Open /experts; verify expert list pulled from profiles with author_status='approved' AND at least one published course.
    - Click "Become an Expert"; verify author_status set to 'pending'.
    - As pending expert, verify access to /author (Expert Console).
    - Publish first course as trial user; verify membership_status='active' AND billing_disabled=true.
    - Unpublish last course (no Stripe sub); verify membership_status='trial' AND billing_disabled=false.
  staging:
    - Open expert detail page; courses authored by that expert are listed.
    - Publish a pending expert's first course; verify auto-approval to 'approved'.
    - Verify Stripe subscription check works during downgrade (billing_disabled=false if subscription exists).
invariants:
  - author_status must be 'approved' AND have at least one published course to appear on /experts page.
  - Pending, approved, AND rejected experts can all access the Expert Console (/author/*).
  - Auto-approval triggers when admin publishes an expert's FIRST course (author_status changes from 'pending' to 'approved').
  - Once approved, expert stays approved even if courses are unpublished later (author_status is permanent).
  - Membership benefits change on publish/unpublish but author_status stays 'approved'.
  - On first course publish: trial → active (billing_disabled=true), paid → billing_disabled=true.
  - On last course unpublish: with Stripe sub → billing_disabled=false, without → trial (billing_disabled=false).
  - Org members (org_id set) are exempt from membership changes on publish/unpublish.
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
- Membership benefits (billing_disabled) change on publish/unpublish; author_status stays 'approved'.
- Org members (org_id set) are exempt from all expert membership changes.

## Expert Membership Upgrade/Downgrade

When experts publish or unpublish courses, their membership benefits change automatically while their author_status remains 'approved'.

### Upgrade (First Course Published)

Triggered when an expert's first course is published (via course-builder.ts or org-courses.ts).

| Current State | Action |
|---------------|--------|
| Trial account (`membership_status='trial'`) | Set `membership_status='active'`, `billing_disabled=true` |
| Paid Individual (has Stripe subscription) | Set `billing_disabled=true` (stops billing) |
| Org Owner/Employee (`org_id` set) | No change (org membership takes precedence) |

### Downgrade (Last Published Course Removed)

Triggered when an expert's last published course is unpublished.

| Current State | Action |
|---------------|--------|
| Has active Stripe subscription | Set `billing_disabled=false` (resume billing) |
| No Stripe subscription | Set `membership_status='trial'`, `billing_disabled=false` |
| Org member (`org_id` set) | No change |

### Key Implementation Details

**Files:**
- `src/lib/expert-membership.ts` — Core utility functions
  - `getExpertMembershipContext(userId)` — Fetch profile fields for decisions
  - `isOrgMember(context)` — Check if user is org owner/employee
  - `countPublishedCourses(authorId, excludeCourseId?)` — Count published courses
  - `hasActiveStripeSubscription(stripeCustomerId)` — Verify via Stripe API
  - `upgradeExpertMembership(userId)` — Execute upgrade logic
  - `downgradeExpertMembership(userId)` — Execute downgrade logic
- `src/app/actions/course-builder.ts` — Calls upgrade on first publish, downgrade on last unpublish
- `src/app/actions/org-courses.ts` — Calls downgrade on org course unpublish

**Edge Cases:**
- Rapid publish/unpublish: atomic state checks prevent race conditions
- Multiple courses: `countPublishedCourses` with `excludeCourseId` for accurate counts
- Stripe API failure: conservative fallback assumes no subscription (downgrades to trial)
- Manually approved expert: handled by checking if first course on publish

### Account Settings Display

The account settings page (`/settings/account`) shows three expert membership states:
- **Active expert** (`billing_disabled=true`): "Expert Membership"
- **Expert with paid subscription** (`billing_disabled=false` + Stripe sub): "Expert Membership + Pro"
- **Approved but no published courses**: "Expert Account (No Published Courses)"

## Failure Modes & Recovery
- **Expert missing from /experts list**: Verify author_status='approved' AND has at least one published course.
- **Expert can't access Expert Console**: Check author_status is not 'none'. All other statuses should have access.
- **Auto-approval didn't trigger**: Verify this was the FIRST published course for this expert; check course-builder.ts logic.
- **Course not showing under expert**: Ensure author_id set; course status may be non-published.
- **Expert still being billed after publish**: Check billing_disabled=true; if false, run upgradeExpertMembership().
- **Expert not reverting to trial on unpublish**: Check Stripe subscription status; if active sub exists, they keep paid status.
- **Org member's membership changed**: Bug — isOrgMember() check should prevent this. Verify org_id is set.

## Testing Checklist
- [ ] Click "Become an Expert" → verify author_status='pending' (not 'approved').
- [ ] As pending expert, access /author → should succeed.
- [ ] As pending expert, create course → should succeed.
- [ ] As pending expert, check /experts → should NOT appear in list.
- [ ] Admin publishes pending expert's first course → verify author_status auto-changes to 'approved'.
- [ ] Approved expert with published course → appears on /experts page.
- [ ] Unpublish the expert's only course → expert should remain 'approved'.
- [ ] As rejected expert, access /author → should succeed (can try again).

### Membership Upgrade/Downgrade Tests
- [ ] Trial user publishes first course → membership_status='active', billing_disabled=true.
- [ ] Paid user (with Stripe sub) publishes first course → billing_disabled=true (billing stops).
- [ ] Expert unpublishes last course (no Stripe sub) → membership_status='trial', billing_disabled=false.
- [ ] Expert unpublishes last course (has Stripe sub) → billing_disabled=false (billing resumes).
- [ ] Org member publishes/unpublishes → no membership changes.
- [ ] Rapid publish/unpublish → correct final state (no race conditions).
- [ ] Account settings shows correct expert membership state.

## Change Guide
- **Changing registration behavior**: Update src/app/actions/expert-application.ts becomeExpert().
- **Changing Expert Console access**: Update route guards in src/app/author/layout.tsx, page.tsx, and courses/[id]/builder/page.tsx.
- **Changing auto-approval logic**: Update src/app/actions/course-builder.ts publish action.
- **Changing public visibility rules**: Update /experts page query and this doc's invariants.
- **Changing membership upgrade logic**: Update src/lib/expert-membership.ts upgradeExpertMembership().
- **Changing membership downgrade logic**: Update src/lib/expert-membership.ts downgradeExpertMembership() and callers in course-builder.ts, org-courses.ts.
- **Adding new membership states**: Update getExpertMembershipContext(), account settings display, and this doc.

## Related Docs
- docs/features/author-portal.md
- docs/features/expert-resources.md
- docs/features/academy.md
- docs/workflows/Expert_Workflow.md
- docs/workflows/expert-author-workflows.md
