<script setup lang="ts">
useHead({ title: 'Dashboard' })

const { droplets, total, isPending, refresh } = useDroplets()

// Headline KPIs, account-wide (mirrors the Droplets page so the numbers line up).
const activeCount = computed(() => droplets.value.filter(d => d.status === 'active').length)
const offCount = computed(() => droplets.value.filter(d => d.status === 'off').length)
const monthlySpend = computed(() =>
  Math.round(droplets.value.reduce((sum, d) => sum + (d.size?.price_monthly ?? 0), 0))
)

// First load only — keep numbers visible during background refetches.
const loading = computed(() => isPending.value && !droplets.value.length)

function onRefresh() {
  refresh()
}
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            aria-label="Refresh dashboard"
            :loading="isPending"
            @click="onRefresh"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <DashboardWelcome :droplet-count="total" />

        <DropletsStatBar
          :total="total"
          :active="activeCount"
          :off="offCount"
          :monthly-spend="monthlySpend"
        />

        <DashboardResources
          :droplet-count="total"
          :loading="loading"
        />

        <div class="grid gap-6 lg:grid-cols-3">
          <DashboardRecentDroplets
            class="lg:col-span-2"
            :droplets="droplets"
            :loading="loading"
          />
          <DashboardFleetBreakdown
            :droplets="droplets"
            :loading="loading"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
