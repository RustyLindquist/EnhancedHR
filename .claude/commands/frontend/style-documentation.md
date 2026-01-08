---
description: Record discovered patterns in the style guide for reuse
---

# Style Documentation

Record discovered patterns in the style guide. This skill ensures patterns are documented for reuse.

## When to Use

- After discovering an undocumented component
- After discovering a reusable pattern
- After creating a new component
- When codifying design decisions

## Documentation Locations

```
docs/frontend/
├── STYLE_GUIDE.md         ← Design tokens and principles
├── COMPONENT_INDEX.md     ← Master list of all components
├── components/            ← Per-component documentation
│   ├── canvas-header.md
│   ├── course-card.md
│   └── ...
├── patterns/              ← Layout and interaction patterns
│   ├── collection-view.md
│   ├── detail-page.md
│   └── ...
└── anti-patterns.md       ← Things to avoid
```

## Component Documentation Template

For each component, create `docs/frontend/components/[component-name].md`:

```markdown
# [Component Name]

## Overview
[1-2 sentences describing what this component does]

## Location
`src/components/[path]/[ComponentName].tsx`

## Visual Example
```
┌─────────────────────────────────────┐
│  [ASCII representation of the       │
│   component's visual structure]     │
└─────────────────────────────────────┘
```

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| ... | ... | ... | ... |

## Styling
- Background: `[tailwind classes]`
- Text: `[tailwind classes]`
- Spacing: `[tailwind classes]`
- Interaction: `[hover/focus states]`

## Usage Example
```tsx
import { ComponentName } from '@/components/ComponentName'

<ComponentName prop="value" />
```

## Variants
- [variant 1]: [description]
- [variant 2]: [description]

## Related Components
- [RelatedComponent] - [relationship]
```

## Pattern Documentation Template

For layout patterns, create `docs/frontend/patterns/[pattern-name].md`:

```markdown
# [Pattern Name]

## Overview
[Description of when and why to use this pattern]

## Visual Structure
```
┌─────────────────────────────────────────────────────────┐
│                     PATTERN NAME                         │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Header (h-12, sticky)                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  Content Area                                    │   │
│  │  (flex-1, overflow-auto)                        │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Implementation
```tsx
<div className="flex flex-col h-full">
  <CanvasHeader title="..." />
  <div className="flex-1 overflow-auto p-4">
    {/* Content */}
  </div>
</div>
```

## Key Classes
- Container: `[classes]`
- Header: `[classes]`
- Content: `[classes]`

## Examples in Codebase
- `src/app/dashboard/page.tsx`
- `src/components/CollectionCanvas.tsx`

## Variations
- [variation]: [how it differs]
```

## Updating COMPONENT_INDEX.md

Always add new components to the master index:

```markdown
## Component Index

| Component | Category | Location | Description |
|-----------|----------|----------|-------------|
| CanvasHeader | Layout | src/components/CanvasHeader.tsx | Standard header for canvas views |
| CourseCard | Cards | src/components/CourseCard.tsx | Card for displaying course info |
| [NEW] | [category] | [path] | [description] |
```

## Updating STYLE_GUIDE.md

Add new design tokens as discovered:

```markdown
## Colors
| Token | Class | Usage |
|-------|-------|-------|
| Background transparent | (none) | Main content areas |
| Card background | bg-white/5 | Cards and panels |
| [NEW] | [class] | [usage] |

## Spacing
| Size | Class | Usage |
|------|-------|-------|
| Container padding | p-4, p-6 | Outer containers |
| [NEW] | [class] | [usage] |
```

## Adding Anti-Patterns

When you discover something that should be avoided:

```markdown
## Anti-Patterns

### [Pattern Name]
**Don't:** [what to avoid]
**Why:** [why it's problematic]
**Instead:** [what to do instead]

Example:
### Solid Backgrounds on Main Content
**Don't:** `bg-white` or `bg-gray-900` on main content areas
**Why:** Blocks the platform gradient, looks inconsistent
**Instead:** Use transparent or `bg-white/5` for subtle definition
```

## Checklist After Documentation

- [ ] Component added to COMPONENT_INDEX.md
- [ ] Individual component doc created (if new component)
- [ ] Pattern doc created (if new pattern)
- [ ] STYLE_GUIDE.md updated with any new tokens
- [ ] Anti-patterns documented (if discovered)
