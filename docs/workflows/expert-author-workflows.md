# Expert/Author Workflows

> **Status**: Stub — to be populated as workflows are discovered and documented
> **Last Updated**: 2026-01-04

## Role Overview

Experts/Authors create and manage course content on EnhancedHR.ai. They build courses, track performance, and earn revenue from their content.

**Primary Goals**:
- Create high-quality course content
- Get courses approved and published
- Track course performance and engagement
- Earn revenue from course sales
- Build reputation as an expert

**Access Level**: Author portal access via `/author/*` and `/teach` routes

## Primary Workflows

### Course Creation

**Goal**: Build and submit a new course
**Frequency**: Monthly / As creating
**Features Involved**: `author-portal`, `academy`

#### Steps
1. Navigate to Author Portal (`/author`)
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

#### Success Criteria
- Course submitted successfully
- Content properly uploaded and processed

#### Related Workflows
- Course Publishing
- Content Updates

---

### Course Publishing

**Goal**: Get course approved and live on platform
**Frequency**: Per course
**Features Involved**: `author-portal`, `admin-portal`, `academy`

#### Steps
1. Submit course for review
2. Wait for admin review
3. Receive feedback (if revisions needed)
4. Make revisions and resubmit
5. Course approved
6. Course appears in Academy
7. Start earning on enrollments

#### Variations
- Revisions requested
- Rejection with feedback
- Fast-track approval (trusted authors)

#### Success Criteria
- Course live in Academy
- Enrollments possible

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
- [ ] Expert Onboarding / Application
- [ ] Course Pricing Strategy
- [ ] Learner Engagement Response
- [ ] Co-authoring (if available)

---

## Notes for Agents

When working on features that affect Experts/Authors:
1. Revenue impact is critical — earnings must be accurate
2. Course creation UX affects content quality
3. Video processing (Mux) is async — handle appropriately
4. Approval workflow involves admin coordination
5. Update this doc if workflow changes
