# Page Standards

> **Status**: Active
> **Last Updated**: 2026-01-13

This document defines the mandatory standards for creating new pages in EnhancedHR.ai. Every new page MUST follow these patterns to maintain consistency and ensure full platform integration.

## The Three Pillars

Every page in EnhancedHR.ai requires three core elements:

1. **Canvas Header** - Consistent page header treatment
2. **Transparent Background** - Allow platform gradient to show through
3. **AI Panel Integration** - Every page has AI assistance

---

## 1. Canvas Header Standard

All pages use the "Canvas Header" pattern - a glassy, translucent header that provides context and actions.

### Required Specifications

| Property | Value | Notes |
|----------|-------|-------|
| Height | `h-24` (96px) | **SACRED** - never vary |
| Background | `bg-white/5 backdrop-blur-xl` | Translucent, not solid |
| Border | `border-b border-white/10` | Subtle separator |
| Shadow | `shadow-[0_4px_30px_rgba(0,0,0,0.1)]` | Subtle depth |
| Padding | `px-10` | Horizontal padding |
| Layout | `flex items-center justify-between` | Left content, right actions |
| Z-index | `z-30` | Above scrolling content |

### Header Structure

```tsx
<div className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10">
    {/* Left Side: Context + Title */}
    <div>
        <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-light">
                {/* Context Label - e.g., "My Organization", "Academy", "Personal Library" */}
            </span>
        </div>
        <h1 className="text-3xl font-light text-white tracking-tight">
            {/* First Word */} <span className="font-bold text-white">{/* Bold Word(s) */}</span>
        </h1>
    </div>

    {/* Right Side: Actions */}
    <div className="flex items-center gap-3">
        {/* Action buttons, toggles, etc. */}
    </div>
</div>
```

### Typography Pattern

- **Context Label**: `text-[10px] font-bold uppercase tracking-widest text-brand-blue-light`
- **Title**: `text-3xl font-light text-white tracking-tight`
- **Title Emphasis**: First word is `font-light`, key word(s) are `font-bold`

Examples:
- "Personal **Context**"
- "Organization **Courses**"
- "Admin **Console**"

---

## 2. Background Standard

Pages MUST have transparent backgrounds to allow the platform's BackgroundSystem gradient to show through.

### The Rule

**NEVER** add background colors to page-level containers. The visual depth and premium feel of EnhancedHR.ai comes from the gradient background showing through all content.

### Correct Pattern

```tsx
// Layout includes BackgroundSystem
<div className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]">
    <BackgroundSystem theme={currentTheme} />

    <div className="flex w-full h-full relative z-10">
        <NavigationPanel ... />
        <main className="flex-1 overflow-hidden flex flex-col">
            {/* No background here! */}
            {children}
        </main>
        <AIPanel ... />
    </div>
</div>
```

### Page Content

```tsx
// Page component - NO background
<div className="flex flex-col h-full">
    {/* Canvas Header - has its own subtle bg-white/5 */}
    <div className="h-24 ... bg-white/5 backdrop-blur-xl">
        ...
    </div>

    {/* Content Area - NO background */}
    <div className="flex-1 overflow-y-auto p-8">
        {/* Cards and panels can have bg-white/5 or bg-white/10 */}
        <div className="bg-white/5 rounded-xl p-4">
            ...
        </div>
    </div>
</div>
```

### What CAN Have Backgrounds

- Cards: `bg-white/5` or `bg-[#0B1120]` for dark cards
- Panels: `bg-white/5 backdrop-blur-xl`
- Modals: Modal overlays with `bg-black/50`
- Interactive elements: Hover states with `hover:bg-white/10`

### What CANNOT Have Backgrounds

- Page containers
- Main content areas
- Layout wrappers
- Section dividers

---

## 3. AI Panel Integration Standard

**EVERY page must have an AI Panel.** This is non-negotiable. The AI is a core part of the EnhancedHR.ai experience.

### Planning New Features

When planning any new feature or page, always ask:
> "How should the AI panel work on this page? What agent type? What context scope?"

### Required Integration

Every page layout must include:

```tsx
<AIPanel
    isOpen={rightOpen}
    setIsOpen={setRightOpen}
    agentType="<appropriate_agent_type>"
    contextScope={{ type: '<SCOPE_TYPE>', id: '<context_id>' } as ContextScope}
    contextTitle="<Feature Name>"
/>
```

### Agent Type Selection

| Page Type | Agent Type | Context Scope Type |
|-----------|------------|-------------------|
| Dashboard | `platform_assistant` | `PLATFORM` |
| Course Player | `course_assistant` or `course_tutor` | `COURSE` |
| Collection View | `collection_assistant` | `COLLECTION` |
| Org Courses | `org_course_assistant` | `ORG_COURSES` |
| Team Analytics | `team_analytics_assistant` | `USER` |
| Academy Browse | `platform_assistant` | `PLATFORM` |

### Adding New Agent Types

When creating a new page type that needs specialized AI context:

1. **Add to types.ts**:
```typescript
// src/lib/ai/types.ts
export type AgentType = ... | 'new_agent_type';
export type ContextScopeType = ... | 'NEW_SCOPE_TYPE';
```

2. **Add to context-resolver.ts**:
```typescript
// Handle the new context type
if (context.type === 'NEW_SCOPE_TYPE') {
    return {
        ...baseScope,
        // Configure RAG scope appropriately
    };
}
```

3. **Add to AIPanel.tsx** (agent display config):
```typescript
case 'new_agent_type': return {
    name: 'Feature Name Assistant',
    icon: SomeIcon,
    color: 'text-<color>-400',
    themeColor: 'bg-<color>-400'
};
```

4. **Add welcome message** in AIPanel.tsx:
```tsx
{effectiveAgentType === 'new_agent_type' && (
    <>
        <p>I'm your Feature Name assistant.</p>
        <p className="mt-2 text-slate-400 text-xs">
            Description of what this agent can help with.
        </p>
    </>
)}
```

---

## Layout Structure Pattern

Every feature area follows this layout pattern:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Full Screen Container                            │
│  className="relative flex h-screen w-full overflow-hidden ..."         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      BackgroundSystem                              │ │
│  │                      (Gradient layer)                              │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    Application Layer (z-10)                        │ │
│  │  className="flex w-full h-full relative z-10"                      │ │
│  │                                                                     │ │
│  │  ┌─────────┐  ┌─────────────────────────────────┐  ┌─────────────┐│ │
│  │  │ NavPanel│  │           Main Content          │  │  AIPanel    ││ │
│  │  │ (Left)  │  │                                  │  │  (Right)    ││ │
│  │  │         │  │  ┌───────────────────────────┐  │  │             ││ │
│  │  │         │  │  │     Canvas Header         │  │  │             ││ │
│  │  │         │  │  │     h-24, bg-white/5      │  │  │             ││ │
│  │  │         │  │  └───────────────────────────┘  │  │             ││ │
│  │  │         │  │                                  │  │             ││ │
│  │  │         │  │  ┌───────────────────────────┐  │  │             ││ │
│  │  │         │  │  │   Scrollable Content      │  │  │             ││ │
│  │  │         │  │  │   (TRANSPARENT bg)        │  │  │             ││ │
│  │  │         │  │  │                           │  │  │             ││ │
│  │  │         │  │  │   Cards have bg-white/5   │  │  │             ││ │
│  │  │         │  │  │                           │  │  │             ││ │
│  │  │         │  │  └───────────────────────────┘  │  │             ││ │
│  │  └─────────┘  └─────────────────────────────────┘  └─────────────┘│ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Layout Implementation

```tsx
// feature/layout.tsx
export default function FeatureLayout({ children }: { children: React.ReactNode }) {
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);

    return (
        <div className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]">
            {/* Global Background System */}
            <BackgroundSystem theme={currentTheme} />

            {/* Main Application Layer */}
            <div className="flex w-full h-full relative z-10">
                {/* Left Navigation */}
                <NavigationPanel
                    isOpen={leftOpen}
                    setIsOpen={setLeftOpen}
                    currentTheme={currentTheme}
                    onThemeChange={setCurrentTheme}
                    activeCollectionId="feature-id"
                    onSelectCollection={handleSelectCollection}
                    // ... other props
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-hidden">
                        {children}
                    </div>
                </main>

                {/* Right AI Panel - REQUIRED */}
                <AIPanel
                    isOpen={rightOpen}
                    setIsOpen={setRightOpen}
                    agentType="feature_assistant"
                    contextScope={{ type: 'FEATURE_SCOPE', id: contextId } as ContextScope}
                    contextTitle="Feature Name"
                />
            </div>
        </div>
    );
}
```

---

## Checklist for New Pages

When creating a new page, verify:

- [ ] **Canvas Header** uses exact specifications (`h-24`, `bg-white/5 backdrop-blur-xl`, etc.)
- [ ] **No background color** on page container or content wrapper
- [ ] **AIPanel included** in layout with appropriate agent type
- [ ] **Context scope** configured correctly for RAG
- [ ] **Title pattern** follows "Word **BoldWord**" convention
- [ ] **Context label** is uppercase, small, and uses brand colors
- [ ] **Scrollable content** area uses `overflow-y-auto` with `custom-scrollbar`
- [ ] **Cards** use `bg-white/5` or `bg-[#0B1120]`, not solid backgrounds

---

## Anti-Patterns

### NEVER Do These

1. **Solid page backgrounds**
   ```tsx
   // WRONG
   <div className="bg-slate-900">...</div>

   // CORRECT
   <div className="flex flex-col h-full">...</div>
   ```

2. **Variable header heights**
   ```tsx
   // WRONG
   <header className="h-16">...</header>

   // CORRECT
   <header className="h-24">...</header>
   ```

3. **Missing AI Panel**
   ```tsx
   // WRONG - no AIPanel
   <main>{children}</main>

   // CORRECT
   <main>{children}</main>
   <AIPanel ... />
   ```

4. **Wrong context scope**
   ```tsx
   // WRONG - generic platform scope on feature-specific page
   <AIPanel contextScope={{ type: 'PLATFORM' }} />

   // CORRECT - feature-specific scope
   <AIPanel contextScope={{ type: 'ORG_COURSES', id: orgId }} />
   ```

---

## Related Documentation

- `docs/frontend/STYLE_GUIDE.md` - Design tokens and styling
- `docs/frontend/components/CanvasHeader.md` - Header component details
- `docs/frontend/components/BackgroundSystem.md` - Background system
- `docs/features/ai-context-engine.md` - AI context and RAG system
