# EnhancedHR.ai Style Guide

This is the authoritative source for design tokens and styling principles. The Frontend Agent maintains this document as it discovers and documents patterns.

> **Status**: Bootstrapped on 2026-01-04. Contains discovered patterns from codebase analysis.

---

## Design Philosophy

EnhancedHR.ai uses a **dark, translucent aesthetic** with a rich gradient background. The design should feel:
- **Modern and premium** — high-end consumer tech, not corporate LMS
- **Clean and spacious** — generous whitespace, not cramped
- **Subtle and layered** — translucent overlays, not solid blocks

### Key Principle: Transparent Backgrounds

Main content areas should have **NO background color**. The platform's gradient background should show through. Use subtle translucent cards (`bg-white/5`) to define content boundaries without blocking the background.

---

## Color System

### Text Colors

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| Primary | `text-white` | Headings, primary content |
| Secondary | `text-white/70` | Supporting text, descriptions |
| Muted | `text-white/50` | Hints, timestamps |
| Disabled | `text-white/30` | Disabled states |
| Link | `text-blue-400` | Hyperlinks |
| Link Hover | `hover:text-blue-300` | Link hover state |

### Background Colors

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| Transparent | (no class) | Main content areas — ALWAYS |
| Card | `bg-white/5` | Cards, panels, containers |
| Card Hover | `hover:bg-white/10` | Interactive card hover |
| Active | `bg-white/10` | Active/selected states |
| Overlay | `bg-black/50` | Modal backdrops |

### Border Colors

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| Subtle | `border-white/10` | Default borders |
| Standard | `border-white/20` | More visible borders |
| Focus | `border-white/40` | Focus states |

### Accent Colors

Brand colors are defined in `src/app/globals.css` using CSS custom properties:

| Token | Tailwind Class | Hex Value | Usage |
|-------|---------------|-----------|-------|
| Brand Blue Light | `text-brand-blue-light` or `bg-brand-blue-light` | #78C0F0 | Primary accents, interactive highlights, glows |
| Brand Blue | `text-brand-blue` or `bg-brand-blue` | #054C74 | Primary brand color, headers |
| Brand Blue Dark | `text-brand-blue-dark` or `bg-brand-blue-dark` | #052333 | Dark backgrounds, gradients |
| Brand Black | `text-brand-black` or `bg-brand-black` | #0A0D12 | Base background color |
| Brand Orange | `text-brand-orange` or `bg-brand-orange` | #FF9300 | Secondary accent, AI features, highlights |
| Brand Red | `text-brand-red` or `bg-brand-red` | #FF2600 | Error states, destructive actions, alerts |

### Common Color Combinations

| Purpose | Classes | Example Usage |
|---------|---------|---------------|
| Card background | `bg-white/5` or `bg-white/10` | Translucent card surfaces |
| Active state | `bg-white/10 border-white/10` | Selected navigation items |
| Glow effect | `shadow-[0_0_15px_rgba(120,192,240,0.5)]` | Brand blue light glow |
| Context label | `text-brand-blue-light` | Small uppercase labels |
| Header gradient | `bg-gradient-to-b from-[#054C74] to-[#022031]` | Navigation panel |

---

## Typography

### Font Sizes

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| XS | `text-xs` | Labels, metadata |
| SM | `text-sm` | Body text, descriptions |
| Base | `text-base` | Primary content |
| LG | `text-lg` | Section headers |
| XL | `text-xl` | Page titles |
| 2XL | `text-2xl` | Hero text |

### Font Weights

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| Normal | `font-normal` | Body text |
| Medium | `font-medium` | Emphasis, labels |
| Semibold | `font-semibold` | Headers |
| Bold | `font-bold` | Strong emphasis |

### Common Combinations

| Pattern | Classes | Example |
|---------|---------|---------|
| Page title | `text-3xl font-light text-white` with `font-bold` for emphasis word | "Personal **Context**" |
| Canvas header title | `text-3xl font-light text-white tracking-tight drop-shadow-lg` | CanvasHeader component |
| Context label | `text-[10px] font-bold uppercase tracking-widest text-brand-blue-light` | Small labels above titles |
| Card title | `text-lg font-bold text-white` or `text-[17px] font-bold` | UniversalCard titles |
| Card subtitle | `text-xs font-medium text-white/70 tracking-wide` | Author/meta info |
| Body text | `text-[13px] text-slate-300 font-light leading-relaxed` | Card descriptions |
| Label | `text-xs font-medium text-white/70` | Form labels |
| Metadata | `text-[10px] font-bold tracking-wider uppercase text-slate-500` | Timestamps, counts |
| Type badge | `text-[10px] font-bold tracking-[0.2em] uppercase text-white/70` | Card type labels |

---

## Spacing

### Padding Scale

| Size | Class | Usage |
|------|-------|-------|
| Tight | `p-2` | Compact elements, icons |
| Standard | `p-4` | Cards, containers |
| Relaxed | `p-6` | Larger containers, modals |

### Gap Scale

| Size | Class | Usage |
|------|-------|-------|
| Tight | `gap-2` | Inline items, icons |
| Standard | `gap-4` | Card grids, lists |
| Relaxed | `gap-6` | Major sections |

### Margin Scale

Use margins sparingly. Prefer gaps in flex/grid containers.

---

## Border Radius

| Token | Class | Usage |
|-------|-------|-------|
| Small | `rounded-md` or `rounded-lg` | Buttons, small containers |
| Standard | `rounded-xl` | Panels, navigation items |
| Large | `rounded-2xl` or `rounded-3xl` | Cards (UniversalCard uses `rounded-3xl`) |
| Full | `rounded-full` | Avatars, circular buttons, badges |

**Card Pattern**: Most cards use `rounded-3xl` for a premium, modern appearance.

---

## Shadows

Shadows create depth in the dark theme. Custom shadow values are commonly used:

| Token | Class | Usage |
|-------|-------|-------|
| None | (default) | Flat elements |
| Card default | `shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]` | UniversalCard base shadow |
| Card hover | `shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4)]` | UniversalCard hover state |
| Glow blue | `shadow-[0_0_15px_rgba(120,192,240,0.5)]` | Brand blue glow effect |
| Glow orange | `shadow-[0_0_30px_rgba(255,147,0,0.3)]` | Brand orange glow |
| Panel | `shadow-[5px_0_30px_0_rgba(0,0,0,0.3)]` | NavigationPanel depth |
| Header | `shadow-[0_4px_30px_rgba(0,0,0,0.1)]` | CanvasHeader subtle depth |

---

## Interactive States

### Buttons

```
Default:    bg-white/10 text-white
Hover:      hover:bg-white/20
Active:     active:bg-white/25
Disabled:   opacity-50 cursor-not-allowed
Focus:      focus:ring-2 focus:ring-white/20
```

### Cards (Clickable)

```
Default:    bg-white/5
Hover:      hover:bg-white/10
Active:     bg-white/10
Transition: transition-colors
```

### Inputs

```
Default:    bg-white/5 border border-white/10
Focus:      focus:border-white/30 focus:outline-none
Placeholder: placeholder:text-white/40
```

### Links

```
Default:    text-blue-400
Hover:      hover:text-blue-300
Underline:  hover:underline (optional)
```

---

## Layout Principles

### Canvas Structure

```
┌─────────────────────────────────────────────────────────┐
│  CanvasHeader (h-24, fixed height, with border-bottom)  │
│  - bg-white/5 backdrop-blur-xl                          │
│  - border-b border-white/10                             │
│  - px-10 (horizontal padding)                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Content Area (flex-1, overflow-auto)                   │
│  - p-8 typical for main canvas                          │
│  - Background: TRANSPARENT (platform gradient shows)     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Layout Details**:
- **CanvasHeader**: Always `h-24` (not h-12), uses `flex items-center justify-between`
- **NavigationPanel**: Width toggles between `w-20` (collapsed) and `w-72` (expanded)
- **Content padding**: Usually `p-8` for main canvas areas
- **Logo area**: Fixed `h-24` to match header height

### Card Grid

Cards use a responsive grid with consistent aspect ratios:

```
┌─────────────────────────────────────────────────────────┐
│  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6  │
│                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │ UniversalCard │  │ UniversalCard │  │ Universal.. │ │
│  │ aspect-[4/3]  │  │ aspect-[4/3]  │  │ aspect-[4/3]│ │
│  │ min-h-[310px] │  │ min-h-[310px] │  │ min-h-[..]  │ │
│  │ rounded-3xl   │  │ rounded-3xl   │  │ rounded-3xl │ │
│  │ bg-[#0B1120]  │  │ bg-[#0B1120]  │  │ bg-[#0B1120]│ │
│  └───────────────┘  └───────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Card Structure** (UniversalCard pattern):
- **Aspect ratio**: `aspect-[4/3]` with `min-h-[310px]`
- **Border radius**: `rounded-3xl`
- **Base background**: `bg-[#0B1120]` (dark blue-black)
- **Border**: Type-specific (e.g., `border-blue-500/30` for courses)
- **Shadow**: Dual-layer shadow that intensifies on hover
- **Layout**: Top section (45-60% height) + Bottom section (40-55% height)

---

## Anti-Patterns

See `docs/frontend/anti-patterns.md` for a full list of what to avoid.

Key violations:
- **NEVER** use solid backgrounds on main content areas
- **NEVER** use inline styles
- **NEVER** use arbitrary Tailwind values
- **NEVER** skip hover states on interactive elements
- **NEVER** duplicate existing components

---

## Updating This Guide

This guide is maintained by the Frontend Agent. When new patterns are discovered:

1. Document the pattern in the appropriate section
2. Add usage examples
3. Update COMPONENT_INDEX.md if new components are involved
4. Note any anti-patterns discovered
