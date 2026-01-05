# Spawn Frontend Agent

Spawn the Frontend Agent (Design System Guardian) to handle UI implementation work.

## When to Use

Use this command for ANY frontend work:
- Creating new UI components
- Modifying existing component styling
- Building new pages or views
- Fixing UI bugs (not just typos)
- Layout changes

## What Happens

1. Frontend Agent loads:
   - `docs/frontend/STYLE_GUIDE.md` (design tokens)
   - `docs/frontend/COMPONENT_INDEX.md` (component inventory)

2. For each task, the agent follows this workflow:
   - Check inventory for existing components
   - Discover patterns if not in inventory
   - Execute (reuse or create new)
   - Validate against design system
   - Document any new components

3. Returns completed, validated work

## How to Delegate Work

```
@frontend-agent: Build a new card component for displaying bookmarks

@frontend-agent: Fix the hover states on the dashboard cards

@frontend-agent: Create a modal for confirming deletions

@frontend-agent: Add a loading skeleton to the course grid
```

## Frontend Agent Skills

The agent has access to these skills in `.claude/commands/frontend/`:

| Skill | Purpose |
|-------|---------|
| `component-inventory` | Check what exists |
| `style-discovery` | Find patterns in codebase |
| `style-documentation` | Document discovered patterns |
| `new-style-creation` | Create following design system |
| `style-validation` | Validate against design tokens |

## Design Tokens the Agent Enforces

### Backgrounds
- Main content: transparent (NO bg class)
- Cards: `bg-white/5`, `hover:bg-white/10`

### Text
- Primary: `text-white`
- Secondary: `text-white/70`

### Spacing
- Standard: `p-4`, `gap-4`
- Relaxed: `p-6`, `gap-6`

### Anti-Patterns Prevented
- Solid backgrounds on content
- Inline styles
- Arbitrary Tailwind values
- Missing hover states
- Duplicating existing components

## Coordination with Doc Agent

For complex features, spawn both agents:
- Doc Agent for feature knowledge and invariants
- Frontend Agent for UI implementation

They can query each other as needed.

## Full Specification

See `.claude/agents/frontend-agent.md` for the complete agent prompt.
