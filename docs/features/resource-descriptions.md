---
id: resource-descriptions
owner: platform-engineering
status: active
stability: new
last_updated: 2026-02-21
surfaces:
  routes:
    - /admin/courses/[id]/builder (ResourcesEditorPanel, LessonEditorPanel)
    - /author/courses/[id]/builder (ResourcesEditorPanel, ExpertLessonEditorPanel)
    - /courses/[id] (CoursePageV2 viewer, CourseResourcePanel)
  collections: []
data:
  tables:
    - public.resources (description TEXT column)
  storage: []
backend:
  actions:
    - src/app/actions/course-builder.ts (addCourseResource, updateCourseResource, uploadModuleResourceFile, updateModuleResource, getCourseData)
    - src/app/actions/expert-course-builder.ts (addExpertCourseResource, updateExpertCourseResource, uploadExpertModuleResourceFile, updateExpertModuleResource)
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Add a course-level link resource with a description; verify description persists and displays in viewer.
    - Upload a module-level file resource with a description; verify description persists and displays in viewer.
    - Edit an existing resource description in ResourcesEditorPanel; verify auto-save on blur and debounce on typing.
    - Clear a resource description; verify empty state renders correctly in the viewer.
    - View an image resource with a description; verify gradient overlay at the bottom of the image.
    - View a non-image resource with a description; verify header + scrollable description layout.
    - View a course-level resource in CourseResourcePanel; verify "About This Resource" card appears when description exists.
  staging:
    - Create resources with descriptions via both admin and expert builders; verify learners see descriptions.
    - Verify description round-trips correctly through the database for all resource types.
invariants:
  - description column is optional (nullable TEXT); existing resources without descriptions continue to work unchanged.
  - Description is stored directly on the resources table, not in a related table or JSONB field.
  - Auto-save in ResourcesEditorPanel uses blur + 2-second debounce; does not require an explicit save button.
  - Expert resource actions (updateExpertCourseResource, etc.) require checkExpertCourseAccess() before delegating to shared course-builder actions.
  - CoursePageV2 renders description differently for image vs non-image resources; both paths must be maintained.
  - getCourseData() maps the description field from the database row to the Resource type; omitting this mapping breaks display.
---

## Overview

Resource Descriptions adds an optional free-text `description` field to course resources (both course-level and module-level). This allows course creators to provide context about what a resource contains, why it is relevant, or how learners should use it. Descriptions are editable inline in the course builder and displayed to learners in the course viewer alongside the resource content.

## User Surfaces

### Course Builder (Admin and Expert) -- Editor UIs

- **ResourcesEditorPanel** (`src/components/admin/course-panels/ResourcesEditorPanel.tsx`):
  - Each resource in the list renders a `ResourceListItem` component with an always-visible description textarea.
  - Auto-saves on blur with a 2-second debounce while typing.
  - Shows saving/saved status indicators next to the description field.
  - New link resources include a description textarea in the link creation form.
  - New `onRefresh` prop allows upload/link-add to refresh data without closing the panel.
  - "Done" button in the header closes the panel; "Add Resource" button is in the panel body.

- **LessonEditorPanel** (`src/components/admin/course-panels/LessonEditorPanel.tsx`):
  - Description textarea shown for file-type resources (both new uploads and existing resources in edit mode).
  - Description is passed to `uploadModuleResourceFile` on resource creation.
  - Description is included in `updateModuleResource` on resource save.

- **ExpertLessonEditorPanel** (`src/app/author/courses/[id]/builder/ExpertLessonEditorPanel.tsx`):
  - Mirrors LessonEditorPanel changes for the expert console.

### Course Viewer (Learner-facing) -- Display Components

- **CoursePageV2** (`src/components/course/CoursePageV2.tsx`):
  - **Image resources**: Gradient overlay at the bottom of the image with the description text (max 40% height, scrollable).
  - **Non-image resources**: Header area with file metadata, plus a scrollable description section below.
  - Empty state shown when no description is present.

- **CourseResourcePanel** (`src/components/course/CourseResourcePanel.tsx`):
  - "About This Resource" card displayed when a description exists.
  - Styled with a red/orange accent gradient header bar.

### Builder Client Wiring

- **AdminCourseBuilderClient** (`src/app/admin/courses/[id]/builder/AdminCourseBuilderClient.tsx`): Passes `resourceDescription` and `onRefresh` props to ResourcesEditorPanel.
- **ExpertCourseBuilderClient** (`src/app/author/courses/[id]/builder/ExpertCourseBuilderClient.tsx`): Same prop wiring as admin client.

## Data Model

### Schema Changes

Migration: `supabase/migrations/20260221000001_add_resource_description.sql`

```sql
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS description TEXT;
```

The column is nullable with no default. Existing resources will have `description = NULL`.

### Type Definition (`src/types.ts`)

```typescript
export interface Resource {
  id: string;
  title: string;
  type: 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'LINK';
  url: string;
  size?: string;
  module_id?: string;
  order?: number;
  estimated_duration?: string;
  description?: string;  // NEW: optional free-text description
}
```

## Server Actions

### Write Paths

| Operation | Server Action | Description Changes |
|-----------|---------------|---------------------|
| Add course-level resource | `addCourseResource(courseId, data)` | `data` now accepts `description` field |
| Update course-level resource | `updateCourseResource(resourceId, courseId, data)` | **NEW action** -- updates `title` and/or `description` for course-level resources |
| Upload module file resource | `uploadModuleResourceFile(courseId, moduleId, ...)` | Accepts optional `description` param; includes in DB insert |
| Update module resource | `updateModuleResource(resourceId, courseId, data)` | `data` type now includes `description` |

### Expert Write Paths

Expert wrappers in `expert-course-builder.ts` apply `checkExpertCourseAccess()` before delegating:

| Expert Action | Delegates To | Description Changes |
|---------------|-------------|---------------------|
| `addExpertCourseResource` | `addCourseResource` | Passes `description` through |
| `updateExpertCourseResource` | `updateCourseResource` | **NEW action** -- access-check wrapper around `updateCourseResource` |
| `uploadExpertModuleResourceFile` | `uploadModuleResourceFile` | Passes `description` through |
| `updateExpertModuleResource` | `updateModuleResource` | Passes `description` through |

### Read Paths

- `getCourseData()`: Maps `description` from the database row to the `Resource` type in the resource-mapping logic.

## Components

### ResourceListItem (New Sub-component)

Located within `ResourcesEditorPanel.tsx`. Renders a single resource row with:
- Resource title and type indicator
- Always-visible description textarea
- Auto-save behavior: saves on blur, debounces 2 seconds while typing
- Saving/saved status indicators

### Auto-Save Behavior

The description field in `ResourceListItem` uses a combined save strategy:
1. **Debounce on typing**: Waits 2 seconds after the last keystroke before saving.
2. **Save on blur**: Immediately saves when the user leaves the field.
3. **Status feedback**: Shows "Saving..." and "Saved" indicators to confirm persistence.

This calls either `updateCourseResource` (for course-level resources) or `updateModuleResource` (for module-level resources) depending on whether the resource has a `module_id`.

## Architecture Decisions

1. **Direct column on resources table**: Description is stored as a simple `TEXT` column directly on `public.resources`, not in a JSONB field or separate table. This keeps queries simple and avoids JSON parsing overhead.
2. **Auto-save pattern**: Uses blur + debounce rather than an explicit save button, reducing friction for content creators and matching modern editor UX expectations.
3. **Conditional viewer rendering**: CoursePageV2 uses different layouts for image vs non-image resources to handle the visual differences (overlay for images, dedicated section for documents).
4. **onRefresh prop pattern**: ResourcesEditorPanel accepts an `onRefresh` callback that refreshes course data without closing the panel, allowing seamless add-then-continue editing workflows.
5. **Shared action pattern**: `updateCourseResource` is a new shared action in `course-builder.ts` that both admin and expert paths use, with the expert path adding access-check gating.

## Files Modified

| File | Role |
|------|------|
| `supabase/migrations/20260221000001_add_resource_description.sql` | **NEW** -- Database migration |
| `src/types.ts` | Added `description?: string` to `Resource` interface |
| `src/app/actions/course-builder.ts` | Updated `addCourseResource`, `uploadModuleResourceFile`, `updateModuleResource`; **NEW** `updateCourseResource` |
| `src/app/actions/expert-course-builder.ts` | Updated `addExpertCourseResource`, `uploadExpertModuleResourceFile`, `updateExpertModuleResource`; **NEW** `updateExpertCourseResource` |
| `src/components/admin/course-panels/ResourcesEditorPanel.tsx` | **NEW** `ResourceListItem` sub-component, `onRefresh` prop, description textarea, auto-save |
| `src/components/admin/course-panels/LessonEditorPanel.tsx` | Description textarea for file resources |
| `src/app/author/courses/[id]/builder/ExpertLessonEditorPanel.tsx` | Mirror of LessonEditorPanel description changes |
| `src/components/course/CoursePageV2.tsx` | Description display for image and non-image resources |
| `src/components/course/CourseResourcePanel.tsx` | "About This Resource" card |
| `src/app/admin/courses/[id]/builder/AdminCourseBuilderClient.tsx` | `resourceDescription` and `onRefresh` prop wiring |
| `src/app/author/courses/[id]/builder/ExpertCourseBuilderClient.tsx` | Same prop wiring as admin client |

## Permissions & Security

No new permission model is required. Resource descriptions inherit the same access controls as the resources themselves:

| Role | View Description | Edit Description |
|------|-----------------|------------------|
| Platform Admin | Yes | Yes (via admin builder) |
| Expert (course owner) | Yes | Yes (via expert builder) |
| Org Admin (org course) | Yes | Yes (via org builder) |
| Learner | Yes (viewer only) | No |

## Failure Modes & Recovery

| Failure | Cause | Recovery |
|---------|-------|----------|
| Description not saving | Auto-save debounce not firing (e.g., tab closed mid-edit) | User re-opens panel; data reverts to last saved state |
| Description not displaying in viewer | `getCourseData()` not mapping `description` from DB | Verify the resource-mapping logic includes `description` field |
| Migration not applied | Migration file not run against database | Run `supabase db push` or apply migration manually |
| Description appears as `null` in UI | Textarea rendering null instead of empty string | Ensure fallback to empty string in textarea value prop |

## Testing Checklist

### Editor Tests (Admin + Expert)
- [ ] Open ResourcesEditorPanel; verify each resource shows a description textarea.
- [ ] Type in description field; verify "Saving..." indicator appears after 2 seconds.
- [ ] Blur description field; verify immediate save triggers and "Saved" indicator appears.
- [ ] Add new link resource with description; verify description persists after refresh.
- [ ] Upload file resource in LessonEditorPanel with description; verify description persists.
- [ ] Edit existing module resource description in LessonEditorPanel; verify save includes description.

### Viewer Tests (Learner)
- [ ] View non-image resource with description; verify header + scrollable description layout.
- [ ] View image resource with description; verify gradient overlay at bottom with description.
- [ ] View resource without description; verify clean empty state (no broken layout).
- [ ] Open course-level resource in CourseResourcePanel with description; verify "About This Resource" card appears.
- [ ] Open course-level resource in CourseResourcePanel without description; verify card is hidden.

### Edge Cases
- [ ] Very long description text; verify scrollable area works correctly in both viewer layouts.
- [ ] Description with special characters and line breaks; verify `whitespace-pre-wrap` renders correctly.
- [ ] Rapid typing in description field; verify debounce prevents excessive API calls.
- [ ] Concurrent editing (two tabs); verify last-write-wins without data corruption.

## Change Guide

- **Adding description to other resource-like entities**: Follow the same pattern -- add nullable TEXT column, map in data-fetching action, add textarea with auto-save in editor.
- **Changing auto-save behavior**: Modify debounce timing and blur handler in `ResourceListItem` within `ResourcesEditorPanel.tsx`.
- **Changing viewer description layout**: Update `CoursePageV2.tsx` for inline module resources and `CourseResourcePanel.tsx` for course-level resources.
- **Adding rich text/markdown to descriptions**: Replace textarea with a markdown editor component; update viewer to render markdown instead of `whitespace-pre-wrap` text.

## Implementation Guidance

**Primary Agent**: Backend Agent (migration, server actions, data mapping)
**Secondary Agent**: Frontend Agent (editor UIs, viewer display, auto-save pattern)

**Skills to Use**:
- `/doc-discovery` -- Load inline-module-resources and course-player docs before modifying resource patterns
- `/plan-lint` -- Validate changes to resources table and server actions
- `/test-from-docs` -- Verify description round-trips through create/edit/view flows

**Key Patterns to Follow**:
- Auto-save with debounce pattern from `ResourceListItem`
- Expert wrapper pattern from `expert-course-builder.ts`
- Conditional image/non-image rendering in `CoursePageV2.tsx`

## Related Docs

- docs/features/inline-module-resources.md (module-level resource system, Resource type definition)
- docs/features/course-player-and-progress.md (CoursePageV2 viewer, resource display)
- docs/features/expert-resources.md (expert resource patterns, admin client usage)
- docs/features/author-portal.md (Expert Console course builder)
- docs/features/admin-portal.md (Admin course builder)
- docs/foundation/supabase-schema-and-migrations.md (migration patterns)
