<script setup lang="ts">
import type { DropletRegion } from '~/types/droplet'

const props = defineProps<{
  regions: DropletRegion[]
  loading: boolean
}>()

const selected = defineModel<string | null>({ default: null })

// Only regions you can actually deploy into, sorted for a stable, scannable list.
const available = computed(() =>
  props.regions
    .filter(r => r.available)
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
)

function select(slug: string) {
  selected.value = slug
}
</script>

<template>
  <section>
    <div class="mb-3">
      <h2 class="text-base font-semibold text-highlighted">
        Region
      </h2>
      <p class="text-sm text-muted">
        Pick the datacenter closest to your users. This narrows the available plans.
      </p>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        class="h-16 rounded-lg"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!available.length"
      class="rounded-lg border border-dashed border-default p-6 text-center"
    >
      <UIcon
        name="i-lucide-globe"
        class="size-6 text-dimmed mx-auto mb-2"
      />
      <p class="text-sm font-medium text-highlighted">
        No regions available
      </p>
      <p class="text-sm text-muted">
        This account can't deploy to any region right now.
      </p>
    </div>

    <!-- Region cards -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      <button
        v-for="region in available"
        :key="region.slug"
        type="button"
        :aria-pressed="selected === region.slug"
        class="group relative cursor-pointer text-left rounded-lg border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="selected === region.slug
          ? 'border-primary bg-primary/10 ring-1 ring-primary'
          : 'border-default bg-elevated/50 hover:border-primary/50 hover:bg-elevated'"
        @click="select(region.slug)"
      >
        <UIcon
          v-if="selected === region.slug"
          name="i-lucide-check-circle-2"
          class="absolute top-2 right-2 size-4 text-primary"
        />
        <div class="font-medium text-highlighted truncate pr-5">
          {{ region.name }}
        </div>
        <div class="text-xs text-muted font-mono mt-0.5">
          {{ region.slug }}
        </div>
      </button>
    </div>
  </section>
</template>
