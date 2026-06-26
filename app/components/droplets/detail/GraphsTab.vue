<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()

const rangeItems = [
  { label: '1 hour', value: '1' },
  { label: '6 hours', value: '6' },
  { label: '24 hours', value: '24' }
]
const selectedRange = ref('6')
const rangeHours = computed(() => Number(selectedRange.value))

const id = computed(() => props.droplet.id)
const { cpu, memory, bandwidth } = useDropletMetrics(id, rangeHours)

const cpuData = computed(() => cpu.state.value.data ?? [])
const memoryData = computed(() => memory.state.value.data ?? [])
const bandwidthData = computed(() => bandwidth.state.value.data ?? [])

const cpuLoading = computed(() => cpu.asyncStatus.value === 'loading')
const memoryLoading = computed(() => memory.asyncStatus.value === 'loading')
const bandwidthLoading = computed(() => bandwidth.asyncStatus.value === 'loading')

const cpuCategories = { CPU: { name: 'CPU %', color: '#0069ff' } }
const memoryCategories = { Used: { name: 'Memory %', color: '#00b8d4' } }
const bandwidthCategories = {
  Inbound: { name: 'Inbound', color: '#0069ff' },
  Outbound: { name: 'Outbound', color: '#f59e0b' }
}

const percentFormat = (v: number) => `${Math.round(v)}%`
const mbpsFormat = (v: number) => `${v.toFixed(2)} Mbps`
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-muted">
        Live metrics from the DigitalOcean monitoring agent.
      </p>
      <UTabs
        v-model="selectedRange"
        :items="rangeItems"
        :content="false"
        color="primary"
        variant="pill"
        size="sm"
        :ui="{ list: 'w-auto' }"
      />
    </div>

    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-cpu"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            CPU usage
          </h3>
        </div>
      </template>
      <MetricChart
        :data="cpuData"
        :categories="cpuCategories"
        :loading="cpuLoading"
        :y-format="percentFormat"
        :height="240"
      />
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-memory-stick"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Memory usage
          </h3>
        </div>
      </template>
      <MetricChart
        :data="memoryData"
        :categories="memoryCategories"
        :loading="memoryLoading"
        :y-format="percentFormat"
        :height="240"
      />
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-activity"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Public bandwidth
          </h3>
        </div>
      </template>
      <MetricChart
        :data="bandwidthData"
        :categories="bandwidthCategories"
        :loading="bandwidthLoading"
        :y-format="mbpsFormat"
        :height="240"
      />
    </UCard>
  </div>
</template>
