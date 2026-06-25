<script setup lang="ts">
useHead({ title: 'Dashboard' })

const store = useDoAuthStore()
const active = computed(() => store.activeToken)

// Placeholder resource tiles — each becomes a real vertical slice next.
const resources = [
  { label: 'Droplets', icon: 'i-lucide-server' },
  { label: 'Databases', icon: 'i-lucide-database' },
  { label: 'Firewalls', icon: 'i-lucide-shield' },
  { label: 'Domains', icon: 'i-lucide-globe' }
]
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Which team you're acting as, straight from the saved token. -->
        <div class="bg-elevated/50 rounded-lg border border-default p-4 flex items-center gap-3">
          <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UIcon
              name="i-lucide-circle-check"
              class="size-5 text-primary"
            />
          </div>
          <div
            v-if="active"
            class="min-w-0"
          >
            <p class="font-medium text-highlighted truncate">
              Connected to {{ active.label }}
            </p>
            <p class="text-sm text-muted truncate">
              {{ active.accountEmail }}
            </p>
          </div>
        </div>

        <!-- Resource tiles (coming soon in the skeleton). -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="resource in resources"
            :key="resource.label"
            class="bg-elevated/50 rounded-lg border border-default p-4 flex items-center gap-3"
          >
            <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon
                :name="resource.icon"
                class="size-5 text-primary"
              />
            </div>
            <div>
              <p class="font-medium text-highlighted">
                {{ resource.label }}
              </p>
              <p class="text-xs text-muted">
                Coming soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
