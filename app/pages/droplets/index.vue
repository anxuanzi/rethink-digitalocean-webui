<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { Droplet } from '~/types/droplet'

useHead({ title: 'Droplets' })

const { droplets, total, isPending, refresh } = useDroplets()
const actions = useDropletActions()
const { menuItems } = useDropletMenu()
const notes = useDropletNotesStore()
const toast = useToast()
const { copy } = useClipboard()

// --- Toolbar state (all filtering is client-side over the single fetched page) ---
const search = ref('')
const statusFilter = ref<'all' | 'active' | 'off'>('all')
const regionFilter = ref<string>('all')
const tagFilter = ref<string>('all')

const statusItems = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Off', value: 'off' }
]

// Region/tag options are derived from the Droplets actually present, so the filters never
// offer a choice that yields zero rows.
const regionItems = computed(() => {
  const seen = new Map<string, string>()
  for (const d of droplets.value) {
    if (!seen.has(d.region.slug)) seen.set(d.region.slug, d.region.name)
  }
  const options = [...seen.entries()]
    .map(([value, label]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
  return [{ label: 'All regions', value: 'all' }, ...options]
})

const tagItems = computed(() => {
  const tags = new Set<string>()
  for (const d of droplets.value) {
    for (const tag of d.tags) tags.add(tag)
  }
  const options = [...tags]
    .sort((a, b) => a.localeCompare(b))
    .map(tag => ({ label: tag, value: tag }))
  return [{ label: 'All tags', value: 'all' }, ...options]
})

const hasActiveFilters = computed(() =>
  search.value.trim() !== ''
  || statusFilter.value !== 'all'
  || regionFilter.value !== 'all'
  || tagFilter.value !== 'all'
)

function resetFilters() {
  search.value = ''
  statusFilter.value = 'all'
  regionFilter.value = 'all'
  tagFilter.value = 'all'
}

// --- Filtering: name, public/private IP, and tags for search; selects narrow the rest ---
const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return droplets.value.filter((d) => {
    if (statusFilter.value !== 'all' && d.status !== statusFilter.value) return false
    if (regionFilter.value !== 'all' && d.region.slug !== regionFilter.value) return false
    if (tagFilter.value !== 'all' && !d.tags.includes(tagFilter.value)) return false
    if (!query) return true
    const haystack = [
      d.name,
      dropletPublicIp(d) ?? '',
      dropletPrivateIp(d) ?? '',
      ...d.tags
    ].join(' ').toLowerCase()
    return haystack.includes(query)
  })
})

// --- Stats (over all Droplets, not the filtered view, so the headline is account-wide) ---
const activeCount = computed(() => droplets.value.filter(d => d.status === 'active').length)
const offCount = computed(() => droplets.value.filter(d => d.status === 'off').length)
const monthlySpend = computed(() =>
  Math.round(droplets.value.reduce((sum, d) => sum + (d.size?.price_monthly ?? 0), 0))
)

// --- Row selection: TanStack model keyed by droplet id (Record<id, boolean>) ---
const rowSelection = ref<Record<string, boolean>>({})

const selectedDroplets = computed(() =>
  filtered.value.filter(d => rowSelection.value[String(d.id)])
)

// Keep the selection from drifting onto rows that filtering has hidden.
watch(filtered, (rows) => {
  const visible = new Set(rows.map(d => String(d.id)))
  const pruned = Object.fromEntries(
    Object.entries(rowSelection.value).filter(([id]) => visible.has(id))
  )
  if (Object.keys(pruned).length !== Object.keys(rowSelection.value).length) {
    rowSelection.value = pruned
  }
})

const allVisibleSelected = computed(() =>
  filtered.value.length > 0 && filtered.value.every(d => rowSelection.value[String(d.id)])
)
const someVisibleSelected = computed(() =>
  filtered.value.some(d => rowSelection.value[String(d.id)])
)
const headerCheckboxState = computed<boolean | 'indeterminate'>(() => {
  if (allVisibleSelected.value) return true
  if (someVisibleSelected.value) return 'indeterminate'
  return false
})

function toggleAll(value: boolean | 'indeterminate') {
  const next: Record<string, boolean> = {}
  if (value === true) {
    for (const d of filtered.value) next[String(d.id)] = true
  }
  rowSelection.value = next
}

function toggleRow(droplet: Droplet, value: boolean | 'indeterminate') {
  const id = String(droplet.id)
  if (value === true) {
    rowSelection.value = { ...rowSelection.value, [id]: true }
  } else {
    rowSelection.value = Object.fromEntries(
      Object.entries(rowSelection.value).filter(([key]) => key !== id)
    )
  }
}

function clearSelection() {
  rowSelection.value = {}
}

// --- Interactions ---
function openDroplet(droplet: Droplet) {
  navigateTo(`/droplet/${droplet.id}`)
}

// Row click navigates, except when the click originated in the checkbox or actions cells
// (those stop propagation themselves). `@select` hands us the TanStack row.
function onRowSelect(_event: Event, row: TableRow<Droplet>) {
  openDroplet(row.original)
}

async function copyIp(ip: string) {
  await copy(ip)
  toast.add({ title: 'Copied', description: ip, color: 'success', icon: 'i-lucide-clipboard-check' })
}

// Wrap so the click handler returns void (refresh resolves to a DataState we don't need).
function onRefresh() {
  refresh()
}

// --- Columns (cells rendered via #<id>-cell slots below) ---
const columns: TableColumn<Droplet>[] = [
  { id: 'select' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'public_ip', header: 'Public IP' },
  { id: 'region', header: 'Region' },
  { id: 'size', header: 'Size' },
  { accessorKey: 'created_at', header: 'Created' },
  { id: 'actions' }
]

const showCapNote = computed(() => droplets.value.length === 200 && total.value > 200)

// Skeleton rows mirror the real table shape while the first page loads.
const skeletonRows = 6
</script>

<template>
  <UDashboardPanel id="droplets">
    <template #header>
      <UDashboardNavbar title="Droplets">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            aria-label="Refresh Droplets"
            :loading="isPending"
            @click="onRefresh"
          />
          <UButton
            icon="i-lucide-plus"
            label="Create Droplet"
            @click="navigateTo('/droplets/new')"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #default>
          <div class="flex flex-1 flex-wrap items-center gap-2">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Search name, IP, or tag"
              class="w-full sm:w-72"
              :ui="{ trailing: 'pe-1' }"
            >
              <template
                v-if="search"
                #trailing
              >
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="link"
                  size="xs"
                  aria-label="Clear search"
                  @click="search = ''"
                />
              </template>
            </UInput>

            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              icon="i-lucide-activity"
              class="w-36"
            />
            <USelect
              v-model="regionFilter"
              :items="regionItems"
              value-key="value"
              icon="i-lucide-map-pin"
              class="w-40"
            />
            <USelect
              v-model="tagFilter"
              :items="tagItems"
              value-key="value"
              icon="i-lucide-tag"
              class="w-40"
            />

            <UButton
              v-if="hasActiveFilters"
              label="Reset"
              icon="i-lucide-filter-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="resetFilters"
            />
          </div>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <DropletsStatBar
          :total="total"
          :active="activeCount"
          :off="offCount"
          :monthly-spend="monthlySpend"
        />

        <DropletBulkBar
          v-if="selectedDroplets.length"
          :selected="selectedDroplets"
          @clear="clearSelection"
        />

        <!-- Loading: skeleton table that mirrors the real columns -->
        <div
          v-if="isPending && !droplets.length"
          class="rounded-lg border border-default overflow-hidden"
        >
          <div class="flex items-center gap-4 px-4 py-3 border-b border-default bg-elevated/50">
            <USkeleton class="size-4 rounded" />
            <USkeleton class="h-4 w-40" />
            <USkeleton class="h-4 w-20 ms-auto" />
            <USkeleton class="h-4 w-28" />
            <USkeleton class="h-4 w-24" />
          </div>
          <div
            v-for="row in skeletonRows"
            :key="row"
            class="flex items-center gap-4 px-4 py-3 border-b border-default last:border-0"
          >
            <USkeleton class="size-4 rounded" />
            <div class="space-y-2">
              <USkeleton class="h-4 w-44" />
              <USkeleton class="h-3 w-24" />
            </div>
            <USkeleton class="h-6 w-20 rounded-full ms-auto" />
            <USkeleton class="h-4 w-28" />
            <USkeleton class="h-4 w-24" />
            <USkeleton class="size-8 rounded" />
          </div>
        </div>

        <!-- Empty: no Droplets on the account at all -->
        <div
          v-else-if="!droplets.length"
          class="flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-default py-16 px-6"
        >
          <div class="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <UIcon
              name="i-lucide-server"
              class="size-6 text-primary"
            />
          </div>
          <p class="text-base font-medium text-highlighted">
            No Droplets yet
          </p>
          <p class="text-sm text-muted mt-1 max-w-sm">
            Droplets are the virtual machines that run your apps. Spin up your first Droplet to get started.
          </p>
          <UButton
            label="Spin up your first Droplet"
            icon="i-lucide-plus"
            class="mt-4"
            @click="navigateTo('/droplets/new')"
          />
        </div>

        <!-- Empty: have Droplets, but the filters exclude them all -->
        <div
          v-else-if="!filtered.length"
          class="flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-default py-16 px-6"
        >
          <div class="size-12 rounded-xl bg-elevated flex items-center justify-center mb-4">
            <UIcon
              name="i-lucide-search-x"
              class="size-6 text-muted"
            />
          </div>
          <p class="text-base font-medium text-highlighted">
            No matching Droplets
          </p>
          <p class="text-sm text-muted mt-1">
            No Droplets match your current search and filters.
          </p>
          <UButton
            label="Clear filters"
            icon="i-lucide-filter-x"
            color="neutral"
            variant="outline"
            class="mt-4"
            @click="resetFilters"
          />
        </div>

        <!-- The table -->
        <template v-else>
          <UTable
            v-model:row-selection="rowSelection"
            :data="filtered"
            :columns="columns"
            :get-row-id="(row: Droplet) => String(row.id)"
            sticky
            class="rounded-lg border border-default"
            :ui="{
              tr: 'cursor-pointer data-[selected=true]:bg-elevated/40 hover:bg-elevated/40',
              th: 'whitespace-nowrap',
              td: 'whitespace-nowrap'
            }"
            @select="onRowSelect"
          >
            <!-- Select column -->
            <template #select-header>
              <UCheckbox
                :model-value="headerCheckboxState"
                aria-label="Select all Droplets"
                @update:model-value="toggleAll"
              />
            </template>
            <template #select-cell="{ row }">
              <div @click.stop>
                <UCheckbox
                  :model-value="!!rowSelection[String(row.original.id)]"
                  :aria-label="`Select ${row.original.name}`"
                  @update:model-value="(value: boolean | 'indeterminate') => toggleRow(row.original, value)"
                />
              </div>
            </template>

            <!-- Name: title + tag badges + note dot -->
            <template #name-cell="{ row }">
              <div class="flex flex-col gap-1 py-1 min-w-0">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="font-medium text-highlighted truncate">
                    {{ row.original.name }}
                  </span>
                  <UTooltip
                    v-if="notes.hasNote(row.original.id)"
                    text="Has a private note"
                  >
                    <span
                      class="size-1.5 rounded-full bg-primary shrink-0"
                      aria-label="Has a private note"
                    />
                  </UTooltip>
                </div>
                <div
                  v-if="row.original.tags.length"
                  class="flex flex-wrap items-center gap-1"
                >
                  <UBadge
                    v-for="tag in row.original.tags"
                    :key="tag"
                    :label="tag"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                  />
                </div>
                <span
                  v-else
                  class="text-xs text-dimmed"
                >
                  {{ row.original.image.distribution }} {{ row.original.image.name }}
                </span>
              </div>
            </template>

            <!-- Status -->
            <template #status-cell="{ row }">
              <DropletStatusBadge
                :status="row.original.status"
                :busy="actions.isBusy(row.original.id)"
              />
            </template>

            <!-- Public IP: mono, click to copy -->
            <template #public_ip-cell="{ row }">
              <UButton
                v-if="dropletPublicIp(row.original)"
                :label="dropletPublicIp(row.original) ?? ''"
                color="neutral"
                variant="ghost"
                size="xs"
                trailing-icon="i-lucide-copy"
                class="font-mono -ms-2"
                :aria-label="`Copy public IP ${dropletPublicIp(row.original)}`"
                @click.stop="copyIp(dropletPublicIp(row.original) as string)"
              />
              <span
                v-else
                class="text-dimmed"
              >—</span>
            </template>

            <!-- Region -->
            <template #region-cell="{ row }">
              <span class="text-muted">{{ row.original.region.name }}</span>
            </template>

            <!-- Size: specs + monthly price -->
            <template #size-cell="{ row }">
              <div class="flex flex-col">
                <span class="text-highlighted">
                  {{ formatMemory(row.original.memory) }} · {{ row.original.vcpus }} vCPU · {{ formatDisk(row.original.disk) }}
                </span>
                <span class="text-xs text-muted">
                  {{ formatPrice(row.original.size?.price_monthly) }}/mo
                </span>
              </div>
            </template>

            <!-- Created -->
            <template #created_at-cell="{ row }">
              <UTooltip :text="shortDate(row.original.created_at)">
                <span class="text-muted">{{ relativeTime(row.original.created_at) }}</span>
              </UTooltip>
            </template>

            <!-- Actions -->
            <template #actions-cell="{ row }">
              <div
                class="flex justify-end"
                @click.stop
              >
                <UDropdownMenu
                  :items="menuItems(row.original)"
                  :content="{ align: 'end' }"
                >
                  <UButton
                    icon="i-lucide-ellipsis-vertical"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :aria-label="`Actions for ${row.original.name}`"
                  />
                </UDropdownMenu>
              </div>
            </template>
          </UTable>

          <p
            v-if="showCapNote"
            class="text-xs text-muted text-center"
          >
            Showing the first 200 Droplets.
          </p>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
