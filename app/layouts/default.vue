<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { refreshActive } = useDoAuth()

/*
 * Sidebar navigation, grouped by DigitalOcean's mental model.
 * Only Dashboard is live so far; resource links are disabled placeholders
 * (no `to`) that light up as each vertical slice lands.
 */
const nav = computed<NavigationMenuItem[][]>(() => [
  [
    { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' }
  ],
  [
    { label: 'Droplets', icon: 'i-lucide-server', to: '/droplets' },
    { label: 'Databases', icon: 'i-lucide-database', to: '/databases' },
    { label: 'Kubernetes', icon: 'i-lucide-ship-wheel', disabled: true }
  ],
  [
    { label: 'Firewalls', icon: 'i-lucide-shield', disabled: true },
    { label: 'Load Balancers', icon: 'i-lucide-scale', disabled: true },
    { label: 'Domains', icon: 'i-lucide-globe', disabled: true }
  ]
])

// Pinned to the bottom of the sidebar.
const bottomNav = computed<NavigationMenuItem[]>(() => [
  { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }
])

// Re-verify the active token once when the app shell mounts: catches a revoked token early
// (via $doFetch's 401 handler) and refreshes stale team/account info. Client-only.
onMounted(() => {
  refreshActive()
})
</script>

<template>
  <UDashboardGroup
    storage="local"
    unit="rem"
  >
    <UDashboardSidebar
      id="default"
      resizable
      collapsible
      :min-size="13"
      :default-size="15"
      :max-size="20"
    >
      <template #header="{ collapsed }">
        <AppLogo :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="nav"
          orientation="vertical"
        />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="bottomNav"
          orientation="vertical"
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex flex-col gap-1 w-full">
          <ColorModeToggle :collapsed="collapsed" />
          <TeamSwitcher :collapsed="collapsed" />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
