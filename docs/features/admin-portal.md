---
id: admin-portal
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /admin/*
  collections: []
data:
  tables:
    - public.ai_system_prompts
    - public.profiles
    - public.courses (admin writes)
    - public.tools (admin writes)
  storage: []
backend:
  actions:
    - src/components/admin/SystemPromptManager.tsx
    - admin actions within /admin tree (listing not exhaustive)
ai:
  context_scopes: []
  models: []
tests:
  local:
    - As admin user (profiles.role='admin'), open /admin prompts page and update a system prompt; confirm row updates.
  staging:
    - Verify non-admin is denied (redirect/403) when hitting /admin.
invariants:
  - Admin access determined by profiles.role='admin'; RLS and UI gating must enforce this.
  - ai_system_prompts rows unique by agent_type; admin edits must preserve uniqueness.
  - Service-role usage in admin actions must be scoped to admin users to avoid cross-tenant leakage.
---

## Overview
Admin Portal provides privileged management of system resources such as AI system prompts, tools, courses, and user profiles. Access is limited to users whose `profiles.role` is `admin`.

## User Surfaces
- `/admin` pages (e.g., System Prompt Manager) for editing ai_system_prompts.
- Potential course/tool management pages under /admin (code scaffolding).

## Core Concepts & Objects
- **Admin user**: profile with role='admin'.
- **System prompt**: ai_system_prompts row editable via admin UI; drives agent behavior.
- **Admin management actions**: CRUD over courses/tools/users with elevated permissions.

## Data Model
- `ai_system_prompts`: id, agent_type unique, system_instruction, model, timestamps.
- `profiles`: role field designates admin.
- `tools`, `courses`: admin can insert/update; RLS permits admins (see policies).

Write paths:
- SystemPromptManager updates ai_system_prompts via admin client (service_role) gated by admin role.
- Admin pages may upsert courses/tools using service-role clients.

Read paths:
- Admin pages fetch protected data with service-role but should filter/scope appropriately.

## Permissions & Security
- RLS: ai_system_prompts editable by admin (policy); tools/courses have admin write policies; other users read-only.
- UI gating must check profile role before rendering admin routes.
- Service-role usage must still validate user role to prevent privilege escalation.

## Integration Points
- AI agents rely on ai_system_prompts; admin edits immediately affect chat behavior.
- Tools definitions managed here feed tools feature.
- Courses managed here feed academy/course-player features.

## Invariants
- agent_type uniqueness must be preserved when editing prompts.
- Admin routes must never be accessible to non-admin; ensure checks both client-side and server-side.
- Any service-role write must be scoped to avoid cross-tenant data exposure.

## Failure Modes & Recovery
- Prompt update fails: check admin role and RLS policy; ensure agent_type exists.
- Non-admin access: verify profile.role and route guards.
- Data corruption from service-role misuse: audit recent admin changes and restore rows if necessary.

## Testing Checklist
- Login as admin, edit a prompt, reload chat to verify new prompt used.
- Attempt admin page as non-admin; expect redirect/denial.
- Create a tool via admin (if UI present) and confirm it appears in /tools for authenticated users.

## Change Guide
- Adding new admin sections: ensure role checks and RLS policies exist before wiring UI.
- Changing prompt schema: update ai_system_prompts table, SystemPromptManager, and related actions.
- If introducing granular admin roles, extend profiles.role and RLS policies accordingly.

## Implementation Guidance

**Primary Agent**: Backend Agent (admin RLS, service-role usage, system prompts, admin actions)
**Secondary Agent**: Frontend Agent (admin UI, route guards)

**Skills to Use**:
- `/doc-discovery` — Load tools and ai-context-engine docs before modifying admin functionality
- `/plan-lint` — Validate admin role checks and service-role scoping
- `/test-from-docs` — Verify admin access control and prompt editing

**Key Invariants**:
- Admin access determined by profiles.role='admin'; RLS and UI gating must enforce this
- ai_system_prompts rows unique by agent_type; admin edits must preserve uniqueness
- Service-role usage in admin actions must be scoped to admin users to avoid cross-tenant leakage

**Related Workflows**: docs/workflows/admin-management.md (if exists)

## Related Docs
- docs/features/tools.md
- docs/features/ai-context-engine.md
