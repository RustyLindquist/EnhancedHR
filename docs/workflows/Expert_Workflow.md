# Expert Workflow - Technical Architecture

> **Last Updated:** January 2026
> **Status:** Production-ready (MVP)
> **Related PRD:** `/docs/Author_Accounts_and_Compensation.md`

## Overview

This document describes the technical implementation of the Expert (Author) workflow, from discovery through course building and auto-approval. The flow has been updated to a **pending-then-auto-approve model** where experts can immediately access the Expert Console to build courses, and are automatically approved when their first course is published.

---

## Table of Contents

1. [User Journey Overview](#user-journey-overview)
2. [Database Schema](#database-schema)
3. [File Structure](#file-structure)
4. [Key Components](#key-components)
5. [Server Actions](#server-actions)
6. [API Routes](#api-routes)
7. [State Machine](#state-machine)
8. [Admin Functionality](#admin-functionality)
9. [Common Pitfalls](#common-pitfalls)
10. [Testing Checklist](#testing-checklist)

---

## User Journey Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXPERT USER JOURNEY (Updated Jan 2026)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DISCOVERY                                                                │
│     Home Page → "Experts" link (nav) → /experts landing page                │
│     Or: Any "Become an Expert" button throughout the app                    │
│                                                                              │
│  2. REGISTRATION (Immediate Access)                                          │
│     User clicks "Become an Expert"                                          │
│     └── author_status set to 'pending' (NOT 'approved')                     │
│     └── User IMMEDIATELY gains Expert Console access                        │
│     └── No application form required                                        │
│                                                                              │
│  3. COURSE DEVELOPMENT (Pending State)                                       │
│     Pending expert accesses Expert Console (/author/*)                      │
│     └── Can create and build courses                                        │
│     └── Can submit course proposals                                         │
│     └── Can upload content and manage drafts                                │
│     └── Cannot appear on public /experts page yet                           │
│                                                                              │
│  4. AUTO-APPROVAL (On First Course Publish)                                  │
│     Admin reviews and publishes expert's first course                       │
│     └── System auto-changes author_status: 'pending' → 'approved'           │
│     └── Expert now visible on /experts page                                 │
│     └── No separate admin approval step for expert status                   │
│                                                                              │
│  5. APPROVED EXPERT                                                          │
│     Continued access to /author dashboard                                   │
│     └── Visible on public /experts page                                     │
│     └── Status persists even if courses later unpublished                   │
│                                                                              │
│  6. REJECTION PATH (Edge Case)                                               │
│     If admin explicitly rejects an expert:                                  │
│     └── author_status = 'rejected'                                          │
│     └── Expert CAN still access Expert Console                              │
│     └── Can continue building courses and try again                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Primary Table: `profiles`

The `profiles` table stores all user data, with Expert-specific fields:

```sql
-- Expert-specific columns in profiles table
role                      TEXT     -- 'user' | 'pending_author' | 'author' | 'admin'
author_status             TEXT     -- 'none' | 'pending' | 'approved' | 'rejected'
application_status        TEXT     -- 'draft' | 'submitted' | 'approved' | 'rejected'
application_submitted_at  TIMESTAMPTZ
approved_at               TIMESTAMPTZ
rejection_notes           TEXT     -- Feedback when rejected

-- Profile fields
full_name                 TEXT
expert_title              TEXT     -- e.g., "Senior HR Consultant"
phone_number              TEXT
linkedin_url              TEXT
author_bio                TEXT
avatar_url                TEXT

-- Legacy proposal fields (still used for initial application)
course_proposal_title       TEXT
course_proposal_description TEXT
```

### Related Tables

#### `course_proposals`
Stores course proposals (both initial and subsequent):

```sql
CREATE TABLE course_proposals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    status          TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'converted'
    admin_notes     TEXT,                     -- Feedback from admin
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     UUID REFERENCES profiles(id)
);
```

#### `expert_credentials`
Stores typed credential entries:

```sql
CREATE TABLE expert_credentials (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    type          TEXT NOT NULL,  -- 'certification' | 'degree' | 'experience' | 'expertise' | 'publication' | 'achievement'
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
```

#### `admin_audit_log`
Tracks admin actions for compliance:

```sql
CREATE TABLE admin_audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID REFERENCES profiles(id),
    action      TEXT NOT NULL,      -- 'expert_approved' | 'expert_rejected'
    target_type TEXT NOT NULL,      -- 'expert' | 'proposal'
    target_id   UUID NOT NULL,
    details     JSONB,
    created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## File Structure

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── experts/
│   │   │   └── page.tsx              # Expert landing page (public)
│   │   └── join/
│   │       └── expert/
│   │           ├── page.tsx          # Expert signup form
│   │           └── actions.ts        # signupExpert() action
│   │
│   ├── author/                       # EXPERT CONSOLE (Updated Access Rules)
│   │   ├── layout.tsx                # Route guard: allows pending/approved/rejected
│   │   ├── page.tsx                  # Expert Console dashboard (same guard)
│   │   └── courses/
│   │       └── [id]/
│   │           └── builder/
│   │               └── page.tsx      # Course builder (same guard)
│   │
│   ├── admin/
│   │   ├── experts/
│   │   │   ├── page.tsx              # Expert list with approve/reject
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Expert detail view
│   │   └── proposals/
│   │       └── page.tsx              # Global proposal queue
│   │
│   ├── actions/
│   │   ├── expert-application.ts     # becomeExpert() - sets 'pending' status
│   │   ├── expert-course-builder.ts  # Course creation (allows pending/rejected)
│   │   ├── proposals.ts              # Proposal submission (allows pending/rejected)
│   │   ├── course-builder.ts         # Auto-approval logic on first publish
│   │   ├── experts.ts                # updateExpertStatus(), getExpertDetails()
│   │   └── credentials.ts            # CRUD for expert_credentials
│   │
│   ├── settings/
│   │   └── account/
│   │       └── page.tsx              # Expert status messaging (updated)
│   │
│   └── api/
│       └── admin/
│           └── authors/
│               └── approve/
│                   └── route.ts      # POST endpoint for manual approval
│
├── components/
│   ├── NavigationPanel.tsx           # Expert Console link (shows for all statuses)
│   │
│   ├── admin/
│   │   ├── ExpertManagementDashboard.tsx  # Expert list
│   │   ├── ExpertDetailsDashboard.tsx     # Expert detail + proposals
│   │   └── ProposalsDashboard.tsx         # Global proposals view
│   │
│   ├── author/
│   │   └── NewProposalForm.tsx            # Proposal submission for authors
│   │
│   ├── onboarding/
│   │   └── AvatarUpload.tsx               # Profile photo upload
│   │
│   └── CredentialsEditor.tsx              # Drag-sortable credentials
│
supabase/
└── migrations/
    ├── 20251229000003_create_course_proposals.sql
    ├── 20251229000004_create_expert_credentials.sql
    └── 20260102000002_add_expert_rejection_notes.sql
```

### Key Files Changed in Pending-Then-Auto-Approve Update

| File | Change |
|------|--------|
| `src/app/actions/expert-application.ts` | `becomeExpert()` now sets `author_status='pending'` instead of `'approved'` |
| `src/app/author/layout.tsx` | Route guard updated to allow pending/rejected experts |
| `src/app/author/page.tsx` | Same route guard update |
| `src/app/author/courses/[id]/builder/page.tsx` | Same route guard update |
| `src/app/actions/expert-course-builder.ts` | Allows pending/rejected experts to create courses |
| `src/app/actions/proposals.ts` | Allows pending/rejected experts to submit proposals |
| `src/app/actions/course-builder.ts` | Added auto-approval logic on first course publish |
| `src/components/NavigationPanel.tsx` | Shows Expert Console link for all expert statuses |
| `src/app/settings/account/page.tsx` | Updated expert status messaging |

---

## Key Components

### ExpertDetailsDashboard.tsx

The main admin view for reviewing an expert application.

**Props:**
```typescript
interface ExpertDetailsDashboardProps {
    expert: ExpertProfile;
    proposals: CourseProposal[];
    courses: ExpertCourse[];
    performance: ExpertPerformance | null;
    credentials: ExpertCredential[];
}
```

**Key Features:**
- Profile display with editable bio and title
- Credentials viewer (via CredentialsEditor)
- Expandable proposal list with approve/reject/delete
- Rejection modal with notes textarea
- Performance metrics (if courses exist)

**State Management:**
```typescript
const [showRejectModal, setShowRejectModal] = useState(false);
const [rejectionNotes, setRejectionNotes] = useState('');
const [showProposalRejectModal, setShowProposalRejectModal] = useState<string | null>(null);
const [proposalRejectionNotes, setProposalRejectionNotes] = useState('');
```

### CredentialsEditor.tsx

Manages expert credentials with drag-and-drop reordering.

**Key Features:**
- Add credentials by type (certification, degree, etc.)
- Icon per type
- Drag to reorder
- Delete with confirmation

**Usage:**
```tsx
<CredentialsEditor
    credentials={credentials}
    isAdmin={true}           // Admin can edit others
    expertId={expert.id}     // Required for admin editing
/>
```

### AvatarUpload.tsx

Profile photo upload with validation.

**Validation Rules:**
- Max file size: 2MB
- Accepted types: JPEG, PNG, GIF, WebP

---

## Server Actions

### Expert Actions (`/app/actions/experts.ts`)

#### `updateExpertStatus(expertId, action, rejectionNotes?)`

Approves or rejects an expert application.

```typescript
export async function updateExpertStatus(
    expertId: string,
    action: 'approve' | 'reject',
    rejectionNotes?: string
): Promise<{ success: boolean; error?: string }>
```

**What it does on APPROVE:**
1. Sets `author_status = 'approved'`
2. Sets `application_status = 'approved'`
3. Sets `approved_at = now()`
4. Clears `rejection_notes`
5. Updates auth.users metadata with `role: 'author'`
6. Logs to `admin_audit_log`

**What it does on REJECT:**
1. Sets `author_status = 'rejected'`
2. Sets `application_status = 'rejected'`
3. Saves `rejection_notes` (if provided)
4. Logs to `admin_audit_log`

**Important:** This action uses `createAdminClient()` to bypass RLS.

### Proposal Actions (`/app/actions/proposals.ts`)

#### `getAllProposals(filters?)`

Fetches all proposals with expert info (admin only).

```typescript
export async function getAllProposals(filters?: {
    status?: 'pending' | 'approved' | 'rejected' | 'converted';
}): Promise<{ proposals: ProposalWithExpert[]; error?: string }>
```

#### `updateProposalStatus(proposalId, status, adminNotes?)`

Updates a proposal's status with optional notes.

```typescript
export async function updateProposalStatus(
    proposalId: string,
    status: 'pending' | 'approved' | 'rejected' | 'converted',
    adminNotes?: string
): Promise<{ success: boolean; error?: string }>
```

### Application Actions (`/app/expert-application/actions.ts`)

#### `saveExpertApplication(formData)`

Saves or submits the expert application form.

**Key Behavior:**
- When `submit=true`, validates required fields
- Sets `application_status = 'submitted'`
- Sets `author_status = 'pending'`
- **Syncs proposal to `course_proposals` table** (prevents data duplication)

---

## API Routes

### POST `/api/admin/authors/approve`

Legacy API route for approving/rejecting experts.

**Request:**
```typescript
{
    userId: string;
    action: 'approve' | 'reject';
}
```

**Response:**
```typescript
{ success: true } | { error: string }
```

**Note:** This route ALSO sets `approved_at` on approval. Both this route and the `updateExpertStatus` action can be used for approval - ensure consistency.

---

## State Machine

### Author Status Transitions (Updated)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AUTHOR STATUS STATE MACHINE                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                     "Become an Expert"                                        │
│    ┌────────┐      (becomeExpert())       ┌─────────┐                        │
│    │  none  │ ──────────────────────────▶ │ pending │                        │
│    └────────┘                              └────┬────┘                        │
│                                                 │                             │
│                    ┌────────────────────────────┼────────────────────┐       │
│                    │                            │                    │       │
│                    ▼                            ▼                    ▼       │
│    ┌───────────────────────┐      ┌──────────────────┐    ┌──────────────┐  │
│    │ First course published│      │  Admin rejects   │    │ Stay pending │  │
│    │    (auto-approval)    │      │    (optional)    │    │ (build more) │  │
│    └───────────┬───────────┘      └────────┬─────────┘    └──────────────┘  │
│                │                           │                                  │
│                ▼                           ▼                                  │
│          ┌──────────┐               ┌──────────┐                             │
│          │ approved │               │ rejected │ ← Can still access          │
│          └──────────┘               └────┬─────┘   Expert Console            │
│                ▲                         │                                    │
│                │    First course         │                                    │
│                │    published            │                                    │
│                └─────────────────────────┘                                    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

KEY CHANGES FROM PREVIOUS FLOW:
- Registration sets 'pending' (was: 'approved')
- Pending experts CAN access Expert Console (was: blocked)
- Rejected experts CAN access Expert Console (was: blocked)
- Auto-approval triggers on first course publish (was: manual admin approval)
- Approved status is permanent (course unpublish doesn't revert)
```

### Expert Console Access by Status

| author_status | Expert Console | Create Courses | Submit Proposals | Public /experts |
|---------------|----------------|----------------|------------------|-----------------|
| `none`        | NO             | NO             | NO               | NO              |
| `pending`     | YES            | YES            | YES              | NO              |
| `approved`    | YES            | YES            | YES              | YES (if pub)    |
| `rejected`    | YES            | YES            | YES              | NO              |

### Auto-Approval Logic

The auto-approval is triggered in `src/app/actions/course-builder.ts` when a course is published:

1. Check if expert's author_status is 'pending'
2. Check if this is the expert's FIRST published course
3. If both conditions met: auto-change author_status to 'approved'

**Edge Cases:**
- Course unpublished later: Expert stays 'approved'
- Multiple courses published: Only first triggers auto-approval (others are no-op)
- Rejected expert's course published: Changes 'rejected' → 'approved'

---

## Admin Functionality

### Viewing Experts

**Location:** `/admin/experts`

Shows all users where `author_status IN (pending, approved, rejected) OR role = 'admin'`.

**Features:**
- Filter by status (pending/approved/rejected/admin)
- Search by name/email
- Inline approve/reject buttons
- Click to view details

### Viewing Proposals

**Location:** `/admin/proposals`

Shows all proposals across all experts.

**Features:**
- Filter by status (pending/approved/rejected/all)
- Expandable proposal cards
- Approve/reject with notes
- Link to expert detail

---

## Common Pitfalls

### 1. Three Approval Paths

**Problem:** Expert approval can happen via:
- `/api/admin/authors/approve` (legacy API route)
- `updateExpertStatus()` (admin action)
- Auto-approval on first course publish (new)

**Solution:** All paths must set `author_status='approved'` and `approved_at`. The auto-approval path is in `src/app/actions/course-builder.ts`. If adding new approval logic, update ALL THREE paths.

### 2. Assuming Only Approved Experts Access Expert Console

**Problem:** The OLD flow blocked non-approved experts from /author/*. The NEW flow allows pending/approved/rejected.

**Solution:** Route guards in the following files have been updated to allow all statuses except 'none':
- `src/app/author/layout.tsx`
- `src/app/author/page.tsx`
- `src/app/author/courses/[id]/builder/page.tsx`

When adding new /author/* routes, ensure they follow this pattern.

### 3. Proposals Stored in Two Places

**Problem:** Initial proposal in `profiles.course_proposal_*`, subsequent proposals in `course_proposals` table.

**Current Solution:** `saveExpertApplication()` now syncs to `course_proposals` on submit. When reading proposals, query `course_proposals` for unified view.

**Future:** Consider deprecating `profiles.course_proposal_*` fields entirely.

### 4. Credentials Migration

**Problem:** Old `profiles.credentials` (text) vs new `expert_credentials` table.

**Current State:** `CredentialsEditor` uses only the new table. Legacy field still exists but should not be read from.

### 5. RLS Bypass Requirements

**Problem:** Admin actions need to modify other users' profiles.

**Solution:** Use `createAdminClient()` for all admin mutations. Regular `createClient()` respects RLS.

### 6. Confusing 'Pending' with 'No Access'

**Problem:** 'pending' now means "can access Expert Console but not visible on /experts page" rather than "waiting for approval to access anything".

**Solution:** Update any code that treats pending as a blocking state. The only blocking state is 'none'.

### 7. Auto-Approval Not Triggering

**Problem:** Auto-approval only triggers on the FIRST published course.

**Solution:** Check the expert's existing published course count before expecting auto-approval. If they already have published courses, the trigger won't fire again.

---

## Testing Checklist

Before deploying Expert workflow changes, verify:

### Registration Flow (Updated)
- [ ] User can click "Become an Expert" from various locations
- [ ] Registration sets `author_status='pending'` (NOT 'approved')
- [ ] User immediately has access to Expert Console (/author/*)
- [ ] No application form or approval wait required

### Expert Console Access (New)
- [ ] As user with `author_status='none'`: /author → should redirect/block
- [ ] As pending expert: /author → should load Expert Console
- [ ] As approved expert: /author → should load Expert Console
- [ ] As rejected expert: /author → should load Expert Console (can try again)

### Course Building (Pending State)
- [ ] Pending expert can create a new course
- [ ] Pending expert can build course content
- [ ] Pending expert can submit course proposals
- [ ] Pending expert does NOT appear on /experts page

### Auto-Approval (New)
- [ ] Admin publishes pending expert's first course → author_status auto-changes to 'approved'
- [ ] Expert now appears on /experts page (with published course)
- [ ] Publishing second+ courses does NOT trigger auto-approval again (already approved)
- [ ] Rejected expert's course published → changes to 'approved'

### Approval Persistence (New)
- [ ] Unpublish an approved expert's only course → expert should REMAIN 'approved'
- [ ] Approved status is permanent once granted

### Admin Review (Still Available)
- [ ] Admin can still manually change author_status via /admin/experts
- [ ] Approve/reject modals still function
- [ ] Actions logged to `admin_audit_log`

### Rejected Expert (Updated)
- [ ] Rejected expert CAN still access Expert Console
- [ ] Rejected expert CAN create courses
- [ ] Rejected expert CAN have courses published (triggers auto-approval)
- [ ] Rejection messaging shows in account settings

### Navigation (Updated)
- [ ] Expert Console link shows for pending experts
- [ ] Expert Console link shows for approved experts
- [ ] Expert Console link shows for rejected experts
- [ ] Expert Console link hidden for users with author_status='none'

### Account Settings Messaging
- [ ] Pending expert sees appropriate status message
- [ ] Approved expert sees appropriate status message
- [ ] Rejected expert sees appropriate status message

---

## SQL for Production

When deploying changes to production, run:

```sql
-- Add rejection_notes if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejection_notes text;

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES profiles(id),
    action text NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);

-- RLS for audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view audit logs"
    ON admin_audit_log FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

---

## Related Documentation

- **PRD:** `/docs/Author_Accounts_and_Compensation.md`
- **Platform Admin:** `/docs/Platform_Administrators.md`
- **User Auth:** `/docs/User_Accounts_and_Authentication.md`
