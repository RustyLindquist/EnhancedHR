---
id: author-portal
owner: learning-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /author/*
    - /teach
  collections: []
data:
  tables:
    - public.profiles (author_status, author_bio)
    - public.courses
    - public.course_proposals
    - public.expert_credentials
  storage: []
backend:
  actions:
    - src/app/author pages/components
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Access /teach as authenticated user; verify author application flow reachable.
  staging:
    - Submit author application (course_proposals); confirm row inserted and author_status updates to pending.
invariants:
  - profiles.author_status enum (none/pending/approved/rejected) governs author capabilities.
  - course_proposals/expert_credentials tied to profile id; authors can manage only their own data.
  - Courses authored by approved authors should reference author_id = profiles.id.
---

## Overview
Author Portal supports instructor onboarding and course proposal/management for approved authors. It relies on profile author_status and related proposal/credential tables.

## User Surfaces
- `/teach` landing to start author application.
- `/author/*` pages for managing proposals, credentials, and authored courses.

## Core Concepts & Objects
- **Author**: profile with author_status='approved'.
- **Author application/proposal**: course_proposals rows keyed to profile.
- **Expert credentials**: expert_credentials rows storing author qualifications.

## Data Model
- `profiles`: author_status enum, author_bio, linkedin_url.
- `course_proposals`: id uuid PK, user_id FK profiles, course details fields, created_at.
- `expert_credentials`: id uuid PK, user_id FK profiles, credential fields.
- `courses`: author_id FK profiles; status text (draft/published etc).

Write paths:
- Author application inserts into course_proposals; may set author_status to pending.
- Admin approval sets author_status to approved; author can then create/manage courses.

Read paths:
- Author pages list proposals and authored courses; filter by user_id.

## Permissions & Security
- RLS on proposals/credentials should restrict to owner; admin may have elevated access (see policies in migrations).
- Author creation/editing of courses may use admin policies; ensure author_id matches auth user.

## Integration Points
- Academy uses courses authored by approved authors.
- Payout reporting references courses.author_id and profiles.author_status.

## Invariants
- author_status must be approved before author can publish courses.
- course_proposals and expert_credentials must reference the same user_id as profiles.id.
- Course author_id should remain stable; reassigning requires business approval.

## Failure Modes & Recovery
- Author cannot access portal: check author_status and RLS policies.
- Proposal not visible: verify user_id matches auth.uid() and row exists.
- Course missing author info: ensure author_id set and profile exists.

## Testing Checklist
- Submit author application; confirm course_proposals row and profile author_status=pending.
- Admin approve (manual update); author can access /author dashboard and create a draft course.
- Create credential; ensure expert_credentials row tied to user_id.

## Change Guide
- Adding approval workflow: add statuses and actions; update RLS to allow admin approval.
- Expanding course creation: ensure new course fields captured and linked to author_id.
- If enabling revenue sharing, integrate with payout reporting and author_id usage.

## Related Docs
- docs/features/academy.md
- docs/features/admin-portal.md
- docs/architecture/Expert_Workflow.md
