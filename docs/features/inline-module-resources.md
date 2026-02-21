# Inline Module Resources ("File" Learning Element)

---

## Invariants

- Resources with `module_id = NULL` remain course-level; existing behavior unchanged.
- Resources with `module_id` set appear inline within that module only.
- Lessons and resources share the `order` column within a module for unified sorting.
- The flat navigation list in CoursePageV2 includes all items across all modules, ordered by module sequence then item order.
- `activeLessonId` and `activeResourceId` are mutually exclusive; only one can be non-null at a time.
- Module deletion cascades to all inline resources via FK ON DELETE CASCADE.
- uploadModuleResourceFile computes shared order as MAX(lessons.order, resources.order) + 1.
- RAG embeddings are generated asynchronously; embedding failure does not block the upload.
- FileUploadZone enforces a 25MB file size limit and validates against supported document/image types.
- Expert module resource actions require checkExpertCourseAccess() authorization before delegating to shared course-builder actions.
- resources.estimated_duration defaults to '0m'; file resources and quiz lessons accept optional estimated time input from course builders.
- Total course duration = sum of all video durations + quiz estimated durations + file resource estimated durations.

---

## Overview

Inline Module Resources allows course creators to embed documents and files directly within course modules, interleaved with lessons. Previously, resources could only be attached at the course level. With this feature, resources participate in the module's ordered item list, appear alongside lesson cards in both the builder and the viewer, and are included in the sequential prev/next navigation within the course player.

## User Surfaces

### Course Builder (Admin and Expert)

- **Add Item button**: Each module has an "Add Item" button (previously "Add Lesson") that opens the LessonEditorPanel.
- **File type option**: The element type selector includes "File" (with Upload icon) alongside Video and Quiz. Selecting File shows the FileUploadZone drag-and-drop component.
- **Estimated Completion Time**: When File or Quiz type is selected, an optional "Estimated Completion Time (minutes)" input appears below the type-specific content. Input validates for positive numbers and converts to standard duration format (e.g., "15m", "1h 30m"). This value is included in the aggregate course time calculation.
- **Resource cards in module**: Uploaded resources appear as cards within the module grid, visually distinguished by a red RESOURCE badge and Paperclip icon.
- **Click-to-edit**: Clicking a resource card opens the LessonEditorPanel in resource editing mode (title editing, file info display, download link, delete action).
- **Reordering**: Lessons and resources share the `order` column within a module.

### Course Viewer (CoursePageV2)

- **Inline resource display**: ModuleContainer merges lessons and resources by `order` and renders resource cards alongside lesson cards in both grid and list views.
- **Resource detail view**: Clicking a resource displays content in the main player area:
  - **Image resources** (type `IMG` or image URL extension): Inline image preview with discreet title overlay (top-left), download button (top-right), and description gradient overlay at bottom when description exists.
  - **Non-image resources**: Header with file icon, title, type/size metadata, and download button; scrollable description section below when description exists.
- **Unified navigation**: Prev/next buttons step sequentially through all lessons and resources across all modules.
- **Course-level resources**: Resources without `module_id` continue to appear in the course resources section at the bottom.

## Data Model

### Schema Changes

Migration: `supabase/migrations/20260211000001_add_module_resources.sql`

```sql
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_resources_module_id
  ON public.resources(module_id) WHERE module_id IS NOT NULL;
```

Migration: `supabase/migrations/20260211_add_resource_estimated_duration.sql`

```sql
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS estimated_duration text DEFAULT '0m';
```

### Type Definitions (`src/types.ts`)

```typescript
export interface Resource {
  id: string;
  title: string;
  type: 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'LINK';
  url: string;
  size?: string;
  module_id?: string;  // When set, resource appears inline within this module
  order?: number;              // Display order within module (shared with lessons)
  estimated_duration?: string; // Expected completion time (e.g., "15m", "1h 30m")
  description?: string;        // Optional free-text description (see docs/features/resource-descriptions.md)
}

export interface Lesson {
  // ... existing fields ...
  order?: number;       // Display order within module (shared with resources)
}

export type ModuleItem =
  | { kind: 'lesson'; data: Lesson; order: number }
  | { kind: 'resource'; data: Resource; order: number };
```

## Server Actions

### Write Paths

| Operation | Server Action | Description |
|-----------|---------------|-------------|
| Upload file to module | `uploadModuleResourceFile(courseId, moduleId, fileName, fileType, fileBuffer, estimatedDuration?, description?)` | Uploads file, detects type, computes shared order, inserts resource with `module_id`, optional `estimated_duration`, and optional `description` |
| Update resource | `updateModuleResource(resourceId, courseId, data)` | Updates resource title, `estimated_duration`, and/or `description` |
| Reset course durations | `resetCourseDurations(courseId)` | Fetches video durations, aggregates with quiz/file estimated times, updates `course.duration` |
| Delete module resource | `deleteModuleResource(resourceId, courseId)` | Deletes resource, cleans up storage file and embeddings |
| Reorder module items | `reorderModuleItems(moduleId, courseId, orderedItems)` | Sets `order` on both lessons and resources within a module |

### Expert Write Paths

Expert wrappers in `expert-course-builder.ts` apply `checkExpertCourseAccess()` before delegating:

| Expert Action | Delegates To |
|---------------|-------------|
| `uploadExpertModuleResourceFile` | `uploadModuleResourceFile` |
| `updateExpertModuleResource` | `updateModuleResource` |
| `deleteExpertModuleResource` | `deleteModuleResource` |
| `reorderExpertModuleItems` | `reorderModuleItems` |

### Read Paths

- `getCourseForBuilder()`: Returns `module_id` and `order` in resource mapping, `order` in lesson mapping.
- `fetchCourseModules()`: Returns `order` in lesson mapping. CoursePageV2 splits resources into `courseResources` and `moduleResourcesMap`.

## Components

### FileUploadZone (`src/components/admin/FileUploadZone.tsx`)

Reusable drag-and-drop upload component. Features: drag feedback, click-to-browse, single/multi-file modes, file validation (25MB, supported types), upload progress indicator, deduplication.

### LessonEditorPanel / ExpertLessonEditorPanel

Updated to support three modes:
1. **Lesson mode** (default): Standard lesson editor with type selector. For Quiz type, includes QuizBuilder and estimated completion time input.
2. **Resource editing mode** (when `resourceId` prop set): Shows file info, download link, title and estimated time editing, description textarea, delete action.
3. **File creation mode** (type "File" + new): Shows FileUploadZone, estimated completion time input, and description textarea.

When type is Quiz or File, shows "Estimated Completion Time (minutes)" input that validates for positive numbers and saves as standard duration format. File type additionally shows a description textarea (see `docs/features/resource-descriptions.md`).

### Builder Resource Cards

- **Admin**: `ModuleResourceCardAdmin` in `CourseBuilderView.tsx` — red badge, click-to-edit.
- **Expert**: `ExpertModuleResourceCard` in `ExpertCourseBuilderClient.tsx` — same pattern.

### CoursePageV2 Navigation

- `navigationItems`: Flat ordered array of all lessons and resources across modules.
- `goToNextItem` / `goToPreviousItem`: Unified navigation handling both types.
- Resource viewer: Conditional image preview vs download card rendering.

### ModuleContainer (Viewer)

Accepts `moduleResources` prop, merges with lessons by `order`, renders in grid/list views with red RESOURCE badge styling.

## Label Changes (Builder UI)

| Previous Label | New Label |
|---------------|-----------|
| Add Lesson | Add Item |
| Add New Lesson | Add Learning Element |
| Lesson Title | Element Title |
| Lesson Type | Element Type |
| Article | File |
| Create Lesson | Create Element |

## Architecture Decisions

1. **Shared LessonEditorPanel**: Resources reuse the existing panel, reducing duplication.
2. **Shared order column**: Lessons and resources occupy the same ordering space.
3. **Flat navigation array**: Single array across all modules for seamless prev/next.
4. **Image detection heuristic**: Dual check via `Resource.type === 'IMG'` and URL extension regex.
5. **Mutually exclusive active states**: `activeLessonId` and `activeResourceId` never set simultaneously.
6. **Async embedding generation**: Non-blocking, failures logged but don't block upload.
7. **Optional estimated duration**: Time estimates are optional for quiz/file; default to '0m' if not provided.
8. **Unified duration aggregation**: `resetCourseDurations()` sums video durations (auto-fetched) + quiz estimated times + file estimated times into one course total.

## Files Modified

| File | Role |
|------|------|
| `supabase/migrations/20260211000001_add_module_resources.sql` | Migration |
| `src/types.ts` | Type definitions |
| `src/components/admin/FileUploadZone.tsx` | **NEW** — Upload component |
| `src/app/actions/course-builder.ts` | Server actions |
| `src/app/actions/expert-course-builder.ts` | Expert wrappers |
| `src/lib/courses.ts` | Data fetching |
| `src/components/admin/AdminCoursePageWrapper.tsx` | Builder context |
| `src/app/admin/courses/[id]/builder/AdminCourseBuilderClient.tsx` | Admin builder state |
| `src/app/admin/courses/[id]/builder/CourseBuilderView.tsx` | Admin builder view |
| `src/app/author/courses/[id]/builder/ExpertCourseBuilderClient.tsx` | Expert builder |
| `src/app/author/courses/[id]/builder/ExpertLessonEditorPanel.tsx` | Expert lesson editor |
| `src/components/admin/course-panels/LessonEditorPanel.tsx` | Admin lesson editor |
| `src/components/course/CoursePageV2.tsx` | Course viewer |
| `src/components/course/ModuleContainer.tsx` | Module container |

## Related Docs

- `docs/features/course-player-and-progress.md`
- `docs/features/expert-resources.md`
- `docs/features/resource-descriptions.md` (optional description field on resources)
- `docs/features/author-portal.md`
- `docs/features/admin-portal.md`
