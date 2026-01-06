---
id: help-collection
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /dashboard?collection=help-collection
    - Help dropdown/panel in app shell
  collections:
    - help-collection
data:
  tables:
    - public.help_topics
  storage: []
backend:
  actions:
    - src/components/help/HelpContent.tsx (client render/logic)
    - src/app/api/chat/route.ts (help scope handling)
ai:
  context_scopes:
    - COLLECTION (help special-cased)
  models: []
tests:
  local:
    - Open Help collection; verify topics render in order and search/anchors work.
  staging:
    - In Help collection AI panel, ask about onboarding; ensure response references help topic text (no embeddings call).
invariants:
  - help_topics.is_active=true rows are the only content surfaced; ordering uses display_order ascending.
  - Help scope bypasses embeddings: context.ts performs text matching over help_topics instead of RAG.
  - Slugs in help_topics must remain stable; UI links and system anchors depend on slug identifiers (e.g., help-collection, getting-started).
---

## Overview
The Help Collection provides curated help topics and a collection-specific AI helper that answers using help topic text instead of embeddings. Topics are stored in `help_topics`, filtered by is_active, and ordered by display_order.

## User Surfaces
- Help panel/dropdown in the app shell.
- Help collection view within MainCanvas (activeCollectionId `help-collection`).
- Collection Assistant in this collection answers using help topic text.

## Core Concepts & Objects
- **Help topic**: row in `help_topics` with slug/title/summary/content_text/display_order/is_active.
- **Help collection**: virtual collection keyed by slug `help-collection`; does not use collection_items.

## Data Model
- `help_topics`: id uuid PK, slug unique, title, summary, content_text, display_order int, is_active bool.

Write paths:
- Seeded via migration 20260103000001_update_help_topics_end_user.sql or admin UI (if present).

Read paths:
- HelpContent component queries help_topics where is_active=true ordered by display_order.
- context.ts in COLLECTION scope with id 'help' loads help_topics, builds index, and performs simple term scoring; always includes help-collection/getting-started anchors.

## Permissions & Security
- RLS not shown in migration; assume public read or default; app uses client supabase, so topics must be readable by authenticated users.
- No user-specific data is returned.

## Integration Points
- AI context: help scope short-circuits embeddings; uses text matching inside context.ts.
- Navigation: Collection navigation entry points must map slug help-collection to this virtual collection.

## Invariants
- help topic slugs must remain stable; anchors in HelpContent and context selection depend on exact values (e.g., help-collection, getting-started).
- Only is_active topics should surface; ensure writes set is_active appropriately.
- Do not enable embeddings for help scope; maintain text-based retrieval to avoid irrelevant RAG noise.

## Failure Modes & Recovery
- Help collection empty: verify help_topics has is_active rows; reseed via migration if missing.
- AI answers irrelevant to help: confirm context.ts is using help scope (id 'help'); check that queryEmbedding is skipped for help.
- Ordering incorrect: ensure display_order set; check ordering clause in HelpContent and context.ts.

## Testing Checklist
- Load Help collection; confirm topics sorted by display_order and only active topics visible.
- Ask AI in Help collection about a specific topic keyword; response should reference help text (no embeddings errors in logs).
- Toggle a topic inactive (via DB) and ensure it disappears after reload.

## Change Guide
- Adding topics: insert into help_topics with unique slug and display_order; no collection_items needed.
- Changing retrieval to embeddings: would require adding help_topics to unified_embeddings and altering context.ts; update this doc accordingly.
- If adding admin editing, ensure RLS allows admins and prevents ordinary users from modifying topics.

## Related Docs
- docs/features/collections-and-context.md
- docs/features/ai-context-engine.md
- supabase/migrations/20260103000001_update_help_topics_end_user.sql
