<script setup lang="ts">
import type { Droplet, DropletAction } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()

const api = useDoApi()
const auth = useDoAuthStore()

const { state, asyncStatus } = useQuery({
  key: () => dropletKeys.actions(auth.activeId, props.droplet.id),
  query: () => api.droplets.listActions(props.droplet.id),
  enabled: () => auth.isConnected
})

const events = computed(() => state.value.data?.actions ?? [])
const isLoading = computed(() => asyncStatus.value === 'loading' && !state.value.data)

/** Map a DigitalOcean action status to a badge color + icon. */
const statusMeta: Record<DropletAction['status'], { color: 'success' | 'warning' | 'error', icon: string, label: string, spin?: boolean }> = {
  'completed': { color: 'success', icon: 'i-lucide-circle-check', label: 'Completed' },
  'in-progress': { color: 'warning', icon: 'i-lucide-loader', label: 'In progress', spin: true },
  'errored': { color: 'error', icon: 'i-lucide-circle-x', label: 'Errored' }
}

/** "power_off" -> "Power off" */
function prettyType(type: string): string {
  const text = type.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
</script>

<template>
  <UCard variant="subtle">
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

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <div
        v-for="n in 5"
        :key="n"
        class="flex items-center gap-3"
      >
        <USkeleton class="size-9 rounded-lg shrink-0" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-4 w-40" />
          <USkeleton class="h-3 w-24" />
        </div>
        <USkeleton class="h-5 w-20 rounded-full" />
      </div>
    </div>

    <!-- Events -->
    <ol
      v-else-if="events.length"
      class="-my-2 divide-y divide-default"
    >
      <li
        v-for="event in events"
        :key="event.id"
        class="flex items-center gap-3 py-3"
      >
        <div class="size-9 rounded-lg bg-elevated flex items-center justify-center shrink-0">
          <UIcon
            :name="statusMeta[event.status].icon"
            class="size-4.5"
            :class="[
              statusMeta[event.status].spin ? 'animate-spin' : '',
              event.status === 'completed' ? 'text-success' : event.status === 'errored' ? 'text-error' : 'text-warning'
            ]"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-highlighted truncate">
            {{ prettyType(event.type) }}
          </p>
          <p class="text-xs text-muted">
            {{ relativeTime(event.started_at) }}
          </p>
        </div>
        <UBadge
          :color="statusMeta[event.status].color"
          variant="subtle"
          size="sm"
        >
          {{ statusMeta[event.status].label }}
        </UBadge>
      </li>
    </ol>

    <!-- Empty -->
    <div
      v-else
      class="flex flex-col items-center text-center gap-2 py-8"
    >
      <div class="size-10 rounded-lg bg-elevated flex items-center justify-center">
        <UIcon
          name="i-lucide-history"
          class="size-5 text-dimmed"
        />
      </div>
      <p class="text-sm font-medium text-highlighted">
        No activity yet
      </p>
      <p class="text-sm text-muted max-w-sm">
        Power, resize, snapshot, and other actions on this Droplet will show up here as a timeline.
      </p>
    </div>
  </UCard>
</template>
