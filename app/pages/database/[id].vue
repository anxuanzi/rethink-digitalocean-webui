<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from '@nuxt/ui'
import type { DatabaseEngine } from '~/types/database'
import DatabaseOverviewTab from '~/components/databases/detail/DatabaseOverviewTab.vue'
import DatabaseMetricsTab from '~/components/databases/detail/DatabaseMetricsTab.vue'
import ConnectionTab from '~/components/databases/detail/ConnectionTab.vue'
import UsersTab from '~/components/databases/detail/UsersTab.vue'
import DatabasesTab from '~/components/databases/detail/DatabasesTab.vue'
import DatabasePoolsTab from '~/components/databases/detail/DatabasePoolsTab.vue'
import DatabaseReplicasTab from '~/components/databases/detail/DatabaseReplicasTab.vue'
import DatabaseConfigTab from '~/components/databases/detail/DatabaseConfigTab.vue'
import DatabaseBackupsTab from '~/components/databases/detail/DatabaseBackupsTab.vue'
import DatabaseActivityTab from '~/components/databases/detail/DatabaseActivityTab.vue'
import DatabaseEvictionTab from '~/components/databases/detail/DatabaseEvictionTab.vue'
import DatabaseSqlModeTab from '~/components/databases/detail/DatabaseSqlModeTab.vue'
import DatabaseTopicsTab from '~/components/databases/detail/DatabaseTopicsTab.vue'
import DatabaseIndexesTab from '~/components/databases/detail/DatabaseIndexesTab.vue'
import SettingsTab from '~/components/databases/detail/SettingsTab.vue'
import DatabaseDangerTab from '~/components/databases/detail/DatabaseDangerTab.vue'

const route = useRoute()
const id = computed(() => String(route.params.id))

const { database, isPending } = useDatabase(id)
const actions = useDatabaseActions()
const menu = useDatabaseMenu()

useHead({ title: () => database.value?.name ?? 'Database' })

/**
 * Tab registry. `engines` restricts a tab to specific engines (omit = all engines). The detail
 * nav is built from the subset that applies to this cluster, so a Redis cluster never shows a
 * "Pools" tab and a Kafka cluster shows "Topics" instead of "Databases".
 */
interface TabDef {
  value: string
  label: string
  icon: string
  component: Component
  engines?: DatabaseEngine[]
}

const allTabs: TabDef[] = [
  { value: 'overview', label: 'Overview', icon: 'i-lucide-layout-dashboard', component: DatabaseOverviewTab },
  { value: 'metrics', label: 'Metrics', icon: 'i-lucide-chart-line', component: DatabaseMetricsTab },
  { value: 'connection', label: 'Connection', icon: 'i-lucide-plug', component: ConnectionTab },
  { value: 'users', label: 'Users', icon: 'i-lucide-users', component: UsersTab },
  { value: 'databases', label: 'Databases', icon: 'i-lucide-table-2', component: DatabasesTab, engines: ['pg', 'mysql', 'mongodb'] },
  { value: 'pools', label: 'Pools', icon: 'i-lucide-waypoints', component: DatabasePoolsTab, engines: ['pg'] },
  { value: 'replicas', label: 'Replicas', icon: 'i-lucide-git-fork', component: DatabaseReplicasTab, engines: ['pg', 'mysql', 'mongodb'] },
  { value: 'topics', label: 'Topics', icon: 'i-lucide-list', component: DatabaseTopicsTab, engines: ['kafka'] },
  { value: 'indexes', label: 'Indexes', icon: 'i-lucide-search', component: DatabaseIndexesTab, engines: ['opensearch'] },
  { value: 'config', label: 'Config', icon: 'i-lucide-sliders-horizontal', component: DatabaseConfigTab },
  { value: 'eviction', label: 'Eviction', icon: 'i-lucide-recycle', component: DatabaseEvictionTab, engines: ['redis', 'valkey'] },
  { value: 'sqlmode', label: 'SQL mode', icon: 'i-lucide-settings-2', component: DatabaseSqlModeTab, engines: ['mysql'] },
  { value: 'backups', label: 'Backups', icon: 'i-lucide-database-backup', component: DatabaseBackupsTab, engines: ['pg', 'mysql', 'mongodb', 'kafka', 'opensearch'] },
  { value: 'activity', label: 'Activity', icon: 'i-lucide-history', component: DatabaseActivityTab },
  { value: 'settings', label: 'Settings', icon: 'i-lucide-settings', component: SettingsTab },
  { value: 'danger', label: 'Danger', icon: 'i-lucide-triangle-alert', component: DatabaseDangerTab }
]

const visibleTabs = computed(() => {
  const engine = database.value?.engine
  return allTabs.filter(tab => !tab.engines || (engine != null && tab.engines.includes(engine)))
})

const activeTab = ref('overview')
const activeComponent = computed(() =>
  visibleTabs.value.find(tab => tab.value === activeTab.value)?.component ?? DatabaseOverviewTab
)

// In-page section nav (same finished `highlight` treatment as the rest of the app).
const navItems = computed<NavigationMenuItem[]>(() => visibleTabs.value.map(tab => ({
  label: tab.label,
  icon: tab.icon,
  active: activeTab.value === tab.value,
  onSelect: () => {
    activeTab.value = tab.value
  }
})))

const busy = computed(() => (database.value ? actions.isBusy(database.value.id) : false))

// Quick cluster actions in the header (the deeper controls live in Settings / Danger tabs).
const headerMenu = computed<DropdownMenuItem[][]>(() => {
  if (!database.value) return []
  const cluster = database.value
  return [
    [{ label: 'Resize', icon: 'i-lucide-scaling', onSelect: () => menu.openResize(cluster) }],
    [{ label: 'Destroy', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => menu.openDestroy(cluster) }]
  ]
})
</script>

<template>
  <UDashboardPanel id="database-detail">
    <template #header>
      <UDashboardNavbar :title="database?.name ?? ''">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            aria-label="Back to Databases"
            @click="navigateTo('/databases')"
          />
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <div class="flex items-center gap-2 min-w-0">
            <USkeleton
              v-if="isPending && !database"
              class="h-6 w-44"
            />
            <template v-else-if="database">
              <DatabaseEngineIcon
                :engine="database.engine"
                size="sm"
              />
              <span class="truncate font-semibold text-highlighted">{{ database.name }}</span>
              <DatabaseStatusBadge
                :status="database.status"
                :busy="busy"
              />
            </template>
          </div>
        </template>

        <template #right>
          <UDropdownMenu
            v-if="database"
            :items="headerMenu"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="More actions"
            />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="database">
        <UNavigationMenu
          :items="navItems"
          highlight
          color="primary"
          class="-mx-1"
          :ui="{
            root: 'flex-1 min-w-0 overflow-x-auto',
            list: 'flex-nowrap',
            item: 'shrink-0',
            link: 'cursor-pointer'
          }"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div
        v-if="isPending && !database"
        class="space-y-6"
      >
        <USkeleton class="h-40 w-full rounded-lg" />
        <USkeleton class="h-32 w-full rounded-lg" />
      </div>

      <!-- Loaded -->
      <component
        :is="activeComponent"
        v-else-if="database"
        :database="database"
      />

      <!-- Not found -->
      <div
        v-else
        class="flex flex-col items-center text-center gap-3 py-16"
      >
        <div class="size-12 rounded-xl bg-elevated flex items-center justify-center">
          <UIcon
            name="i-lucide-database-backup"
            class="size-6 text-dimmed"
          />
        </div>
        <div>
          <p class="text-base font-semibold text-highlighted">
            Database not found
          </p>
          <p class="text-sm text-muted max-w-sm">
            This cluster may have been destroyed, or it belongs to a different team.
          </p>
        </div>
        <UButton
          label="Back to Databases"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          @click="navigateTo('/databases')"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
