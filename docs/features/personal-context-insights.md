---
id: personal-context-insights
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /dashboard?collection=personal-context
    - TopContextPanel (Add Context)
    - AI panel insight capture (auto-save)
  collections:
    - personal-context
data:
  tables:
    - public.user_context_items
    - public.unified_embeddings
    - public.profiles (auto_insights flag)
  storage:
    - user-context-files
backend:
  actions:
    - src/app/actions/context.ts
    - src/app/actions/insights.ts
    - src/lib/context-embeddings.ts
ai:
  context_scopes:
    - PERSONAL_CONTEXT
    - COLLECTION
    - PLATFORM
  models:
    - google/gemini-2.0-flash-001
tests:
  local:
    - Add a custom context item in Personal Context; verify it appears in list and is retrievable by AI.
  staging:
    - Enable auto-insights, have AI emit <INSIGHT>, confirm insight saved to Personal Context and shows in AI response sources.
invariants:
  - user_context_items rows are strictly owned by user_id; RLS prevents cross-user access.
  - Personal Context collection is identified by label \"Personal Context\"; alias `personal-context` must resolve to the oldest matching row per user.
  - Embeddings for all context items must be written to unified_embeddings with user_id and (when scoped) collection_id; PROFILE items embed via embedProfileDetails.
  - Auto-saved insights store type AI_INSIGHT in user_context_items and are embedded; insights must not duplicate existing content (novelty check).
  - Files uploaded to context use storage bucket `user-context-files`; path must begin with user_id to satisfy storage RLS.
---

## Overview
Personal Context stores user-specific knowledge (custom text, files, profile details, auto-generated insights) that is always included in AI scopes unless explicitly excluded. Items live in `user_context_items`, are optionally tied to the Personal Context collection, and are embedded into `unified_embeddings` for retrieval by Platform, Course, and Collection assistants.

## User Surfaces
- Personal Context collection view (`activeCollectionId = 'personal-context'`) inside MainCanvas.
- TopContextPanel for adding/editing context items and profile details; supports file uploads.
- AI insight auto-save: chat stream detects `<INSIGHT>` tags and writes to Personal Context.

## Core Concepts & Objects
- **Context item**: user_context_items row of type CUSTOM_CONTEXT, AI_INSIGHT, FILE, or PROFILE.
- **Auto insight**: AI-generated insight saved with type AI_INSIGHT, content metadata (category, confidence, conversation id).
- **Profile context**: PROFILE item representing user profile fields, embedded separately.
- **Embeddings**: unified_embeddings entries per context item chunk, keyed by user_id and optional collection_id.

## Data Model
- `user_context_items`: id uuid PK, user_id FK auth.users, collection_id text nullable, type enum, title, content jsonb, created_at/updated_at; indexes on user_id, collection_id; RLS owner-only.
- `unified_embeddings`: rows created by embedding helpers; collection_id populated when item is attached to a specific collection, null for global personal context.
- `profiles.auto_insights`: boolean flag to enable automatic insight saving.

Write paths:
- createContextItem/createFileContextItem insert rows (resolving collection alias), then embed content (text or parsed file chunks).
- updateContextItem updates content and regenerates embeddings.
- deleteContextItem deletes embeddings then row.
- saveInsight/processInsight auto-create AI_INSIGHT in Personal Context; embed insight text.

Read paths:
- getContextItems/getGlobalContextItems fetch items for UI and AI panel.
- ContextResolver includes personal context in every scope unless excluded; match_unified_embeddings uses user_id/collection_id filters.

## Permissions & Security
- RLS on user_context_items restricts all operations to owner; server actions use auth client.
- Embedding writes use service-role but carry user_id/collection_id; must not be called without user verification.
- Storage bucket `user-context-files` requires object path first segment = auth.uid() for writes; bucket is public read by policy.

## Integration Points
- AI context engine: personal context included in all scopes; collection scope adds collection-scoped context on top.
- Collections feature: context items can belong to other collections by setting collection_id to that collection’s UUID.
- Insights pipeline: /api/chat/stream extracts insights and calls insights actions to save to Personal Context.

## Invariants
- Personal Context alias resolution must prefer oldest matching row to avoid duplicate collections.
- Embedding dimension (768) must match model output; changing model requires regenerating embeddings.
- Deleting a context item must delete corresponding unified_embeddings rows first to avoid orphan embeddings.
- PROFILE item is unique logical representation; if absent, UI may show virtual placeholder but embeddings should not be generated for placeholder.

## Failure Modes & Recovery
- Context item saved but not retrieved: check unified_embeddings for matching source_id/user_id; re-run embedding helpers if missing.
- File upload blocked: ensure MIME type/size within bucket policy (<=10MB, whitelisted types).
- Duplicate Personal Context collections: run cleanupDuplicateCollectionsAction (Collections feature) and reassign context items if needed.
- Auto insights not saving: verify profiles.auto_insights and that chat response contains `<INSIGHT>`; check insights actions logs.

## Testing Checklist
- Add CUSTOM_CONTEXT text; verify user_context_items row, unified_embeddings rows with user_id set, and Collection Assistant references it.
- Upload a file to Personal Context; ensure storage object path starts with user_id/personal, unified_embeddings rows exist with collection_id for personal context.
- Trigger auto insight via chat; confirm AI_INSIGHT row is created and embedded; subsequent AI replies can reference it.
- Delete a context item; ensure embeddings for that source_id are removed and item disappears from UI.

## Change Guide
- Adding new context item types: extend context_item_type enum, TopContextPanel UI, embedding source_type map, and match_unified_embeddings source handling.
- Changing personal context inclusion rules: update ContextResolver defaults and chat endpoints; reassess tests for all assistants.
- Modifying storage policy: update bucket policies and upload paths; ensure file-parser uses new path scheme.
- If attaching context items to multiple collections becomes necessary, consider pivot table or multi-collection support; update invariants/tests accordingly.

## Related Docs
- docs/features/collections-and-context.md
- docs/features/ai-context-engine.md
- docs/features/prometheus-chat.md
