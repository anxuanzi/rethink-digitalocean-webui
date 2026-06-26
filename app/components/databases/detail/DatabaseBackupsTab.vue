<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()

// DigitalOcean exposes a read-only backup history plus the cluster's scheduled backup window.
const { backups, scheduledTime, isPending } = useDatabaseBackups(() => props.database.id)

// Newest-first so the most recent restore point leads the list and feeds the "Latest" tile.
const sorted = computed(() =>
  [...backups.value].sort((a, b) => b.created_at.localeCompare(a.created_at))
)

const newest = computed(() => sorted.value[0])
const oldest = computed(() => sorted.value[sorted.value.length - 1])

// scheduledTime is an object { backup_hour, backup_minute, backup_interval_hours } — format HH:MM.
const shortTime = computed(() => {
  const schedule = scheduledTime.value
  if (!schedule || schedule.backup_hour == null) return ''
  const hh = String(schedule.backup_hour).padStart(2, '0')
  const mm = String(schedule.backup_minute ?? 0).padStart(2, '0')
  return `${hh}:${mm}`
})
</script>

<template>
  <UCard
    variant="subtle"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-database-backup"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Backups
          </h3>
        </div>
        <span class="text-xs text-muted">
          {{ shortTime ? `Daily around ${shortTime}` : 'Daily' }}
        </span>
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="isPending && !backups.length"
      class="divide-y divide-default"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <USkeleton class="size-8 rounded-lg" />
        <USkeleton class="h-4 w-40 flex-1" />
        <USkeleton class="h-4 w-16" />
      </div>
    </div>

    <template v-else-if="sorted.length">
      <!-- Summary tiles — body has p-0, so this block carries its own padding. -->
      <div class="px-4 py-4 sm:px-5">
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-lg border border-default bg-elevated/50 p-3">
            <p class="text-lg font-semibold text-highlighted">
              {{ sorted.length }}
            </p>
            <p class="text-xs text-muted">
              Backups
            </p>
          </div>
          <div class="rounded-lg border border-default bg-elevated/50 p-3">
            <p class="text-lg font-semibold text-highlighted">
              {{ relativeTime(newest?.created_at) }}
            </p>
            <p class="text-xs text-muted">
              Latest
            </p>
          </div>
          <div class="rounded-lg border border-default bg-elevated/50 p-3">
            <p class="text-lg font-semibold text-highlighted">
              {{ shortDate(oldest?.created_at) }}
            </p>
            <p class="text-xs text-muted">
              Oldest restore point
            </p>
          </div>
        </div>
      </div>

      <ul class="divide-y divide-default border-t border-default">
        <li
          v-for="b in sorted"
          :key="b.created_at"
          class="flex items-center gap-3 px-4 py-3 sm:px-5"
        >
          <div class="size-8 rounded-lg bg-elevated flex items-center justify-center shrink-0">
            <UIcon
              name="i-lucide-archive"
              class="size-4 text-muted"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-highlighted">
              {{ shortDate(b.created_at) }}
            </p>
            <p class="text-xs text-muted">
              {{ relativeTime(b.created_at) }}
            </p>
          </div>
          <span class="text-sm text-muted">{{ b.size_gigabytes.toFixed(2) }} GB</span>
        </li>
      </ul>
    </template>

    <div
      v-else
      class="px-6 py-10 text-center"
    >
      <p class="text-sm text-highlighted">
        No backups yet
      </p>
      <p class="text-sm text-muted max-w-sm mx-auto mt-1">
        DigitalOcean takes automated daily backups; they'll appear here.
      </p>
    </div>
  </UCard>
</template>
