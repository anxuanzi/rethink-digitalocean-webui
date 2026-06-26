<script setup lang="ts">
import type { DropletSize } from '~/types/droplet'

const props = defineProps<{
  sizes: DropletSize[]
  loading: boolean
  regionSelected: boolean
}>()

const selected = defineModel<string | null>({ default: null })

// Human-friendly category for each slug family, in display order.
const categories: { prefix: string, label: string, description: string }[] = [
  { prefix: 's-', label: 'Basic', description: 'Shared CPU · great value for most workloads' },
  { prefix: 'c2-', label: 'CPU-Optimized', description: 'Dedicated CPU for compute-heavy work' },
  { prefix: 'c-', label: 'CPU-Optimized', description: 'Dedicated CPU for compute-heavy work' },
  { prefix: 'g-', label: 'General Purpose', description: 'Balanced dedicated CPU and memory' },
  { prefix: 'gd-', label: 'General Purpose', description: 'Balanced dedicated CPU and memory' },
  { prefix: 'm-', label: 'Memory-Optimized', description: 'More RAM per core for in-memory data' },
  { prefix: 'm3-', label: 'Memory-Optimized', description: 'More RAM per core for in-memory data' },
  { prefix: 'm6-', label: 'Memory-Optimized', description: 'More RAM per core for in-memory data' },
  { prefix: 'so-', label: 'Storage-Optimized', description: 'High local NVMe storage' }
]

function categoryFor(slug: string): { label: string, description: string } {
  const match = categories.find(c => slug.startsWith(c.prefix))
  return match ?? { label: 'Other', description: 'Additional plans' }
}

interface SizeGroup {
  label: string
  description: string
  sizes: DropletSize[]
}

// Group available sizes by category, each sorted cheapest-first.
const groups = computed<SizeGroup[]>(() => {
  const byLabel = new Map<string, SizeGroup>()
  for (const size of props.sizes) {
    const meta = categoryFor(size.slug)
    const group = byLabel.get(meta.label) ?? { label: meta.label, description: meta.description, sizes: [] }
    group.sizes.push(size)
    byLabel.set(meta.label, group)
  }
  const order = ['Basic', 'General Purpose', 'CPU-Optimized', 'Memory-Optimized', 'Storage-Optimized', 'Other']
  return [...byLabel.values()]
    .map(group => ({
      ...group,
      sizes: group.sizes.slice().sort((a, b) => a.price_monthly - b.price_monthly)
    }))
    .sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))
})
</script>

<template>
  <section>
    <div class="mb-3">
      <h2 class="text-base font-semibold text-highlighted">
        Plan
      </h2>
      <p class="text-sm text-muted">
        Pick the CPU, memory, and storage for your Droplet.
      </p>
    </div>

    <!-- Region not chosen yet -->
    <div
      v-if="!regionSelected"
      class="rounded-lg border border-dashed border-default p-6 text-center"
    >
      <UIcon
        name="i-lucide-arrow-up"
        class="size-6 text-dimmed mx-auto mb-2"
      />
      <p class="text-sm font-medium text-highlighted">
        Choose a region first
      </p>
      <p class="text-sm text-muted">
        Plans are filtered to what's available where you deploy.
      </p>
    </div>

    <!-- Loading skeleton -->
    <div
      v-else-if="loading"
      class="space-y-2"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-14 rounded-lg"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!groups.length"
      class="rounded-lg border border-dashed border-default p-6 text-center"
    >
      <UIcon
        name="i-lucide-cpu"
        class="size-6 text-dimmed mx-auto mb-2"
      />
      <p class="text-sm font-medium text-highlighted">
        No plans in this region
      </p>
      <p class="text-sm text-muted">
        Try a different region to see available plans.
      </p>
    </div>

    <!-- Grouped plan rows -->
    <div
      v-else
      class="space-y-6"
    >
      <div
        v-for="group in groups"
        :key="group.label"
      >
        <div class="flex items-baseline justify-between mb-2">
          <h3 class="text-sm font-medium text-default">
            {{ group.label }}
          </h3>
          <span class="text-xs text-muted">{{ group.description }}</span>
        </div>

        <div class="space-y-2">
          <button
            v-for="size in group.sizes"
            :key="size.slug"
            type="button"
            :aria-pressed="selected === size.slug"
            class="w-full cursor-pointer text-left rounded-lg border px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="selected === size.slug
              ? 'border-primary bg-primary/10 ring-1 ring-primary'
              : 'border-default bg-elevated/50 hover:border-primary/50 hover:bg-elevated'"
            @click="selected = size.slug"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <UIcon
                  :name="selected === size.slug ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
                  class="size-4 shrink-0"
                  :class="selected === size.slug ? 'text-primary' : 'text-dimmed'"
                />
                <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm min-w-0">
                  <span class="font-medium text-highlighted">{{ formatMemory(size.memory) }}</span>
                  <span class="text-dimmed">·</span>
                  <span class="text-default">{{ size.vcpus }} vCPU</span>
                  <span class="text-dimmed">·</span>
                  <span class="text-default">{{ formatDisk(size.disk) }} SSD</span>
                  <span
                    v-if="size.transfer"
                    class="text-dimmed hidden sm:inline"
                  >·</span>
                  <span class="text-muted hidden sm:inline">{{ size.transfer }} TB transfer</span>
                </div>
              </div>
              <div class="text-right shrink-0">
                <span class="text-sm font-semibold text-highlighted">{{ formatPrice(size.price_monthly) }}</span>
                <span class="text-xs text-muted">/mo</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
