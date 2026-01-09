---
description: Create new components and patterns following the established design system
---

# New Style Creation

Create new components and patterns following the established design system. Only use this after confirming nothing suitable exists via inventory and discovery.

## Prerequisites

Before using this skill, you MUST have:
1. Checked COMPONENT_INDEX.md (no existing component)
2. Run style-discovery (nothing in codebase)
3. Loaded STYLE_GUIDE.md (know the design tokens)

## Design System Reference

These are the NON-NEGOTIABLE design tokens. Memorize them.

### Backgrounds
```
Main content:     (transparent - no bg class)
Cards/panels:     bg-white/5, hover:bg-white/10
Modal overlays:   bg-black/50
Active states:    bg-white/10 or bg-white/15
```

### Text Colors
```
Primary:          text-white
Secondary:        text-white/70
Muted:            text-white/50
Disabled:         text-white/30
Links:            text-blue-400, hover:text-blue-300
```

### Borders
```
Subtle:           border-white/10
Standard:         border-white/20
Focused:          border-white/40 or ring-2 ring-white/20
```

### Spacing Scale
```
Tight:            p-2, gap-2
Standard:         p-4, gap-4
Relaxed:          p-6, gap-6
```

### Border Radius
```
Small (buttons):  rounded-md
Standard (cards): rounded-lg
Large (modals):   rounded-xl
```

### Typography
```
Headers:          text-lg font-semibold, text-xl font-bold
Body:             text-sm, text-base
Labels:           text-xs font-medium text-white/70
```

## Creation Process

```
┌─────────────────────────────────────────────────────────────┐
│                  NEW STYLE CREATION                          │
│                                                              │
│  1. REFERENCE                                               │
│     └─► Load STYLE_GUIDE.md for design tokens              │
│     └─► Look at 2-3 similar existing components             │
│     └─► Identify the visual "family" it belongs to         │
│                                                              │
│  2. DESIGN                                                  │
│     └─► Sketch the component structure (ASCII or mental)   │
│     └─► Map design tokens to each element                   │
│     └─► Plan interactive states (hover, focus, active)     │
│                                                              │
│  3. BUILD                                                   │
│     └─► Use Tailwind classes (no inline styles)            │
│     └─► Follow spacing scale exactly                        │
│     └─► Match typography patterns                           │
│     └─► Implement all interaction states                    │
│                                                              │
│  4. DOCUMENT                                                │
│     └─► Add to COMPONENT_INDEX.md                          │
│     └─► Create component doc in docs/frontend/components/  │
│     └─► Include usage example                               │
│                                                              │
│  5. VALIDATE                                                │
│     └─► Run /frontend/style-validation                      │
└─────────────────────────────────────────────────────────────┘
```

## Component Template

Use this structure for new components:

```tsx
interface ComponentNameProps {
  // Required props
  title: string
  // Optional props with defaults
  variant?: 'default' | 'secondary'
  className?: string
}

export function ComponentName({
  title,
  variant = 'default',
  className
}: ComponentNameProps) {
  return (
    <div className={cn(
      // Base styles
      "rounded-lg p-4",
      // Variant styles
      variant === 'default' && "bg-white/5",
      variant === 'secondary' && "bg-white/10",
      // Allow override
      className
    )}>
      <h3 className="text-white font-medium">{title}</h3>
    </div>
  )
}
```

## Checklist for New Components

### Structure
- [ ] Uses semantic HTML where appropriate
- [ ] Props are typed with TypeScript interface
- [ ] Has sensible default props
- [ ] Accepts `className` for customization

### Styling
- [ ] Uses Tailwind classes only (no inline styles)
- [ ] Follows spacing scale (p-2, p-4, p-6, not arbitrary)
- [ ] Uses design token colors (text-white, not text-gray-100)
- [ ] Has appropriate border radius
- [ ] Background matches pattern (transparent or bg-white/5)

### Interactivity
- [ ] Hover states defined
- [ ] Focus states for keyboard navigation
- [ ] Active/pressed states if clickable
- [ ] Disabled states if applicable
- [ ] Transitions are smooth (transition-colors, etc.)

### Accessibility
- [ ] Has appropriate ARIA labels if needed
- [ ] Keyboard navigable
- [ ] Sufficient color contrast

### Documentation
- [ ] Added to COMPONENT_INDEX.md
- [ ] Individual doc created with props table
- [ ] Usage example included
- [ ] Variants documented

## Common Patterns to Follow

### Card Pattern
```tsx
<div className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors">
  {/* content */}
</div>
```

### Header Pattern
```tsx
<div className="h-12 px-4 flex items-center justify-between sticky top-0 z-10">
  {/* content */}
</div>
```

### Button Pattern
```tsx
<button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
  {/* content */}
</button>
```

### Input Pattern
```tsx
<input className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none" />
```

## What NOT to Do

- Don't use arbitrary Tailwind values (`p-[13px]`)
- Don't use colors not in the design system
- Don't skip hover/focus states
- Don't use inline styles
- Don't forget to document
- Don't create one-off variants (make it a prop)

IMPORTANT: If you create a new style, be sure to document it using the style-documentation skill.