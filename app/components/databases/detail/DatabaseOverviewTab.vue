<script setup lang="ts">
import { CurveType, LegendPosition } from 'vue-chrts'
import type { ChartPoint } from '~/composables/useDropletMetrics'
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()

const meta = computed(() => engineMeta(props.database.engine))

// Live counts + data for the dashboard. Each is cached and reused by its own tab, so these are
// cheap; engines that don't support a sub-resource simply return an empty list.
const { users } = useDatabaseUsers(() => props.database.id)
const { backups } = useDatabaseBackups(() => props.database.id)
const { replicas } = useDatabaseReplicas(() => props.database.id)
const { events } = useDatabaseEvents(() => props.database.id)

// Backups + read-replicas don't exist for Redis/Valkey (caching), so only surface the counts and
// the storage chart that actually apply to this engine — keeps the dashboard honest.
const hasBackups = computed(() => !['redis', 'valkey'].includes(props.database.engine))
const hasReplicas = computed(() => ['pg', 'mysql', 'mongodb'].includes(props.database.engine))

const kpis = computed(() => {
  const list = [
    { label: 'Users', value: users.value.length, icon: 'i-lucide-users', tint: 'bg-primary/10 text-primary' },
    { label: 'Events', value: events.value.length, icon: 'i-lucide-history', tint: 'bg-warning/10 text-warning' }
  ]
  if (hasBackups.value) {
    list.splice(1, 0, { label: 'Backups', value: backups.value.length, icon: 'i-lucide-database-backup', tint: 'bg-success/10 text-success' })
  }
  if (hasReplicas.value) {
    list.push({ label: 'Replicas', value: replicas.value.length, icon: 'i-lucide-git-fork', tint: 'bg-info/10 text-info' })
  }
  return list
})

// Backup-size trend (oldest → newest) — the dashboard's headline chart.
const backupChart = computed<ChartPoint[]>(() =>
  [...backups.value]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(b => ({ t: new Date(b.created_at).getTime(), size: Number(b.size_gigabytes.toFixed(3)) }))
)
const chartCategories = { size: { name: 'Backup size', color: 'var(--color-ocean-500)' } }
function chartX(i: number) {
  const point = backupChart.value[i]
  return point ? shortDate(new Date(point.t).toISOString()).split(',')[0]! : ''
}
function chartY(v: number) {
  return `${v.toFixed(1)} GB`
}

const recentEvents = computed(() =>
  [...events.value].sort((a, b) => b.create_time.localeCompare(a.create_time)).slice(0, 5)
)
function eventIcon(type: string) {
  if (type.includes('promotion')) return 'i-lucide-arrow-up-circle'
  if (type.includes('resiz')) return 'i-lucide-scaling'
  if (type.includes('migrat')) return 'i-lucide-arrow-right-left'
  if (type.includes('maintenance') || type.includes('update')) return 'i-lucide-wrench'
  if (type.includes('backup')) return 'i-lucide-archive'
  return 'i-lucide-activity'
}
function humanizeEvent(type: string) {
  const text = type.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Cluster facts as a grid of tinted tiles.
const specs = computed(() => [
  { label: 'Engine', value: meta.value.label, sub: `Version ${props.database.version}`, icon: meta.value.icon, tint: meta.value.tint },
  { label: 'Nodes', value: `${props.database.num_nodes}`, sub: props.database.num_nodes > 1 ? 'Primary + standby' : 'Single node', icon: 'i-lucide-layers', tint: 'bg-info/10 text-info' },
  { label: 'Plan', value: props.database.size, sub: databaseSizeSpecs(props.database.size) ?? undefined, icon: 'i-lucide-box', tint: 'bg-primary/10 text-primary' },
  { label: 'Storage', value: formatStorage(props.database.storage_size_mib), icon: 'i-lucide-hard-drive', tint: 'bg-warning/10 text-warning' },
  { label: 'Region', value: regionName(props.database.region), sub: props.database.region, icon: 'i-lucide-map-pin', tint: 'bg-elevated text-muted' },
  { label: 'Created', value: shortDate(props.database.created_at), sub: relativeTime(props.database.created_at), icon: 'i-lucide-calendar', tint: 'bg-elevated text-muted' },
  { label: 'Cluster ID', value: props.database.id, icon: 'i-lucide-hash', tint: 'bg-elevated text-muted' }
])

const tags = computed(() => props.database.tags ?? [])

const maintenance = computed(() => {
  const mw = props.database.maintenance_window
  if (!mw?.day) return null
  const day = mw.day.charAt(0).toUpperCase() + mw.day.slice(1)
  const hour = mw.hour?.slice(0, 5) ?? mw.hour
  return { text: `${day}s at ${hour} UTC`, pending: mw.pending }
})
</script>

<template>
  <div class="space-y-6">
    <!-- KPI tiles -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(kpi, i) in kpis"
        :key="kpi.label"
        class="animate-rise bg-elevated/50 rounded-lg border border-default p-4 flex items-center gap-3 transition-colors hover:border-default/80 hover:bg-elevated"
        :style="{ animationDelay: `${i * 60}ms` }"
      >
        <div
          class="size-10 rounded-lg flex items-center justify-center shrink-0"
          :class="kpi.tint"
        >
          <UIcon
            :name="kpi.icon"
            class="size-5"
          />
        </div>
        <div class="min-w-0">
          <p class="text-xl font-semibold text-highlighted tabular-nums">
            {{ kpi.value }}
          </p>
          <p class="text-xs text-muted uppercase tracking-wide">
            {{ kpi.label }}
          </p>
        </div>
      </div>
    </div>

    <!-- Chart + recent activity -->
    <div class="grid gap-6 lg:grid-cols-3">
      <UCard
        v-if="hasBackups"
        variant="subtle"
        class="lg:col-span-2"
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

        <AreaChart
          v-if="backupChart.length > 1"
          :data="backupChart"
          :height="240"
          :categories="chartCategories"
          :x-formatter="chartX"
          :y-formatter="chartY"
          :curve-type="CurveType.MonotoneX"
          :legend-position="LegendPosition.TopRight"
          :x-num-ticks="5"
          :y-num-ticks="4"
        />
        <div
          v-else
          class="h-[240px] flex flex-col items-center justify-center text-center gap-2"
        >
          <UIcon
            name="i-lucide-chart-area"
            class="size-7 text-dimmed"
          />
          <p class="text-sm text-muted max-w-xs">
            Not enough backups to chart yet — daily backups will build this trend over time.
          </p>
        </div>
      </UCard>

      <UCard
        variant="subtle"
        :ui="{ body: 'p-0 sm:p-0' }"
        :class="hasBackups ? '' : 'lg:col-span-3'"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-history"
              class="size-4 text-muted"
            />
            <h3 class="font-semibold text-highlighted">
              Recent activity
            </h3>
          </div>
        </template>

        <ul
          v-if="recentEvents.length"
          class="divide-y divide-default"
        >
          <li
            v-for="event in recentEvents"
            :key="event.id"
            class="flex items-center gap-3 px-4 py-3 sm:px-5"
          >
            <div class="size-8 rounded-lg bg-elevated flex items-center justify-center shrink-0">
              <UIcon
                :name="eventIcon(event.event_type)"
                class="size-4 text-muted"
              />
            </div>
            <span class="text-sm text-highlighted truncate flex-1">{{ humanizeEvent(event.event_type) }}</span>
            <span class="text-xs text-dimmed shrink-0">{{ relativeTime(event.create_time) }}</span>
          </li>
        </ul>
        <div
          v-else
          class="px-6 py-10 text-center text-sm text-muted"
        >
          No recent activity.
        </div>
      </UCard>
    </div>

    <!-- Specs -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-database"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Specs
          </h3>
        </div>
      </template>

      <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="spec in specs"
          :key="spec.label"
          class="group rounded-lg border border-default bg-elevated/40 p-4 transition-all hover:border-primary/40 hover:bg-elevated"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="size-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              :class="spec.tint"
            >
              <UIcon
                :name="spec.icon"
                class="size-4.5"
              />
            </div>
            <dt class="text-xs font-medium uppercase tracking-wide text-muted truncate">
              {{ spec.label }}
            </dt>
          </div>
          <dd class="mt-3 text-lg font-semibold text-highlighted truncate leading-tight">
            {{ spec.value }}
          </dd>
          <dd
            v-if="spec.sub"
            class="mt-0.5 text-xs text-dimmed truncate"
          >
            {{ spec.sub }}
          </dd>
        </div>
      </dl>
    </UCard>

    <!-- Maintenance + tags -->
    <div class="grid gap-6 sm:grid-cols-2">
      <UCard variant="subtle">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-wrench"
              class="size-4 text-muted"
            />
            <h3 class="font-semibold text-highlighted">
              Maintenance window
            </h3>
          </div>
        </template>
        <div
          v-if="maintenance"
          class="flex items-center gap-2"
        >
          <span class="text-sm text-highlighted">{{ maintenance.text }}</span>
          <UBadge
            v-if="maintenance.pending"
            color="warning"
            variant="subtle"
            size="sm"
            icon="i-lucide-clock"
          >
            Update pending
          </UBadge>
        </div>
        <p
          v-else
          class="text-sm text-muted"
        >
          No maintenance window scheduled. Set one in Settings.
        </p>
      </UCard>

      <UCard variant="subtle">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-tag"
              class="size-4 text-muted"
            />
            <h3 class="font-semibold text-highlighted">
              Tags
            </h3>
          </div>
        </template>
        <div
          v-if="tags.length"
          class="flex flex-wrap gap-2"
        >
          <UBadge
            v-for="tag in tags"
            :key="tag"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ tag }}
          </UBadge>
        </div>
        <p
          v-else
          class="text-sm text-muted"
        >
          No tags.
        </p>
      </UCard>
    </div>
  </div>
</template>
