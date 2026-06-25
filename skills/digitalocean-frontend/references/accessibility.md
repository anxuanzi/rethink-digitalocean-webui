# Accessibility (a11y) Guide

Practical accessibility patterns for the DigitalOcean console. Every feature must be usable by
keyboard-only users and understandable by screen readers. This is not optional — it's professional
quality.

## Table of Contents
- [Core Principles](#core-principles)
- [Keyboard Navigation](#keyboard-navigation)
- [Focus Management](#focus-management)
- [ARIA Patterns](#aria-patterns)
- [Color & Contrast](#color--contrast)
- [Screen Reader Support](#screen-reader-support)
- [Component-Specific a11y](#component-specific-a11y)
- [Testing Checklist](#testing-checklist)

## Core Principles

1. **Perceivable**: Information is presentable in ways all users can perceive (text alternatives, sufficient contrast)
2. **Operable**: All functionality is operable via keyboard (no mouse-only interactions)
3. **Understandable**: Content and operation are understandable (clear labels, predictable behavior)
4. **Robust**: Content works with assistive technologies (semantic HTML, ARIA when needed)

**WCAG 2.1 Level AA** is the target for the console.

## Keyboard Navigation

### Tab Order

Ensure logical tab order follows visual flow — top-to-bottom, left-to-right:

```vue
<!-- Natural tab order: search → filter → create button → table rows → pagination -->
<UDashboardToolbar>
  <template #left>
    <UInput v-model="search" placeholder="Search Droplets..." />  <!-- Tab stop 1 -->
    <USelectMenu v-model="region" :items="regions" />             <!-- Tab stop 2 -->
  </template>
  <template #right>
    <UButton @click="openCreate">Create Droplet</UButton>         <!-- Tab stop 3 -->
  </template>
</UDashboardToolbar>
```

### Keyboard Shortcuts

Nuxt UI handles most component keyboard behavior (Enter to select, Escape to close). Add custom shortcuts for power users:

```typescript
// Global keyboard shortcuts via VueUse
const { Ctrl_K } = useMagicKeys()

// Open command palette / global search
watch(Ctrl_K, (v) => {
  if (v) openCommandPalette()
})
```

### Custom Interactive Elements

When building custom interactive elements (not using Nuxt UI components), add keyboard support:

```vue
<!-- Clickable card must be keyboard-accessible -->
<div
  role="button"
  tabindex="0"
  class="cursor-pointer rounded-lg border border-default p-4
         hover:bg-elevated/50 transition-colors duration-150
         focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
  @click="handleClick"
  @keydown.enter="handleClick"
  @keydown.space.prevent="handleClick"
>
  <!-- card content -->
</div>

<!-- Clickable list item -->
<li
  role="option"
  tabindex="0"
  :aria-selected="isSelected"
  class="cursor-pointer px-4 py-2 hover:bg-elevated/50
         focus-visible:bg-elevated/50 focus-visible:outline-none"
  @click="select"
  @keydown.enter="select"
>
  {{ item.label }}
</li>
```

## Focus Management

### Modal/Slideover Focus Trap

Nuxt UI handles focus trapping in `UModal` and `USlideover` automatically. For custom overlays:

```typescript
// Focus the first interactive element when modal opens
const firstInput = ref<HTMLElement>()

watch(isOpen, (open) => {
  if (open) {
    nextTick(() => firstInput.value?.focus())
  }
})
```

### Focus Restoration

When a modal closes, return focus to the element that triggered it:

```typescript
// Nuxt UI's useOverlay handles this automatically
// For manual modals, store the trigger element:
const triggerRef = ref<HTMLElement>()

const openModal = (event: Event) => {
  triggerRef.value = event.target as HTMLElement
  isOpen.value = true
}

const closeModal = () => {
  isOpen.value = false
  nextTick(() => triggerRef.value?.focus())
}
```

### Focus Indicators

Always use `focus-visible` (not `focus`) to show focus rings only for keyboard users:

```vue
<!-- focus-visible: ring appears on Tab, not on click -->
class="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"

<!-- WRONG: focus ring on mouse click too (distracting) -->
class="focus:ring-2 focus:ring-primary"
```

### Skip Links (Optional)

For complex pages with many navigation elements before main content:

```vue
<!-- At the top of the page, visually hidden until focused -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4
         focus:bg-white dark:focus:bg-gray-900 focus:text-primary"
>
  Skip to main content
</a>

<!-- Main content landmark -->
<main id="main-content">
  <!-- page content -->
</main>
```

## ARIA Patterns

### When to Use ARIA

**First rule of ARIA**: Don't use ARIA if native HTML achieves the same result.

```vue
<!-- WRONG: div with ARIA role -->
<div role="button" tabindex="0" @click="action">Click me</div>

<!-- RIGHT: Native button element -->
<UButton @click="action">Click me</UButton>

<!-- WRONG: ARIA label duplicating visible text -->
<UButton aria-label="Create Droplet">Create Droplet</UButton>

<!-- RIGHT: ARIA label only when icon-only -->
<UButton icon="i-lucide-pencil" aria-label="Edit Droplet" />
```

### Common ARIA Patterns

**Icon-only buttons** — must have accessible names:

```vue
<UButton
  variant="ghost"
  icon="i-lucide-pencil"
  aria-label="Edit Droplet"
  class="cursor-pointer"
/>

<UButton
  variant="ghost"
  icon="i-lucide-trash-2"
  color="error"
  aria-label="Delete Droplet"
  class="cursor-pointer"
/>
```

**Status indicators** — announce state changes:

```vue
<!-- Badge with screen reader context -->
<UBadge color="success" variant="subtle">
  <span class="flex items-center gap-1.5">
    <UIcon name="i-lucide-check-circle" class="w-3.5 h-3.5" />
    Active
  </span>
</UBadge>
<!-- Screen reader reads: "Active" — good, the icon is decorative -->

<!-- If icon conveys unique meaning, add sr-only text -->
<div class="flex items-center gap-2" role="status" aria-label="Droplet is active since July 2020">
  <UBadge color="success" variant="subtle">Active</UBadge>
  <span class="text-xs text-muted">created {{ format(parseISO(droplet.created_at), 'MMM yyyy') }}</span>
</div>
```

**Live regions** — announce dynamic updates:

```vue
<!-- Announce item count changes to screen readers -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {{ filteredItems.length }} Droplets found
</div>

<!-- Announce toast-like status messages -->
<div role="status" aria-live="polite" class="sr-only">
  {{ statusMessage }}
</div>
```

For async DigitalOcean actions (power on/off, resize, snapshot), use a live region to announce
the transition so screen reader users know the optimistic state was applied:

```vue
<!-- Announce async action progress while it reconciles -->
<div role="status" aria-live="polite" class="sr-only">
  {{ actionMessage }}  <!-- e.g. "Resizing Droplet web-01…" then "Resize completed" -->
</div>
```

**Tables** — provide context:

```vue
<UTable
  :data="droplets"
  :columns="columns"
  aria-label="Droplets"
/>
<!-- Nuxt UI UTable renders a semantic <table> with proper <thead>/<tbody> -->
```

**Loading states** — announce to screen readers:

```vue
<div v-if="loading" role="status" aria-label="Loading Droplets">
  <USkeleton class="h-10 w-full" />
  <span class="sr-only">Loading Droplets...</span>
</div>
```

## Color & Contrast

### Minimum Contrast Ratios (WCAG AA)

| Text Size | Required Ratio | Passes? |
|---|---|---|
| Normal text (< 18px) | 4.5:1 | Check with DevTools |
| Large text (≥ 18px or ≥ 14px bold) | 3:1 | More relaxed |
| UI components & graphics | 3:1 | Icons, borders, form outlines |

### Don't Rely on Color Alone

Always pair color with a secondary indicator. Droplet status is the canonical case —
`active`, `off`, `new`, and `archive` must each be distinguishable without color:

```vue
<!-- WRONG: Status communicated only by color -->
<div :class="isActive ? 'text-green-500' : 'text-red-500'">
  ●
</div>

<!-- RIGHT: Color + icon + text -->
<UBadge :color="isActive ? 'success' : 'error'" variant="subtle">
  <span class="flex items-center gap-1.5">
    <UIcon :name="isActive ? 'i-lucide-check-circle' : 'i-lucide-x-circle'" class="w-3.5 h-3.5" />
    {{ isActive ? 'Active' : 'Off' }}
  </span>
</UBadge>
```

### Muted Text Contrast

`text-muted` (Nuxt UI semantic class) is designed for AA compliance. Avoid stacking opacity on top:

```vue
<!-- WRONG: text-muted + opacity further reduces contrast -->
<p class="text-muted opacity-50">Hard to read</p>

<!-- RIGHT: Use text-muted as-is -->
<p class="text-muted">Readable secondary text</p>
```

## Screen Reader Support

### Semantic HTML

Use proper HTML elements — they provide free accessibility:

```vue
<!-- Use headings for page structure -->
<h1>Droplets</h1>               <!-- Page title (via UDashboardNavbar) -->
<h2>Active Droplets</h2>        <!-- Section heading -->
<h3>Networking</h3>             <!-- Sub-section -->

<!-- Use lists for groups of items -->
<ul role="list">
  <li v-for="item in items" :key="item.id">...</li>
</ul>

<!-- Use nav for navigation -->
<nav aria-label="Main navigation">
  <UNavigationMenu :items="links" />
</nav>

<!-- Use main for primary content -->
<main>
  <UDashboardPanel>...</UDashboardPanel>
</main>
```

### Visually Hidden Text

Use `sr-only` for screen-reader-only context:

```vue
<!-- Table action column header -->
<th>
  <span class="sr-only">Actions</span>
</th>

<!-- Decorative icon with context -->
<UIcon name="i-lucide-clock" class="w-4 h-4 text-muted" aria-hidden="true" />
<span class="sr-only">Created:</span>
<span>{{ formatDistanceToNow(parseISO(droplet.created_at), { addSuffix: true }) }}</span>
```

## Component-Specific a11y

### Forms

```vue
<UFormField label="Droplet Name" name="name" required>
  <!-- UFormField provides: <label>, aria-required, error association -->
  <UInput
    v-model="state.name"
    type="text"
    placeholder="e.g. web-01"
    autocomplete="off"
  />
</UFormField>

<!-- Help text associated with the field -->
<UFormField label="Hostname" name="hostname" help="Lowercase, letters, numbers, and hyphens only">
  <UInput v-model="state.hostname" />
</UFormField>
```

### Modals

```vue
<UModal v-model:open="isOpen">
  <template #header>
    <!-- UModal auto-sets aria-labelledby from header content -->
    <h3 class="text-lg font-semibold">Resize Droplet</h3>
  </template>
  <template #body>
    <!-- Content is focus-trapped automatically -->
  </template>
  <template #footer>
    <!-- Escape key closes modal automatically -->
    <UButton variant="ghost" @click="isOpen = false">Cancel</UButton>
    <UButton @click="resize">Resize</UButton>
  </template>
</UModal>
```

### Tables

```vue
<!-- Empty table state with screen reader announcement -->
<UTable :data="items" :columns="columns" aria-label="Droplets list">
  <template #empty>
    <div role="status" class="text-center py-12">
      <p>No Droplets found</p>
    </div>
  </template>
</UTable>
```

### Dropdown Menus

```vue
<!-- UDropdownMenu handles keyboard nav (arrow keys, Enter, Escape) -->
<UDropdownMenu :items="actions">
  <UButton
    variant="ghost"
    icon="i-lucide-more-horizontal"
    aria-label="Droplet actions"
    class="cursor-pointer"
  />
</UDropdownMenu>
```

## Testing Checklist

Run through this checklist for every new page or component:

### Keyboard

- [ ] All interactive elements reachable via Tab
- [ ] Tab order follows visual flow (no unexpected jumps)
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals, dropdowns, and popovers
- [ ] Arrow keys navigate within menus and selects
- [ ] Focus indicator visible on all focusable elements
- [ ] No keyboard traps (can always Tab out of a component, except modals)

### Screen Reader (test with VoiceOver on Mac: Cmd+F5)

- [ ] Page structure announced via headings (h1-h3)
- [ ] Interactive elements have accessible names
- [ ] Icon-only buttons have `aria-label`
- [ ] Images have `alt` text (or `aria-hidden="true"` if decorative)
- [ ] Form fields have associated labels (via `UFormField`)
- [ ] Error messages are announced (via `aria-live` or field association)
- [ ] Dynamic content updates announced (loading states, counts, async action progress)
- [ ] Tables have column headers that make sense when read aloud

### Visual

- [ ] Text contrast meets 4.5:1 ratio (use browser DevTools → Accessibility)
- [ ] Information not conveyed by color alone (icons + text + color)
- [ ] Focus rings visible in both light and dark mode
- [ ] UI is usable at 200% browser zoom
- [ ] No content clipped or hidden at 200% zoom
- [ ] Touch targets at least 44x44px on mobile

---

## Related References

- [ui-quality.md](ui-quality.md) — UI quality checklist, empty/error states, dark mode
- [design-patterns.md](design-patterns.md) — DigitalOcean brand design system, layout recipes, status badges
- [ux-principles.md](ux-principles.md) — universal UX principles (cognitive load, feedback, content design)
