---
description: Validate frontend work against the design system for consistency
---

# Style Validation

Validate frontend work against the design system. Run this AFTER completing any UI work to ensure consistency.

## When to Use

- After creating a new component
- After modifying an existing component
- After implementing any UI changes
- Before marking frontend work as complete

## Validation Checklist

Run through each category and verify compliance.

```
┌─────────────────────────────────────────────────────────────┐
│                    STYLE VALIDATION                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. DESIGN TOKENS                               [ ]  │   │
│  │     Colors match system                              │   │
│  │     Spacing follows scale                            │   │
│  │     Typography is consistent                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2. ANTI-PATTERNS                               [ ]  │   │
│  │     No solid backgrounds on main areas               │   │
│  │     No inline styles                                 │   │
│  │     No arbitrary values                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  3. COMPONENT REUSE                             [ ]  │   │
│  │     Used existing components where possible          │   │
│  │     Didn't duplicate existing patterns               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  4. INTERACTIVITY                               [ ]  │   │
│  │     Hover states present                             │   │
│  │     Focus states for keyboard                        │   │
│  │     Transitions are smooth                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  5. DOCUMENTATION                               [ ]  │   │
│  │     New components documented                        │   │
│  │     COMPONENT_INDEX updated                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Checks

### 1. Design Token Validation

**Colors**
| Check | Valid | Invalid |
|-------|-------|---------|
| Primary text | `text-white` | `text-gray-100`, `text-slate-50` |
| Secondary text | `text-white/70` | `text-gray-400`, `text-slate-400` |
| Card backgrounds | `bg-white/5`, `bg-white/10` | `bg-gray-800`, `bg-slate-900` |
| Main backgrounds | transparent (no class) | `bg-white`, `bg-gray-900` |
| Borders | `border-white/10`, `border-white/20` | `border-gray-700` |

**Spacing**
| Check | Valid | Invalid |
|-------|-------|---------|
| Padding | `p-2`, `p-4`, `p-6` | `p-[13px]`, `p-3` (unless intentional) |
| Gaps | `gap-2`, `gap-4`, `gap-6` | `gap-[18px]` |
| Margins | `m-2`, `m-4`, `my-6` | `m-[7px]` |

**Typography**
| Check | Valid | Invalid |
|-------|-------|---------|
| Font sizes | `text-xs`, `text-sm`, `text-base`, `text-lg` | `text-[15px]` |
| Font weights | `font-medium`, `font-semibold`, `font-bold` | `font-[450]` |

### 2. Anti-Pattern Detection

Scan for these violations:

```
FAIL: Solid backgrounds on content
└─► bg-white, bg-gray-*, bg-slate-* on main content areas

FAIL: Inline styles
└─► style={{ anything }}

FAIL: Arbitrary values
└─► p-[13px], text-[15px], w-[347px]

FAIL: Inconsistent header heights
└─► h-14, h-16 on canvas headers (should be h-12)

FAIL: Hard-coded colors
└─► text-gray-400 instead of text-white/70

FAIL: Missing hover states on interactive elements
└─► Clickable elements without hover:bg-* or hover:text-*
```

### 3. Component Reuse Check

- Did you check COMPONENT_INDEX.md first?
- Is there an existing component that could have been used?
- If you created something new, is it sufficiently different to justify?
- Could your new component replace or extend an existing one?

### 4. Interactivity Check

For every interactive element:

```tsx
// Button/Link - MUST HAVE:
hover:bg-*        // Visual feedback
transition-colors // Smooth change
focus:outline-*   // Keyboard visibility

// Input - MUST HAVE:
focus:border-*    // Focus indication
placeholder:text-* // Placeholder styling

// Card - IF CLICKABLE:
hover:bg-white/10 // Hover state
cursor-pointer    // Cursor feedback
```

### 5. Documentation Check

If you created something new:
- [ ] Is it in COMPONENT_INDEX.md?
- [ ] Does it have a doc in `docs/frontend/components/`?
- [ ] Are props documented?
- [ ] Is there a usage example?

## Validation Report Format

```markdown
## Style Validation Report

### Component/Feature: [name]

### Design Tokens
- [ ] Colors: PASS/FAIL (details)
- [ ] Spacing: PASS/FAIL (details)
- [ ] Typography: PASS/FAIL (details)

### Anti-Patterns
- [ ] No solid backgrounds: PASS/FAIL
- [ ] No inline styles: PASS/FAIL
- [ ] No arbitrary values: PASS/FAIL
- [ ] Consistent heights: PASS/FAIL

### Component Reuse
- [ ] Checked inventory: YES/NO
- [ ] Reused where possible: YES/NO/NA

### Interactivity
- [ ] Hover states: PASS/FAIL/NA
- [ ] Focus states: PASS/FAIL/NA
- [ ] Transitions: PASS/FAIL/NA

### Documentation
- [ ] Index updated: YES/NO/NA
- [ ] Component doc: YES/NO/NA

### Overall: PASS / FAIL

### Issues to Fix
1. [issue description] → [how to fix]
2. ...
```

## Common Fixes

| Issue | Fix |
|-------|-----|
| Solid background | Remove bg class or use `bg-white/5` |
| Wrong text color | Use `text-white` or `text-white/70` |
| Missing hover | Add `hover:bg-white/10` |
| Arbitrary spacing | Use nearest scale value (`p-4` instead of `p-[15px]`) |
| Missing transition | Add `transition-colors` or `transition-all` |
| Inline style | Convert to Tailwind class |
