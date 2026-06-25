<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

// Sub-navigation for the settings section. Child pages render in <NuxtPage/> below.
const links = computed<NavigationMenuItem[]>(() => [
  { label: 'Teams', icon: 'i-lucide-users', to: '/settings/teams' },
  { label: 'Appearance', icon: 'i-lucide-palette', to: '/settings/appearance' }
])
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu
          :items="links"
          highlight
          class="-mx-1 flex-1"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
