# Style Discovery

Find existing patterns in the codebase before creating anything new. This skill ensures you don't duplicate what already exists.

## When to Use

- Before creating any new component
- Before implementing any new UI pattern
- When unsure if something similar exists
- When the Component Index doesn't have what you need

## Process

```
┌─────────────────────────────────────────────────────────────┐
│                    STYLE DISCOVERY                           │
│                                                              │
│  1. Define what you're looking for                          │
│     └─► "A card component with hover state"                 │
│                                                              │
│  2. Search src/components/                                  │
│     └─► Glob for *Card*, *card*, *Item*                    │
│                                                              │
│  3. Search for Tailwind patterns                            │
│     └─► Grep for class combinations like "rounded-lg p-4"  │
│                                                              │
│  4. Check src/app/ for page-level patterns                  │
│     └─► Look at existing pages for layout patterns          │
│                                                              │
│  5. Analyze what you find                                   │
│     └─► Extract reusable patterns                           │
│     └─► Note variations                                     │
│     └─► Identify the "canonical" version                    │
└─────────────────────────────────────────────────────────────┘
```

## Search Strategies

### 1. Component Name Search
```
# Search for components by name
Glob: src/components/**/*[Cc]ard*.tsx
Glob: src/components/**/*[Bb]utton*.tsx
Glob: src/components/**/*[Pp]anel*.tsx
```

### 2. Tailwind Pattern Search
```
# Search for specific Tailwind class combinations
Grep: "bg-white/5" or "bg-white/10"  (translucent backgrounds)
Grep: "rounded-lg"                    (card-like components)
Grep: "hover:bg-"                     (interactive elements)
Grep: "h-12"                          (header height)
```

### 3. Layout Pattern Search
```
# Search for layout structures
Grep: "grid grid-cols"               (grid layouts)
Grep: "flex flex-col"                (vertical stacks)
Grep: "sticky top-0"                 (sticky headers)
```

### 4. File Structure Search
```
# Explore component organization
ls src/components/
ls src/components/ui/
ls src/components/layout/
```

## What to Look For

### Design Tokens in Use
- Color classes (`text-white`, `bg-white/10`, etc.)
- Spacing classes (`p-4`, `gap-6`, `m-2`, etc.)
- Typography classes (`text-sm`, `font-medium`, etc.)
- Border/rounding classes (`rounded-lg`, `border-white/10`, etc.)

### Component Patterns
- How are cards structured?
- How are headers built?
- How are lists/grids laid out?
- How are interactive states handled?

### Naming Conventions
- How are components named?
- Are there consistent prefixes/suffixes?
- How is the file structure organized?

## Output Format

After discovery, document your findings:

```markdown
## Discovery Results: [what you were looking for]

### Found Components
| Component | Location | Purpose | Reusable? |
|-----------|----------|---------|-----------|
| CourseCard | src/components/CourseCard.tsx | Display course in grid | Yes |
| ... | ... | ... | ... |

### Common Patterns Observed
- Background: `bg-white/5` with `hover:bg-white/10`
- Padding: `p-4` for cards, `p-6` for containers
- Rounding: `rounded-lg` consistently
- ...

### Recommendation
- [ ] Use existing [component] for this task
- [ ] Extend [component] with new props
- [ ] Create new component following [pattern]
- [ ] Document [undocumented pattern] first
```

## Next Steps After Discovery

1. **If found and documented**: Use it directly
2. **If found but undocumented**: Run `/frontend/style-documentation` first
3. **If not found**: Run `/frontend/new-style-creation`
