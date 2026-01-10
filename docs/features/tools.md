---
id: tools
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /tools
    - /tools/[slug]
    - /dashboard?collection=tools
  collections:
    - tools
data:
  tables:
    - public.tools
    - public.conversations
    - public.conversation_messages
    - public.collection_items
    - public.unified_embeddings
  storage: []
backend:
  actions:
    - src/app/actions/tools.ts
    - src/app/actions/collections.ts (conversation sync)
    - src/app/api/chat/route.ts
    - src/app/api/chat/stream/route.ts
ai:
  context_scopes:
    - TOOL
    - COLLECTION
    - PLATFORM
  models:
    - google/gemini-2.0-flash-001
tests:
  local:
    - Open /tools, verify active tools render from Supabase; click a tool, start a conversation, receive a reply.
  staging:
    - Start tool conversation, save to a collection, reopen via Conversations collection; confirm tool metadata preserved and correct agent responds.
invariants:
  - tools.slug is unique and the canonical identifier for /tools/[slug] routing.
  - Tool conversations must set metadata.is_tool_conversation=true and carry tool_slug/tool_id/tool_title/agent_type.
  - Only active tools (`is_active=true`) are listed; RLS allows read only when is_active.
  - Tool conversation membership in collections is tracked via collection_items (item_type=CONVERSATION).
  - Chat context for tool conversations uses ContextResolver with pageContext including agentType/tool to ensure correct RAG scope.
---

## Overview
Tools provide curated AI workflows backed by dedicated system prompts. Each tool is defined in the `tools` table and can launch a conversation scoped to the tool’s agent. Tool conversations persist like other chats and can be saved into collections for organization and resume.

## User Surfaces
- Tools collection view (`/tools`): lists active tools with icon/title/description.
- Tool detail page (`/tools/[slug]`): launches a tool-specific conversation and shows prior tool conversations.
- Conversations collection: shows saved tool conversations alongside other chats.

## Core Concepts & Objects
- **Tool**: row in `tools` with slug/title/description/agent_type/is_active/order.
- **Tool conversation**: conversation with metadata marking the originating tool plus agent_type; created via createToolConversationAction.
- **Tool history**: list of prior tool conversations filtered by metadata.tool_slug.

## Data Model
- `tools`: id uuid PK, slug unique, title, description, agent_type (maps to ai_system_prompts), icon_name, is_active, display_order, timestamps; RLS: authenticated read active; admins manage.
- `conversations`/`conversation_messages`: reused for tool conversations; metadata stores tool identifiers.
- `collection_items`: item_type=CONVERSATION rows to persist saves; optional metadata.collection_ids remains legacy.

Write paths:
- fetchToolsAction/fetchToolBySlugAction read active tools (admin client).
- createToolConversationAction inserts conversations row with metadata, user_id, title; returns id.
- syncConversationCollectionsAction attaches tool conversations to collections.

Read paths:
- fetchToolConversationsAction/BySlug/ById return tool conversations for current user, adding lastMessage and collections info.
- Tools pages fetch tool list and conversation history.

## Permissions & Security
- tools RLS: authenticated users can select active tools; admin (profiles.role='admin') can manage all operations.
- conversations/messages RLS: owner-only access; service-role actions must filter by user_id.
- No public endpoints expose tool definitions beyond is_active=true.

## Integration Points
- AI system prompts: tools.agent_type must exist in ai_system_prompts; chat endpoints pull prompt/model per agent_type.
- Collections: saving tool conversations updates collection_items and nav counts.
- ContextResolver: page context should include tool scope so match_unified_embeddings can incorporate relevant embeddings (if any).

## Invariants
- Each tool must have a unique slug; slugs are the only routing key.
- createToolConversationAction must set metadata.agent_type to keep prompt/model aligned on resume.
- Only is_active tools appear in UI; do not rely on client-side filtering alone.
- collection_items is the canonical source for saved-state; metadata.collection_ids is secondary.

## Failure Modes & Recovery
- Tool not visible: ensure is_active true and RLS conditions met; check tools table.
- Conversation missing tool metadata: update conversation.metadata with tool_id/slug/title/agent_type; future resumes depend on it.
- Tool conversation not showing in collections: ensure collection_items row exists; run syncConversationCollectionsAction.
- Prompt mismatch: verify ai_system_prompts row matches tools.agent_type.

## Testing Checklist
- Verify /tools renders tools ordered by display_order and hides inactive rows.
- Launch a tool, send a message, confirm conversation row created with metadata.is_tool_conversation=true and agent_type set.
- Save tool conversation to Favorites; confirm collection_items row exists and nav count updates.
- Resume conversation from Conversations collection; response should use the tool’s agent prompt (check system prompt in AI logs if available).

## Change Guide
- Adding a tool: insert into tools with unique slug and existing agent_type; ensure ai_system_prompts contains that agent_type.
- Changing tool agent/prompt: update ai_system_prompts and optionally migrate existing conversations’ metadata.agent_type.
- Schema changes to tools: update RLS policies and actions fetches; supply migration + prod SQL script.
- If introducing tool-specific embeddings, extend match_unified_embeddings filters and ContextResolver to include tool scope.

## Implementation Guidance

**Primary Agent**: Backend Agent (tools table, tool conversations, RLS, agent_type mapping)
**Secondary Agent**: Frontend Agent (tools UI, conversation history, tool detail pages)

**Skills to Use**:
- `/doc-discovery` — Load prometheus-chat and ai-context-engine docs before modifying tool flows
- `/plan-lint` — Validate tool metadata persistence and agent_type consistency
- `/test-from-docs` — Verify tool conversation creation, resume, and collection sync

**Key Invariants**:
- tools.slug is unique and the canonical identifier for /tools/[slug] routing
- Tool conversations must set metadata.is_tool_conversation=true and carry tool_slug/tool_id/tool_title/agent_type
- Only active tools (`is_active=true`) are listed; RLS allows read only when is_active

**Related Workflows**: docs/workflows/tool-conversation.md (if exists)

## Related Docs
- docs/features/prometheus-chat.md
- docs/features/ai-context-engine.md
- supabase/migrations/20251231000001_create_tools.sql
