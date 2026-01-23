---
id: expert-resources
owner: platform-engineering
status: active
stability: new
last_updated: 2026-01-23
surfaces:
  routes:
    - /author/resources
  collections:
    - expert-resources (special platform-wide collection)
data:
  tables:
    - public.user_context_items (collection_id = 'expert-resources')
  storage:
    - user-context-files bucket (path: {user_id}/expert-resources/*)
backend:
  actions:
    - src/app/actions/expertResources.ts
ai:
  context_scopes: []
  models:
    - google/gemini-2.0-flash-001 (for file summary generation)
tests:
  local:
    - Access /author/resources as platform admin; verify action buttons visible.
    - Access /author/resources as non-admin expert; verify read-only mode (no action buttons).
    - Create note, context, and file resources as admin; verify they appear in grid.
    - Click a resource as non-admin expert; verify read-only view panel opens.
    - Click a resource as admin; verify edit panel opens.
    - Delete a resource as admin; confirm deletion and refresh.
  staging:
    - Platform admin creates resources; verify all expert users can view them.
    - Verify file uploads generate AI summaries.
invariants:
  - Only platform admins (role='admin') can create, update, or delete expert resources.
  - All experts (pending, approved, rejected) can view expert resources.
  - Expert resources use collection_id='expert-resources' (a reserved platform-wide identifier).
  - Admin client is required to bypass RLS since resources are shared across all users.
  - Custom handlers must be passed to TopContextPanel and AddNotePanel for expert resources.
---

## Overview

Expert Resources is a platform-wide resource library within the Expert Console that allows Platform Admins to share helpful materials (notes, context items, and files) with all experts on the platform. Unlike personal collections which are user-scoped, expert resources are visible to all users with expert status, making them ideal for training materials, guidelines, and reference documents.

## User Surfaces

- **Expert Resources page** (`/author/resources`): Grid display of all expert resources using UniversalCard components.
- **Admin action bar**: Platform admins see Note, Context, and File buttons to add resources.
- **Add/Edit panels**: TopContextPanel (for context/files) and AddNotePanel (for notes) with custom handlers.
- **Read-only view panel**: ResourceViewPanel for non-admin experts to view resource content.
- **Expert Console navigation**: "Expert Resources" link in left nav (via EXPERT_NAV_ITEMS constant).

## Core Concepts & Objects

- **Expert Resource**: A `user_context_items` row with `collection_id='expert-resources'` that is visible to all experts.
- **Platform Admin**: A user with `profiles.role='admin'` who can create, update, and delete expert resources.
- **Expert**: Any user with `author_status` in ('pending', 'approved', 'rejected') who can view expert resources.
- **Custom Handler Pattern**: Optional handler functions passed to panel components to override default RLS-bound operations.

### Resource Types

| Type | Description | Panel Used | Content Schema |
|------|-------------|------------|----------------|
| Note | Markdown-formatted text with `isNote: true` flag | AddNotePanel | `{ text: string, isNote: true }` |
| Context | Plain text context item | TopContextPanel | `{ text: string }` |
| File | Uploaded document with AI-generated summary | TopContextPanel | `{ fileName, fileType, fileSize, url, storagePath, summary }` |

## Data Model

Expert resources use the existing `user_context_items` table with a special collection identifier:

```
user_context_items (for expert resources)
├── id: uuid (PK)
├── user_id: uuid (creator - always a platform admin)
├── collection_id: text = 'expert-resources' (special reserved ID)
├── type: context_item_type enum (CUSTOM_CONTEXT, FILE)
├── title: text
├── content: jsonb
├── created_at: timestamp
└── updated_at: timestamp
```

**Key distinction**: Unlike normal context items where `collection_id` is a UUID referencing `user_collections`, expert resources use the string literal `'expert-resources'` as a reserved platform-wide identifier.

### Write Paths (Admin Only)

All write operations require:
1. Authenticated user check via `createClient()`
2. Platform admin verification via `isPlatformAdmin()` helper
3. Admin client (`createAdminClient()`) to bypass RLS

| Operation | Action | Auth Check |
|-----------|--------|------------|
| Create note/context | `createExpertResource()` | Platform admin required |
| Create file | `createExpertFileResource()` | Platform admin required |
| Update resource | `updateExpertResource()` | Platform admin required |
| Delete resource | `deleteExpertResource()` | Platform admin required |

### Read Paths (All Experts)

| Operation | Action | Auth Check |
|-----------|--------|------------|
| List all resources | `getExpertResources()` | Any authenticated user |

Note: `getExpertResources()` uses admin client to bypass RLS, but only reads from the 'expert-resources' collection.

## Permissions & Security

### Access Control Matrix

| Role | View Resources | Create | Edit | Delete |
|------|---------------|--------|------|--------|
| Platform Admin | Yes | Yes | Yes | Yes |
| Approved Expert | Yes | No | No | No |
| Pending Expert | Yes | No | No | No |
| Rejected Expert | Yes | No | No | No |
| Regular User | No (redirected) | No | No | No |

### RLS Bypass Pattern

Expert resources require admin client because:
- Standard RLS restricts `user_context_items` to owner (`user_id = auth.uid()`)
- Expert resources need to be readable by ALL experts, not just the creator
- The collection ID 'expert-resources' is a string literal, not a real collection UUID

**Security measures in server actions:**
1. User authentication verified via `supabase.auth.getUser()`
2. Platform admin role checked via profile lookup
3. Operations scoped to `collection_id = 'expert-resources'`
4. Path revalidation after mutations

## Integration Points

### Panel Components with Custom Handlers

Both `TopContextPanel` and `AddNotePanel` accept optional custom handlers to override default behavior:

```typescript
// TopContextPanel custom handler props
customCreateHandler?: (data: { type: ContextItemType; title: string; content: any })
  => Promise<{ success: boolean; error?: string; id?: string }>;
customUpdateHandler?: (id: string, updates: { title?: string; content?: any })
  => Promise<{ success: boolean; error?: string }>;
customFileCreateHandler?: (fileName: string, fileType: string, fileBuffer: ArrayBuffer)
  => Promise<{ success: boolean; error?: string; id?: string }>;

// AddNotePanel custom handler props
customCreateHandler?: (data: { type: 'CUSTOM_CONTEXT'; title: string; content: any })
  => Promise<{ success: boolean; error?: string }>;
customUpdateHandler?: (id: string, updates: { title?: string; content?: any })
  => Promise<{ success: boolean; error?: string }>;
```

When custom handlers are provided, the panels use them instead of the default `createContextItem`/`updateContextItem` actions.

### Navigation Integration

Expert Resources is integrated into the Expert Console navigation via `EXPERT_NAV_ITEMS` in `src/constants.ts`:

```typescript
export const EXPERT_NAV_ITEMS: NavItemConfig[] = [
    { id: 'author', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'author/courses', label: 'My Courses', icon: BookOpen },
    { id: 'author/resources', label: 'Expert Resources', icon: Layers },
    // ...
];
```

### File Processing Pipeline

For file uploads, `createExpertFileResource()` follows this pipeline:
1. Parse file content via `parseFileContent()`
2. Generate AI summary using `generateQuickAIResponse()` (if text > 50 chars)
3. Upload to storage via `uploadFileToStorage()`
4. Create `user_context_items` row with content metadata

## Architecture

### File Structure

```
src/
├── app/
│   ├── author/
│   │   └── resources/
│   │       ├── page.tsx              # Server component (auth + data fetch)
│   │       └── ExpertResourcesCanvas.tsx  # Client component (UI + interactions)
│   └── actions/
│       └── expertResources.ts        # Server actions with admin client
└── components/
    ├── AddNotePanel.tsx              # Note creation/editing (extended with custom handlers)
    ├── TopContextPanel.tsx           # Context/file creation (extended with custom handlers)
    └── ResourceViewPanel.tsx         # Read-only view for non-admin experts
```

### Component Responsibilities

| Component | Role |
|-----------|------|
| `page.tsx` | Auth check, admin status determination, initial data fetch |
| `ExpertResourcesCanvas.tsx` | Grid rendering, panel state management, custom handler wiring |
| `AddNotePanel` | Note creation/editing UI with optional custom handlers |
| `TopContextPanel` | Context/file creation UI with optional custom handlers |
| `ResourceViewPanel` | Read-only view panel for non-admin experts |

### Data Flow

```
[Platform Admin Creates Resource]
     │
     ▼
ExpertResourcesCanvas (onClick)
     │
     ├─[Note]─► AddNotePanel (customCreateHandler) ─► createExpertResource()
     │
     └─[Context/File]─► TopContextPanel (customCreateHandler/customFileCreateHandler)
                             │
                             ├─[Text]─► createExpertResource()
                             └─[File]─► createExpertFileResource()
                                              │
                                              ▼
                                    [Parse → AI Summary → Storage → DB]

[All Experts View Resources]
     │
     ▼
page.tsx ─► getExpertResources() ─► ExpertResourcesCanvas (renders UniversalCard grid)
     │
     └─[Non-admin clicks card]─► ResourceViewPanel (read-only view)
```

## Invariants

1. **Collection ID is reserved**: The string `'expert-resources'` must never be used as a UUID for normal collections.
2. **Admin client required**: All write operations must use `createAdminClient()` to bypass RLS.
3. **Platform admin gating**: Create/update/delete operations must verify `role='admin'` before proceeding.
4. **Custom handlers required**: When using TopContextPanel/AddNotePanel for expert resources, custom handlers must be passed to override default RLS-bound operations.
5. **Expert access only**: The `/author/resources` page requires expert status (pending/approved/rejected).

## Failure Modes & Recovery

| Failure | Cause | Recovery |
|---------|-------|----------|
| "Forbidden" error on create | User is not platform admin | Verify `profiles.role = 'admin'` |
| Resources not visible | User lacks expert access | Check `author_status` is not 'none' |
| File upload fails | Storage permissions or file size | Check bucket policies and file size limits |
| AI summary missing | Summary generation failed (non-blocking) | File still created; summary field is null |
| Panel uses wrong handler | Custom handler not passed | Verify `customCreateHandler` prop is set |

## Testing Checklist

### Platform Admin Tests
- [ ] Navigate to /author/resources as admin; verify action buttons (Note, Context, File) visible.
- [ ] Create a note; verify it appears in the grid with amber NOTE card styling.
- [ ] Create a context item; verify it appears in the grid with orange CONTEXT card styling.
- [ ] Upload a file; verify it appears with AI-generated summary preview.
- [ ] Click a resource; verify edit panel opens with pre-filled content.
- [ ] Delete a resource; confirm deletion dialog and verify removal from grid.

### Non-Admin Expert Tests
- [ ] Navigate to /author/resources as pending/approved/rejected expert.
- [ ] Verify NO action buttons visible (no Note, Context, File buttons).
- [ ] Click a resource; verify read-only ResourceViewPanel opens.
- [ ] Verify file download button works in read-only view.
- [ ] Verify markdown content renders correctly in read-only view.

### Edge Cases
- [ ] Create resource with empty title; verify validation prevents save.
- [ ] Upload file > 10MB; verify error handling.
- [ ] Rapid create/delete; verify no race conditions.
- [ ] Access /author/resources as non-expert user; verify redirect to /teach.

## Change Guide

- **Adding new resource types**: Update `getCardType()` helper in ExpertResourcesCanvas, add handling in TopContextPanel, and extend `createExpertResource()`.
- **Changing admin verification**: Update `isPlatformAdmin()` in expertResources.ts and any route guards.
- **Changing expert access rules**: Update page.tsx access check (`hasExpertAccess` logic).
- **Adding edit permissions for experts**: Remove `isPlatformAdmin` check from edit panel logic; pass custom handlers conditionally.
- **Changing the collection identifier**: Search for all uses of `'expert-resources'` string and update consistently.

## Implementation Guidance

**Primary Agent**: Backend Agent (server actions, admin client patterns, permission checks)
**Secondary Agent**: Frontend Agent (panel integration, role-based UI rendering)

**Skills to Use**:
- `/doc-discovery` - Load collections-and-context docs before modifying context item patterns
- `/plan-lint` - Validate changes to user_context_items or admin client usage
- `/test-from-docs` - Verify permission boundaries and custom handler integration

**Key Patterns to Follow**:
- Admin client pattern from `collections-and-context.md`
- Custom handler pattern established in this feature
- UniversalCard usage from `docs/frontend/components/UniversalCard.md`

## Related Docs

- docs/features/collections-and-context.md (context item data model, RLS patterns)
- docs/features/experts.md (expert status definitions)
- docs/features/author-portal.md (Expert Console access rules)
- docs/frontend/components/UniversalCard.md (card component usage)
