---
id: admin-portal
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-02-07
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
    - src/app/actions/users.ts (getUsers, updateBillingDisabled, updateSalesStatus, updateAuthorStatus)
    - src/app/actions/leads.ts (getLeads, updateLeadStatus, updateLeadNotes, getLeadOwners)
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
  - Admin Users table includes Sales Account toggle (is_sales) and Billing Disabled toggle in Roles & Permissions.
  - Admin Leads page (/admin/leads) shares LeadsTable component with Sales Console (/sales/leads).
  - Admin Expert creation (/admin/experts/add) includes CredentialsEditor with standaloneExpertId support. Save/cancel buttons are in page header.
---

## Overview
Admin Portal provides privileged management of system resources such as AI system prompts, tools, courses, and user profiles. Access is limited to users whose `profiles.role` is `admin`.

## User Surfaces
- `/admin` pages (e.g., System Prompt Manager) for editing ai_system_prompts.
- `/admin/courses/[id]/builder` for editing courses with full Quiz Builder support.
- `/admin/experts/add` for creating expert profiles with credentials/skills management (CredentialsEditor).
- Potential course/tool management pages under /admin (code scaffolding).

## Course Management Features

### Quiz Builder
Admins can create and edit quiz assessments for lessons:
- **Location**: Admin Lesson Editor Panel (LessonEditorPanel.tsx)
- **Access**: Select "Quiz" as the lesson type to reveal the Quiz Builder UI
- **Features**:
  - Set passing score (0-100%) - note: this does NOT gate lesson completion
  - Add/remove questions with text input
  - Add/remove answer options per question (minimum 2)
  - Mark correct answer (one per question)
  - Add optional explanation per question (shown after submission)
  - Reorder questions with up/down arrows

See `docs/features/course-player-and-progress.md` for quiz data model and behavior details.

### Drag-and-Drop Lesson Reordering
Admins can reorder lessons within and between modules using drag-and-drop:
- **Location**: Admin Course Builder (CourseBuilderView.tsx)
- **Library**: @dnd-kit (core, sortable, utilities)
- **Features**:
  - **Drag Handle**: Full-width blue bar at top of lesson cards, appears on hover, shows "Drag to Reorder" text with grip icons
  - **Within-Module Reorder**: Drag lessons to reposition within the same module
  - **Cross-Module Move**: Drag lessons between different expanded modules
  - **Empty Module Drop**: Empty modules accept drops via the "Add Lesson" button which transforms into a drop target during drag
  - **Optimistic Updates**: UI updates immediately during drag; reverts on error
- **Server Actions**:
  - `reorderLessons(lessonIds: string[])` - Batch reorder lessons within a module
  - `moveLessonToModule(lessonId, targetModuleId, newOrder?)` - Move lesson to different module
  - `reorderModules(moduleIds: string[])` - Batch reorder modules within a course
- **Technical Details**:
  - Custom collision detection prioritizes add-lesson buttons, then module zones, then closest-center for lesson-to-lesson
  - Unique drop zone IDs: `add-lesson-drop-${moduleId}` vs `module-drop-${moduleId}` to avoid conflicts
  - Components: `SortableLessonCardAdmin`, `LessonDragOverlay`, `DroppableModuleZone`, `DroppableAddLessonButton`

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
