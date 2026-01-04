---
id: prompt-library
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-04
surfaces:
  routes:
    - Prompt drawer in dashboard
    - /admin/prompts (management via admin portal)
  collections: []
data:
  tables:
    - public.prompt_suggestions
    - public.ai_system_prompts
  storage: []
backend:
  actions:
    - src/lib/prompts.ts (fetchPromptSuggestions)
    - Admin prompt management components
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Fetch prompt suggestions for user_dashboard; verify records return ordered by page_context/order_index.
  staging:
    - Update a prompt suggestion (admin) and confirm it appears in drawer after reload.
invariants:
  - prompt_suggestions.page_context constrained to user_dashboard/employee_dashboard/org_admin_dashboard/instructor_dashboard.
  - ai_system_prompts.agent_type must remain unique; admin edits should not duplicate agent types.
---

## Overview
Prompt Library offers reusable prompt suggestions tailored to page context and manages system prompts for AI agents. End users see curated suggestions in drawers; admins manage both suggestions and system prompts.

## User Surfaces
- Prompt drawer/panel on dashboard surfaces.
- Admin prompt management page (SystemPromptManager) for ai_system_prompts.

## Core Concepts & Objects
- **Prompt suggestion**: prompt_suggestions row with page_context, label, prompt, category, order_index.
- **System prompt**: ai_system_prompts row defining agent system_instruction/model/insight instructions.

## Data Model
- `prompt_suggestions`: id identity, page_context enum, label, prompt, category, order_index, created_at.
- `ai_system_prompts`: id uuid, agent_type unique, system_instruction, model, insight_instructions, timestamps.

Write paths:
- Admin edits create/update prompt_suggestions and ai_system_prompts (via admin portal).

Read paths:
- fetchPromptSuggestions(page_context) selects suggestions ordered by order_index.
- Chat endpoints read ai_system_prompts by agent_type.

## Permissions & Security
- prompt_suggestions select allowed for authenticated; write allowed for admins via policy.
- ai_system_prompts writable only by admins; readable by all.

## Integration Points
- Dashboard prompt drawer uses prompt_suggestions for quick AI starters.
- AI chat/assistants load system prompts from ai_system_prompts; tools/course AI rely on these definitions.

## Invariants
- page_context must be one of allowed values; adding new contexts requires schema update.
- agent_type uniqueness in ai_system_prompts must be preserved to avoid conflicting prompts.

## Failure Modes & Recovery
- Suggestions not appearing: check page_context value and order_index; ensure RLS allows select.
- Wrong AI behavior after prompt edit: verify correct agent_type updated; clear caches if any.

## Testing Checklist
- Load dashboard drawer: suggestions list matches prompt_suggestions for page_context user_dashboard.
- Admin updates a system prompt; subsequent chat uses new prompt (verify via logs/behavior).

## Change Guide
- Adding new page context: update prompt_suggestions check constraint and fetchPromptSuggestions usage.
- Adding new agent types: insert ai_system_prompts with unique agent_type; update chat/tool/course features to reference it.

## Related Docs
- docs/features/ai-context-engine.md
- docs/features/admin-portal.md
