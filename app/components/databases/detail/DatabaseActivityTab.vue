<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()

// Read-only feed of lifecycle events (resizes, migrations, maintenance, …) for the cluster.
const { events, isPending } = useDatabaseEvents(() => props.database.id)

// Newest-first so the latest event sits at the top of the timeline.
const sorted = computed(() =>
  [...events.value].sort((a, b) => b.create_time.localeCompare(a.create_time))
)

// Map an event_type to a recognisable icon; fall back to a generic activity glyph.
function eventIcon(type: string) {
  if (type.includes('promotion')) return 'i-lucide-arrow-up-circle'
  if (type.includes('resiz')) return 'i-lucide-scaling'
  if (type.includes('migrat')) return 'i-lucide-arrow-right-left'
  if (type.includes('maintenance') || type.includes('update')) return 'i-lucide-wrench'
  if (type.includes('backup')) return 'i-lucide-archive'
  return 'i-lucide-activity'
}

// Turn snake_case event types into a readable, capitalised label.
function humanize(type: string) {
  const spaced = type.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
</script>

<template>
  <UCard
    variant="subtle"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-history"
          class="size-4 text-muted"
        />
        <h3 class="font-semibold text-highlighted">
          Activity
        </h3>
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="isPending && !events.length"
      class="divide-y divide-default"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <USkeleton class="size-8 rounded-lg" />
        <USkeleton class="h-4 w-48 flex-1" />
        <USkeleton class="h-4 w-16" />
      </div>
    </div>

    <ul
      v-else-if="sorted.length"
      class="divide-y divide-default"
    >
      <li
        v-for="event in sorted"
        :key="event.id"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <div class="size-8 rounded-lg bg-elevated flex items-center justify-center shrink-0">
          <UIcon
            :name="eventIcon(event.event_type)"
            class="size-4 text-muted"
          />
        </div>
        <span class="font-medium text-highlighted truncate flex-1">{{ humanize(event.event_type) }}</span>
        <UTooltip :text="shortDate(event.create_time)">
          <span class="text-xs text-muted">{{ relativeTime(event.create_time) }}</span>
        </UTooltip>
      </li>
    </ul>

    <div
      v-else
      class="px-6 py-10 text-center text-sm text-muted"
    >
      No recent activity
    </div>
  </UCard>
</template>
