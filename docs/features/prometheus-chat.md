---
id: prometheus-chat
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /dashboard?collection=conversations
    - /prometheus
    - /tools/[slug] (tool conversations reuse chat surface)
  collections:
    - conversations
data:
  tables:
    - public.conversations
    - public.conversation_messages
    - public.collection_items
    - public.unified_embeddings
  storage: []
backend:
  actions:
    - src/app/api/chat/route.ts
    - src/app/api/chat/stream/route.ts
    - src/app/actions/collections.ts (conversation sync)
    - src/app/actions/tools.ts (tool conversation creation)
ai:
  context_scopes:
    - COLLECTION
    - PLATFORM
    - TOOL
    - DASHBOARD
  models:
    - google/gemini-2.0-flash-001
tests:
  local:
    - Start app (`pnpm dev`), open Conversations collection, create a new chat, send a message; confirm reply renders.
  staging:
    - Start a conversation in a Tool page, save it to a collection, then open Conversations collection and resume; confirm correct tool metadata is preserved and AI responds.
invariants:
  - conversations rows are owned by user_id; all CRUD and message reads must filter by user_id.
  - collection membership for conversations is canonical in collection_items (item_type=CONVERSATION); metadata.collection_ids is legacy/secondary.
  - Tool conversations are marked by metadata.is_tool_conversation=true and include tool_slug; resume must load correct agent_type from metadata.
  - match_unified_embeddings scopes include personal context by default; chat routes must pass page/agent context through ContextResolver.
  - Streaming API must strip insight tags before returning text and optionally auto-save insights via insights actions.
---

## Overview
Prometheus Chat provides persistent AI conversations across the platform, including generic chats, collection-specific assistants, and tool-specific conversations. Conversations are stored in Supabase with messages; collection membership controls where they appear in the UI and which context is supplied to the AI. Tool conversations reuse the chat pipeline but add tool metadata and agent selection.

## User Surfaces
- Conversations collection view in the main dashboard (activeCollectionId `conversations`).
- Full-screen Prometheus experience (`/prometheus`) and right-side AI panel in pages that embed chat.
- Tool detail pages (`/tools/[slug]`) start tool conversations and list prior tool chats.
- Collection canvases: saving a conversation adds it to the selected collection for discovery/resume.

## Core Concepts & Objects
- **Conversation**: `conversations` row with metadata (tool info, collection_ids legacy) and `is_saved` flag.
- **Conversation message**: sequential messages in `conversation_messages`; ordered by created_at.
- **Tool conversation**: conversation with metadata.is_tool_conversation=true plus tool identifiers; created via createToolConversationAction.
- **Saved conversation**: conversation linked to one or more collections through `collection_items`.

## Data Model
- `conversations`: id uuid PK, user_id FK auth.users, title, is_saved bool, metadata jsonb (tool ids, collection_ids legacy), created_at/updated_at.
- `conversation_messages`: id uuid PK, conversation_id FK, role enum ('user','model'), content text, created_at.
- `collection_items`: for conversations, item_type='CONVERSATION', item_id=conversation id; membership drives nav counts and collection retrieval.
- `unified_embeddings`: AI retrieval source; not directly written by chat but used for context resolution.

Write paths:
- createToolConversationAction inserts conversations row with metadata and returns id.
- Chat APIs insert conversation_messages rows per turn; update conversations.updated_at; may set is_saved.
- syncConversationCollectionsAction updates conversations.metadata.collection_ids and collection_items rows.

Read paths:
- fetchToolConversationsAction/BySlug/ById read conversations (+messages) for current user.
- Collection detail fetch aggregates conversations via collection_items and metadata fallback.

## Permissions & Security
- RLS: conversations and conversation_messages enforce auth.uid() = user_id through policies (see migration 20251201000001_create_conversations.sql).
- Server actions use service-role for cross-table joins but always filter by user_id; never return other users' conversations.
- Collection adds/removals use admin client but resolve collection IDs to the owner before writing collection_items.

## Integration Points
- AI prompting: /api/chat and /api/chat/stream call ContextResolver.resolve with page context to build filter_scope for match_unified_embeddings.
- Insights: /api/chat/stream extracts `<INSIGHT>` tags, invokes processInsight/saveInsight (user_context_items + embeddings).
- Collections: syncConversationCollectionsAction maintains collection_items parity with metadata; counts surfaced via getCollectionCountsAction.
- Tools: conversations created with tool metadata; UI renders in Tools collection and tool page history.

## Invariants
- Conversations must always be queried with user_id; admin queries without filter are forbidden.
- collection_items is the source of truth for collection membership; metadata.collection_ids is for compatibility only.
- Tool conversations must carry agent_type in metadata to restore correct prompt/model.
- Delete cascade is enforced by FK on conversation_messages; deleting a conversation must remove messages.
- Streaming endpoint must redact insight tags from user-visible output but still log/save insights.

## Failure Modes & Recovery
- Missing collection_items for a saved conversation: run syncConversationCollectionsAction with desired collection IDs.
- Tool conversation resumes wrong agent: verify metadata.agent_type set at creation; fix by updating conversation metadata and reloading page.
- Duplicate conversations listed: check for duplicate collection entries; remove extra collection_items rows.
- Unauthorized errors: ensure auth session; RLS will reject cross-user access—debug by logging auth.uid in server action.

## Testing Checklist
- Create a new conversation from Conversations collection, send message, verify conversation_messages row and updated_at changes.
- Save conversation to Favorites via modal; confirm collection_items row exists and nav count increments.
- Start a tool conversation; verify metadata.is_tool_conversation=true and agent_type set; resume from Tools collection and get tool-specific response.
- Delete a conversation; ensure messages are removed and it disappears from collections.

## Change Guide
- Adding new conversation metadata fields: update creation in tools and chat flows; maintain backward compatibility in fetch functions.
- Changing collection membership model: adjust syncConversationCollectionsAction and collection detail fetchers to keep collection_items canonical.
- Altering AI models/prompts: update ai_system_prompts rows and ensure agentType mapping in chat endpoints/tool metadata stays aligned.
- Schema changes to conversations/messages require corresponding Supabase migration and production SQL script.

## Related Docs
- docs/engine/DOCUMENTATION_ENGINE.md
- docs/features/collections-and-context.md
- docs/features/tools.md
- supabase/migrations/20251201000001_create_conversations.sql
