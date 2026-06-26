<script setup lang="ts">
import OverviewTab from '~/components/droplets/detail/OverviewTab.vue'
import NetworkingTab from '~/components/droplets/detail/NetworkingTab.vue'
import PowerResizeTab from '~/components/droplets/detail/PowerResizeTab.vue'
import BackupsTab from '~/components/droplets/detail/BackupsTab.vue'
import HistoryTab from '~/components/droplets/detail/HistoryTab.vue'
import GraphsTab from '~/components/droplets/detail/GraphsTab.vue'
import DangerTab from '~/components/droplets/detail/DangerTab.vue'
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const id = computed(() => Number(route.params.id))

const { droplet, isPending } = useDroplet(id)
const actions = useDropletActions()
const { menuItems } = useDropletMenu()

useHead({ title: () => droplet.value?.name ?? 'Droplet' })

const tabComponents = {
  overview: OverviewTab,
  networking: NetworkingTab,
  power: PowerResizeTab,
  backups: BackupsTab,
  history: HistoryTab,
  graphs: GraphsTab,
  danger: DangerTab
}

const tabItems = [
  { label: 'Overview', icon: 'i-lucide-layout-dashboard', value: 'overview' },
  { label: 'Networking', icon: 'i-lucide-network', value: 'networking' },
  { label: 'Power & Resize', icon: 'i-lucide-power', value: 'power' },
  { label: 'Backups', icon: 'i-lucide-shield-check', value: 'backups' },
  { label: 'History', icon: 'i-lucide-history', value: 'history' },
  { label: 'Graphs', icon: 'i-lucide-chart-area', value: 'graphs' },
  { label: 'Danger', icon: 'i-lucide-triangle-alert', value: 'danger' }
]

const activeTab = ref('overview')
const activeComponent = computed(() => tabComponents[activeTab.value as keyof typeof tabComponents])

// Section nav rendered as a horizontal NavigationMenu (same `highlight` treatment as the
// Settings sub-nav, for a consistent, finished look). These are in-page sections rather
// than routes, so each item drives `activeTab` via `onSelect` and marks itself `active`.
const navItems = computed<NavigationMenuItem[]>(() => tabItems.map(tab => ({
  label: tab.label,
  icon: tab.icon,
  active: activeTab.value === tab.value,
  onSelect: () => {
    activeTab.value = tab.value
  }
})))

const isOff = computed(() => droplet.value?.status === 'off')
const busy = computed(() => (droplet.value ? actions.isBusy(droplet.value.id) : false))
</script>

<template>
  <UDashboardPanel id="droplet-detail">
    <template #header>
      <UDashboardNavbar :title="droplet?.name ?? ''">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            aria-label="Back to Droplets"
            @click="navigateTo('/droplets')"
          />
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <div class="flex items-center gap-2 min-w-0">
            <USkeleton
              v-if="isPending && !droplet"
              class="h-6 w-44"
            />
            <template v-else-if="droplet">
              <span class="truncate font-semibold text-highlighted">{{ droplet.name }}</span>
              <DropletStatusBadge
                :status="droplet.status"
                :busy="busy"
              />
            </template>
          </div>
        </template>

        <template #right>
          <template v-if="droplet">
            <UButton
              v-if="isOff"
              label="Power on"
              icon="i-lucide-power"
              color="primary"
              size="sm"
              :loading="busy"
              @click="actions.powerOn(droplet)"
            />
            <UButton
              v-else
              label="Power off"
              icon="i-lucide-power-off"
              color="neutral"
              variant="outline"
              size="sm"
              :loading="busy"
              @click="actions.powerOff(droplet)"
            />
            <UButton
              label="Reboot"
              icon="i-lucide-rotate-cw"
              color="neutral"
              variant="outline"
              size="sm"
              :loading="busy"
              :disabled="isOff"
              @click="actions.reboot(droplet)"
            />
            <UDropdownMenu
              :items="menuItems(droplet)"
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
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="droplet">
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
        v-if="isPending && !droplet"
        class="space-y-6"
      >
        <USkeleton class="h-40 w-full rounded-lg" />
        <USkeleton class="h-32 w-full rounded-lg" />
        <USkeleton class="h-24 w-full rounded-lg" />
      </div>

      <!-- Loaded -->
      <component
        :is="activeComponent"
        v-else-if="droplet"
        :droplet="droplet"
      />

      <!-- Not found -->
      <div
        v-else
        class="flex flex-col items-center text-center gap-3 py-16"
      >
        <div class="size-12 rounded-xl bg-elevated flex items-center justify-center">
          <UIcon
            name="i-lucide-server-off"
            class="size-6 text-dimmed"
          />
        </div>
        <div>
          <p class="text-base font-semibold text-highlighted">
            Droplet not found
          </p>
          <p class="text-sm text-muted max-w-sm">
            This Droplet may have been destroyed, or it belongs to a different team.
          </p>
        </div>
        <UButton
          label="Back to Droplets"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          @click="navigateTo('/droplets')"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
