---
id: notes
owner: learning-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - /dashboard?collection=notes
    - Course player note panel
  collections:
    - notes
data:
  tables:
    - public.notes
    - public.collection_items
  storage: []
backend:
  actions:
    - src/app/actions/notes.ts
    - src/app/actions/collections.ts (note add/remove)
ai:
  context_scopes:
    - COLLECTION
    - PERSONAL_CONTEXT (indirect via collection scope)
  models: []
tests:
  local:
    - Create a note in course player, add to a collection; verify notes row and collection_items row.
  staging:
    - Remove a note from a collection via UI; confirm collection_items row deleted and note still exists in notes table.
invariants:
  - Notes table enforces ownership via RLS (auth.uid() = user_id) for all CRUD.
  - Collection membership for notes is tracked in collection_items with item_type='NOTE'; removing from a collection must not delete the note row.
  - Notes default title is 'Untitled Note'; empty titles should be allowed but preserved.
---

## Overview
Notes allow learners to capture text tied optionally to a course and organize those notes into collections for later retrieval and AI context. Notes are stored per user, can be added or removed from collections, and remain even when removed from a collection.

## User Surfaces
- Notes collection view in MainCanvas (shows all notes).
- Course player right panel for note creation and editing.
- Add-to-collection modal and drag/drop to collections.

## Core Concepts & Objects
- **Note**: row in `notes` with user_id, title, content, optional course_id.
- **Saved note**: note linked to collections through `collection_items` (item_type='NOTE').

## Data Model
- `notes`: id uuid PK, user_id FK auth.users, title text default 'Untitled Note', content text, course_id FK courses nullable, created_at/updated_at; triggers maintain updated_at.
- `collection_items`: rows with item_type='NOTE', item_id=note id, collection_id FK user_collections.

Write paths:
- createNoteAction inserts note (auth client).
- addNoteToCollectionAction resolves collection alias, inserts collection_items row; duplicate insert ignored (23505).
- removeNoteFromCollectionAction deletes collection_items row.

Read paths:
- getNotesAction (not shown here) and collection detail fetch combine notes from collection_items for rendering.

## Permissions & Security
- RLS on notes restricts all operations to owner; actions use createClient with user session.
- collection_items RLS enforces owner of collection; addNoteToCollectionAction uses admin client but resolves collection to owner id.

## Integration Points
- Collections: note cards rendered alongside other items; counts included in getCollectionCountsAction.
- Course player: note creation may default to active course_id for context.
- AI: when notes are added to a collection, Collection Assistant can retrieve their content via unified_embeddings if embedded separately (not currently embedded by default).

## Invariants
- Removing a note from a collection must not delete the note record; only collection_items row should be removed.
- When adding to a collection, item_type must be 'NOTE' to avoid collisions with other item types in PK.
- addNoteToCollectionAction must resolve collection aliases and auto-create system collections if missing.

## Failure Modes & Recovery
  - Note not appearing in collection: check collection_items for item_type='NOTE'; re-run addNoteToCollectionAction.
  - Unauthorized errors: confirm user session; RLS blocks cross-user access.
  - Duplicate note in collection: duplicate inserts are ignored; if duplicates exist, remove extra collection_items rows manually.

## Testing Checklist
- Create a note; verify notes row exists with user_id and default title.
- Add note to Favorites; verify collection_items row and nav count increment.
- Remove note from collection; collection_items row disappears, note still listed in Notes collection.
- Edit note content; verify updated_at trigger fires and content persists after reload.

## Change Guide
- If embedding notes for AI is needed, add embedding step on note create/update and store in unified_embeddings with source_type custom_context/note.
- Changing notes schema: update RLS policies and actions; provide migration + prod SQL.
- If allowing rich text/attachments, extend notes.content type and update UI accordingly.

## Related Docs
- docs/features/collections-and-context.md
- docs/features/course-player-and-progress.md
