<script setup lang="ts">
import { CurveType, LegendPosition } from 'vue-chrts'
import type { ChartPoint } from '~/composables/useDropletMetrics'
import type { DatabaseCluster } from '~/types/database'

/**
 * Metrics / charts page — present for every engine. DigitalOcean's public API only exposes live
 * performance metrics (CPU/memory/disk) for MySQL, so:
 *  - MySQL clusters get real performance charts with a time-range selector.
 *  - Every engine also gets a cluster-activity chart (events over time) and, where the engine
 *    supports backups, a storage-growth chart — all from data the API does expose.
 */
const props = defineProps<{ database: DatabaseCluster }>()

const isMysql = computed(() => props.database.engine === 'mysql')
const hasBackups = computed(() => !['redis', 'valkey'].includes(props.database.engine))

// --- MySQL performance (real metrics) ---
const rangeOptions = [{ label: '1H', value: 1 }, { label: '24H', value: 24 }, { label: '7D', value: 168 }]
const range = ref(24)
const { cpuData, memoryData, diskData, isPending: metricsLoading } = useDatabaseMetrics(
  () => props.database.id,
  range,
  () => isMysql.value
)
type ChartCategories = Record<string, { name: string, color: string }>
interface PerfChart {
  key: string
  title: string
  icon: string
  data: ChartPoint[]
  categories: ChartCategories
}
const OCEAN = 'var(--color-ocean-500)'
const perfCharts = computed<PerfChart[]>(() => [
  { key: 'CPU', title: 'CPU usage', icon: 'i-lucide-cpu', data: cpuData.value, categories: { CPU: { name: 'CPU', color: OCEAN } } as ChartCategories },
  { key: 'Memory', title: 'Memory usage', icon: 'i-lucide-memory-stick', data: memoryData.value, categories: { Memory: { name: 'Memory', color: OCEAN } } as ChartCategories },
  { key: 'Disk', title: 'Disk usage', icon: 'i-lucide-hard-drive', data: diskData.value, categories: { Disk: { name: 'Disk', color: OCEAN } } as ChartCategories }
])

// --- Cluster activity over time (every engine) ---
const { events } = useDatabaseEvents(() => props.database.id)
const activityChart = computed<ChartPoint[]>(() => {
  const byDay = new Map<number, number>()
  for (const event of events.value) {
    const d = new Date(event.create_time)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    byDay.set(day, (byDay.get(day) ?? 0) + 1)
  }
  return [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([t, count]) => ({ t, events: count }))
})
const activityCategories = { events: { name: 'Events', color: 'var(--color-ocean-500)' } }

// --- Backup storage trend (engines with backups) ---
const { backups } = useDatabaseBackups(() => props.database.id)
const backupChart = computed<ChartPoint[]>(() =>
  [...backups.value]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(b => ({ t: new Date(b.created_at).getTime(), size: Number(b.size_gigabytes.toFixed(3)) }))
)
const backupCategories = { size: { name: 'Backup size', color: 'var(--color-ocean-500)' } }

// --- Formatters ---
function makeTimeX(data: ChartPoint[]) {
  return (i: number) => {
    const point = data[i]
    return point ? new Date(point.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  }
}
function makeDayX(data: ChartPoint[]) {
  return (i: number) => {
    const point = data[i]
    return point ? shortDate(new Date(point.t).toISOString()).split(',')[0]! : ''
  }
}
function pctFmt(v: number) {
  return `${v.toFixed(1)}%`
}
function countFmt(v: number) {
  return String(Math.round(v))
}
function gbFmt(v: number) {
  return `${v.toFixed(1)} GB`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Engines without live perf metrics -->
    <UAlert
      v-if="!isMysql"
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="Live performance metrics are available for MySQL only"
      description="DigitalOcean's API exposes CPU, memory, and disk metrics for MySQL clusters. For this engine we chart the cluster activity and storage insights it does provide."
    />

    <!-- MySQL performance charts -->
    <template v-if="isMysql">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-sm font-semibold text-muted uppercase tracking-wide">
          Performance
        </h2>
        <div class="inline-flex rounded-md border border-default bg-elevated p-0.5">
          <button
            v-for="opt in rangeOptions"
            :key="opt.value"
            type="button"
            class="cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors"
            :class="range === opt.value ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-default'"
            @click="range = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <UCard
        v-for="chart in perfCharts"
        :key="chart.key"
        variant="subtle"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              :name="chart.icon"
              class="size-4 text-muted"
            />
            <h3 class="font-semibold text-highlighted">
              {{ chart.title }}
            </h3>
          </div>
        </template>
        <div class="h-[220px]">
          <div
            v-if="metricsLoading"
            class="size-full flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="size-5 animate-spin text-muted"
            />
          </div>
          <AreaChart
            v-else-if="chart.data.length"
            :data="chart.data"
            :height="220"
            :categories="chart.categories"
            :x-formatter="makeTimeX(chart.data)"
            :y-formatter="pctFmt"
            :curve-type="CurveType.MonotoneX"
            :legend-position="LegendPosition.TopRight"
            :x-num-ticks="5"
            :y-num-ticks="4"
          />
          <div
            v-else
            class="size-full flex items-center justify-center text-sm text-muted"
          >
            No data for this range.
          </div>
        </div>
      </UCard>
    </template>

    <!-- Cluster activity (every engine) -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-activity"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Cluster activity
          </h3>
        </div>
      </template>
      <div class="h-[220px]">
        <AreaChart
          v-if="activityChart.length > 1"
          :data="activityChart"
          :height="220"
          :categories="activityCategories"
          :x-formatter="makeDayX(activityChart)"
          :y-formatter="countFmt"
          :curve-type="CurveType.MonotoneX"
          :legend-position="LegendPosition.TopRight"
          :x-num-ticks="5"
          :y-num-ticks="3"
        />
        <div
          v-else
          class="size-full flex flex-col items-center justify-center text-center gap-2"
        >
          <UIcon
            name="i-lucide-activity"
            class="size-7 text-dimmed"
          />
          <p class="text-sm text-muted">
            Not enough activity to chart yet.
          </p>
        </div>
      </div>
    </UCard>

    <!-- Backup storage trend (engines with backups) -->
    <UCard
      v-if="hasBackups"
      variant="subtle"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-chart-area"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Backup storage trend
          </h3>
        </div>
      </template>
      <div class="h-[220px]">
        <AreaChart
          v-if="backupChart.length > 1"
          :data="backupChart"
          :height="220"
          :categories="backupCategories"
          :x-formatter="makeDayX(backupChart)"
          :y-formatter="gbFmt"
          :curve-type="CurveType.MonotoneX"
          :legend-position="LegendPosition.TopRight"
          :x-num-ticks="5"
          :y-num-ticks="4"
        />
        <div
          v-else
          class="size-full flex flex-col items-center justify-center text-center gap-2"
        >
          <UIcon
            name="i-lucide-chart-area"
            class="size-7 text-dimmed"
          />
          <p class="text-sm text-muted">
            No backup history to chart yet.
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
