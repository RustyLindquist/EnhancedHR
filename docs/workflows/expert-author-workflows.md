# Expert/Author Workflows

> **Status**: Active
> **Last Updated**: 2026-01-22

## Role Overview

Experts/Authors create and manage course content on EnhancedHR.ai. They build courses, track performance, and earn revenue from their content.

**Primary Goals**:
- Create high-quality course content
- Get courses published and visible to learners
- Track course performance and engagement
- Earn revenue from course sales
- Build reputation as an expert

**Access Level**: Expert Console access via `/author/*` routes. Available to ALL expert statuses (pending, approved, rejected).

## Primary Workflows

### Expert Onboarding / Registration

**Goal**: Become an expert and start building courses
**Frequency**: One-time
**Features Involved**: `experts`, `author-portal`, `auth-accounts`

#### Steps
1. User discovers "Become an Expert" option (nav, settings, or landing pages)
2. User clicks "Become an Expert" button
3. System sets `author_status = 'pending'` (immediate, no form required)
4. User gains immediate access to Expert Console (`/author/*`)
5. Navigation panel shows Expert Console link
6. User can start building courses immediately

#### Variations
- From /experts landing page
- From account settings
- From marketing pages

#### Success Criteria
- User's author_status is 'pending'
- User can access /author routes
- Expert Console link visible in navigation

#### Related Workflows
- Course Creation
- Auto-Approval on First Publish

---

### Course Creation

**Goal**: Build and submit a new course
**Frequency**: Monthly / As creating
**Features Involved**: `author-portal`, `academy`

#### Steps
1. Navigate to Expert Console (`/author`)
2. Click "Create New Course"
3. Add course metadata (title, description, category)
4. Build module structure
5. Add lessons (video, text, quizzes)
6. Upload video content (Mux processing)
7. Set pricing and credits
8. Submit for review

#### Variations
- Course from template
- Importing existing content
- Multi-module courses
- Created by pending expert (before approval)

#### Success Criteria
- Course submitted successfully
- Content properly uploaded and processed

#### Related Workflows
- Course Publishing
- Content Updates
- Auto-Approval on First Publish

---

### Course Publishing (with Auto-Approval)

**Goal**: Get course approved and live on platform
**Frequency**: Per course
**Features Involved**: `author-portal`, `admin-portal`, `academy`, `experts`

#### Steps
1. Submit course for review
2. Wait for admin review
3. Receive feedback (if revisions needed)
4. Make revisions and resubmit
5. Admin publishes course
6. **If this is expert's FIRST published course:**
   - System auto-approves expert (`author_status` → `'approved'`)
   - Expert now visible on /experts page
7. Course appears in Academy
8. Start earning on enrollments

#### Variations
- First course (triggers auto-approval)
- Subsequent courses (no status change)
- Revisions requested
- Rejection with feedback

#### Success Criteria
- Course live in Academy
- Enrollments possible
- Expert visible on /experts page (after first publish)

#### Related Workflows
- Course Creation
- Performance Tracking

---

### Performance Tracking

**Goal**: Monitor course engagement and revenue
**Frequency**: Weekly
**Features Involved**: `author-portal`

#### Steps
1. Navigate to Author Analytics (`/author/analytics`)
2. View enrollment numbers
3. See completion rates
4. Track revenue and earnings
5. Identify high/low performing content
6. Use insights to improve future courses

#### Variations
- Per-course deep dive
- Time-based comparisons
- Learner feedback review

#### Success Criteria
- Clear understanding of course performance
- Actionable insights for improvement

#### Related Workflows
- Content Updates
- Earnings Management

---

### Content Updates

**Goal**: Update existing course content
**Frequency**: As needed
**Features Involved**: `author-portal`, `course-player-and-progress`

#### Steps
1. Navigate to Author Portal → My Courses
2. Select course to edit
3. Update content (lessons, quizzes, videos)
4. Save changes
5. Changes reflected for learners

#### Variations
- Major vs minor updates
- Adding new modules
- Fixing errors

#### Success Criteria
- Content updated successfully
- Existing progress preserved where appropriate

#### Related Workflows
- Performance Tracking

---

### Earnings Management

**Goal**: Track and receive earnings from courses
**Frequency**: Monthly
**Features Involved**: `author-portal`, `admin-portal` (payout side)

#### Steps
1. Navigate to Author Earnings (`/author/earnings`)
2. View earnings summary
3. See pending vs paid amounts
4. Review payout schedule
5. Ensure payment info is current
6. Receive payouts per schedule

#### Variations
- Viewing historical earnings
- Payment method updates
- Earnings disputes

#### Success Criteria
- Clear visibility into earnings
- Timely, accurate payouts

#### Related Workflows
- Performance Tracking

---

### Expert Profile Management

**Goal**: Manage public expert profile
**Frequency**: Monthly / As needed
**Features Involved**: `experts`, `auth-accounts`

#### Steps
1. Navigate to Profile settings
2. Update bio, credentials, photo
3. Add expertise areas
4. Link social/professional profiles
5. Profile appears on expert directory
6. Learners can discover you

#### Variations
- Feature on course pages
- Expert directory listing

#### Success Criteria
- Professional profile presented
- Discoverability for learners

#### Related Workflows
- Course Creation (profile linked to courses)

---

## Workflows To Document

The following workflows have been identified but not yet documented:
- [x] Expert Onboarding / Registration (documented above)
- [ ] Course Pricing Strategy
- [ ] Learner Engagement Response
- [ ] Co-authoring (if available)
- [ ] Expert Re-application After Rejection

---

## Notes for Agents

When working on features that affect Experts/Authors:
1. **Revenue impact is critical** — earnings must be accurate
2. **Course creation UX affects content quality**
3. **Video processing (Mux) is async** — handle appropriately
4. **Expert Console access is broad** — pending, approved, AND rejected experts can all access /author/*
5. **Auto-approval is automatic** — first course publish changes pending → approved
6. **Approval is permanent** — once approved, status persists even if courses unpublished
7. **Three approval paths exist** — API route, admin action, and auto-approval on publish
8. Update this doc and `docs/workflows/Expert_Workflow.md` if workflow changes

### Key Files for Expert Flow
- `src/app/actions/expert-application.ts` — becomeExpert() sets 'pending'
- `src/app/author/layout.tsx` — Route guard for Expert Console
- `src/app/author/page.tsx` — Route guard for Expert Console
- `src/app/author/courses/[id]/builder/page.tsx` — Route guard for course builder
- `src/app/actions/expert-course-builder.ts` — Course creation permissions
- `src/app/actions/proposals.ts` — Proposal submission permissions
- `src/app/actions/course-builder.ts` — Auto-approval logic on publish
- `src/components/NavigationPanel.tsx` — Expert Console link visibility
- `src/app/settings/account/page.tsx` — Expert status messaging
