<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

/** The five most recently created Droplets, as a compact, clickable preview of the fleet. */
const props = defineProps<{ droplets: Droplet[], loading?: boolean }>()

const recent = computed(() =>
  [...props.droplets]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
)
</script>

<template>
  <UCard
    variant="subtle"
    :ui="{ body: 'p-0 sm:p-0', header: 'px-4 py-3 sm:px-5' }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-server"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Recent Droplets
          </h3>
        </div>
        <UButton
          v-if="droplets.length"
          label="View all"
          trailing-icon="i-lucide-arrow-right"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="navigateTo('/droplets')"
        />
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="loading"
      class="divide-y divide-default"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <USkeleton class="size-9 rounded-lg" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-4 w-40" />
          <USkeleton class="h-3 w-24" />
        </div>
        <USkeleton class="h-6 w-20 rounded-full" />
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="!recent.length"
      class="flex flex-col items-center justify-center text-center px-6 py-12"
    >
      <div class="size-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
        <UIcon
          name="i-lucide-server"
          class="size-5 text-primary"
        />
      </div>
      <p class="text-sm font-medium text-highlighted">
        No Droplets yet
      </p>
      <p class="mt-1 text-sm text-muted max-w-xs">
        Spin up your first Droplet to see it here.
      </p>
      <UButton
        label="Create Droplet"
        icon="i-lucide-plus"
        size="sm"
        class="mt-4"
        @click="navigateTo('/droplets/new')"
      />
    </div>

    <!-- List -->
    <ul
      v-else
      class="divide-y divide-default"
    >
      <li
        v-for="droplet in recent"
        :key="droplet.id"
        class="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated sm:px-5"
        @click="navigateTo(`/droplet/${droplet.id}`)"
      >
        <div class="size-9 rounded-lg bg-elevated flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary/10">
          <UIcon
            name="i-lucide-server"
            class="size-4.5 text-muted transition-colors group-hover:text-primary"
          />
        </div>

        <div class="min-w-0 flex-1">
          <p class="font-medium text-highlighted truncate">
            {{ droplet.name }}
          </p>
          <p class="text-xs text-muted truncate">
            {{ droplet.region.name }} · {{ formatMemory(droplet.memory) }} · {{ droplet.vcpus }} vCPU
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <span class="hidden text-xs text-dimmed sm:inline">
            {{ relativeTime(droplet.created_at) }}
          </span>
          <DropletStatusBadge :status="droplet.status" />
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 text-dimmed transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </li>
    </ul>
  </UCard>
</template>
