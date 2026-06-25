<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

/*
 * Sidebar navigation, grouped by DigitalOcean's mental model.
 * Only Dashboard is live in the skeleton; resource links are disabled placeholders
 * that light up as each vertical slice lands.
 */
const nav = computed<NavigationMenuItem[][]>(() => [
  [
    { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' }
  ],
  // Placeholders for upcoming vertical slices — disabled (no `to`) so the router doesn't
  // try to resolve routes that don't exist yet.
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
      </template>

      <template #footer="{ collapsed }">
        <AccountMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
