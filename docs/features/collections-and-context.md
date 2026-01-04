---
id: collections-and-context
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /dashboard?collection=:id
    - /org/collections
    - /org/collections/[id]
  collections:
    - favorites
    - research
    - to_learn
    - personal-context
    - conversations
    - notes
    - tools
    - custom:* (user-created)
data:
  tables:
    - public.user_collections
    - public.collection_items
    - public.user_context_items
    - public.unified_embeddings
    - public.conversations
    - public.notes
    - public.courses
    - public.modules
    - public.lessons
  storage:
    - user-context-files (Supabase storage bucket)
backend:
  actions:
    - src/app/actions/collections.ts
    - src/app/actions/context.ts
    - src/app/actions/insights.ts
    - src/app/actions/notes.ts
  api:
    - src/app/api/chat/route.ts
    - src/app/api/chat/stream/route.ts
ai:
  context_scopes:
    - COLLECTION
    - PERSONAL_CONTEXT
    - PLATFORM
    - DASHBOARD
    - COURSE
  models:
    - google/gemini-2.0-flash-001
tests:
  local:
    - pnpm dev (app shell) and run checklist below
  staging:
    - Save course + context to a new collection, query Collection Assistant for that content
invariants:
  - Default system collections are identified solely by labels "Favorites", "Workspace", "Watchlist", "Personal Context"; alias resolution always picks the oldest row per label.
  - collection_items primary key (collection_id, item_type, item_id) must remain intact; course rows also set course_id for filtering and RAG scopes.
  - user_context_items must store user_id and optional collection_id (uuid-as-text); RLS restricts all CRUD to the owner.
  - Embeddings for context items are written to unified_embeddings with matching user_id and collection_id, and match_unified_embeddings relies on those fields for scope filters.
  - Personal context is always included in AI scopes unless explicitly disabled; collection scopes combine collection items + collection-scoped context + personal context.
---

## Overview
Collections let users and org admins organize heterogeneous learning objects (courses, lessons, notes, conversations, tools, custom context, files) into named workspaces and feed those items into AI assistants. System collections (Favorites, Workspace, Watchlist, Personal Context) are created per-user; custom collections are user-defined. Collection contents drive saved-state UI, navigation, and the retrieval scope for the Collection Assistant and other agents via unified_embeddings.

## User Surfaces
- `/dashboard` main app shell: left navigation shows system + custom collections with counts; query param `collection` selects active view.
- CollectionSurface (bottom drag target) + AddCollectionModal: drag/drop or select items to save, create new collections inline.
- TopContextPanel: create/edit custom context, profile details, AI insights, or file uploads for the active collection (notably Personal Context).
- Collection detail canvas (MainCanvas): renders mixed items from `collection_items` and `user_context_items`, supports delete/rename and note/conversation actions.
- Org collection editor (`/org/collections/[id]`): upserts org-scoped collections (`is_org_collection=true`).
- AI panel: Collection Assistant uses the active collection scope; Platform/Dashboard scope uses all user context; Course assistant/tutor include personal context by default.

## Core Concepts & Objects
- **System collections**: per-user rows labeled exactly `Favorites`, `Workspace`, `Watchlist`, `Personal Context`; alias keys `favorites|research|to_learn|personal-context` resolve to these rows and are auto-created when missing.
- **Custom collections**: `user_collections.is_custom=true`, arbitrary label/color; deletable by owner.
- **Collection items (standard content)**: `collection_items` rows referencing collection_id + item_type (COURSE, MODULE, LESSON, CONVERSATION, NOTE, TOOL, etc.) with optional course_id shortcut.
- **User context items**: `user_context_items` rows scoped to user_id, type `AI_INSIGHT|CUSTOM_CONTEXT|FILE|PROFILE`, optional collection_id (uuid-as-text). These represent personal/collection-specific context objects and back unified_embeddings.
- **Conversations**: `conversations.metadata.collection_ids` (legacy) and `collection_items` entries for item_type `CONVERSATION` keep chat history visible in collections; `is_saved` mirrors presence of any collections.
- **Embeddings**: `unified_embeddings` stores both course embeddings and user context embeddings; `match_unified_embeddings` filters by collectionId/allowedCourseIds/allowedItemIds and always includes personal context when permitted.

## Data Model
- **user_collections**: `id` (uuid), `user_id`, `label`, `color`, `is_custom` (default true), `is_org_collection` (default false), `org_id`, `created_at`; PK `id`; org/admin RLS below. System resolution always selects the oldest row per label to avoid duplicates.
- **collection_items**: `collection_id` (uuid FK → user_collections CASCADE), `item_type` text, `item_id` text, `course_id` bigint nullable, `added_at`; PK `(collection_id, item_type, item_id)`. Course items should populate both `item_id` and `course_id` for RAG filtering.
- **user_context_items** (migration 20251208000001): `id` uuid PK, `user_id` uuid (auth.users), `collection_id` text nullable (expected to hold collection uuid string), `type` enum context_item_type, `title`, `content` jsonb, timestamps; indexes on user_id, collection_id. No FK to user_collections—manual cleanup needed on collection delete.
- **unified_embeddings**: `id`, `user_id`, `course_id`, `collection_id`, `source_type` (lesson|custom_context|file|conversation|profile), `source_id`, `content`, `embedding vector(768)`, `metadata`, `created_at`; RLS allows course rows to all authenticated, private rows only to owner; service_role full access. RPC `match_unified_embeddings` uses `filter_scope` (collectionId, allowedCourseIds, allowedItemIds, includePersonalContext, includeAllUserContext, isPlatformScope, isGlobalAcademy, userId).
- **conversations**: `metadata.collection_ids` array (legacy) plus collection_items rows for canonical membership; `is_saved` toggled when any collections are attached.
- **notes**: note rows saved in `notes` table; membership tracked through `collection_items` item_type `NOTE`.
- **courses/modules/lessons**: referenced from collection_items for nested content; `courses.collections` text[] is legacy and not source of truth.
- **Storage**: bucket `user-context-files` (public read). Object key must start with `<user_id>/[collection_id|personal]/...` to satisfy upload/delete RLS.

## Permissions & Security
- `user_collections`: RLS allows owners full CRUD (`auth.uid() = user_id`); org policies allow org_admin manage/view org collections; org members can view org collections for their org_id. Admin client bypass used in server actions—always scope by user_id when using admin.
- `collection_items`: RLS select limited to owner or org members of owning collection; insert limited to owner. Server actions use admin for inserts/removals; they resolve collection aliases to owner’s UUID to avoid cross-user writes.
- `user_context_items`: RLS restricts select/insert/update/delete to `auth.uid() = user_id`. No FK to collections—deletes do not cascade.
- `unified_embeddings`: RLS permits authenticated read of course rows or rows where `user_id = auth.uid()`. Writes happen via service role in context embedding helpers.
- Storage bucket `user-context-files`: public read; insert/delete allowed only when path’s first folder equals auth.uid().
- API/chat endpoints rely on `ContextResolver` (user client) so RLS prevents cross-user leakage; ensure any admin usage adds explicit user_id filters.

## Integration Points
- **AI context**: `ContextResolver.resolve` builds `filter_scope` from page/collection context (includes personal context by default) and `match_unified_embeddings` retrieves course + user context embeddings. Collection Assistant scope includes collection items + context items + personal context; Platform/Dashboard scope includes all courses + all user context.
- **Server actions**: `addToCollectionAction`, `syncCourseCollectionsAction`, `syncConversationCollectionsAction`, `cleanupDuplicateCollectionsAction`, `getCollectionCountsAction` (counts courses, context items, conversations, notes, certifications) use service-role client and must enforce user ownership/alias resolution.
- **Context item pipeline**: `TopContextPanel` → `createContextItem` / `createFileContextItem` → `user_context_items` row → embeddings via `embedContextItem`/`embedFileChunks` (stored in `unified_embeddings`). Insights auto-save via `saveInsight` into Personal Context.
- **Conversation/Note linkage**: conversation save modal calls `syncConversationCollectionsAction` (updates metadata + collection_items); notes use `addNoteToCollectionAction`/`removeNoteFromCollectionAction` to manage collection_items.
- **Org collections**: `OrgCollectionEditor` upserts `user_collections` with `is_org_collection=true` (assumes optional fields `is_required`, `due_date` if present in schema).
- **Events**: `collection:refresh` custom event (src/lib/collection-events.ts) lets components signal count refresh after mutations.

## Invariants
- System collection labels must not change: `Favorites`, `Workspace`, `Watchlist`, `Personal Context`; alias maps in collections/actions/context/NavigationPanel depend on these exact strings.
- When adding course items, set both `item_id` (string) and `course_id` (number) so collection scopes can filter course embeddings correctly.
- Collection membership is canonical in `collection_items`; `courses.collections` and `conversations.metadata.collection_ids` are legacy hints only.
- Personal context must always remain accessible to AI: ContextResolver sets `includePersonalContext=true` by default and Collection Assistant scopes must not disable it.
- Embeddings for any user_context_item must be written to `unified_embeddings` with matching user_id and (when scoped) collection_id; failing embeddings should be treated as a bug even if creation succeeds.
- Default collections are singletons per label per user; when duplicates occur, oldest row is treated as canonical and duplicates should be merged then removed.
- Deleting a collection must not leave orphaned context items; move or delete `user_context_items` referencing that collection before/after deletion.

## Failure Modes & Recovery
- **Duplicate system collections** (multiple rows with same label) cause counts to drift and alias resolution to pick an arbitrary row. Run `cleanupDuplicateCollectionsAction` to merge items and remove duplicates.
- **Collection delete leaves context items** because `user_context_items.collection_id` has no FK. Manually reassign or delete context items for that collection (consider adding backfill script) before removing the collection.
- **Alias not resolved** (label mismatch/case change) auto-creates new system collections, fragmenting data. Ensure labels remain canonical; repair via cleanup action.
- **Missing `is_required`/`due_date` columns** for org collections will make `/org/collections/[id]` upsert fail. Add columns or adjust UI before deploying org changes.
- **Embeddings skipped** (RPC/key failure) degrade Collection/Platform assistants silently. Check `unified_embeddings` for new rows and rerun embedding helpers if missing.
- **Conversations saved only in metadata** (no collection_items row) means cards won’t render in collection view. Use `syncConversationCollectionsAction` to re-sync metadata and rows.
- **File uploads blocked** if >10MB or unsupported type; user sees alert. Confirm bucket policies and MIME whitelist in `user-context-files` migration when extending types.

## Testing Checklist
- Start app with `pnpm dev`; log in as a test user.
- Ensure system collections exist: open dashboard, verify Favorites/Workspace/Watchlist/Personal Context appear; confirm in `user_collections` there is one row per label (oldest used).
- Create a custom collection via Add to Collection modal; confirm row in `user_collections` with `is_custom=true` and it appears in nav and CollectionSurface.
- Add a course to that collection (drag to CollectionSurface or use card Add); verify `collection_items` row (`item_type=COURSE`, `course_id` set) and nav count increments.
- Add a note to the collection and confirm a `collection_items` row with `item_type=NOTE`; delete the item from the collection and ensure the row is removed.
- Add a custom context item in Personal Context; verify `user_context_items` row and new `unified_embeddings` rows with matching user_id/collection_id; ask the Collection Assistant about that text to confirm retrieval.
- Save a conversation to a collection via the modal; ensure `conversations.metadata.collection_ids` updated and corresponding `collection_items` row exists; conversation card shows in that collection.
- Delete a collection (non-system) and verify `collection_items` cascade; manually check for `user_context_items` still referencing the deleted id and clean them.

## Change Guide
- Adding a new collection type or default label: update alias maps in `src/lib/collections.ts`, `src/app/actions/collections.ts`, `src/app/actions/context.ts`, `src/lib/ai/context-resolver.ts`, NavigationPanel, and ensure seeds/ensureSystemCollections create exactly one row per user.
- Introducing new item types to collections: extend `collection_items` usage, UI card mapping, `getCollectionDetailsAction`, and RAG scope assembly (allowedCourseIds/allowedItemIds). Update `match_unified_embeddings` filters if embeddings are required.
- Modifying `user_context_items` schema or types: update context enums, `TopContextPanel`, context actions, embedding helpers, and confirm storage/RPC coverage. Provide Supabase migration and production-safe SQL.
- Changing AI scope logic: adjust `ContextResolver` and validate `match_unified_embeddings` filter_scope contract; rerun Collection Assistant smoke test.
- Deleting or renaming collections: ensure context items are migrated or deleted, then run counts refresh; avoid changing system labels.
- Remember to update `docs/features/FEATURE_INDEX.md` doc status and this doc when adding surfaces or schema changes.

## Related Docs
- docs/engine/DOCUMENTATION_ENGINE.md
- docs/features/FEATURE_INDEX.md
- docs/Object Oriented Context Engineering.md
