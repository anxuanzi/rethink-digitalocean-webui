<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

/** Aggregate view of the fleet: total provisioned capacity and where it lives (by region). */
const props = defineProps<{ droplets: Droplet[], loading?: boolean }>()

const capacity = computed(() => {
  let vcpus = 0
  let memory = 0
  let disk = 0
  for (const d of props.droplets) {
    vcpus += d.vcpus
    memory += d.memory
    disk += d.disk
  }
  return [
    { label: 'vCPUs', value: `${vcpus}`, icon: 'i-lucide-cpu' },
    { label: 'Memory', value: formatMemory(memory), icon: 'i-lucide-memory-stick' },
    { label: 'Storage', value: formatDisk(disk), icon: 'i-lucide-hard-drive' }
  ]
})

const byRegion = computed(() => {
  const map = new Map<string, number>()
  for (const d of props.droplets) map.set(d.region.name, (map.get(d.region.name) ?? 0) + 1)
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const total = computed(() => props.droplets.length)
const maxRegion = computed(() => Math.max(1, ...byRegion.value.map(r => r.count)))
</script>

<template>
  <UCard
    variant="subtle"
    :ui="{ header: 'px-4 py-3 sm:px-5' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-chart-pie"
          class="size-4 text-muted"
        />
        <h3 class="font-semibold text-highlighted">
          Fleet
        </h3>
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="loading"
      class="space-y-5"
    >
      <div class="grid grid-cols-3 gap-3">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-16 rounded-lg"
        />
      </div>
      <div class="space-y-3">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-4 w-full"
        />
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="!total"
      class="flex flex-col items-center justify-center text-center py-8"
    >
      <UIcon
        name="i-lucide-chart-pie"
        class="size-8 text-dimmed mb-2"
      />
      <p class="text-sm text-muted">
        Capacity insights appear once you have Droplets.
      </p>
    </div>

    <template v-else>
      <!-- Provisioned capacity -->
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="item in capacity"
          :key="item.label"
          class="rounded-lg border border-default bg-elevated/50 p-3"
        >
          <UIcon
            :name="item.icon"
            class="size-4 text-primary"
          />
          <p class="mt-2 text-lg font-semibold text-highlighted tabular-nums leading-tight">
            {{ item.value }}
          </p>
          <p class="text-xs text-muted">
            {{ item.label }}
          </p>
        </div>
      </div>

      <!-- By region -->
      <div class="mt-5">
        <p class="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          By region
        </p>
        <ul class="space-y-3">
          <li
            v-for="region in byRegion"
            :key="region.name"
          >
            <div class="mb-1 flex items-center justify-between text-sm">
              <span class="text-default truncate">{{ region.name }}</span>
              <span class="text-muted tabular-nums shrink-0 ps-2">{{ region.count }}</span>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-accented">
              <div
                class="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                :style="{ width: `${(region.count / maxRegion) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </div>
    </template>
  </UCard>
</template>
