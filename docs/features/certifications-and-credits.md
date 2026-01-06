---
id: certifications-and-credits
owner: learning-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /dashboard (cert stats widgets)
    - Certifications collection view (virtual)
  collections:
    - certifications
data:
  tables:
    - public.user_credits_ledger
    - public.certificates
    - public.courses
    - public.user_progress
  storage: []
backend:
  actions:
    - public.award_course_credits (function)
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Manually insert user_credits_ledger row and confirm certificate uniqueness constraint holds.
  staging:
    - Complete a course and call award_course_credits; verify ledger row created and certificate issued if enabled.
invariants:
  - user_credits_ledger credit_type constrained to SHRM or HRCI; user_id FK auth.users; certificate_id unique.
  - award_course_credits prevents duplicate awards for same user/course/credit_type.
  - certificates unique per (user_id, course_id); FK to courses and profiles.
---

## Overview
Certifications & Credits track SHRM/HRCI credit awards and generated certificates per course completion. Credits are recorded in `user_credits_ledger`, and certificates capture issued achievements.

## User Surfaces
- Dashboard widgets showing credits/certifications.
- Certifications collection (virtual) lists courses with badges.

## Core Concepts & Objects
- **Credit ledger entry**: user_credits_ledger row per user/course/credit_type.
- **Certificate**: certificates row per user/course when issued.
- **Credit award function**: award_course_credits plpgsql ensures idempotent inserts.

## Data Model
- `user_credits_ledger`: id uuid PK, user_id FK auth.users, course_id FK courses, credit_type text check (SHRM/HRCI), amount numeric(4,2), awarded_at, certificate_id unique, metadata jsonb.
- `certificates`: id uuid PK, user_id FK profiles, course_id FK courses, issued_at; unique (user_id, course_id).
- `courses.badges`: text[] indicates available certifications; used to filter certification collection counts.
- `user_progress`: used to determine completion but logic not implemented in code here.

Write paths:
- award_course_credits(user_id, course_id, credit_type, amount) inserts ledger row if absent.
- Certificates insert expected when issuing (policy allows select/insert).

Read paths:
- Dashboard counts (collection counts action counts courses with badges).

## Permissions & Security
- RLS: user_credits_ledger select/insert limited to auth.uid() = user_id; certificates select for owner; inserts allowed where auth.uid() = user_id (system policy).
- award_course_credits is SECURITY DEFINER; ensure callers pass correct user_id to avoid cross-user awards.

## Integration Points
- Course completion logic should call award_course_credits and insert certificate.
- Collections: certifications collection count uses courses with badges; certificate list may be rendered in dashboard.

## Invariants
- No duplicate ledger row per user/course/credit_type (enforced by function logic).
- Certificates unique per user/course.
- credit_type must be SHRM or HRCI; changing requires schema update.

## Failure Modes & Recovery
- Duplicate credit: award_course_credits returns existing id without new row; verify function present.
- Missing certificate: if ledger exists but no certificate, insert certificates row manually with same course/user.
- Incorrect credit_type: will fail check constraint; correct data and reinsert.

## Testing Checklist
- Call award_course_credits twice for same user/course/type: second call returns existing id only.
- Insert certificate and ensure unique (user_id, course_id) constraint enforced.
- Create course with badges and verify certifications collection count increments (via collection counts action).

## Change Guide
- Adding new credit types: update check constraint and function; update UI filters and docs.
- Automating issuance: wire progress completion to call award_course_credits and certificates insert.
- If badges schema changes (text[] to jsonb), update counts logic in collection counts action.

## Related Docs
- docs/features/course-player-and-progress.md
- docs/features/collections-and-context.md
