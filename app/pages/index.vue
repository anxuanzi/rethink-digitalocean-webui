<script setup lang="ts">
useHead({ title: 'Dashboard' })

const auth = useDoAuthStore()
const api = useDoApi()

// Proves the full loop: token (client) → $doFetch → proxy → DigitalOcean → account.
const { state, asyncStatus } = useQuery({
  key: accountKeys.root,
  query: () => api.account.get(),
  enabled: () => auth.isConnected
})
const account = computed(() => state.value.data?.account)
const isPending = computed(() => asyncStatus.value === 'loading')

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
        <!-- Connection proof: the authenticated account, fetched live from the DO API. -->
        <div class="bg-elevated/50 rounded-lg border border-default p-4 flex items-center gap-3">
          <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UIcon
              name="i-lucide-circle-check"
              class="size-5 text-primary"
            />
          </div>

          <div
            v-if="isPending"
            class="space-y-2"
          >
            <USkeleton class="h-4 w-48" />
            <USkeleton class="h-3 w-32" />
          </div>
          <div v-else-if="account">
            <p class="font-medium text-highlighted">
              Connected as {{ account.email }}
            </p>
            <p class="text-sm text-muted">
              Account status: {{ account.status }} · Droplet limit: {{ account.droplet_limit }}
            </p>
          </div>
          <div v-else>
            <p class="font-medium text-highlighted">
              Welcome
            </p>
            <p class="text-sm text-muted">
              Your DigitalOcean account will appear here.
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
