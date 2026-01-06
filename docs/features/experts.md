---
id: experts
owner: product-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /experts
    - /experts/[id]
  collections: []
data:
  tables:
    - public.profiles (author_status, author_bio, linkedin_url)
    - public.courses (author_id)
    - public.expert_credentials
  storage: []
backend:
  actions:
    - src/app/expert-application/*
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Open /experts; verify expert list pulled from profiles with author_status='approved'.
  staging:
    - Open expert detail page; courses authored by that expert are listed.
invariants:
  - author_status must be 'approved' for experts to surface.
  - courses.author_id must match profiles.id; profile must exist.
  - expert_credentials tied to user_id for additional detail.
---

## Overview
Experts feature lists approved instructors and their courses. Expert pages present profile details and authored courses, leveraging profile author fields and credentials.

## User Surfaces
- Experts index page showing cards for approved experts.
- Expert detail page with bio/credentials and course list.

## Core Concepts & Objects
- **Expert**: profile with author_status='approved' plus bio/links.
- **Expert credentials**: supplemental qualifications in expert_credentials.
- **Authored courses**: courses where author_id matches expert profile.

## Data Model
- `profiles`: author_status, author_bio, linkedin_url fields.
- `courses`: author_id FK profiles.
- `expert_credentials`: id uuid PK, user_id FK profiles, title/org/dates.

Write paths:
- Author/approval flows update author_status and credentials.

Read paths:
- Experts pages query profiles filtered by author_status and join to courses.

## Permissions & Security
- Profiles readable by owner; public listing may require service-role or relaxed select; ensure only approved authors shown to non-admin users.
- expert_credentials select should be limited to relevant experts; consider RLS when exposing publicly.

## Integration Points
- Academy shows author info on course cards; links to expert pages.
- Author portal manages author approval/credentials.

## Invariants
- Only approved authors should appear publicly; enforce filter in queries.
- Courses must maintain correct author_id; reassignment requires manual update.

## Failure Modes & Recovery
- Expert missing from list: confirm author_status approved and RLS allows select.
- Course not showing under expert: ensure author_id set; course status may hide in queries.

## Testing Checklist
- Approve an author, load /experts, confirm appearance.
- Visit expert detail, verify courses list and credentials display.

## Change Guide
- If exposing experts publicly, ensure RLS allows public read of approved authors only (or use service-role with filters).
- Adding fields to expert profiles requires updating UI and possibly credentials table.

## Related Docs
- docs/features/author-portal.md
- docs/features/academy.md
- docs/architecture/Expert_Workflow.md
