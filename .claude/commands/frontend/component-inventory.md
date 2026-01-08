---
description: Check existing components and patterns before starting any UI work
---

# Component Inventory

Check what components and patterns already exist before starting any UI work. This is your FIRST step for every frontend task.

## When to Use

- **ALWAYS** before creating any new component
- **ALWAYS** before implementing any UI change
- When trying to understand available building blocks
- When planning a new feature's UI

## Process

```
┌─────────────────────────────────────────────────────────────┐
│                  COMPONENT INVENTORY CHECK                   │
│                                                              │
│  1. Read COMPONENT_INDEX.md                                 │
│     └─► Get overview of all documented components           │
│                                                              │
│  2. Check if your need matches an existing component        │
│     └─► Search by category (Layout, Cards, Forms, etc.)    │
│     └─► Search by purpose                                   │
│                                                              │
│  3. If match found:                                         │
│     └─► Read the component's individual doc                 │
│     └─► Verify it fits your use case                        │
│     └─► Note any needed modifications                       │
│                                                              │
│  4. If no match:                                            │
│     └─► Run /frontend/style-discovery                       │
│     └─► Maybe it exists but isn't documented                │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference: Component Categories

### Layout Components
- **CanvasHeader**: Standard header for canvas views
- **MainCanvas**: Primary content container
- **SidePanel**: Slide-out panel for details/AI
- ...

### Card Components
- **CourseCard**: Course display in grids
- **ConversationCard**: Chat conversation preview
- **CollectionCard**: Collection display
- ...

### Form Components
- **Input**: Standard text input
- **Button**: Primary/secondary/ghost buttons
- **Select**: Dropdown select
- ...

### Navigation Components
- **NavigationPanel**: Left sidebar navigation
- **TabBar**: Horizontal tab navigation
- ...

### Feedback Components
- **Toast**: Notification messages
- **Modal**: Dialog overlays
- **Skeleton**: Loading states
- ...

## Reading the Component Index

The `COMPONENT_INDEX.md` provides:

| Column | What It Tells You |
|--------|-------------------|
| Component | The component name |
| Category | What type of component it is |
| Location | Where to find the source |
| Description | What it's for |
| Props | Key props it accepts |
| Used In | Where it's currently used |

## Decision Tree

```
Need UI element
      │
      ▼
Check COMPONENT_INDEX.md
      │
      ├── Found exact match ───► Use it directly
      │
      ├── Found similar ───► Can you extend it?
      │         │
      │         ├── Yes ───► Extend with new props
      │         │
      │         └── No ───► Create new, document both
      │
      └── Not found ───► Run /frontend/style-discovery
                │
                ├── Found in code ───► Document it first
                │
                └── Not found ───► Create new with
                                   /frontend/new-style-creation
```

## Output Format

After inventory check, report:

```markdown
## Inventory Check: [what you need]

### Existing Components
| Component | Fit | Notes |
|-----------|-----|-------|
| [name] | Exact/Partial/No | [why] |

### Recommendation
- [ ] Use [component] directly
- [ ] Extend [component] with [modification]
- [ ] Run style discovery (not in index)
- [ ] Create new (nothing suitable exists)

### Next Step
[What action to take based on findings]
```

## Common Mistakes to Avoid

1. **Skipping the check**: Always check before creating
2. **Creating duplicates**: If it's in the index, use it
3. **Ignoring partial matches**: Extending is better than duplicating
4. **Not updating index**: If you create something new, add it
