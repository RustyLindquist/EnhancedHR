# Expert Workflow - Technical Architecture

> **Last Updated:** January 2026
> **Status:** Production-ready (MVP)
> **Related PRD:** `/docs/Author_Accounts_and_Compensation.md`

## Overview

This document describes the technical implementation of the Expert (Author) workflow, from discovery through approval and course proposal management. Use this as a reference when making changes to any Expert-related functionality.

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
│                           EXPERT USER JOURNEY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DISCOVERY                                                                │
│     Home Page → "Experts" link (nav) → /experts landing page                │
│                                                                              │
│  2. SIGNUP                                                                   │
│     /experts → "Become an Expert" → /join/expert (creates account)          │
│     └── Account created with role: 'pending_author'                         │
│                                                                              │
│  3. APPLICATION                                                              │
│     Auto-redirect to /expert-application (middleware enforced)              │
│     └── Fill profile, credentials, course proposal                          │
│     └── Submit application → status becomes 'submitted'                     │
│                                                                              │
│  4. ADMIN REVIEW                                                             │
│     Admin views at /admin/experts                                            │
│     └── Can approve → role becomes 'author', approved_at set                │
│     └── Can reject → rejection_notes saved, expert can resubmit             │
│                                                                              │
│  5. APPROVED EXPERT                                                          │
│     Access to /author dashboard                                              │
│     └── Can submit new course proposals                                     │
│     └── Can access course builder                                            │
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
│   │   │   └── page.tsx              # Expert landing page
│   │   └── join/
│   │       └── expert/
│   │           ├── page.tsx          # Expert signup form
│   │           └── actions.ts        # signupExpert() action
│   │
│   ├── expert-application/
│   │   ├── page.tsx                  # Application form (pending_author only)
│   │   └── actions.ts                # getExpertApplication(), saveExpertApplication()
│   │
│   ├── author/
│   │   ├── page.tsx                  # Author dashboard (approved only)
│   │   └── courses/                  # Course builder
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
│   │   ├── experts.ts                # updateExpertStatus(), getExpertDetails()
│   │   ├── proposals.ts              # getAllProposals(), updateProposalStatus()
│   │   └── credentials.ts            # CRUD for expert_credentials
│   │
│   └── api/
│       └── admin/
│           └── authors/
│               └── approve/
│                   └── route.ts      # POST endpoint for approval
│
├── components/
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
└── middleware.ts                          # Redirects pending_author to /expert-application

supabase/
└── migrations/
    ├── 20251229000003_create_course_proposals.sql
    ├── 20251229000004_create_expert_credentials.sql
    └── 20260102000002_add_expert_rejection_notes.sql
```

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

### Role Transitions

```
┌──────────┐    signup     ┌─────────────────┐   approve   ┌────────┐
│   user   │ ───────────▶ │ pending_author  │ ──────────▶ │ author │
└──────────┘               └─────────────────┘             └────────┘
                                   │
                                   │ reject
                                   ▼
                           (stays pending_author,
                            can resubmit)
```

### Application Status

```
draft ──▶ submitted ──▶ approved
                   └──▶ rejected (can resubmit → submitted)
```

**Note:** The `reviewing` status exists in the schema but is NOT used. The progress indicator shows only "Submitted → Under Review" without a separate reviewing state.

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

### 1. Two Approval Paths

**Problem:** Both `/api/admin/authors/approve` and `updateExpertStatus()` can approve experts.

**Solution:** Both now set `approved_at`. If you add new approval logic, update BOTH.

### 2. Proposals Stored in Two Places

**Problem:** Initial proposal in `profiles.course_proposal_*`, subsequent proposals in `course_proposals` table.

**Current Solution:** `saveExpertApplication()` now syncs to `course_proposals` on submit. When reading proposals, query `course_proposals` for unified view.

**Future:** Consider deprecating `profiles.course_proposal_*` fields entirely.

### 3. Credentials Migration

**Problem:** Old `profiles.credentials` (text) vs new `expert_credentials` table.

**Current State:** `CredentialsEditor` uses only the new table. Legacy field still exists but should not be read from.

### 4. Middleware Redirect Loop

**Problem:** If middleware redirects to `/expert-application` but page throws error, could loop.

**Solution:** Ensure `/expert-application/page.tsx` always renders something, even on error.

### 5. RLS Bypass Requirements

**Problem:** Admin actions need to modify other users' profiles.

**Solution:** Use `createAdminClient()` for all admin mutations. Regular `createClient()` respects RLS.

---

## Testing Checklist

Before deploying Expert workflow changes, verify:

### Signup Flow
- [ ] New user can navigate: Home → /experts → /join/expert
- [ ] Signup creates account with `role: 'pending_author'`
- [ ] User is redirected to `/expert-application`

### Application Form
- [ ] Can save as draft (no validation)
- [ ] Can upload avatar (< 2MB)
- [ ] Can add/edit/delete/reorder credentials
- [ ] Required fields show asterisks (Full Name, Course Title, Description)
- [ ] Character counters display correctly
- [ ] Submit validates required fields
- [ ] Submit creates entry in `course_proposals` table

### Admin Review
- [ ] Pending expert appears in `/admin/experts`
- [ ] Admin can view full application details
- [ ] Approve sets: `author_status='approved'`, `role='author'`, `approved_at`
- [ ] Reject modal appears with notes textarea
- [ ] Rejection notes saved to `rejection_notes` field
- [ ] Actions logged to `admin_audit_log`

### Rejected Expert
- [ ] Sees rejection feedback on `/expert-application`
- [ ] Can edit and resubmit application
- [ ] Resubmission clears rejection status

### Approved Expert
- [ ] Can access `/author` dashboard
- [ ] Can submit new course proposals
- [ ] Cannot access `/expert-application` (redirected)

### Global Proposals
- [ ] `/admin/proposals` shows all proposals
- [ ] Filters work correctly
- [ ] Can approve/reject with notes
- [ ] Links to expert detail work

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
