<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

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
    { label: 'Droplets', icon: 'i-lucide-server', disabled: true },
    { label: 'Databases', icon: 'i-lucide-database', disabled: true },
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
  { label: 'Settings', icon: 'i-lucide-settings', to: '/settings/teams' }
])
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
        <TeamSwitcher :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
