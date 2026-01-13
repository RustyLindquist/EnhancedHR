---
id: org-courses
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-13
surfaces:
  routes:
    - /org-courses
    - /org-courses/[id]
    - /org-courses/[id]/builder
    - /org-courses/new/builder
  collections:
    - org-courses (virtual navigation collection)
data:
  tables:
    - public.courses (with org_id column)
    - public.modules
    - public.lessons
    - public.unified_embeddings (with org_id and 'org_course' source_type)
  storage:
    - course-images
    - mux-videos
backend:
  actions:
    - src/app/actions/org-courses.ts
    - src/lib/ai/org-course-embeddings.ts
    - src/lib/ai/context-resolver.ts
ai:
  context_scopes:
    - ORG_COURSES
  agent_types:
    - org_course_assistant
  models:
    - google/gemini-2.0-flash-001 (embeddings)
tests:
  local:
    - Create an org course, add modules/lessons, publish; verify it appears in org courses list
    - As employee, verify you can see published org courses but not drafts
    - Ask AI panel about org course content; verify org-scoped RAG returns content
  staging:
    - Verify org course embeddings are generated on publish
    - Verify org course embeddings are deleted on unpublish/delete
    - Verify cross-org isolation (org A users cannot see org B courses)
invariants:
  - org_id MUST be set on courses table for org courses; NULL = platform course
  - org_id MUST be set on unified_embeddings for org course content; enforces RAG scope isolation
  - Only org_admin and platform_admin can create/edit/delete org courses
  - Only org members can view org courses (enforced by RLS and RAG scope 8)
  - Embeddings are generated when course is published; deleted when unpublished
  - Navigation shows org-courses to employees ONLY if published courses exist
---

## Overview

Organization Courses is a feature that allows organizations to create, manage, and publish custom learning content exclusively for their org members. Unlike platform courses (available to all users), org courses are private to the organization that created them and can be used for onboarding, compliance training, product knowledge, or any company-specific content.

The feature includes full integration with the AI Context Engine, enabling the AIPanel to answer questions about org-specific course content while maintaining strict org-based isolation.

## User Surfaces

### Main Page: `/org-courses`
- Displays all org courses for the user's organization
- Status toggle (Published/Draft) for org admins - employees only see published
- Course card grid with status badges, thumbnails, and metadata
- "Create Course" button for org admins
- Informational section explaining the feature

### Course Detail: `/org-courses/[id]`
- View course details (reuses platform course detail components)
- Access to course player for consumption
- Link to builder for editing (org admins only)

### Course Builder: `/org-courses/[id]/builder` and `/org-courses/new/builder`
- Full course creation/editing interface
- Module and lesson management
- Video upload via Mux
- Author assignment from org members
- Publish/Unpublish actions

### AI Panel Integration
- Every org-courses page includes the AIPanel
- Agent type: `org_course_assistant`
- Context scope: `ORG_COURSES` with org ID
- Can answer questions about org course content
- Also includes platform context for general questions

## Core Concepts & Objects

### Org Course
A course with `org_id` set to the owning organization's UUID. Key differences from platform courses:
- **Visibility**: Only visible to members of that org
- **Management**: Only org admins (and platform admins) can create/edit/delete
- **RAG**: Content is embedded with org_id for scoped retrieval
- **Status**: Draft courses visible only to org admins

### Org Course Embeddings
When an org course is published, embeddings are generated for:
- Course overview (title, description, category, author)
- Modules (title, description)
- Lessons (title, description, transcript)

These embeddings are stored in `unified_embeddings` with:
- `source_type = 'org_course'`
- `org_id = <owning org UUID>`
- `course_id = <course ID>`

### Permission Model

| Role | Can View Published | Can View Drafts | Can Create | Can Edit | Can Delete |
|------|-------------------|-----------------|------------|----------|------------|
| Employee (org member) | Yes | No | No | No | No |
| Org Admin | Yes | Yes | Yes | Yes | Yes |
| Platform Admin | Yes | Yes | Yes | Yes | Yes |
| Non-org User | No | No | No | No | No |

## Data Model

### courses Table Changes
```sql
ALTER TABLE public.courses
ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
```
- `org_id = NULL`: Platform-wide course
- `org_id = <UUID>`: Organization-specific course

### unified_embeddings Table Changes
```sql
ALTER TABLE unified_embeddings
ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TYPE embedding_source_type ADD VALUE 'org_course';
```

### RLS Policies (courses table)

**SELECT**:
- Platform admins see all
- Published platform courses visible to all authenticated
- Org courses visible to org members only
- Authors see their own courses

**INSERT**:
- Platform admins can insert any
- Org admins can insert for their org
- Experts can insert draft platform courses

**UPDATE**:
- Platform admins can update any
- Org admins can update their org's courses
- Authors can update their own drafts

**DELETE**:
- Platform admins and org admins only

### RLS Policies (unified_embeddings table)

```sql
CREATE POLICY "Access Unified Embeddings" ON public.unified_embeddings
    FOR SELECT TO authenticated
    USING (
        (course_id IS NOT NULL AND org_id IS NULL) OR  -- Public Academy Content
        (user_id = auth.uid()) OR                       -- User's own content
        (org_id IN (                                    -- Org content for org members
            SELECT org_id FROM profiles WHERE id = auth.uid()
        ))
    );
```

## Permissions & Security

### Double-Layer Security for Org Content

Org course content is protected at two levels:

1. **RLS Layer**: Database policies prevent direct access to org content for non-members
2. **RAG Layer**: The `match_unified_embeddings` RPC function includes SCOPE 8 filtering by `orgId`, ensuring org content only returns for matching org members

This double protection ensures:
- Users cannot directly query for another org's content
- RAG queries do not accidentally surface cross-org content
- Even platform-wide searches exclude org-specific content (SCOPE 1 and 2 explicitly filter `org_id IS NULL`)

### Context Resolver Integration

```typescript
// In context-resolver.ts
if (context.type === 'ORG_COURSES' || context.collectionId === 'org-courses') {
    const userOrgId = context.orgId || profile?.org_id;
    if (userOrgId) {
        return {
            ...baseScope,
            orgId: userOrgId,
            isPlatformScope: true  // Also allow general questions
        };
    }
}
```

## Integration Points

### Navigation Panel
- Org Courses appears in NavigationPanel for all org members
- For employees: Only shows if org has published courses (via `hasPublishedOrgCourses`)
- For org admins: Always shows (they need to create courses)

### AI Panel
- Uses `agentType="org_course_assistant"`
- Uses `contextScope={{ type: 'ORG_COURSES', id: userOrgId }}`
- Agent config in AIPanel: amber theme, Library icon

### Course Builder
- Reuses platform course builder components
- Adds org-specific features (author assignment from org members)
- Publish action triggers embedding generation

### Content Assignments
- Org courses can be assigned to employees/groups (via existing assignment system)
- Assigned org courses appear in employee dashboards

## Server Actions

### `fetchOrgCoursesAction(orgId, status)`
Fetch org courses with optional status filter. Employees always get published only.

### `getOrgCourseCounts(orgId)`
Get counts for status toggle. Employees see `{ published: X, draft: 0 }`.

### `createOrgCourse(orgId)`
Create new draft org course with default module. Org admin only.

### `deleteOrgCourse(courseId, orgId)`
Delete org course and all related data including embeddings. Org admin only.

### `publishOrgCourse(courseId)`
Publish course and trigger embedding generation. Org admin only.

### `unpublishOrgCourse(courseId)`
Unpublish course and delete embeddings. Org admin only.

### `hasPublishedOrgCourses(orgId)`
Check if org has any published courses. Used for nav visibility.

### `getOrgMembersForAuthor(orgId)`
Get org members for author assignment dropdown.

### `assignOrgCourseAuthor(courseId, authorId)`
Assign an org member as course author.

## Embedding Service

### `generateOrgCourseEmbeddings(courseId, orgId)`
Generates embeddings for course overview, modules, and lessons. Called on publish.

### `deleteOrgCourseEmbeddings(courseId)`
Deletes all embeddings for a course. Called on unpublish/delete.

### `hasOrgCourseEmbeddings(courseId)`
Check if course has embeddings.

### `regenerateAllOrgCourseEmbeddings(orgId)`
Batch regenerate embeddings for all published org courses.

## Invariants

1. **org_id Consistency**: All org course data must have org_id set - courses, embeddings, etc.
2. **Embedding Lifecycle**: Embeddings created on publish, deleted on unpublish/delete
3. **Permission Enforcement**: RLS + RAG scoping must both enforce org isolation
4. **Status Visibility**: Draft courses hidden from employees in all contexts
5. **Author Org Match**: Assigned authors must belong to the same org

## Failure Modes & Recovery

### Embeddings Missing After Publish
1. Check if `generateOrgCourseEmbeddings` succeeded in logs
2. Re-publish the course or call `regenerateAllOrgCourseEmbeddings`
3. Verify `unified_embeddings` has rows with `source_type='org_course'`

### Org Course Visible to Wrong Users
1. Check RLS policies on courses table
2. Verify `org_id` is set correctly on the course
3. Check RAG scope 8 is working in `match_unified_embeddings`

### AI Panel Not Returning Org Content
1. Verify embeddings exist for the course
2. Check `contextScope` includes correct `orgId`
3. Verify ContextResolver is handling `ORG_COURSES` type
4. Check user's profile has correct `org_id`

### Draft Courses Visible to Employees
1. Check `fetchOrgCoursesAction` applies status filter
2. Verify `getOrgContext` returns correct `isOrgAdmin` value
3. Check RLS SELECT policy

## Testing Checklist

- [ ] Org admin can create, edit, publish, unpublish, delete org courses
- [ ] Employee can view published org courses but not drafts
- [ ] Employee cannot see "Create Course" button or draft toggle
- [ ] Non-org user cannot see org courses at all
- [ ] AI panel returns org course content when asked
- [ ] AI panel does NOT return other org's content
- [ ] Embeddings generated on publish (check unified_embeddings)
- [ ] Embeddings deleted on unpublish (check unified_embeddings)
- [ ] Navigation shows/hides based on published course existence

## Change Guide

### Adding New Course Fields
1. Update courses table migration
2. Update server actions in `org-courses.ts`
3. Update embedding generation in `org-course-embeddings.ts`
4. Update course builder UI

### Changing Permission Model
1. Update RLS policies (migration required)
2. Update server action permission checks
3. Update UI visibility logic
4. Update this doc

### Adding New Embedding Sources
1. Add to `buildCourseOverviewText`, `buildModuleText`, or `buildLessonText`
2. Or add new embedding generation function
3. Ensure metadata includes new fields
4. Test RAG retrieval

## Related Docs

- `docs/features/organization-membership.md` - Org membership and roles
- `docs/features/ai-context-engine.md` - RAG and embedding system
- `docs/features/author-portal.md` - Course builder (similar UI)
- `docs/foundation/auth-roles-rls.md` - RLS patterns
- `docs/architecture/org-scoped-content.md` - Org content architecture patterns
