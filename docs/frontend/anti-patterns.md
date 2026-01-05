# Anti-Patterns

This document catalogs styling mistakes to avoid. The Frontend Agent updates this as issues are discovered.

> **Purpose**: Prevent common mistakes before they happen. Check this list during style validation.

---

## Critical Anti-Patterns (NEVER DO)

### 1. Solid Backgrounds on Main Content

**Don't:**
```tsx
<div className="bg-white">
<div className="bg-gray-900">
<div className="bg-slate-800">
```

**Why:** Blocks the platform gradient, creates visual discontinuity, looks inconsistent.

**Instead:**
```tsx
<div>                           // Transparent - preferred
<div className="bg-white/5">    // Subtle definition if needed
```

---

### 2. Inline Styles

**Don't:**
```tsx
<div style={{ padding: '16px', color: 'white' }}>
<div style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
```

**Why:** Breaks consistency, harder to maintain, can't be themed, bypasses Tailwind.

**Instead:**
```tsx
<div className="p-4 text-white">
<div className="bg-white/10">
```

---

### 3. Arbitrary Tailwind Values

**Don't:**
```tsx
<div className="p-[13px] w-[347px] text-[15px]">
```

**Why:** Creates inconsistent spacing, breaks the design system scale, harder to maintain.

**Instead:**
```tsx
<div className="p-4 w-80 text-sm">  // Use scale values
```

---

### 4. Hard-Coded Gray Colors

**Don't:**
```tsx
<span className="text-gray-400">
<div className="border-gray-700">
<div className="bg-gray-800">
```

**Why:** Doesn't match the translucent aesthetic, creates inconsistency.

**Instead:**
```tsx
<span className="text-white/70">
<div className="border-white/10">
<div className="bg-white/5">
```

---

### 5. Missing Hover States

**Don't:**
```tsx
<button className="bg-white/10">Click me</button>
<div onClick={...} className="cursor-pointer">
```

**Why:** No visual feedback, poor UX, feels broken.

**Instead:**
```tsx
<button className="bg-white/10 hover:bg-white/20 transition-colors">
<div onClick={...} className="cursor-pointer hover:bg-white/5 transition-colors">
```

---

### 6. Missing Focus States

**Don't:**
```tsx
<input className="bg-white/5 border border-white/10" />
<button className="bg-white/10">
```

**Why:** Keyboard users can't see focus, accessibility violation.

**Instead:**
```tsx
<input className="bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none" />
<button className="bg-white/10 focus:ring-2 focus:ring-white/20">
```

---

### 7. Inconsistent Header Heights

**Don't:**
```tsx
<header className="h-14">   // Wrong
<header className="h-16">   // Wrong
<header className="py-4">   // Unpredictable
```

**Why:** Creates jarring transitions between views, looks unprofessional.

**Instead:**
```tsx
<CanvasHeader />           // Use the standard component
<header className="h-12">  // If custom, use h-12
```

---

### 8. Duplicating Existing Components

**Don't:** Create a new `MySpecialCard` when `CourseCard` already does what you need.

**Why:** Maintenance burden, inconsistency, wasted effort.

**Instead:**
1. Check COMPONENT_INDEX.md first
2. Extend existing component with props if needed
3. Only create new if truly different

---

### 9. Non-Standard Border Radius

**Don't:**
```tsx
<div className="rounded-sm">     // Too subtle
<div className="rounded-[10px]"> // Arbitrary
```

**Why:** Inconsistent with the rest of the UI.

**Instead:**
```tsx
<div className="rounded-md">  // Buttons, inputs
<div className="rounded-lg">  // Cards (standard)
<div className="rounded-xl">  // Modals
```

---

### 10. Missing Transitions

**Don't:**
```tsx
<button className="bg-white/10 hover:bg-white/20">
```

**Why:** Abrupt color changes feel jarring.

**Instead:**
```tsx
<button className="bg-white/10 hover:bg-white/20 transition-colors">
// or
<button className="bg-white/10 hover:bg-white/20 transition-all duration-200">
```

---

## Moderate Anti-Patterns (Avoid)

### Using Margin Instead of Gap

**Avoid:**
```tsx
<div className="flex">
  <div className="mr-4">Item 1</div>
  <div className="mr-4">Item 2</div>
  <div>Item 3</div>
</div>
```

**Prefer:**
```tsx
<div className="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Using `!important` or Style Overrides

**Avoid:**
```tsx
<div className="!p-0">
<div className="[&>*]:hidden">
```

**Prefer:** Fix the underlying component or use proper variants.

---

## Pattern-Specific Anti-Patterns

### Cards
- Don't use `shadow-lg` on cards (too heavy for dark theme)
- Don't use solid borders (use `border-white/10`)
- Don't nest cards without visual distinction

### Forms
- Don't use browser-default focus rings
- Don't use white backgrounds on inputs
- Don't use colored validation states without opacity

### Navigation
- Don't use different heights for headers
- Don't use solid backgrounds in nav
- Don't hardcode widths for responsive elements

---

## Adding to This Document

When you discover a new anti-pattern:

1. Add it under the appropriate severity section
2. Include a "Don't" example
3. Explain "Why" it's problematic
4. Provide an "Instead" example
5. Consider if it should be in style validation checklist
