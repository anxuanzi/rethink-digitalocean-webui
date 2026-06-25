# UX Design Principles

Practical UX guidelines for building intuitive, professional SaaS interfaces in the DigitalOcean
console. Every design decision should be rooted in user psychology — not aesthetics alone.

The guiding context: this console competes with the official DigitalOcean Cloud console at exactly
the things that frustrate power users — **speed** (instant, optimistic interactions), **clarity**
(scannable lists, calm hierarchy), and **power features the official console lacks** (firewall rule
notes, bulk/batch editing, fast multi-resource search). Let those pressures shape every screen.

## Table of Contents
- [Design Thinking Mindset](#design-thinking-mindset)
- [Cognitive Load Management](#cognitive-load-management)
- [Interaction Design Laws](#interaction-design-laws)
- [Information Architecture](#information-architecture)
- [Form UX](#form-ux)
- [Navigation & Wayfinding](#navigation--wayfinding)
- [Content Design & Microcopy](#content-design--microcopy)
- [Feedback & Communication](#feedback--communication)
- [Responsive Strategy](#responsive-strategy)
- [Data Display UX](#data-display-ux)
- [Motion & Animation Language](#motion--animation-language)

## Design Thinking Mindset

Before writing any UI code, answer three questions:

1. **Who** is using this? (A developer running a side project, an SRE managing a fleet, an account
   owner watching the bill — their context shapes the UI)
2. **What** are they trying to accomplish? (Not "view Droplets" — the real goal: "find idle
   Droplets in nyc1 to resize down and cut cost")
3. **When** do they use this? (Daily task = optimize for speed. Monthly = optimize for clarity.
   One-time = optimize for guidance)

### User Mental Models

DigitalOcean console users expect patterns from tools they already use (Linear, Stripe Dashboard,
Vercel, the official DO console, GitHub):

| User Expectation | Console Implementation |
|---|---|
| Sidebar navigation with collapsible groups | `UDashboardSidebar` with `UNavigationMenu` |
| Global search / command palette | `Cmd+K` pattern (future) |
| Table rows are clickable for detail | `@select` opens slideover |
| Filters persist during session | Store filter state in composable |
| Bulk actions appear on selection | Contextual toolbar replaces "Create" button |
| Settings are separate from operational pages | Centered narrow layout, `/account/*` routes |
| Destructive actions require confirmation | `UModal` confirmation with typed input for critical ops |

### Task-Oriented Design

Structure pages around user tasks, not data models. The official console organizes by API resource;
this console organizes by what the user actually came to do:

```
WRONG thinking:  "Display a table of Droplet entities"
RIGHT thinking:  "Help the operator find idle Droplets in nyc1 and resize them down to cut cost"

WRONG thinking:  "Show all fields from the Firewall model"
RIGHT thinking:  "Let the operator see what each rule allows at a glance — and annotate why
                  port 8080 is open — then apply the firewall to more Droplets"

WRONG thinking:  "Render a list of Database clusters"
RIGHT thinking:  "Let the operator batch-tag every database in a project so billing reports
                  group cleanly"
```

## Cognitive Load Management

### The Three Types of Cognitive Load

1. **Intrinsic** (task complexity) — Can't reduce. Accept it, but don't amplify it.
2. **Extraneous** (bad design) — Eliminate. Every unnecessary element costs attention.
3. **Germane** (learning) — Support with patterns, progressive disclosure, and consistency.

### Reducing Extraneous Load

**Chunking**: Group related information visually.

```vue
<!-- WRONG: Flat list of 12 fields -->
<div class="space-y-4">
  <UFormField label="Name" ... />
  <UFormField label="Region" ... />
  <UFormField label="Size" ... />
  <UFormField label="Image" ... />
  <UFormField label="VPC" ... />
  <UFormField label="SSH Keys" ... />
  <UFormField label="Tags" ... />
  <UFormField label="Backups" ... />
  <!-- user loses track -->
</div>

<!-- RIGHT: Grouped into digestible sections -->
<div class="space-y-6">
  <section class="space-y-4">
    <h4 class="text-sm font-medium text-highlighted flex items-center gap-2">
      <UIcon name="i-lucide-server" class="w-4 h-4"/>
      Droplet Basics
    </h4>
    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Name" ... />
      <UFormField label="Hostname" ... />
    </div>
    <UFormField label="Image" ... />
  </section>
  <USeparator />
  <section class="space-y-4">
    <h4 class="text-sm font-medium text-highlighted flex items-center gap-2">
      <UIcon name="i-lucide-globe" class="w-4 h-4"/>
      Placement & Networking
    </h4>
    <!-- region, size, VPC -->
  </section>
</div>
```

**Progressive Disclosure**: Show only what's needed now, reveal more on demand.

```vue
<!-- Basic view by default -->
<div>
  <DropletCard :droplet="droplet" />
  <!-- Advanced details on click -->
  <UCollapsible>
    <UButton variant="link" size="sm" class="cursor-pointer">
      Show more details
    </UButton>
    <template #content>
      <DropletDetailPanel :droplet="droplet" />
    </template>
  </UCollapsible>
</div>
```

**Recognition over recall**: Show options, don't make users remember.

```vue
<!-- WRONG: Empty input, user must remember the slug format -->
<UInput v-model="region" placeholder="Enter region" />

<!-- RIGHT: Constrained input with clear, known options -->
<USelectMenu v-model="region" :items="regionOptions" placeholder="Select a region" />

<!-- WRONG: Free-text for known values -->
<UInput v-model="status" placeholder="Type a status" />

<!-- RIGHT: Select from known options (new / active / off / archive) -->
<USelectMenu v-model="status" :items="statusOptions" placeholder="Filter by status" />
```

### Working Memory Limits (Miller's Law)

Users hold 5-9 items in working memory. Apply this to:

| Context | Limit | Implementation |
|---|---|---|
| Navigation items per group | 5-7 | Split into groups with separators |
| Filter options visible | 3-5 | Hide advanced filters behind "More filters" |
| Action buttons visible | 2-3 | Overflow to dropdown for 4+ actions |
| Stats cards in a row | 3-4 | Max 4 per row, 2 on mobile |
| Table columns visible | 5-7 | Column toggling for 8+ columns |
| Tabs in toolbar | 3-5 | Horizontal scroll or dropdown for more |

## Interaction Design Laws

### Fitts' Law — Target Size & Distance

Larger targets closer to the cursor are easier to click.

```vue
<!-- WRONG: Tiny click target, far from content -->
<span class="text-xs cursor-pointer" @click="reboot">reboot</span>

<!-- RIGHT: Adequate click target with padding -->
<UButton variant="ghost" size="sm" icon="i-lucide-rotate-cw" class="cursor-pointer" @click="reboot" />

<!-- RIGHT: Full-row click target for table rows -->
<UTable @select="(e, row) => openDetail(row.original)" />
```

**Primary actions**: Make them large and prominent (full-width on mobile, standard on desktop).
**Destructive actions**: Keep them smaller and less prominent — but still easily clickable. A
Droplet "Destroy" or a Firewall "Delete" should never sit pixel-adjacent to a routine action like
"Reboot".

### Hick's Law — Number of Choices

Decision time increases with the number of options. A Droplet has many actions (power on/off,
reboot, resize, snapshot, rebuild, enable backups, destroy) — don't dump them all flat. Reduce and
group choices:

```vue
<!-- WRONG: every Droplet action in one ungrouped dropdown -->
<UDropdownMenu :items="allDropletActions" />

<!-- RIGHT: Grouped, categorized actions -->
<UDropdownMenu :items="[
  [  // Routine actions group
    { label: 'Power Off', icon: 'i-lucide-power', onSelect: ... },
    { label: 'Reboot', icon: 'i-lucide-rotate-cw', onSelect: ... },
  ],
  [  // Heavier actions group
    { label: 'Resize', icon: 'i-lucide-move-diagonal', onSelect: ... },
    { label: 'Take Snapshot', icon: 'i-lucide-camera', onSelect: ... },
  ],
  [  // Dangerous actions group (separated visually)
    { label: 'Destroy', icon: 'i-lucide-trash-2', color: 'error', onSelect: ... },
  ]
]" />
```

### Jakob's Law — Familiarity

Users spend most of their time on *other* products. Match common SaaS conventions:

| Convention | Console Implementation |
|---|---|
| Left sidebar navigation | `UDashboardSidebar` |
| Top-right user menu | `UserMenu` component |
| Breadcrumbs for nested pages | `UBreadcrumb` in navbar |
| Search in toolbar, not navbar | `UInput` in `UDashboardToolbar #left` |
| "Save" at bottom-right of forms | `flex justify-end gap-2` with Cancel + Save |
| Red for destroy, green for success | Semantic color system |
| `...` or `⋮` for overflow actions | `UDropdownMenu` with kebab icon |

### Principle of Least Surprise

Every interaction should behave as the user expects:

- Clicking a table row opens detail — always, on every table (Droplets, Firewalls, Volumes…)
- "Cancel" never saves data — it discards changes
- Back button returns to the previous page, not a random route
- Destroy/delete confirmations always require explicit action — never auto-confirm
- Loading indicators appear within 100ms of user action

## Information Architecture

### Page Hierarchy

```
Dashboard (overview, resource counts, recent activity, billing balance)
├── Droplets (list → detail slideover)
│   ├── Snapshots & Backups (sub-page or tab)
│   └── Bulk operations: resize / tag / power / destroy (contextual toolbar)
├── Networking
│   ├── Firewalls (list → rules with notes)
│   ├── Load Balancers (table)
│   ├── Domains / DNS records (table)
│   ├── Reserved IPs (table)
│   └── VPCs (table)
├── Databases (managed DB clusters)
├── Kubernetes (DOKS clusters → node pools)
├── Storage (Volumes, Spaces)
├── Account
│   ├── Billing (balance, invoices)
│   ├── API / Tokens (the DigitalOcean PAT — Connect screen)
│   └── SSH Keys
└── Activity / Actions (async job log, chronological)
```

### Content Priority (F-Pattern / Z-Pattern)

Users scan in F-pattern for text-heavy pages and Z-pattern for action-oriented ones:

```
Table page (F-pattern), e.g. the Droplets list:
┌─ Search/filter bar (scanned first) ────────────┐
│ Stats cards (scanned second)                    │
│ Table header row (scanned third)                │
│ ├── First few rows get full attention           │
│ ├── Later rows get left-column scan only        │
│ └── Actions column (rightmost, found by intent) │
└─────────────────────────────────────────────────┘

→ Put the most important column (name/identity) leftmost
→ Put status/state in the visual scan path (2nd-3rd column) — Droplet status, region
→ Put actions rightmost (users look there intentionally)
```

### Contextual Hierarchy

Every page section should have a clear purpose level:

| Level | Example | Visual Treatment |
|---|---|---|
| **Primary** | Main data table (Droplets), primary form | Full width, no extra chrome |
| **Secondary** | Stats summary, filter bar | Above primary, lighter bg |
| **Tertiary** | Help text, meta info (region, created date) | Smaller text, muted color |
| **Contextual** | Bulk actions, selection count | Appears/disappears based on state |

## Form UX

### Validation Timing

```typescript
// BEST: Validate on blur (after user finishes a field)
// Shows errors after they move on — not while typing

// GOOD: Validate on submit (all at once)
// Acceptable for short forms (< 5 fields)

// AVOID: Validate on input (while typing)
// Annoying — shows "too short" while user is still typing
```

**Implementation with Zod + UForm:**

```vue
<UForm :state="state" :schema="schema" @submit="onSubmit">
  <!-- UForm handles blur validation automatically with Zod schema -->
  <UFormField label="Droplet name" name="name">
    <UInput v-model="state.name" placeholder="e.g. web-prod-01" />
  </UFormField>
</UForm>
```

### Error Recovery

Make errors easy to understand and fix:

```typescript
// WRONG: Generic error
z.string().min(1, 'Invalid')

// RIGHT: Specific, actionable error
z.string().min(1, 'Droplet name is required')
z.string().regex(/^[a-zA-Z0-9.\-]+$/, 'Name can only contain letters, numbers, dots, and hyphens')
z.string().min(3, 'Firewall name must be at least 3 characters')
// Firewall rule port range, e.g. "8000-9000" or a single port "8080"
z.string().regex(/^\d{1,5}(-\d{1,5})?$/, 'Enter a single port (8080) or a range (8000-9000)')
```

### Multi-Step Forms (Wizard Pattern)

For complex creation flows (e.g., creating a Droplet, provisioning a Kubernetes cluster):

```vue
<template>
  <div class="space-y-6">
    <!-- Step indicator -->
    <div class="flex items-center gap-2">
      <div v-for="(step, i) in steps" :key="i"
        :class="[
          'flex items-center gap-2 text-sm',
          i <= currentStep ? 'text-primary font-medium' : 'text-muted'
        ]">
        <div :class="[
          'w-6 h-6 rounded-full flex items-center justify-center text-xs',
          i < currentStep ? 'bg-primary text-white' :
          i === currentStep ? 'bg-primary/10 text-primary border border-primary' :
          'bg-elevated border border-default text-muted'
        ]">
          <UIcon v-if="i < currentStep" name="i-lucide-check" class="w-3.5 h-3.5" />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span class="hidden sm:inline">{{ step.label }}</span>
        <UIcon v-if="i < steps.length - 1" name="i-lucide-chevron-right" class="w-4 h-4 text-muted" />
      </div>
    </div>

    <!-- Step content (one visible at a time) -->
    <!-- e.g. steps: Choose image → Choose size & region → Authentication → Finalize -->
    <component :is="steps[currentStep].component" v-model="formData" />

    <!-- Navigation -->
    <div class="flex justify-between pt-4">
      <UButton v-if="currentStep > 0" variant="ghost" @click="currentStep--" class="cursor-pointer">
        Back
      </UButton>
      <div class="ml-auto">
        <UButton v-if="currentStep < steps.length - 1" @click="currentStep++" class="cursor-pointer">
          Continue
        </UButton>
        <UButton v-else :loading="isSubmitting" @click="submit" class="cursor-pointer">
          Create Droplet
        </UButton>
      </div>
    </div>
  </div>
</template>
```

### Smart Defaults & Autofill

Reduce effort by pre-filling when possible:

```typescript
// Pre-fill from context
const createDropletForm = () => ({
  region: lastRegion.value ?? 'nyc1',  // Default to user's usual region
  size: 's-1vcpu-1gb',                 // Sensible smallest default
  image: 'ubuntu-24-04-x64',           // Most common default image
  tags: projectTags.value,             // Inherit the current project's tags
})

// Remember last-used values for repeated tasks
const lastRegion = useStorage('do:last-region', 'nyc1')
```

## Navigation & Wayfinding

### User Orientation

Users should always know: **Where am I? How did I get here? Where can I go?**

```vue
<!-- Breadcrumbs for nested pages -->
<UBreadcrumb :items="[
  { label: 'Droplets', to: '/droplets' },
  { label: droplet.name, to: `/droplet/${droplet.id}` },
  { label: 'Snapshots' }
]" />

<!-- Active state in sidebar nav — handled by UNavigationMenu's `to` prop -->
```

### Navigation Hierarchy Rules

| Navigation Level | Component | Behavior |
|---|---|---|
| **App-level** (Droplets, Networking, Account) | Sidebar `UNavigationMenu` | Always visible, persists across pages |
| **Section-level** (Firewalls, Load Balancers, Domains) | Toolbar tabs or `UHorizontalNavigation` | Within a page group |
| **Content-level** (Tab within a detail view: Overview / Graphs / Networking) | `UTabs` inside page body | Within a single page |

### Breadcrumb Rules

- Always show breadcrumbs on pages 2+ levels deep
- Last breadcrumb item is current page (non-clickable, no `to` prop)
- Keep breadcrumb labels short (truncate to ~20 chars — Droplet names can be long)
- Use `UDashboardNavbar` with breadcrumb slot

## Content Design & Microcopy

### Action Labels

Use specific, task-oriented labels — not generic words:

| Generic (AVOID) | Specific (USE) |
|---|---|
| Submit | Save Changes / Create Droplet / Add Firewall Rule |
| OK | Confirm / Got it |
| Cancel | Discard Changes / Keep Editing |
| Delete | Destroy Droplet / Delete Firewall |
| Yes/No | Destroy / Keep |

### Confirmation Dialog Copy

```vue
<!-- Destructive action confirmation -->
<UModal v-model:open="showDestroyConfirm">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
        <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-error" />
      </div>
      <div>
        <h3 class="text-base font-semibold text-highlighted">Destroy Droplet</h3>
        <p class="text-sm text-muted">This action cannot be undone</p>
      </div>
    </div>
  </template>
  <template #body>
    <p class="text-sm text-muted">
      Are you sure you want to destroy <strong class="text-highlighted">{{ droplet.name }}</strong>?
      All data on this Droplet will be permanently deleted. Any reserved IP will be unassigned.
    </p>
  </template>
  <template #footer>
    <div class="flex justify-end gap-2">
      <UButton variant="ghost" @click="showDestroyConfirm = false" class="cursor-pointer">
        Keep Droplet
      </UButton>
      <UButton color="error" :loading="isDestroying" @click="confirmDestroy" class="cursor-pointer">
        Destroy Droplet
      </UButton>
    </div>
  </template>
</UModal>
```

For genuinely irreversible operations on production resources, require the user to type the
resource name to confirm (the official console does this for Droplet destruction — match it).

### Empty State Copy

Tailor empty states to the specific context — don't use generic messages:

| Page | Empty Title | Empty Description | CTA |
|---|---|---|---|
| Droplets | No Droplets yet | Spin up your first Droplet to start running workloads. | Create Droplet |
| Firewalls | No firewalls | Create a firewall to control inbound and outbound traffic for your Droplets. | Create Firewall |
| Volumes | No volumes | Attach block storage to give your Droplets more disk space. | Create Volume |
| Databases | No database clusters | Provision a managed database to run Postgres, MySQL, or Redis. | Create Database |
| Reserved IPs | No reserved IPs | Reserve a static IP you can remap between Droplets. | Reserve IP |
| Activity | No recent activity | Actions like reboots, resizes, and snapshots will appear here. | — |

### Toast Message Patterns

Keep toasts short and action-oriented. For DigitalOcean's **async actions** (power, resize,
snapshot), the toast confirms the request was *accepted* — the resource reconciles when the action
completes (see [Feedback & Communication](#feedback--communication)).

```typescript
// CREATE success
toast.add({ title: 'Droplet created', color: 'success', icon: 'i-lucide-check-circle' })

// UPDATE success
toast.add({ title: 'Firewall rule saved', color: 'success', icon: 'i-lucide-check-circle' })

// ACTION accepted (async — completes in the background)
toast.add({ title: 'Resize started', description: 'This may take a few minutes.', color: 'info', icon: 'i-lucide-loader' })

// DELETE success
toast.add({ title: 'Firewall deleted', color: 'success', icon: 'i-lucide-check-circle' })

// ERROR with actionable description
toast.add({
  title: 'Failed to save',
  description: 'Check your connection and try again.',
  color: 'error',
  icon: 'i-lucide-alert-circle'
})

// WARNING — rate limit (DO allows 250 req/min, 5,000 req/hour per token)
toast.add({
  title: 'Rate limit reached',
  description: 'Too many requests — retrying shortly.',
  color: 'warning',
  icon: 'i-lucide-alert-triangle'
})
```

## Feedback & Communication

### Response Time Perception

| Delay | User Perception | Required Feedback |
|---|---|---|
| 0–100ms | Instant | None needed |
| 100–300ms | Slight delay | Subtle indicator (button loading state) |
| 300ms–1s | Noticeable wait | Progress indicator (spinner, skeleton) |
| 1–5s | Significant wait | Skeleton loading + progress message |
| 5s+ | Long operation | Progress bar + status message + cancel option |

DigitalOcean's async actions (a Droplet resize or rebuild) routinely take **minutes**, not seconds.
Don't block the UI on them: accept the request, reflect the intended state optimistically, and let
the resource settle in the background. The async-action poll (`status` = `in-progress` →
`completed` | `errored`) drives the eventual reconciliation — see [references/patterns.md](patterns.md).

### Feedback Hierarchy

Every user action needs appropriate feedback:

```
Click "Reboot"  → Button shows loading state (immediate)
                → UI reflects intended state optimistically (immediate)
                → Toast confirms the action was accepted (on API resolve)
                → Resource reconciles when the async action completes (background poll)
                → Error toast + rollback (on API reject or action `errored`)

Select rows     → Selection count badge appears (immediate)
                → Bulk action toolbar replaces Create button (immediate)
                  (e.g. "Tag 12 Droplets", "Resize 3 Droplets", "Destroy 5")

Type search     → Debounced filter (300ms delay)
                → "No results" if empty (after filter completes)
                → Clear button appears (when query is non-empty)
```

### Error Communication Levels

| Severity | Component | Example |
|---|---|---|
| **Field-level** | `UFormField` validation | "Droplet name is required" under the field |
| **Form-level** | Alert banner above form | "2 fields need your attention" |
| **Action-level** | Toast notification | "Failed to start resize" |
| **Page-level** | Error state with retry | "Failed to load Droplets" |
| **App-level** | Error boundary / 500 page | "Something went wrong" |

## Responsive Strategy

### Breakpoint Behavior

| Breakpoint | Layout Adaptation |
|---|---|
| `sm` (640px) | Single column, stacked cards, sidebar hidden |
| `md` (768px) | 2-column grids, sidebar toggleable |
| `lg` (1024px) | Full layout, sidebar persistent |
| `xl` (1280px) | Expanded content area, wider tables |

### Responsive Patterns for the Console

```vue
<!-- Stats: 1 col mobile → 2 col tablet → 4 col desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

<!-- Card grid: stack on mobile → grid on larger -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

<!-- Form: full width mobile → 2 cols desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

<!-- Settings: full width → centered narrow -->
<div class="w-full lg:max-w-2xl mx-auto">
```

### Touch-Friendly Targets

Minimum touch target: 44x44px (Apple HIG). Apply to:

```vue
<!-- Buttons: size="md" or larger on mobile -->
<UButton size="md" class="cursor-pointer" />

<!-- Icon buttons need enough padding -->
<UButton variant="ghost" icon="i-lucide-rotate-cw" size="sm" class="p-2 cursor-pointer" />

<!-- Table rows need adequate vertical padding -->
<UTable :ui="{ td: 'py-3' }" />

<!-- Don't rely on hover for critical info on mobile -->
<!-- e.g. a Droplet's region should be a visible label, not a tooltip-only detail -->
```

### Responsive Table Strategy

For tables with many columns on mobile (the Droplets list can carry name, status, region, size,
IP, tags, created):

```vue
<!-- Option A: Horizontal scroll (simplest) -->
<div class="overflow-x-auto">
  <UTable :data="droplets" :columns="allColumns" />
</div>

<!-- Option B: Hide less important columns on mobile -->
const columns = computed(() => {
  const base = [nameCol, statusCol, actionsCol]
  if (width.value >= 768) base.splice(2, 0, regionCol, sizeCol)
  return base
})

<!-- Option C: Card layout on mobile, table on desktop -->
<div class="hidden md:block">
  <UTable :data="droplets" :columns="columns" />
</div>
<div class="md:hidden space-y-3">
  <DropletCard v-for="d in droplets" :key="d.id" :droplet="d" />
</div>
```

## Data Display UX

### Number Formatting

```typescript
// Large numbers: Use abbreviations
'1,234'     // Under 10K: exact with commas
'12.5K'     // 10K-999K: one decimal
'1.2M'      // 1M+: one decimal — e.g. bandwidth transfer in bytes

// Currency: Always show symbol and 2 decimals (billing balance, invoice totals)
'$1,234.00'
'$12.5K'    // Abbreviated in stat cards

// Percentages: Show sign for changes (e.g. Droplet CPU vs. previous period)
'+12.5%'    // Positive trend
'-3.2%'     // Negative trend
'0%'        // No change (neutral)
```

For relative times (e.g. "created 3 hours ago"), DigitalOcean timestamps are **ISO-8601 strings**
(`"2020-07-21T18:37:44Z"`). Parse and format with **date-fns** (`parseISO`,
`formatDistanceToNow`, `format`) — never hand-roll date math. See [references/patterns.md](patterns.md).

### Table UX Rules

1. **Sort indicators**: Show which column is sorted and direction
2. **Column alignment**: Text left, numbers right, status center
3. **Row density**: `py-3` for standard, `py-2` for compact/dense tables (large fleets)
4. **Null values**: Em-dash `—` for empty cells, never blank (e.g. a Droplet with no reserved IP)
5. **Truncation**: Long text truncates with ellipsis, full value in tooltip
6. **Sticky header**: For tables longer than viewport height (fleets of hundreds of Droplets)
7. **No horizontal scrollbar**: Unless table has 7+ columns

### Dashboard KPI Cards

Order matters — put the most important metric first:

```
Primary metric:    Active Droplets (operational health)
Secondary metrics: Monthly cost estimate, Volumes attached, Databases running
Trend indicators:  Compare to previous period with colored arrows
```

## Motion & Animation Language

### Timing Scale

Consistent timing creates a cohesive feel:

| Duration | Usage | Tailwind |
|---|---|---|
| 100ms | Micro-interactions (hover, focus) | `duration-100` |
| 150ms | Color/background transitions | `duration-150` |
| 200ms | Small element transforms (badges, icons) | `duration-200` |
| 300ms | Medium transitions (panel slide, collapse) | `duration-300` |
| 500ms | Large transitions (page enter, modal) | `duration-500` |

### Easing Functions

```css
/* Standard: Most UI transitions */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);  /* ease-in-out */

/* Enter: Elements appearing */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1);    /* ease-out */

/* Exit: Elements disappearing */
transition-timing-function: cubic-bezier(0.4, 0, 1, 1);    /* ease-in */
```

### When to Animate vs. Instant

| Animate | Don't Animate |
|---|---|
| Modal/slideover open/close | Data updates in tables (Droplet status flipping to `active`) |
| Dropdown menus appearing | Filter results changing |
| Toast notifications | Pagination (new page of Droplets) |
| Skeleton → content transition | Sidebar navigation clicks |
| Collapsible sections expanding | Tab switching (content swap) |
| Confirmation dialog | Search results appearing |

### Vue Transition Patterns

```vue
<!-- List items (add/remove with animation) — e.g. firewall rules being added/removed -->
<TransitionGroup
  name="list"
  tag="div"
  class="space-y-2"
  enter-active-class="transition-all duration-300 ease-out"
  leave-active-class="transition-all duration-200 ease-in"
  enter-from-class="opacity-0 -translate-y-2"
  leave-to-class="opacity-0 translate-x-4"
>
  <div v-for="rule in firewall.inbound_rules" :key="rule.id">
    <!-- content -->
  </div>
</TransitionGroup>

<!-- Fade for content swap -->
<Transition
  enter-active-class="transition-opacity duration-200"
  leave-active-class="transition-opacity duration-150"
  enter-from-class="opacity-0"
  leave-to-class="opacity-0"
  mode="out-in"
>
  <component :is="currentView" :key="viewKey" />
</Transition>
```

---

**Related references:**
- [references/design-patterns.md](design-patterns.md) — DigitalOcean brand design system, layout recipes, consistency
- [references/ui-quality.md](ui-quality.md) — quality checklist, empty/error states, dark mode
- [references/accessibility.md](accessibility.md) — WCAG, ARIA, keyboard, focus management
- [references/patterns.md](patterns.md) — data fetching + optimistic UI (Pinia Colada), Zod forms, toasts
