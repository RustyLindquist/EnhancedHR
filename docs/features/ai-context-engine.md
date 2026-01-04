---
id: ai-context-engine
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /api/chat
    - /api/chat/stream
    - /dashboard (AI panel)
    - /tools/[slug]
    - /dashboard?collection=:id (Collection Assistant)
  collections:
    - personal-context
data:
  tables:
    - public.unified_embeddings
    - public.context_embeddings (legacy course)
    - public.course_embeddings (legacy)
    - public.user_context_items
    - public.courses
    - public.collection_items
  storage:
    - user-context-files
backend:
  actions:
    - src/lib/ai/context-resolver.ts
    - src/lib/ai/context.ts
    - src/lib/context-embeddings.ts
    - src/app/api/chat/route.ts
    - src/app/api/chat/stream/route.ts
ai:
  context_scopes:
    - PLATFORM
    - COLLECTION
    - COURSE
    - PERSONAL_CONTEXT
    - TOOL
  models:
    - google/gemini-2.0-flash-001
tests:
  local:
    - From dashboard AI panel, ask a question; confirm response returns and no errors in logs.
  staging:
    - Add a custom context item to Personal Context, then ask Collection Assistant in that collection about it; verify response cites the added text (check AI logs/sources).
invariants:
  - ContextResolver always includes personal context unless explicitly excluded; collection scopes add collection items + context items.
  - match_unified_embeddings is the sole RAG entry point; filter_scope keys must match function contract (isPlatformScope, isGlobalAcademy, collectionId, allowedCourseIds, allowedItemIds, includePersonalContext, includeAllUserContext, userId).
  - unified_embeddings rows for user content must carry user_id and (when scoped) collection_id for correct filtering.
  - query embeddings use generateQueryEmbedding (Gemini) with 768-dim vectors; dimensions must match unified_embeddings column.
  - Help collection bypasses embeddings and uses text matching in context.ts; other scopes rely on embeddings.
---

## Overview
The AI Context Engine assembles retrieval scopes and embeddings for all assistants (Platform, Collection, Course, Tool). It resolves the active context (page/collection/tool/course), gathers allowed items, and queries `match_unified_embeddings` to return relevant chunks, always layering in personal context by default. Custom context, files, insights, and profiles are embedded into `unified_embeddings` to participate in retrieval.

## User Surfaces
- AI panel on dashboard, collections, courses, and tools.
- Collection Assistant inside any collection view.
- Platform Assistant (dashboard scope).
- Tool-specific assistant on tool pages.

## Core Concepts & Objects
- **RAG scope**: structured filter describing where AI can look (course IDs, collection ID, allowed item IDs, personal context flags).
- **Unified embeddings**: single table storing course chunks and user context embeddings; queried via match_unified_embeddings.
- **ContextResolver**: server-side helper building scope based on PageContext (type, id, collectionId, agentType).
- **Context items**: user_context_items plus their embeddings stored in unified_embeddings.

## Data Model
- `unified_embeddings`: user_id, course_id, collection_id, source_type (lesson|custom_context|file|conversation|profile), source_id, content, embedding (vector 768), metadata. RLS allows public course rows; user rows only to owner; service_role full access.
- `match_unified_embeddings` (enhanced 20251219000001): security definer; filters by scope booleans and IDs; always applies similarity threshold and limit.
- Legacy tables `course_embeddings`/`context_embeddings` remain but primary RAG path is unified_embeddings.
- `user_context_items`: source for custom_context/file/profile/AI_INSIGHT embeddings.

Write paths:
- embedContextItem/embedFileChunks/embedProfileDetails insert unified_embeddings rows per chunk.
- createContextItem/createFileContextItem/saveInsight call embedding helpers after inserting user_context_items.

Read paths:
- context-resolver builds scope then chat endpoints call match_unified_embeddings RPC to fetch context items for prompts.
- context.ts handles non-embedded help collection text scoring.

## Permissions & Security
- match_unified_embeddings runs as security definer but relies on scope values; caller must supply userId to avoid cross-user leakage when includePersonalContext/includeAllUserContext are true.
- unified_embeddings RLS: authenticated users can read course content or their own rows; service_role inserts embeddings.
- File uploads obey storage RLS (first folder is user_id); parsed text is embedded server-side only after authenticated actions.

## Integration Points
- Chat APIs: POST /api/chat and /api/chat/stream build query embedding, resolve scope, call match_unified_embeddings, format context for prompts.
+- Collections feature: collection scopes include collection_items and user_context_items for that collection plus personal context.
- Tools feature: tool page passes agentType/pageContext to ContextResolver; scope likely PLATFORM or TOOL collection if implemented.
- Insights: saved insights become user_context_items and are embedded, influencing all future scopes that include personal context.

## Invariants
- Scope resolution must map aliases: 'favorites','research','to_learn','personal-context' to user_collections UUIDs before querying collection items/context items.
- Personal Context must remain included unless a scope explicitly opts out; removing it changes behavior platform-wide.
- All embeddings must use the same dimension/model as match_unified_embeddings expects (768); changing model requires table migration and function update.
- Help collection queries must not call match_unified_embeddings; they use text matching over help_topics to avoid irrelevant embeddings.

## Failure Modes & Recovery
- Empty AI responses or low relevance: check unified_embeddings contains rows for the user/collection; re-run embedding generation for missing items.
- Cross-user leakage risk: verify scope.userId set when includePersonalContext/includeAllUserContext true; ensure admin callers don’t omit userId.
- RPC errors (dimension mismatch): confirm embedding model output dimension matches unified_embeddings column; regenerate if model changed.
- Help collection returning nothing: ensure help_topics has active rows; context.ts fallback should include orientation topics.

## Testing Checklist
- Add a custom context item to Personal Context; verify unified_embeddings rows with user_id set and collection_id null; ask dashboard AI about it and expect reference.
- Add a file to a specific collection; ensure unified_embeddings rows have collection_id set; ask Collection Assistant in that collection and expect retrieval; outside collection it should not appear.
- Open a course and ask a question; match_unified_embeddings should be called with allowedCourseIds; ensure response draws from course content.
- Ask a question in Help collection; confirm results come from help_topics and not embeddings.

## Change Guide
- Changing embedding model/dimension: migrate unified_embeddings column and regenerate embeddings; update generateQueryEmbedding and match_unified_embeddings accordingly.
- Adding new scope types: extend ContextResolver and match_unified_embeddings filter logic; update callers to set new flags.
- Introducing new source_type: add to unified_embeddings enum, embedding writers, and formatter in api/chat/stream to group sources.
- If personal context should be excluded for a specific agent, add an explicit flag in page context and propagate to ContextResolver/includePersonalContext.

## Related Docs
- docs/features/collections-and-context.md
- docs/features/prometheus-chat.md
- supabase/migrations/20251219000001_enhanced_unified_embeddings.sql
- supabase/migrations/20241211180000_unified_embeddings.sql
