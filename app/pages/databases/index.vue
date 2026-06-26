<script setup lang="ts">
useHead({ title: 'Databases' })

const { databases, total, isPending, refresh } = useDatabases()

// --- Toolbar state (client-side filtering over the single fetched page) ---
const search = ref('')
const engineFilter = ref<string>('all')
const statusFilter = ref<string>('all')

// Filter options are derived from the clusters present, so a filter never yields zero rows.
const engineItems = computed(() => {
  const present = new Set(databases.value.map(d => d.engine))
  const options = databaseEngineOrder
    .filter(e => present.has(e))
    .map(e => ({ label: engineMeta(e).label, value: e }))
  return [{ label: 'All engines', value: 'all' }, ...options]
})

const statusItems = computed(() => {
  const present = [...new Set(databases.value.map(d => d.status))].sort()
  const options = present.map(s => ({ label: databaseStatusMeta(s).label, value: s }))
  return [{ label: 'All statuses', value: 'all' }, ...options]
})

const hasActiveFilters = computed(() =>
  search.value.trim() !== '' || engineFilter.value !== 'all' || statusFilter.value !== 'all'
)

function resetFilters() {
  search.value = ''
  engineFilter.value = 'all'
  statusFilter.value = 'all'
}

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return databases.value.filter((d) => {
    if (engineFilter.value !== 'all' && d.engine !== engineFilter.value) return false
    if (statusFilter.value !== 'all' && d.status !== statusFilter.value) return false
    if (!query) return true
    const haystack = [d.name, engineMeta(d.engine).label, d.region, ...(d.tags ?? [])].join(' ').toLowerCase()
    return haystack.includes(query)
  })
})

// --- Stats (account-wide, not the filtered view) ---
const onlineCount = computed(() => databases.value.filter(d => d.status === 'online').length)
const nodesTotal = computed(() => databases.value.reduce((sum, d) => sum + (d.num_nodes ?? 0), 0))
const storageTotal = computed(() => databases.value.reduce((sum, d) => sum + (d.storage_size_mib ?? 0), 0))

const loading = computed(() => isPending.value && !databases.value.length)

function onRefresh() {
  refresh()
}

const skeletonCards = 6
</script>

<template>
  <UDashboardPanel id="databases">
    <template #header>
      <UDashboardNavbar title="Databases">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            aria-label="Refresh databases"
            :loading="isPending"
            @click="onRefresh"
          />
          <UButton
            icon="i-lucide-plus"
            label="Create Database"
            @click="navigateTo('/databases/new')"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #default>
          <div class="flex flex-1 flex-wrap items-center gap-2">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Search name, engine, or region"
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
              v-model="engineFilter"
              :items="engineItems"
              value-key="value"
              icon="i-lucide-database"
              class="w-40"
            />
            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              icon="i-lucide-activity"
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
        <DatabasesStatBar
          :total="total"
          :online="onlineCount"
          :nodes="nodesTotal"
          :storage-mib="storageTotal"
        />

        <!-- Loading: skeleton cards mirroring the grid -->
        <div
          v-if="loading"
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <div
            v-for="i in skeletonCards"
            :key="i"
            class="rounded-xl border border-default p-4"
          >
            <div class="flex items-center gap-3">
              <USkeleton class="size-10 rounded-lg" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-32" />
                <USkeleton class="h-3 w-24" />
              </div>
            </div>
            <USkeleton class="h-6 w-20 rounded-full mt-4" />
            <USkeleton class="h-3 w-full mt-4" />
          </div>
        </div>

        <!-- Empty: no clusters at all -->
        <div
          v-else-if="!databases.length"
          class="flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-default py-16 px-6"
        >
          <div class="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <UIcon
              name="i-lucide-database"
              class="size-6 text-primary"
            />
          </div>
          <p class="text-base font-medium text-highlighted">
            No databases yet
          </p>
          <p class="text-sm text-muted mt-1 max-w-sm">
            Managed databases are fully-configured PostgreSQL, MySQL, Redis, MongoDB, and more —
            with daily backups, failover, and automatic updates. Create your first cluster to begin.
          </p>
          <UButton
            label="Create your first database"
            icon="i-lucide-plus"
            class="mt-4"
            @click="navigateTo('/databases/new')"
          />
        </div>

        <!-- Empty: filtered to nothing -->
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
            No matching databases
          </p>
          <p class="text-sm text-muted mt-1">
            No clusters match your current search and filters.
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

        <!-- The grid -->
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <DatabaseCard
            v-for="(database, i) in filtered"
            :key="database.id"
            :database="database"
            class="animate-rise"
            :style="{ animationDelay: `${Math.min(i * 50, 400)}ms` }"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
